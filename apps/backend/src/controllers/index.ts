/**
 * @file index.ts
 * @description Export tất cả controllers
 * @author Nguyễn Huỳnh Sang
 */

export { authController } from './auth.controller';
export { listCriteriaController as criteriaController } from './criteria.controller';
export { createCustomRubricController as customRubricController } from './customRubric.controller';
export { gradeFileController as gradeController } from './grade.controller';
export { uploadFileController } from './upload.controller';
export { getDashboardStatsController as dashboardController } from './dashboard.controller';
export { analyzeFileController } from './analyze.controller';
