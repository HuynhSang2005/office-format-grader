import type { GradingResult, GradingDetail, PowerPointGradingResult } from "../../types/grading.types";
import type { ParsedPowerPointFormatData } from "../../types/power_point";
import { getRubric, getLatestRubric, onRubricUpdated } from "../../utils/powerpointRubric";
import { updateTotalScore } from "../../helpers/gradingResultHelper";

// Import các checker modules
import {
  checkFilename,
  checkHeaderFooter,
  checkTransitions,
  checkObjects,
  checkSlideMaster,
  checkThemes,
  checkHyperlink,
  checkAnimations,
  checkSlidesFromOutline,
  checkCreativity
} from "./criteriaCheckers";

/**
 * Hàm chính để chấm điểm thủ công file PowerPoint dựa trên tiêu chí
 */
export async function gradePptxManually(
    parsedData: ParsedPowerPointFormatData
): Promise<GradingResult> {
    // Validate input
    if (!parsedData) {
        throw new Error("Không có dữ liệu phân tích để chấm điểm");
    }
    
    // Kết quả dạng mới
    const newFormatResult: PowerPointGradingResult = {
        criteria: {}
    };
    
    // Lấy phiên bản rubric mới nhất
    const rubric = await getLatestRubric();
    
    // Mapping ID tiêu chí -> hàm kiểm tra tương ứng
    const ruleMappings: Record<string, ((data: ParsedPowerPointFormatData) => GradingDetail) | null> = {
        filename: checkFilename,
        headerFooter: checkHeaderFooter,
        transitions: checkTransitions,
        objects: checkObjects,
        slideMaster: checkSlideMaster,
        themes: checkThemes,
        hyperlink: checkHyperlink,
        animations: checkAnimations,
        slidesFromOutline: checkSlidesFromOutline,
        creativity: checkCreativity
    };

    const details: GradingDetail[] = [];
    let totalAchievedScore = 0;
    let totalMaxScore = 0;

    // Chạy từng hàm kiểm tra theo tiêu chí
    for (const rule of rubric) {
        try {
            // Bỏ qua tiêu chí exportPdf
            if (rule.id === 'exportPdf') continue;
            
            totalMaxScore += rule.maxScore;
            const checkFunction = ruleMappings[rule.id];

            if (checkFunction) {
                const result = checkFunction(parsedData);
                details.push(result);
                totalAchievedScore += result.achievedScore;
                
                // Cập nhật kết quả dạng mới
                if (!newFormatResult.criteria) {
                    newFormatResult.criteria = {};
                }
                
                newFormatResult.criteria[rule.id] = {
                    name: rule.criterion,
                    score: result.achievedScore,
                    maxScore: rule.maxScore,
                    reason: result.reason
                };
            } else {
                // Nếu chưa triển khai checker, ghi nhận trong log kết quả
                const errorResult = {
                    criterion: rule.criterion,
                    maxScore: rule.maxScore,
                    achievedScore: 0,
                    reason: `[Chưa triển khai] Tính năng kiểm tra tiêu chí "${rule.criterion}" đang được phát triển`
                };
                details.push(errorResult);
                
                // Cập nhật kết quả dạng mới
                if (!newFormatResult.criteria) {
                    newFormatResult.criteria = {};
                }
                
                newFormatResult.criteria[rule.id] = {
                    name: rule.criterion,
                    score: 0,
                    maxScore: rule.maxScore,
                    reason: errorResult.reason
                };
            }
        } catch (error) {
            // Xử lý ngoại lệ khi kiểm tra tiêu chí
            const errorResult = {
                criterion: rule.criterion,
                maxScore: rule.maxScore,
                achievedScore: 0,
                reason: `[Lỗi kiểm tra] ${(error as Error).message}`
            };
            details.push(errorResult);
            
            // Cập nhật kết quả dạng mới
            if (!newFormatResult.criteria) {
                newFormatResult.criteria = {};
            }
            
            newFormatResult.criteria[rule.id] = {
                name: rule.criterion,
                score: 0,
                maxScore: rule.maxScore,
                reason: errorResult.reason
            };
        }
    }
    
    // Cập nhật tổng điểm cho kết quả dạng mới
    updateTotalScore(newFormatResult);
    
    // Cập nhật log với kết quả dạng mới (để debug)
    console.log("New format result:", JSON.stringify(newFormatResult, null, 2));

    // Trả về kết quả theo định dạng cũ để đảm bảo tương thích ngược
    return {
        totalAchievedScore: Math.round(totalAchievedScore * 100) / 100, // Làm tròn 2 chữ số thập phân
        totalMaxScore,
        details
    };
}