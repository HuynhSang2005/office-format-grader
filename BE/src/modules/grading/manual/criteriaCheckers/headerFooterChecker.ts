import type { ParsedPowerPointFormatData } from "../../../powerpoint/types.ts";
import type { GradingDetail } from "../../types.ts";
import { powerpointRubric } from "../../rubric/powerpointRubric.ts";

/**
 * Kiểm tra thiết lập Header/Footer trong bài nộp
 */
export function checkHeaderFooter(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'headerFooter')!;
    
    // Kiểm tra đủ số lượng slide
    if (!data.slides || data.slides.length < 2) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0, 
            reason: "Bài làm có ít hơn 2 slide, không thể kiểm tra."
        };
    }
    
    // Kiểm tra tất cả slide nội dung (trừ slide đầu) có Header/Footer
    const contentSlides = data.slides.filter(s => s.slideNumber > 1);
    
    const allContentSlidesHaveFooter = contentSlides.every(s => s.displayInfo?.showsFooter === true);
    const allContentSlidesHaveDate = contentSlides.every(s => s.displayInfo?.showsDate === true);
    const allContentSlidesHaveSlideNumber = contentSlides.every(s => s.displayInfo?.showsSlideNumber === true);
    
    // Phải thỏa mãn cả 3 điều kiện
    const allContentSlidesCorrect = allContentSlidesHaveFooter && allContentSlidesHaveDate && allContentSlidesHaveSlideNumber;

    // Kiểm tra slide đầu tiên KHÔNG có Header/Footer (slide tiêu đề thường không có)
    const titleSlide = data.slides[0];
    const titleSlideIsClean = titleSlide &&
                             !titleSlide.displayInfo?.showsFooter &&
                             !titleSlide.displayInfo?.showsSlideNumber;

    // Đánh giá kết quả
    if (allContentSlidesCorrect && titleSlideIsClean) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0.5, 
            reason: "Đã áp dụng Header/Footer cho các slide nội dung và bỏ qua slide tiêu đề đúng quy cách." 
        };
    }

    if (allContentSlidesCorrect && !titleSlideIsClean) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0.25, 
            reason: "Đã áp dụng Header/Footer cho slide nội dung nhưng không bỏ qua slide tiêu đề." 
        };
    }

    return { 
        criterion: rule.criterion, 
        maxScore: rule.maxScore, 
        achievedScore: 0, 
        reason: "Không áp dụng đầy đủ Header/Footer cho tất cả slide nội dung." 
    };
}