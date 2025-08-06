// import các method check từ utils
import { powerpointRubric } from "../../utils/powerpointRubric";

// import Types
import type { GradingResult, GradingDetail } from "../../types/grading.types";
import type { ParsedPowerPointFormatData } from "../../types/power_point/powerpointFormat.types";


function checkFilename(data: ParsedPowerPointFormatData): GradingDetail {
    // TODO: Viết logic ở phase sau
    return { criterion: "Đặt tên tập tin đúng quy ước", maxScore: 0.5, achievedScore: 0, reason: "Chức năng chưa được triển khai." };
}

function checkHeaderFooter(data: ParsedPowerPointFormatData): GradingDetail {
    // TODO: Viết logic ở phase sau
    return { criterion: "Dùng Header/Footer", maxScore: 0.5, achievedScore: 0, reason: "Chức năng chưa được triển khai." };
}

function checkTransitions(data: ParsedPowerPointFormatData): GradingDetail {
    // TODO: Viết logic ở phase sau
    return { criterion: "Hiệu ứng chuyển động (Transition)", maxScore: 1.0, achievedScore: 0, reason: "Chức năng chưa được triển khai." };
}

function checkObjects(data: ParsedPowerPointFormatData): GradingDetail {
    // TODO: Viết logic ở phase sau
    return { criterion: "Chèn đối tượng", maxScore: 1.0, achievedScore: 0, reason: "Chức năng chưa được triển khai." };
}


// --- HÀM ĐIỀU PHỐI CHÍNH ---

export function gradePptxManually(parsedData: ParsedPowerPointFormatData): GradingResult {
    const details: GradingDetail[] = [];

    // Ánh xạ từ id của rubric đến hàm check tương ứng
    const ruleMappings: { [key: string]: (data: ParsedPowerPointFormatData) => GradingDetail } = {
        filename: checkFilename,
        headerFooter: checkHeaderFooter,
        transitions: checkTransitions,
        objects: checkObjects,
    };

    let totalAchievedScore = 0;
    let totalMaxScore = 0;

    // Lặp qua bộ tiêu chí đã mã hóa
    for (const rule of powerpointRubric) {
        totalMaxScore += rule.maxScore;
        const checkFunction = ruleMappings[rule.id];

        if (checkFunction) {
            const result = checkFunction(parsedData);
            details.push(result);
            totalAchievedScore += result.achievedScore;
        }
    }

    return {
        totalAchievedScore,
        totalMaxScore,
        details,
    };
}