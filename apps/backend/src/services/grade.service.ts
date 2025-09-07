/**
 * @file grade.service.ts
 * @description Service chấm điểm: gọi extractor → rule-engine → lưu DB
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import { loadPresetRubric } from '@services/criteria.service';
import { readStoredFile, deleteStoredFile, getOriginalFileName, getFileInfo } from '@services/storage.service';
import { extractDOCXSafely, extractPPTXSafely } from '@services/archive.service';
import { extractDOCXFeatures } from '@/extractors/docx/docx';
import { extractPPTXFeatures } from '@/extractors/pptx/pptx';
import { gradeFile } from '@/rule-engine/rule-engine';
import type { GradeResult, Rubric, FileType } from '@/types/criteria';
import type { FeaturesPPTX } from '@/types/index';
import type { FeaturesDOCX } from '@/types/features-docx';
import type { GradeFileRequest, BatchGradeRequest, GradeResultWithDB } from '@/types/grade.types';
import { PrismaClient } from '@prisma/client';
import pLimit from 'p-limit';

const prisma = new PrismaClient();

// Chấm điểm file chính
export async function gradeFileService(request: GradeFileRequest): Promise<GradeResultWithDB> {
  const { fileId, userId, useHardRubric = true, customRubric, onlyCriteria } = request;
  
  logger.info(`Bắt đầu chấm điểm file: ${fileId} cho user: ${userId}`);
  
  const startTime = Date.now();
  
  try {
    // 1. Đọc file từ storage
    logger.debug('Bước 1: Đọc file từ storage');
    const fileBuffer = await readStoredFile(fileId);
    
    // Get original filename
    const originalFileName = await getOriginalFileName(fileId);
    
    // Determine file type từ buffer và filename
    const fileType = await determineFileType(fileBuffer, fileId);
    logger.info(`File type detected: ${fileType}`);
    
    // 2. Extract features từ file
    logger.debug('Bước 2: Extract features');
    const features = await extractFeatures(fileBuffer, fileType, fileId);
    
    // 3. Load rubric
    logger.debug('Bước 3: Load rubric');
    const { rubric, warnings } = await loadRubricForGrading(fileType, useHardRubric, customRubric);
    
    // 4. Chấm điểm với rule engine
    logger.debug('Bước 4: Chấm điểm với rule engine');
    const gradeResult = await gradeFile(
      features,
      fileType,
      {
        rubric,
        onlyCriteria,
        includeDetails: true
      },
      {
        fileId,
        filename: originalFileName,
        startTime
      }
    );
    
    // 5. Lưu kết quả vào database
    logger.debug('Bước 5: Lưu kết quả vào DB');
    const dbResult = await saveGradeResultToDB(gradeResult, userId);
    
    // 6. Xóa file tạm sau khi chấm điểm xong (luôn luôn xóa)
    logger.debug('Bước 6: Xóa file tạm');
    await deleteStoredFile(fileId);
    
    // 7. Xóa bản ghi trong bảng ungraded_files nếu tồn tại
    try {
      await prisma.ungradedFile.delete({
        where: {
          id: fileId
        }
      });
      logger.info(`Đã xóa bản ghi ungraded file: ${fileId} sau khi chấm điểm hoàn thành`);
    } catch (dbError) {
      // File có thể không tồn tại trong ungraded_files (đã được xóa trước đó)
      logger.debug(`File ${fileId} không tồn tại trong ungraded_files hoặc đã được xóa trước đó`);
    }
    
    logger.info(`Đã xóa file tạm: ${fileId} sau khi chấm điểm hoàn thành`);
    
    const totalTime = Date.now() - startTime;
    
    logger.info(
      `Hoàn thành chấm điểm: ${gradeResult.filename} - ` +
      `${gradeResult.totalPoints}/${gradeResult.maxPossiblePoints} điểm ` +
      `(${gradeResult.percentage.toFixed(1)}%) trong ${totalTime}ms`
    );
    
    return {
      ...gradeResult,
      dbId: dbResult.id,
      saved: true,
      warnings
    };
    
  } catch (error) {
    logger.error(`Lỗi khi chấm điểm file ${fileId}:`, error);
    
    // Cleanup: xóa file ngay cả khi có lỗi
    try {
      await deleteStoredFile(fileId);
      logger.info(`Đã xóa file: ${fileId} do lỗi chấm điểm`);
    } catch (cleanupError) {
      logger.warn(`Không thể xóa file ${fileId}:`, cleanupError);
    }
    
    throw error;
  }
}

// Chấm điểm batch files
export async function batchGradeService(request: BatchGradeRequest): Promise<{
  results: GradeResultWithDB[];
  errors: { fileId: string; error: string }[];
  summary: {
    total: number;
    success: number;
    failed: number;
    totalTime: number;
  };
}> {
  const { files, userId, useHardRubric = true, customRubric, onlyCriteria, concurrency = 5 } = request;
  
  logger.info(`Bắt đầu chấm điểm batch: ${files.length} files cho user: ${userId}`);
  
  const startTime = Date.now();
  
  // Sử dụng p-limit để giới hạn số lượng file xử lý đồng thời
  const limit = pLimit(concurrency);
  
  // Tạo mảng promises cho tất cả files
  const promises = files.map(fileId => 
    limit(async () => {
      try {
        const result = await gradeFileService({
          fileId,
          userId,
          useHardRubric,
          customRubric,
          onlyCriteria
        });
        return { result, error: null };
      } catch (error) {
        logger.error(`Lỗi khi chấm điểm file ${fileId}:`, error);
        return { result: null, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    })
  );
  
  // Chờ tất cả promises hoàn thành
  const results = await Promise.all(promises);
  
  // Phân loại kết quả thành success và error
  const successResults: GradeResultWithDB[] = [];
  const errorResults: { fileId: string; error: string }[] = [];
  
  results.forEach((result, index) => {
    const fileId = files[index];
    if (result.error) {
      errorResults.push({ fileId, error: result.error });
    } else if (result.result) {
      successResults.push(result.result);
    }
  });
  
  const totalTime = Date.now() - startTime;
  
  logger.info(
    `Hoàn thành chấm điểm batch: ${successResults.length}/${files.length} files ` +
    `thành công trong ${totalTime}ms`
  );
  
  return {
    results: successResults,
    errors: errorResults,
    summary: {
      total: files.length,
      success: successResults.length,
      failed: errorResults.length,
      totalTime
    }
  };
}

// Determine file type từ buffer và filename
async function determineFileType(fileBuffer: Buffer, fileId: string): Promise<FileType> {
  try {
    // Get filename từ stored files
    const originalFileName = await getOriginalFileName(fileId);
    const extension = originalFileName.toLowerCase().split('.').pop();
    
    if (extension === 'pptx') {
      return 'PPTX';
    } else if (extension === 'docx') {
      return 'DOCX';
    }
    
    // Fallback: check file content
    if (fileBuffer.length > 100) {
      const content = fileBuffer.toString('utf8', 0, 100);
      if (content.includes('ppt/') || content.includes('slideLayout')) {
        return 'PPTX';
      } else if (content.includes('word/') || content.includes('document.xml')) {
        return 'DOCX';
      }
    }
    
    throw new Error(`Không thể xác định file type từ: ${originalFileName}`);
    
  } catch (error) {
    logger.error('Lỗi khi determine file type:', error);
    throw new Error(`Không thể xác định loại file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract features dựa trên file type
async function extractFeatures(
  fileBuffer: Buffer, 
  fileType: FileType, 
  fileId: string
): Promise<FeaturesPPTX | FeaturesDOCX> {
  const filename = await getOriginalFileName(fileId);
  
  try {
    if (fileType === 'DOCX') {
      logger.debug('Extracting DOCX features');
      const docxStructure = await extractDOCXSafely(fileBuffer);
      return await extractDOCXFeatures(docxStructure, filename, fileBuffer.length);
    } else {
      logger.debug('Extracting PPTX features');
      const pptxStructure = await extractPPTXSafely(fileBuffer);
      return await extractPPTXFeatures(pptxStructure, filename, fileBuffer.length);
    }
  } catch (error) {
    logger.error(`Lỗi khi extract ${fileType} features:`, error);
    throw new Error(`Không thể extract features: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Load rubric cho grading
async function loadRubricForGrading(
  fileType: FileType,
  useHardRubric: boolean,
  customRubric?: Rubric
): Promise<{ rubric: Rubric; warnings: string[] }> {
  try {
    const warnings: string[] = [];
    
    if (customRubric) {
      logger.debug('Sử dụng custom rubric');
      
      const total = customRubric.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
      if (Math.abs(total - 10) > 0.01) {
        warnings.push(`Tổng điểm rubric là ${total}, không bằng 10 (mặc định)`);
      }
      return { rubric: customRubric, warnings };
    }
    
    if (useHardRubric) {
      logger.debug(`Sử dụng hard-coded rubric cho ${fileType}`);
      const rubricName = `Default ${fileType} Rubric`;
      const rubric = await loadPresetRubric(rubricName, fileType);
      return { rubric, warnings: [] };
    }
    
    throw new Error('Không có rubric được chỉ định');
    
  } catch (error) {
    logger.error('Lỗi khi load rubric:', error);
    throw new Error(`Không thể load rubric: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Lưu grade result vào database
async function saveGradeResultToDB(gradeResult: GradeResult, userId: number) {
  logger.debug(`Đang lưu grade result vào DB cho user: ${userId}`);
  
  try {
    const dbResult = await prisma.gradeResult.create({
      data: {
        userId,
        filename: gradeResult.filename,
        fileType: gradeResult.fileType,
        totalPoints: gradeResult.totalPoints,
        byCriteria: JSON.stringify(gradeResult.byCriteria),
        gradedAt: gradeResult.gradedAt
      }
    });
    
    logger.info(`Lưu grade result thành công với ID: ${dbResult.id}`);
    return dbResult;
    
  } catch (error) {
    logger.error('Lỗi khi lưu grade result vào DB:', error);
    throw new Error(`Không thể lưu kết quả: ${error instanceof Error ? error.message : 'Database error'}`);
  }
}

// Get file extension from stored file
async function getFileExtension(fileId: string): Promise<string> {
  try {
    const originalFileName = await getOriginalFileName(fileId);
    return originalFileName.substring(originalFileName.lastIndexOf('.'));
  } catch (error) {
    logger.warn(`Không thể lấy file extension cho ${fileId}:`, error);
    return '.unknown';
  }
}

// Get grade history cho user
export async function getGradeHistory(
  userId: number,
  limit: number = 20,
  offset: number = 0,
  filters: {
    fileType?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    scoreMin?: number;
    scoreMax?: number;
  } = {}
): Promise<{
  results: any[];
  total: number;
  hasMore: boolean;
}> {
  logger.debug(`Đang lấy grade history cho user: ${userId}`);
  
  try {
    // Build where clause for filtering
    const whereClause: any = { userId };
    
    // Apply fileType filter
    if (filters.fileType) {
      whereClause.fileType = filters.fileType;
    }
    
    // Apply search filter (filename)
    if (filters.search) {
      whereClause.filename = {
        contains: filters.search,
        mode: 'insensitive'
      };
    }
    
    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      whereClause.gradedAt = {};
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        // Validate date
        if (isNaN(dateFrom.getTime())) {
          logger.warn(`Invalid dateFrom value: ${filters.dateFrom}`);
        } else {
          whereClause.gradedAt.gte = dateFrom;
        }
      }
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        // Validate date
        if (isNaN(dateTo.getTime())) {
          logger.warn(`Invalid dateTo value: ${filters.dateTo}`);
        } else {
          whereClause.gradedAt.lte = dateTo;
        }
      }
    }
    
    // Apply score range filter
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      whereClause.totalPoints = {};
      if (filters.scoreMin !== undefined) {
        whereClause.totalPoints.gte = filters.scoreMin;
      }
      if (filters.scoreMax !== undefined) {
        whereClause.totalPoints.lte = filters.scoreMax;
      }
    }
    
    logger.debug(`Prisma where clause: ${JSON.stringify(whereClause)}`);
    
    const [results, total] = await Promise.all([
      prisma.gradeResult.findMany({
        where: whereClause,
        orderBy: { gradedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          filename: true,
          fileType: true,
          totalPoints: true,
          gradedAt: true
        }
      }),
      prisma.gradeResult.count({
        where: whereClause
      })
    ]);
    
    const hasMore = offset + limit < total;
    
    logger.debug(`Lấy được ${results.length}/${total} grade results`);
    
    return {
      results,
      total,
      hasMore
    };
    
  } catch (error) {
    logger.error('Lỗi khi lấy grade history:', error);
    throw new Error(`Không thể lấy lịch sử chấm điểm: ${error instanceof Error ? error.message : 'Database error'}`);
  }
}

// Get detailed grade result
export async function getGradeResult(resultId: string, userId: number): Promise<GradeResult | null> {
  logger.debug(`Đang lấy grade result: ${resultId}`);
  
  try {
    const result = await prisma.gradeResult.findFirst({
      where: {
        id: resultId,
        userId
      }
    });
    
    if (!result) {
      return null;
    }
    
    // Parse byCriteria JSON
    const byCriteria = JSON.parse(result.byCriteria);
    
    return {
      fileId: resultId,
      filename: result.filename,
      fileType: result.fileType as FileType,
      rubricName: 'Default Rubric', // TODO: Store rubric name
      totalPoints: result.totalPoints,
      maxPossiblePoints: 10, // TODO: Store this
      percentage: (result.totalPoints / 10) * 100,
      byCriteria,
      gradedAt: result.gradedAt,
      processingTime: 0 // TODO: Store this
    };
    
  } catch (error) {
    logger.error(`Lỗi khi lấy grade result ${resultId}:`, error);
    throw new Error(`Không thể lấy kết quả chấm điểm: ${error instanceof Error ? error.message : 'Database error'}`);
  }
}

// Get grade results by IDs
export async function getGradeResultsByIds(resultIds: string[]): Promise<GradeResult[]> {
  logger.debug(`Đang lấy ${resultIds.length} grade results`);
  
  try {
    // Validate input
    if (!resultIds || resultIds.length === 0) {
      logger.warn('[WARN] Danh sách resultIds rỗng');
      return [];
    }
    
    logger.debug(`[DEBUG] Querying DB for resultIds: ${JSON.stringify(resultIds)}`);
    
    const results = await prisma.gradeResult.findMany({
      where: {
        id: {
          in: resultIds
        }
      }
    });
    
    logger.debug(`[DEBUG] Tìm thấy ${results.length} kết quả từ DB`);
    logger.debug(`[DEBUG] Raw DB results: ${JSON.stringify(results, null, 2)}`);
    
    // Parse byCriteria JSON for each result
    const parsedResults = results.map(result => {
      let byCriteria = {};
      try {
        byCriteria = JSON.parse(result.byCriteria);
        logger.debug(`[DEBUG] Parsed byCriteria for ${result.id}: ${JSON.stringify(byCriteria)}`);
      } catch (parseError) {
        logger.warn(`[WARN] Không thể parse byCriteria cho result ${result.id}:`, parseError);
        byCriteria = {};
      }
      
      const parsedResult = {
        fileId: result.id,
        filename: result.filename,
        fileType: result.fileType as FileType,
        rubricName: 'Default Rubric', // TODO: Store rubric name
        totalPoints: result.totalPoints,
        maxPossiblePoints: 10, // TODO: Store this
        percentage: (result.totalPoints / 10) * 100,
        byCriteria,
        gradedAt: result.gradedAt,
        processingTime: 0 // TODO: Store this
      };
      
      logger.debug(`[DEBUG] Parsed result for ${result.id}: ${JSON.stringify(parsedResult)}`);
      return parsedResult;
    });
    
    logger.debug(`[DEBUG] Final parsed results count: ${parsedResults.length}`);
    return parsedResults;
    
  } catch (error) {
    logger.error(`[ERROR] Lỗi khi lấy grade results:`, error);
    // Log the full error object for debugging
    logger.error('[ERROR] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`Không thể lấy kết quả chấm điểm: ${error instanceof Error ? error.message : 'Database error'}`);
  }
}

// Delete grade result
export async function deleteGradeResult(resultId: string, userId: number): Promise<any | null> {
  logger.debug(`Đang xóa grade result: ${resultId} cho user: ${userId}`);
  
  try {
    const deletedResult = await prisma.gradeResult.delete({
      where: {
        id: resultId,
        userId: userId
      }
    });
    
    logger.info(`Xóa grade result thành công: ${resultId}`);
    return deletedResult;
    
  } catch (error) {
    logger.error(`Lỗi khi xóa grade result ${resultId}:`, error);
    return null;
  }
}
