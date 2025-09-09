/**
 * @file criteria.service.ts
 * @description Service xử lý rubric và criteria: load preset, validate, preview, cache
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import type { 
  Rubric, 
  Criterion, 
  DetectorKey, 
  FileType,
  CriteriaPreviewBody,
  SupportedCriteria,
  CriterionEvalResult
} from '@/types/criteria';
import { RubricSchema } from '@/schemas/rubric.schema';
import { detectors } from '@/rule-engine/detectors';
import { getCriterionById, listCriteria as listAllCriteria } from './criteria-crud.service';
import fs from 'fs/promises';
import path from 'path';

// Cache in-memory 5 phút
const presetCache = new Map<string, Rubric>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cacheTimestamps = new Map<string, number>();

// Load preset
export async function loadPresetRubric(name: string, type?: FileType): Promise<Rubric> {
  // If type is not provided, default to DOCX
  const fileType = type || 'DOCX';
  
  logger.info(`Đang load preset rubric: ${name} cho ${fileType}`);
  
  const key = `${fileType}_${name}`;
  
  // Check cache validity
  const cachedTime = cacheTimestamps.get(key);
  const isExpired = !cachedTime || (Date.now() - cachedTime) > CACHE_DURATION;
  
  if (presetCache.has(key) && !isExpired) {
    logger.debug(`Sử dụng cached rubric: ${key}`);
    return presetCache.get(key)!;
  }
  
  try {
    const file = path.resolve(__dirname, `../config/presets/defaultRubric.${fileType.toLowerCase()}.json`);
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = RubricSchema.parse(JSON.parse(raw));
    
    // Convert the Zod schema structure to the TypeScript interface structure
    const rubric: Rubric = {
      name: parsed.title,
      version: parsed.version,
      description: undefined, // Not in Zod schema
      fileType: fileType,
      totalMaxPoints: parsed.totalPoints,
      rounding: parsed.scoring.rounding,
      criteria: parsed.criteria.map(criterion => ({
        id: criterion.id,
        name: criterion.name,
        description: '', // Not in Zod schema
        detectorKey: criterion.detectorKey as DetectorKey,
        maxPoints: criterion.maxPoints,
        levels: criterion.levels.map(level => ({
          code: level.code,
          name: level.name,
          points: level.points,
          description: level.description
        }))
      }))
    };
    
    // Update cache
    presetCache.set(key, rubric);
    cacheTimestamps.set(key, Date.now());
    
    logger.info(`Load preset rubric thành công: ${name} cho ${fileType} (${rubric.criteria.length} criteria)`);
    return rubric;
  } catch (error) {
    logger.error(`Lỗi khi load preset rubric ${name}:`, error);
    throw new Error(`Không thể load preset rubric: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// List criteria từ preset - enhanced to support both preset and custom criteria
export async function listCriteria(query: { source: 'preset' | 'custom'; fileType?: FileType; rubricName?: string }): Promise<Criterion[]> {
  logger.debug(`Đang list criteria: source=${query.source}, fileType=${query.fileType || 'not specified'}`);
  
  try {
    if (query.source === 'custom') {
      // For custom criteria, list from database
      const customCriteria = await listAllCustomCriteria();
      logger.debug(`Tìm thấy ${customCriteria.length} criteria từ custom database`);
      return customCriteria;
    } else {
      // For preset criteria, if fileType is not provided, throw an error
      // because we need to know which preset rubric to load
      if (!query.fileType) {
        throw new Error('fileType là bắt buộc khi source = "preset"');
      }
      
      // Existing preset implementation
      const rubric = await loadPresetRubric(query.rubricName || 'default', query.fileType);
      logger.debug(`Tìm thấy ${rubric.criteria.length} criteria từ preset`);
      return rubric.criteria;
    }
  } catch (error) {
    logger.error('Lỗi khi list criteria:', error);
    throw error;
  }
}

// Helper function to list all custom criteria from database
async function listAllCustomCriteria(): Promise<Criterion[]> {
  try {
    const customCriteria = await listAllCriteria();
    return customCriteria;
  } catch (error) {
    logger.error('Lỗi khi list custom criteria:', error);
    throw new Error(`Không thể lấy danh sách custom criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validate custom rubric
export async function validateRubric(body: { rubric: Rubric }): Promise<{ isValid: boolean; errors: string[] }> {
  logger.debug('Đang validate rubric');
  
  const errors: string[] = [];
  
  try {
    // Convert the Rubric to match the Zod schema structure
    const rubricForValidation = {
      title: body.rubric.name,
      version: body.rubric.version,
      locale: 'vi', // Default locale
      totalPoints: body.rubric.totalMaxPoints,
      scoring: {
        method: 'sum' as const,
        rounding: body.rubric.rounding
      },
      criteria: body.rubric.criteria.map(criterion => ({
        id: criterion.id,
        name: criterion.name,
        detectorKey: criterion.detectorKey,
        maxPoints: criterion.maxPoints,
        levels: criterion.levels
      }))
    };
    
    RubricSchema.parse(rubricForValidation);
    logger.debug('Schema validation thành công');
  } catch (e) {
    logger.warn('Schema validation thất bại');
    return { isValid: false, errors: (e as any).errors.map((err: any) => err.message) };
  }
  
  const supported = Object.keys(detectors);
  for (const c of body.rubric.criteria) {
    if (!supported.includes(c.detectorKey)) {
      errors.push(`Detector '${c.detectorKey}' chưa hỗ trợ.`);
    }
  }
  
  const isValid = errors.length === 0;
  logger.debug(`Validation result: ${isValid ? 'PASS' : 'FAIL'} (${errors.length} errors)`);
  
  return { isValid, errors };
}

// Get single criterion by ID - enhanced to support both preset and custom criteria
export async function getCriterion(criterionId: string): Promise<Criterion | null> {
  logger.debug(`Đang get criterion: ${criterionId}`);
  
  try {
    // First, try to get from custom criteria (database)
    try {
      const customCriterion = await getCriterionById(criterionId);
      if (customCriterion) {
        logger.debug(`Tìm thấy criterion ${criterionId} trong custom criteria`);
        return customCriterion;
      }
    } catch (error) {
      // If there's an error getting from custom criteria, continue to preset criteria
      logger.debug(`Không tìm thấy criterion ${criterionId} trong custom criteria, tiếp tục tìm trong preset criteria`);
    }
    
    // Tìm trong preset rubrics
    const fileTypes: FileType[] = ['DOCX', 'PPTX'];
    
    for (const fileType of fileTypes) {
      try {
        const rubric = await loadPresetRubric('default', fileType);
        const criterion = rubric.criteria.find(c => c.id === criterionId);
        if (criterion) {
          logger.debug(`Tìm thấy criterion ${criterionId} trong ${fileType} rubric`);
          return criterion;
        }
      } catch (error) {
        // Ignore errors and continue searching
        continue;
      }
    }
    
    logger.debug(`Không tìm thấy criterion: ${criterionId}`);
    return null;
    
  } catch (error) {
    logger.error(`Lỗi khi get criterion ${criterionId}:`, error);
    throw error;
  }
}

// Get supported criteria cho file type - enhanced to include custom criteria
export async function getSupportedCriteria(fileType?: FileType, detectorKey?: DetectorKey): Promise<SupportedCriteria[]> {
  logger.debug(`Đang get supported criteria: fileType=${fileType || 'all'}, detectorKey=${detectorKey || 'all'}`);
  
  try {
    // Get preset criteria (existing implementation)
    const supportedCriteria: SupportedCriteria[] = [];
    
    // Define supported criteria for DOCX
    const docxCriteria: SupportedCriteria[] = [
      {
        detectorKey: 'docx.toc',
        name: 'Mục lục tự động',
        description: 'Tạo mục lục (Table of Contents) tự động',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 1.5,
        suggestedLevels: [
          { code: 'toc_0', name: 'Không có', points: 0, description: 'Không có mục lục hoặc tạo thủ công' },
          { code: 'toc_1', name: 'Cơ bản', points: 0.75, description: 'Có mục lục tự động nhưng chưa đầy đủ' },
          { code: 'toc_2', name: 'Hoàn chỉnh', points: 1.5, description: 'TOC tự động đầy đủ, phân cấp, số trang chính xác' }
        ]
      },
      {
        detectorKey: 'docx.headerFooter',
        name: 'Header và Footer',
        description: 'Thiết lập header/footer đúng chuẩn',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'hf_0', name: 'Không có', points: 0, description: 'Không có header/footer' },
          { code: 'hf_1', name: 'Cơ bản', points: 0.5, description: 'Có header/footer nhưng thiếu thông tin' },
          { code: 'hf_2', name: 'Đầy đủ', points: 1, description: 'Header/Footer đầy đủ thông tin, đúng vị trí' }
        ]
      },
      {
        detectorKey: 'docx.layoutArt',
        name: 'Columns, Drop Cap, Picture, WordArt',
        description: 'Sử dụng đầy đủ 4 yếu tố: Columns, Drop Cap, Picture, WordArt',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 2,
        suggestedLevels: [
          { code: 'layout_0', name: 'Thiếu nhiều', points: 0, description: 'Thiếu hơn 2 yếu tố hoặc không có' },
          { code: 'layout_1', name: 'Thiếu ít', points: 0.5, description: 'Có 2-3 yếu tố nhưng chưa chuẩn' },
          { code: 'layout_2', name: 'Cơ bản', points: 1, description: 'Có đủ 4 yếu tố nhưng chất lượng chưa cao' },
          { code: 'layout_3', name: 'Tốt', points: 1.5, description: 'Đủ 4 yếu tố, chất lượng khá, spacing ổn' },
          { code: 'layout_4', name: 'Xuất sắc', points: 2, description: 'Đủ 4 yếu tố chất lượng cao, spacing hoàn hảo' }
        ]
      },
      {
        detectorKey: 'docx.table',
        name: 'Bảng (Table)',
        description: 'Tạo bảng đúng format với màu nền, border',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 1.5,
        suggestedLevels: [
          { code: 'table_0', name: 'Không có', points: 0, description: 'Không có bảng nào' },
          { code: 'table_1', name: 'Cơ bản', points: 0.75, description: 'Có bảng nhưng format đơn giản' },
          { code: 'table_2', name: 'Hoàn chỉnh', points: 1.5, description: 'Bảng đúng mẫu, có màu nền, border, spacing' }
        ]
      },
      {
        detectorKey: 'docx.equation',
        name: 'Phương trình (Equation)',
        description: 'Sử dụng Equation Editor để tạo công thức',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 1.5,
        suggestedLevels: [
          { code: 'eq_0', name: 'Không có', points: 0, description: 'Không có phương trình hoặc viết tay' },
          { code: 'eq_1', name: 'Cơ bản', points: 0.75, description: 'Có dùng Equation nhưng đơn giản' },
          { code: 'eq_2', name: 'Chính xác', points: 1.5, description: 'Dùng Equation Editor, công thức chính xác' }
        ]
      },
      {
        detectorKey: 'docx.tabs',
        name: 'Tab stops',
        description: 'Sử dụng tab stops để căn chỉnh văn bản',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'tabs_0', name: 'Không có', points: 0, description: 'Không sử dụng tab stops' },
          { code: 'tabs_1', name: 'Cơ bản', points: 0.5, description: 'Có dùng tabs nhưng chưa chính xác' },
          { code: 'tabs_2', name: 'Chính xác', points: 1, description: 'Tab stops chính xác, văn bản thẳng hàng' }
        ]
      },
      {
        detectorKey: 'docx.smartArt',
        name: 'SmartArt',
        description: 'Sử dụng SmartArt để tạo sơ đồ',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 1.5,
        suggestedLevels: [
          { code: 'smart_0', name: 'Không có', points: 0, description: 'Không có SmartArt nào' },
          { code: 'smart_1', name: 'Cơ bản', points: 0.75, description: 'Có SmartArt nhưng đơn giản' },
          { code: 'smart_2', name: 'Phù hợp', points: 1.5, description: 'SmartArt đúng loại, nội dung rõ ràng' }
        ]
      },
      {
        detectorKey: 'docx.hyperlinks',
        name: 'Hyperlinks',
        description: 'Sử dụng hyperlinks trong tài liệu',
        fileTypes: ['DOCX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'link_0', name: 'Không có', points: 0, description: 'Không có hyperlink nào' },
          { code: 'link_1', name: 'Cơ bản', points: 0.5, description: 'Có hyperlink nhưng chưa hiệu quả' },
          { code: 'link_2', name: 'Hiệu quả', points: 1, description: 'Có hyperlink hoạt động tốt, đúng đích' }
        ]
      }
    ];
    
    // Define supported criteria for PPTX  
    const pptxCriteria: SupportedCriteria[] = [
      {
        detectorKey: 'pptx.save',
        name: 'Đặt tên file đúng format',
        description: 'Tên file theo định dạng <MSSV>_<Họ Tên>_<Buổi>.pptx',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 0.5,
        suggestedLevels: [
          { code: 'save_0', name: 'Không đúng', points: 0, description: 'Tên file không theo định dạng yêu cầu' },
          { code: 'save_1', name: 'Đúng format', points: 0.5, description: 'Tên file đúng định dạng <MSSV>_<Họ Tên>_<Buổi>.pptx' }
        ]
      },
      {
        detectorKey: 'pptx.slidesFromOutline',
        name: 'Tạo slide từ outline',
        description: 'Sử dụng chức năng tạo slide từ outline',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'outline_0', name: 'Không có', points: 0, description: 'Không sử dụng chức năng tạo từ outline' },
          { code: 'outline_1', name: 'Cơ bản', points: 0.5, description: 'Có sử dụng outline nhưng cấu trúc chưa tốt' },
          { code: 'outline_2', name: 'Tốt', points: 1, description: 'Tạo slide từ outline với cấu trúc rõ ràng' }
        ]
      },
      {
        detectorKey: 'pptx.theme',
        name: 'Áp dụng theme phù hợp',
        description: 'Sử dụng theme phù hợp với nội dung và bố cục',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'theme_0', name: 'Mặc định', points: 0, description: 'Sử dụng theme mặc định' },
          { code: 'theme_1', name: 'Có theme', points: 0.5, description: 'Có áp dụng theme nhưng chưa phù hợp' },
          { code: 'theme_2', name: 'Theme phù hợp', points: 1, description: 'Theme phù hợp với nội dung và chuyên nghiệp' }
        ]
      },
      {
        detectorKey: 'pptx.slideMaster',
        name: 'Chỉnh sửa Slide Master',
        description: 'Tùy chỉnh Slide Master theo yêu cầu',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'master_0', name: 'Không chỉnh sửa', points: 0, description: 'Không có tùy chỉnh Slide Master' },
          { code: 'master_1', name: 'Có chỉnh sửa', points: 1, description: 'Đã tùy chỉnh Slide Master đúng chuẩn' }
        ]
      },
      {
        detectorKey: 'pptx.headerFooter',
        name: 'Header và Footer',
        description: 'Thêm header/footer với số trang, ngày tháng',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 0.5,
        suggestedLevels: [
          { code: 'header_0', name: 'Không có', points: 0, description: 'Không có header/footer' },
          { code: 'header_1', name: 'Đầy đủ', points: 0.5, description: 'Có header/footer với số trang, ngày đúng vị trí' }
        ]
      },
      {
        detectorKey: 'pptx.hyperlinks',
        name: 'Hyperlink',
        description: 'Sử dụng hyperlink trong presentation',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'link_0', name: 'Không có', points: 0, description: 'Không có hyperlink nào' },
          { code: 'link_1', name: 'Có link hoạt động', points: 1, description: 'Có ít nhất 1 hyperlink hoạt động đúng đích' }
        ]
      },
      {
        detectorKey: 'pptx.transitions',
        name: 'Hiệu ứng chuyển slide',
        description: 'Áp dụng transition effects phù hợp',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1,
        suggestedLevels: [
          { code: 'transition_0', name: 'Không có', points: 0, description: 'Không có hiệu ứng chuyển slide' },
          { code: 'transition_1', name: 'Cơ bản', points: 0.5, description: 'Có hiệu ứng nhưng đơn giản' },
          { code: 'transition_2', name: 'Phù hợp', points: 1, description: 'Hiệu ứng hình và âm thanh phù hợp' }
        ]
      },
      {
        detectorKey: 'pptx.animations',
        name: 'Animation effects',
        description: 'Sử dụng animation cho các đối tượng',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1.5,
        suggestedLevels: [
          { code: 'anim_0', name: 'Không có', points: 0, description: 'Không có animation nào' },
          { code: 'anim_1', name: 'Cơ bản', points: 0.75, description: 'Có animation cơ bản' },
          { code: 'anim_2', name: 'Chuyên nghiệp', points: 1.5, description: 'Animation chuyên nghiệp, phù hợp nội dung' }
        ]
      },
      {
        detectorKey: 'pptx.objects',
        name: 'Đối tượng đa dạng',
        description: 'Sử dụng icon, 3D model, table, chart...',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1.5,
        suggestedLevels: [
          { code: 'obj_0', name: 'Chỉ text', points: 0, description: 'Chỉ có text, không có đối tượng khác' },
          { code: 'obj_1', name: '1-2 loại', points: 0.75, description: 'Có 1-2 loại đối tượng (hình, bảng...)' },
          { code: 'obj_2', name: 'Đa dạng', points: 1.5, description: 'Đa dạng đối tượng: icon, 3D, table, chart...' }
        ]
      },
      {
        detectorKey: 'pptx.artistic',
        name: 'Tính nghệ thuật',
        description: 'Thẩm mỹ, sáng tạo, bố cục khoa học',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 1.5,
        suggestedLevels: [
          { code: 'art_0', name: 'Cơ bản', points: 0, description: 'Bố cục đơn giản, ít tính thẩm mỹ' },
          { code: 'art_1', name: 'Khá', points: 0.75, description: 'Có tính thẩm mỹ, bố cục khá ổn' },
          { code: 'art_2', name: 'Xuất sắc', points: 1.5, description: 'Rất sáng tạo, thẩm mỹ cao, bố cục khoa học' }
        ]
      },
      {
        detectorKey: 'pptx.exportPdf',
        name: 'Xuất file PDF',
        description: 'Xuất presentation thành PDF chất lượng cao',
        fileTypes: ['PPTX'],
        defaultMaxPoints: 0.5,
        suggestedLevels: [
          { code: 'pdf_0', name: 'Không xuất', points: 0, description: 'Không có file PDF hoặc có lỗi' },
          { code: 'pdf_1', name: 'Xuất thành công', points: 0.5, description: 'Xuất PDF chính xác, không lỗi layout' }
        ]
      }
    ];
    
    // Filter theo fileType và detectorKey
    let filteredCriteria = [];
    
    if (!fileType || fileType === 'DOCX') {
      filteredCriteria.push(...docxCriteria);
    }
    if (!fileType || fileType === 'PPTX') {
      filteredCriteria.push(...pptxCriteria);
    }
    
    if (detectorKey) {
      filteredCriteria = filteredCriteria.filter(c => c.detectorKey === detectorKey);
    }
    
    // Add custom criteria to the supported criteria list
    try {
      const customCriteria = await listAllCustomCriteria();
      // Convert custom criteria to SupportedCriteria format
      // Note: Custom criteria don't have fileType information, so we'll include them for all file types
      const customSupportedCriteria: SupportedCriteria[] = customCriteria.map(criterion => ({
        detectorKey: criterion.detectorKey,
        name: criterion.name,
        description: criterion.description || '',
        fileTypes: ['PPTX', 'DOCX'], // Include for all file types since we don't have specific fileType info
        defaultMaxPoints: criterion.maxPoints || 10,
        suggestedLevels: criterion.levels && criterion.levels.length > 0 
          ? criterion.levels 
          : [{ points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' }]
      }));
      
      // Filter custom criteria based on detectorKey if specified
      let filteredCustomCriteria = customSupportedCriteria;
      if (detectorKey) {
        filteredCustomCriteria = filteredCustomCriteria.filter(c => 
          c.detectorKey === detectorKey
        );
      }
      
      // Combine preset and custom criteria
      // Use a Map to ensure unique detector keys (custom criteria will override preset ones if duplicate)
      const criteriaMap = new Map<string, SupportedCriteria>();
          
      // Add preset criteria first
      filteredCriteria.forEach(criterion => {
        criteriaMap.set(criterion.detectorKey, criterion);
      });
          
      // Add custom criteria (will override preset ones with same detectorKey)
      filteredCustomCriteria.forEach(criterion => {
        criteriaMap.set(criterion.detectorKey, criterion);
      });
          
      // Convert back to array
      filteredCriteria = Array.from(criteriaMap.values());
    } catch (error) {
      // If there's an error fetching custom criteria, continue with just preset criteria
      logger.warn('Không thể lấy custom criteria, chỉ sử dụng preset criteria:', error);
    }
    
    logger.debug(`Tìm thấy ${filteredCriteria.length} supported criteria`);
    return filteredCriteria;
    
  } catch (error) {
    logger.error('Lỗi khi get supported criteria:', error);
    throw error;
  }
}

// Preview criteria evaluation
export async function preview(body: CriteriaPreviewBody): Promise<Record<string, CriterionEvalResult>> {
  logger.info('Đang preview criteria evaluation');
  
  try {
    const { rubric, onlyCriteria } = body;
    
    const validation = await validateRubric({ rubric });
    if (!validation.isValid) {
      throw new Error(`Rubric không hợp lệ: ${validation.errors.join(', ')}`);
    }
    
    const criteriaToPreview = onlyCriteria 
      ? rubric.criteria.filter(c => onlyCriteria.includes(c.id))
      : rubric.criteria;
    
    const results: Record<string, CriterionEvalResult> = {};
    
    // Tạo mock results cho preview
    for (const criterion of criteriaToPreview) {
      const mockLevel = criterion.levels[0];
      results[criterion.id] = {
        passed: mockLevel.points > 0,
        points: mockLevel.points,
        level: mockLevel.code,
        reason: `Preview: ${mockLevel.description}`
      };
    }
    
    logger.info(`Preview hoàn thành cho ${Object.keys(results).length} criteria`);
    return results;
    
  } catch (error) {
    logger.error('Lỗi khi preview criteria:', error);
    throw error;
  }
}

// Test function to verify detector implementations
export function testDetectors() {
  logger.info('Đang test detector implementations');
  
  try {
    // Test that all required detectors are implemented
    const requiredDetectors: string[] = [
      'docx.toc',
      'docx.headerFooter',
      'docx.layoutArt',
      'docx.table',
      'docx.equation',
      'docx.tabs',
      'docx.smartArt',
      'docx.hyperlinks',
      'pptx.save',
      'pptx.slidesFromOutline',
      'pptx.theme',
      'pptx.slideMaster',
      'pptx.headerFooter',
      'pptx.hyperlinks',
      'pptx.transitions',
      'pptx.animations',
      'pptx.objects',
      'pptx.artistic',
      'pptx.exportPdf',
      'common.filenameConvention',
      'common.exportPdf'
    ];
    
    const missingDetectors = requiredDetectors.filter(key => !(key in detectors));
    
    if (missingDetectors.length > 0) {
      logger.error(`Thiếu ${missingDetectors.length} detectors: ${missingDetectors.join(', ')}`);
      return false;
    }
    
    logger.info(`Tất cả ${requiredDetectors.length} detectors đã được implement`);
    return true;
  } catch (error) {
    logger.error('Lỗi khi test detectors:', error);
    return false;
  }
}