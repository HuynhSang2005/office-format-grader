import type { ParsedPowerPointFormatData } from "../../../types/power_point";
import type { GradingDetail } from "../../types.ts";
import { 
  findRubricCriterion, 
  createMissingCriterionResult, 
  createNoDataResult,
  calculateScore 
} from "../../rubric/helpers.ts";

/**
 * Kiểm tra việc tạo slide từ Outline
 */
export function checkSlidesFromOutline(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = findRubricCriterion('slidesFromOutline');
    
    if (!rule) {
        return createMissingCriterionResult('slidesFromOutline', "Slides from Outline");
    }
    
    if (!data.slides || data.slides.length === 0) {
        return createNoDataResult(rule, "Không có slide nào để kiểm tra việc tạo từ outline.");
    }

    // Đánh giá dựa trên một số đặc điểm thường thấy ở slides tạo từ outline
    const {
        hasConsistentTitles,
        hasHierarchicalContent,
        hasConsistentFormatting,
        hasProperListLevels
    } = analyzeOutlineStructure(data.slides);
    
    // Điểm tổng dựa trên các tiêu chí
    const scoreFactor = [
        hasConsistentTitles ? 0.25 : 0,
        hasHierarchicalContent ? 0.25 : 0,
        hasConsistentFormatting ? 0.25 : 0,
        hasProperListLevels ? 0.25 : 0
    ].reduce((sum, factor) => sum + factor, 0);
    
    // Xác định lý do tùy chỉnh
    let customReason = "";
    if (scoreFactor >= 0.9) {
        customReason = "Tạo từ outline chính xác hoàn toàn; cấu trúc, định dạng slide chuẩn. Có tiêu đề nhất quán và nội dung phân cấp rõ ràng.";
    } else if (scoreFactor >= 0.7) {
        customReason = "Tạo từ outline khá chính xác; còn ít lỗi nhỏ về định dạng/cấu trúc.";
    } else if (scoreFactor >= 0.5) {
        customReason = "Tạo từ outline: nội dung đúng nhưng sai cấp độ, bố cục slide.";
    } else if (scoreFactor > 0) {
        customReason = "Tạo slide từ Outline nhưng lỗi nghiêm trọng về nội dung hoặc bố cục.";
    } else {
        customReason = "Không tạo slide từ outline hoặc không đủ bằng chứng để xác nhận.";
    }
    
    return calculateScore(rule, scoreFactor, customReason);
}

/**
 * Phân tích cấu trúc slide để đánh giá khả năng được tạo từ outline
 */
function analyzeOutlineStructure(slides: any[]): {
    hasConsistentTitles: boolean;
    hasHierarchicalContent: boolean;
    hasConsistentFormatting: boolean;
    hasProperListLevels: boolean;
} {
    // Kiểm tra tính nhất quán của tiêu đề
    const titleTexts = slides.map(slide => {
        const titleShape = slide.shapes?.find((s: any) => 
            s.name?.toLowerCase().includes('title')
        );
        return titleShape?.textRuns?.[0]?.text || '';
    }).filter(Boolean);
    
    const hasConsistentTitles = titleTexts.length >= slides.length * 0.8;
    
    // Kiểm tra cấu trúc phân cấp trong nội dung
    let totalListItems = 0;
    let totalListLevels = 0;
    let contentWithProperFormatting = 0;
    let slidesWithLists = 0;
    
    slides.forEach(slide => {
        // Tìm shape nội dung (không phải tiêu đề)
        const contentShapes = slide.shapes?.filter((s: any) => 
            !s.name?.toLowerCase().includes('title')
        ) || [];
        
        let slideHasLists = false;
        
        contentShapes.forEach((shape: any) => {
            if (!shape.textRuns || shape.textRuns.length === 0) return;
            
            // Kiểm tra định dạng nhất quán
            const hasConsistentFont = shape.textRuns.every((run: any, i: number, arr: any[]) => 
                i === 0 || run.font === arr[0].font
            );
            
            if (hasConsistentFont) {
                contentWithProperFormatting++;
            }
            
            // Kiểm tra danh sách phân cấp
            // Giả định: Outline thường tạo ra danh sách có thụt đầu dòng
            const listLevels = new Set<number>();
            
            shape.textRuns.forEach((run: any) => {
                if (run.listLevel !== undefined) {
                    listLevels.add(run.listLevel);
                    totalListItems++;
                    slideHasLists = true;
                }
            });
            
            totalListLevels += listLevels.size;
        });
        
        if (slideHasLists) {
            slidesWithLists++;
        }
    });
    
    // Đánh giá các tiêu chí
    const hasHierarchicalContent = slidesWithLists >= slides.length * 0.5;
    const hasConsistentFormatting = contentWithProperFormatting >= slides.length * 0.7;
    const hasProperListLevels = totalListLevels > 0 && totalListItems > 0 && 
                               totalListLevels >= Math.min(3, Math.floor(totalListItems / 3));
    
    return {
        hasConsistentTitles,
        hasHierarchicalContent,
        hasConsistentFormatting,
        hasProperListLevels
    };
}