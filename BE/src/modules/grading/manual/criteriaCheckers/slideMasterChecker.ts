import type { ParsedPowerPointFormatData, FormattedSlide } from "../../../types/power_point";
import type { GradingDetail } from "../../types.ts";
import { powerpointRubric } from "../../rubric/powerpointRubric.ts";
import { validateShapeFormatting, isEmptySlide } from "../helpers/formatValidator";
import { findTitleShape, findSubtitleShape, findContentShape } from "../helpers/slideAnalyzer";

/**
 * Kiểm tra việc sử dụng Slide Master trong thiết kế
 */
export function checkSlideMaster(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'slideMaster');
    
    // Nếu không tìm thấy rule, dùng một giá trị mặc định
    if (!rule) {
        return { 
            criterion: "Slide Master", 
            maxScore: 1.5, 
            achievedScore: 0, 
            reason: "Lỗi cấu hình: Không tìm thấy tiêu chí đánh giá Slide Master" 
        };
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];

    // Kiểm tra slides tồn tại
    if (!data.slides || data.slides.length === 0) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0, 
            reason: "Không có slide nào để kiểm tra Slide Master." 
        };
    }

    // 1. Kiểm tra layout "Title Slide"
    checkTitleSlideLayout(data.slides, errors, warnings);

    // 2. Kiểm tra layout "Title and Content"
    checkContentSlideLayout(data.slides, errors, warnings);

    // 3. Chấm điểm dựa trên số lỗi nghiêm trọng và cảnh báo
    return evaluateResult(rule, errors, warnings);
}

/**
 * Kiểm tra các slide có layout Title Slide
 */
function checkTitleSlideLayout(
    slides: FormattedSlide[],
    errors: string[],
    warnings: string[]
): void {
    // Tìm các slides có layout là Title Slide
    const titleSlides = slides.filter(s => s.layout === 'Title Slide');
    
    if (titleSlides.length === 0) {
        errors.push("Thiếu slide sử dụng layout 'Title Slide'");
        return;
    }
    
    // Chắc chắn có ít nhất một phần tử trong titleSlides tại thời điểm này
    const titleSlide = titleSlides[0];
    
    // Kiểm tra slide có shapes không
    if (!titleSlide || isEmptySlide(titleSlide)) {
        errors.push(`Slide tiêu đề ${titleSlide ? `(${titleSlide.slideNumber})` : ''} không có shapes hoặc không hợp lệ`);
        return;
    }

    // Kiểm tra tiêu đề
    const titleShape = findTitleShape(titleSlide);
    if (!titleShape) {
        errors.push("Không tìm thấy placeholder tiêu đề trên Title Slide");
    } else if (!titleShape.textRuns || titleShape.textRuns.length === 0) {
        warnings.push("Placeholder tiêu đề trên Title Slide trống");
    } else {
        errors.push(...validateShapeFormatting(titleShape, 'Times New Roman', 32)
            .map(err => `Tiêu đề chính: ${err}`));
    }

    // Kiểm tra tiêu đề phụ
    const subtitleShape = findSubtitleShape(titleSlide);
    if (!subtitleShape) {
        warnings.push("Không tìm thấy placeholder tiêu đề phụ trên Title Slide");
    } else if (!subtitleShape.textRuns || subtitleShape.textRuns.length === 0) {
        warnings.push("Placeholder tiêu đề phụ trên Title Slide trống");
    } else {
        errors.push(...validateShapeFormatting(subtitleShape, 'Arial', 28)
            .map(err => `Tiêu đề phụ: ${err}`));
    }
}

/**
 * Kiểm tra các slide có layout Title and Content
 */
function checkContentSlideLayout(
    slides: FormattedSlide[],
    errors: string[],
    warnings: string[]
): void {
    // Tìm các slide có layout Title and Content
    const contentSlides = slides.filter(s => s.layout === 'Title and Content');
    
    if (contentSlides.length === 0) {
        errors.push("Thiếu slide sử dụng layout 'Title and Content'");
        return;
    }
    
    // Kiểm tra từng slide
    contentSlides.forEach(slide => {
        if (!slide || isEmptySlide(slide)) {
            const slideNumber = slide?.slideNumber ?? 'unknown';
            errors.push(`Slide ${slideNumber} không có shapes hoặc không hợp lệ`);
            return;
        }
        
        // Kiểm tra tiêu đề slide
        const titleShape = findTitleShape(slide);
        if (!titleShape) {
            errors.push(`Slide ${slide.slideNumber}: Không tìm thấy placeholder tiêu đề`);
        } else if (!titleShape.textRuns || titleShape.textRuns.length === 0) {
            warnings.push(`Slide ${slide.slideNumber}: Placeholder tiêu đề trống`);
        } else {
            errors.push(...validateShapeFormatting(titleShape, 'Times New Roman', 28)
                .map(err => `Slide ${slide.slideNumber} - Tiêu đề: ${err}`));
        }
        
        // Kiểm tra nội dung slide
        const contentShape = findContentShape(slide);
        if (!contentShape) {
            warnings.push(`Slide ${slide.slideNumber}: Không tìm thấy placeholder nội dung`);
        } else if (!contentShape.textRuns || contentShape.textRuns.length === 0) {
            warnings.push(`Slide ${slide.slideNumber}: Placeholder nội dung trống`);
        } else {
            errors.push(...validateShapeFormatting(contentShape, 'Arial', 24)
                .map(err => `Slide ${slide.slideNumber} - Nội dung: ${err}`));
        }
    });
}

/**
 * Đánh giá kết quả dựa trên số lượng lỗi và cảnh báo
 */
function evaluateResult(
    rule: typeof powerpointRubric[0], 
    errors: string[], 
    warnings: string[]
): GradingDetail {
    const allIssues = [...errors, ...warnings.map(w => `(Cảnh báo: ${w})`)];
    
    if (errors.length === 0 && warnings.length === 0) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: rule.maxScore, 
            reason: "Xuất sắc! Sử dụng Slide Master hoàn toàn chính xác và hiệu quả." 
        };
    }
    
    if (errors.length === 0 && warnings.length <= 2) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 1.0, 
            reason: `Tốt! Sử dụng đúng Slide Master với vài lưu ý nhỏ: ${allIssues.join(' ')}` 
        };
    }
    
    if (errors.length <= 2) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0.75, 
            reason: `Khá tốt! Sử dụng tương đối đúng Slide Master: ${allIssues.join(' ')}` 
        };
    }
    
    if (errors.length <= 4) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0.5, 
            reason: `Sử dụng hạn chế, nhiều phần còn sai: ${allIssues.join(' ')}` 
        };
    }

    return { 
        criterion: rule.criterion, 
        maxScore: rule.maxScore, 
        achievedScore: 0, 
        reason: `Sử dụng sai hoặc không dùng Slide Master. Lỗi: ${allIssues.join(' ')}` 
    };
}