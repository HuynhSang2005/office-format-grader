// import các method check từ utils
import { powerpointRubric } from "../../utils/powerpointRubric";
// import Types
import type { GradingResult, GradingDetail } from "../../types/grading.types";
import type { ParsedPowerPointFormatData } from "../../types/power_point/powerpointFormat.types";

function checkFilename(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'filename')!;
    const filename = data.fileName || '';

    const pattern = /^\d+-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*-BaiThietKePowerPoint\.pptx$/i;

    if (pattern.test(filename)) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0.5, reason: "Tên file tuân thủ đúng quy ước." };
    }
    return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: "Tên file không đúng cấu trúc yêu cầu (MSSV-HovaTen-...)."};
}

function checkHeaderFooter(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'headerFooter')!;
    if (!data.slides || data.slides.length < 2) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: "Bài làm có ít hơn 2 slide, không thể kiểm tra."};
    }
    const slidesToCheck = data.slides.filter(s => s.slideNumber > 1);

    const allSlidesHaveHAndF = slidesToCheck.every(s =>
        s.displayInfo?.showsFooter &&
        s.displayInfo?.showsDate &&
        s.displayInfo?.showsSlideNumber
    );

    const titleSlide = data.slides[0];
    // Kiểm tra slide đầu tiên KHÔNG có Header/Footer
    const titleSlideIsClean =
        titleSlide &&
        !titleSlide.displayInfo?.showsFooter &&
        !titleSlide.displayInfo?.showsSlideNumber;

    if (allSlidesHaveHAndF && titleSlideIsClean) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0.5, reason: "Đã áp dụng Header/Footer cho các slide nội dung và bỏ qua slide tiêu đề." };
    }

    if (allSlidesHaveHAndF && !titleSlideIsClean) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0.25, reason: "Đã áp dụng Header/Footer nhưng không bỏ qua slide tiêu đề." };
    }

    return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: "Không áp dụng đầy đủ Header/Footer cho tất cả slide nội dung." };
}

function checkTransitions(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'transitions')!;
    if (!data.slides || data.slides.length === 0) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: "Không có slide nào để kiểm tra hiệu ứng." };
    }
    const allSlidesHaveTransition = data.slides.every(s => !!s.transition);
    // Kiểm tra slide 2 có âm thanh không
    const slide2HasSound = data.slides.length > 1 && !!data.slides[1].transition?.sound;

    if (allSlidesHaveTransition && slide2HasSound) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 1.0, reason: "Tất cả slide đều có hiệu ứng và slide 2 có âm thanh." };
    }
    if (allSlidesHaveTransition && !slide2HasSound) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0.5, reason: "Tất cả slide có hiệu ứng nhưng slide 2 thiếu âm thanh." };
    }

    return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: "Không phải tất cả slide đều có hiệu ứng chuyển động." };
}

function checkObjects(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'objects')!;
    const objectTypes = new Set<string>();

    if (!data.slides) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: "Không có slide nào để kiểm tra đối tượng." };
    }

    data.slides.forEach(slide => {
        slide.shapes?.forEach(shape => {
            if (shape.tableData) objectTypes.add('Table');
            if (shape.chartData) objectTypes.add('Chart');
            if (shape.smartArt) objectTypes.add('SmartArt');
            if (shape.wordArt) objectTypes.add('WordArt');
        });
    });

    // Đếm cả 'Shape' nếu có các hình khối đơn giản
    if (data.slides.some(s => s.shapes && s.shapes.length > 0)) {
        objectTypes.add('Shape');
    }

    if (objectTypes.size >= 2) {
         return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 1.0, reason: `Đã chèn ${objectTypes.size} loại đối tượng khác nhau.` };
    }
    if (objectTypes.size === 1) {
         return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0.5, reason: "Chỉ chèn 1 loại đối tượng, chưa đủ yêu cầu." };
    }

    return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: "Không tìm thấy đối tượng nào được chèn." };
}

export function gradePptxManually(parsedData: ParsedPowerPointFormatData): GradingResult {
    const details: GradingDetail[] = [];

    const ruleMappings: { [key: string]: (data: ParsedPowerPointFormatData) => GradingDetail } = {
        filename: checkFilename,
        headerFooter: checkHeaderFooter,
        transitions: checkTransitions,
        objects: checkObjects,
    };

    let totalAchievedScore = 0;
    let totalMaxScore = 0;

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