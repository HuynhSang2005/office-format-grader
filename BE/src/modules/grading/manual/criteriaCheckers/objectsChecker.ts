import type { ParsedPowerPointFormatData } from "../../../powerpoint/types.ts";
import type { GradingDetail } from "../../types.ts";
import { powerpointRubric } from "../../rubric/powerpointRubric.ts";
import { countObjectsByType } from "../helpers/slideAnalyzer";

/**
 * Kiểm tra việc sử dụng các đối tượng đồ họa trong slide
 */
export function checkObjects(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'objects')!;
    
    if (!data.slides) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0, 
            reason: "Không có slide nào để kiểm tra đối tượng đồ họa." 
        };
    }

    // Đếm số lượng mỗi loại đối tượng
    const objectCounts = countObjectsByType(data.slides);
    
    // Tạo danh sách chi tiết các đối tượng đã sử dụng
    const usedObjectsList = Array.from(objectCounts.entries())
        .map(([type, count]) => `${type} (${count})`)
        .join(', ');
        
    // Đánh giá kết quả
    if (objectCounts.size >= 3) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 1.0, 
            reason: `Xuất sắc! Đã chèn ${objectCounts.size} loại đối tượng đa dạng: ${usedObjectsList}.` 
        };
    }
    
    if (objectCounts.size === 2) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0.75, 
            reason: `Khá tốt! Đã chèn ${objectCounts.size} loại đối tượng: ${usedObjectsList}.` 
        };
    }
    
    if (objectCounts.size === 1) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0.5, 
            reason: `Cơ bản! Chỉ chèn 1 loại đối tượng: ${usedObjectsList}, chưa đủ đa dạng.` 
        };
    }

    return { 
        criterion: rule.criterion, 
        maxScore: rule.maxScore, 
        achievedScore: 0, 
        reason: "Không tìm thấy đối tượng đồ họa nào được chèn trong bài." 
    };
}