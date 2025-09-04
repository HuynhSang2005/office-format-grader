/**
 * @file rule-engine.ts
 * @description Engine chính để chấm điểm file DOCX và PPTX
 * @author Nguyễn Huỳnh Sang
 */

import type { 
  FeaturesPPTX, 
  FeaturesDOCX, 
  Rubric, 
  GradeResult, 
  CriterionEvalResult,
  Criterion 
} from '@/types/index';
import type { GradingOptions, GradingContext, ScoringConfig } from '@/types/rule-engine.types';
import { getDetector } from './detectors';
import { 
  scoreCriterion, 
  createGradeResult, 
  defaultScoringConfig
} from './scoring';
import { logger } from '@core/logger';

// Chấm điểm file DOCX
export async function gradeDocx(
  features: FeaturesDOCX,
  options: GradingOptions,
  context: GradingContext
): Promise<GradeResult> {
  logger.info(`Bắt đầu chấm điểm DOCX: ${context.filename}`);
  
  const { rubric, onlyCriteria, scoringConfig = defaultScoringConfig } = options;
  
  // Lọc criteria cần chấm
  const criteriaToEvaluate = onlyCriteria 
    ? rubric.criteria.filter((c: Criterion) => onlyCriteria.includes(c.id))
    : rubric.criteria;
  
  logger.debug(`Số criteria cần chấm: ${criteriaToEvaluate.length}`);
  
  const results: Record<string, CriterionEvalResult> = {};
  
  // Chấm từng criterion
  for (const criterion of criteriaToEvaluate) {
    try {
      const detector = getDetector(criterion.detectorKey);
      const rawResult = detector(features);
      
      // Áp dụng scoring rules
      const scoredResult = scoreCriterion(rawResult, criterion, scoringConfig);
      
      results[criterion.id] = scoredResult;
      
      logger.debug(
        `Criterion ${criterion.id}: ${scoredResult.points}/${criterion.maxPoints} điểm`
      );
    } catch (error) {
      logger.error(`Lỗi khi chấm criterion ${criterion.id}:`, error);
      
      // Gán điểm 0 khi có lỗi
      results[criterion.id] = {
        passed: false,
        points: 0,
        level: 'error',
        reason: `Lỗi detector: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  // Tính tổng điểm có thể đạt được từ rubric
  const maxPossiblePoints = rubric.totalMaxPoints;
  
  // Tạo grade result
  const processingTime = Date.now() - context.startTime;
  const gradeResult = createGradeResult(
    context.fileId,
    context.filename,
    'DOCX',
    rubric.name,
    results,
    maxPossiblePoints,
    scoringConfig,
    processingTime
  );
  
  logger.info(
    `Hoàn thành chấm DOCX: ${gradeResult.totalPoints}/${gradeResult.maxPossiblePoints} ` +
    `(${gradeResult.percentage.toFixed(1)}%) trong ${processingTime}ms`
  );
  
  return gradeResult;
}

// Chấm điểm file PPTX
export async function gradePptx(
  features: FeaturesPPTX,
  options: GradingOptions,
  context: GradingContext
): Promise<GradeResult> {
  logger.info(`Bắt đầu chấm điểm PPTX: ${context.filename}`);
  
  const { rubric, onlyCriteria, scoringConfig = defaultScoringConfig } = options;
  
  // Lọc criteria cần chấm
  const criteriaToEvaluate = onlyCriteria 
    ? rubric.criteria.filter((c: Criterion) => onlyCriteria.includes(c.id))
    : rubric.criteria;
  
  logger.debug(`Số criteria cần chấm: ${criteriaToEvaluate.length}`);
  
  const results: Record<string, CriterionEvalResult> = {};
  
  // Chấm từng criterion
  for (const criterion of criteriaToEvaluate) {
    try {
      const detector = getDetector(criterion.detectorKey);
      const rawResult = detector(features);
      
      // Áp dụng scoring rules
      const scoredResult = scoreCriterion(rawResult, criterion, scoringConfig);
      
      results[criterion.id] = scoredResult;
      
      logger.debug(
        `Criterion ${criterion.id}: ${scoredResult.points}/${criterion.maxPoints} điểm`
      );
    } catch (error) {
      logger.error(`Lỗi khi chấm criterion ${criterion.id}:`, error);
      
      // Gán điểm 0 khi có lỗi
      results[criterion.id] = {
        passed: false,
        points: 0,
        level: 'error',
        reason: `Lỗi detector: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  // Tính tổng điểm có thể đạt được từ rubric
  const maxPossiblePoints = rubric.totalMaxPoints;
  
  // Tạo grade result
  const processingTime = Date.now() - context.startTime;
  const gradeResult = createGradeResult(
    context.fileId,
    context.filename,
    'PPTX',
    rubric.name,
    results,
    maxPossiblePoints,
    scoringConfig,
    processingTime
  );
  
  logger.info(
    `Hoàn thành chấm PPTX: ${gradeResult.totalPoints}/${gradeResult.maxPossiblePoints} ` +
    `(${gradeResult.percentage.toFixed(1)}%) trong ${processingTime}ms`
  );
  
  return gradeResult;
}

// Wrapper function để chấm điểm tự động dựa trên file type
export async function gradeFile(
  features: FeaturesPPTX | FeaturesDOCX,
  fileType: 'PPTX' | 'DOCX',
  options: GradingOptions,
  context: GradingContext
): Promise<GradeResult> {
  if (fileType === 'DOCX') {
    return gradeDocx(features as FeaturesDOCX, options, context);
  } else {
    return gradePptx(features as FeaturesPPTX, options, context);
  }
}

// Batch grading cho nhiều files
export async function gradeBatch(
  files: Array<{
    features: FeaturesPPTX | FeaturesDOCX;
    fileType: 'PPTX' | 'DOCX';
    fileId: string;
    filename: string;
  }>,
  options: GradingOptions
): Promise<GradeResult[]> {
  const results: GradeResult[] = [];
  const startTime = Date.now();
  
  logger.info(`Bắt đầu batch grading: ${files.length} files`);
  
  for (const file of files) {
    try {
      const result = await gradeFile(
        file.features,
        file.fileType,
        options,
        {
          fileId: file.fileId,
          filename: file.filename,
          startTime: Date.now()
        }
      );
      results.push(result);
    } catch (error) {
      logger.error(`Lỗi khi chấm điểm file ${file.fileId}:`, error);
    }
  }
  
  const totalTime = Date.now() - startTime;
  logger.info(`Hoàn thành batch grading: ${results.length}/${files.length} files trong ${totalTime}ms`);
  
  return results;
}