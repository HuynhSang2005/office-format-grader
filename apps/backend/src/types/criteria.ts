/**
 * @file criteria.ts
 * @description Định nghĩa các kiểu dữ liệu cho hệ thống rubric và chấm điểm
 * @author Nguyễn Huỳnh Sang
 */

// Các detector key được hỗ trợ
export type DetectorKey =
  // DOCX detectors
  | 'docx.toc'
  | 'docx.headerFooter'
  | 'docx.layoutArt'
  | 'docx.table'
  | 'docx.equation'
  | 'docx.tabs'
  | 'docx.smartArt'
  | 'docx.hyperlinks'
  // PPTX detectors
  | 'pptx.save'
  | 'pptx.slidesFromOutline'
  | 'pptx.theme'
  | 'pptx.slideMaster'
  | 'pptx.headerFooter'
  | 'pptx.hyperlinks'
  | 'pptx.transitions'
  | 'pptx.animations'
  | 'pptx.objects'
  | 'pptx.artistic'
  | 'pptx.exportPdf'
  // Common detectors
  | 'common.filenameConvention'
  | 'common.exportPdf';

// Loại file được hỗ trợ
export type FileType = 'PPTX' | 'DOCX' | 'ZIP' | 'RAR';

// Phương thức làm tròn điểm
export type RoundingMethod = 'half_up_0.25' | 'none';

// Level đánh giá cho mỗi tiêu chí
export interface Level {
  code: string;          // Mã level: 'toc_0', 'toc_1', etc.
  name: string;          // Tên ngắn gọn: 'Không có', 'Cơ bản', 'Tốt'
  points: number;        // Điểm cho level này: 0, 0.5, 1, 1.5, 2, etc.
  description: string;   // Mô tả chi tiết tiêu chí đạt level này
}

// Tiêu chí chấm điểm
export interface Criterion {
  id: string;                    // ID duy nhất: 'pptx_theme', 'docx_toc'
  name: string;                  // Tên tiêu chí: 'Áp dụng theme', 'Mục lục tự động'
  description: string;           // Mô tả chi tiết tiêu chí
  detectorKey: DetectorKey;      // Key của detector xử lý tiêu chí này
  maxPoints: number;             // Điểm tối đa cho tiêu chí: 1, 1.5, 2, etc.
  levels: Level[];               // Các mức đánh giá cho tiêu chí
}

// Rubric hoàn chỉnh
export interface Rubric {
  name: string;                  // Tên rubric: 'Default PPTX Rubric'
  version: string;               // Phiên bản: '1.0'
  description?: string;          // Mô tả rubric
  fileType: FileType;            // Loại file áp dụng
  totalMaxPoints: number;        // Tổng điểm tối đa của rubric
  rounding: RoundingMethod;      // Phương thức làm tròn
  criteria: Criterion[];         // Danh sách các tiêu chí
}

// Kết quả đánh giá một tiêu chí
export interface CriterionEvalResult {
  passed: boolean;               // Có đạt tiêu chí hay không
  points: number;                // Điểm thực tế đạt được
  level: string;                 // Level code đạt được
  reason: string;                // Lý do đánh giá (tiếng Việt)
  details?: any;                 // Chi tiết kỹ thuật (optional)
}

// Kết quả chấm điểm đầy đủ
export interface GradeResult {
  fileId: string;                          // ID file được chấm
  filename: string;                        // Tên file gốc
  fileType: FileType;                      // Loại file
  rubricName: string;                      // Tên rubric sử dụng
  totalPoints: number;                     // Tổng điểm đạt được
  maxPossiblePoints: number;               // Tổng điểm tối đa có thể
  percentage: number;                      // Phần trăm: totalPoints/maxPossiblePoints * 100
  byCriteria: Record<string, CriterionEvalResult>; // Kết quả từng tiêu chí
  gradedAt: Date;                          // Thời gian chấm
  processingTime: number;                  // Thời gian xử lý (ms)
}

// Request chấm điểm
export interface GradeRequest {
  rubric?: Rubric;                         // Rubric tùy chỉnh (optional)
  onlyCriteria?: string[];                 // Chỉ chấm những tiêu chí này (optional)
  files: string[];                         // Danh sách file IDs cần chấm
}

// Query để lấy danh sách criteria
export interface CriteriaListQuery {
  source: 'preset' | 'custom';             // Nguồn criteria: preset có sẵn hay custom
  fileType: FileType;                      // Loại file
  rubricName?: string;                     // Tên rubric (nếu source = 'preset')
}

// Body để preview criteria
export interface CriteriaPreviewBody {
  fileId?: string;                         // ID file để preview (optional)
  features?: any;                          // Features đã extract (optional)
  rubric: Rubric;                          // Rubric để preview
  onlyCriteria?: string[];                 // Chỉ preview những criteria này (optional)
}

// Body để validate rubric
export interface CriteriaValidateBody {
  rubric: Rubric;                          // Rubric cần validate
}

// Response cho validation
export interface ValidationResult {
  isValid: boolean;                        // Rubric có hợp lệ không
  errors: string[];                        // Danh sách lỗi (nếu có)
  warnings: string[];                      // Danh sách cảnh báo (nếu có)
}

// Thông tin criteria được hỗ trợ
export interface SupportedCriteria {
  detectorKey: DetectorKey;                // Key của detector
  name: string;                            // Tên hiển thị
  description: string;                     // Mô tả chức năng
  fileTypes: FileType[];                   // Các loại file hỗ trợ
  defaultMaxPoints: number;                // Điểm tối đa mặc định
  suggestedLevels: Level[];                // Các level gợi ý
}