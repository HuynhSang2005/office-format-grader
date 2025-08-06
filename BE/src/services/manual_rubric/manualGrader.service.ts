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

function checkSlideMaster(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'slideMaster')!;
    let errors: string[] = [];

    // 1. Kiểm tra layout "Title Slide"
    const titleSlides = data.slides.filter(s => s.layout === 'Title Slide');
    if (titleSlides.length > 0) {
        const titleShape = titleSlides[0].shapes.find(sh => sh.name.toLowerCase().includes('title'));
        const subtitleShape = titleSlides[0].shapes.find(sh => sh.name.toLowerCase().includes('sub title'));

        if (titleShape?.textRuns[0]?.font !== 'Times New Roman' || titleShape?.textRuns[0]?.size !== 32) {
            errors.push("Tiêu đề trên Title Slide không đúng font/size (yêu cầu TNR, 32pt).");
        }
        if (subtitleShape?.textRuns[0]?.font !== 'Arial' || subtitleShape?.textRuns[0]?.size !== 28) {
            errors.push("Tiêu đề phụ trên Title Slide không đúng font/size (yêu cầu Arial, 28pt).");
        }
    } else {
        errors.push("Không tìm thấy slide nào sử dụng layout 'Title Slide'.");
    }

    // 2. Kiểm tra layout "Title and Content"
    const contentSlides = data.slides.filter(s => s.layout === 'Title and Content');
    if (contentSlides.length > 0) {
        for (const slide of contentSlides) {
            const titleShape = slide.shapes.find(sh => sh.name.toLowerCase().includes('title'));
            const contentShape = slide.shapes.find(sh => sh.name.toLowerCase().includes('content'));

            if (titleShape?.textRuns[0]?.font !== 'Times New Roman' || titleShape?.textRuns[0]?.size !== 28) {
                errors.push(`Tiêu đề trên slide ${slide.slideNumber} không đúng font/size (yêu cầu TNR, 28pt).`);
            }
            if (contentShape?.textRuns[0]?.font !== 'Arial' || contentShape?.textRuns[0]?.size !== 24) {
                errors.push(`Nội dung trên slide ${slide.slideNumber} không đúng font/size (yêu cầu Arial, 24pt).`);
            }
        }
    } else {
        errors.push("Không tìm thấy slide nào sử dụng layout 'Title and Content'.");
    }

    // 3. Chấm điểm dựa trên số lỗi
    if (errors.length === 0) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 1.5, reason: "Sử dụng Slide Master hoàn toàn chính xác và hiệu quả." };
    }
    if (errors.length <= 2) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 1.0, reason: `Sử dụng khá chính xác, còn vài lỗi nhỏ: ${errors.join(' ')}` };
    }
    if (errors.length <= 4) {
        return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0.5, reason: `Sử dụng hạn chế, nhiều phần còn sai: ${errors.join(' ')}` };
    }

    return { criterion: rule.criterion, maxScore: rule.maxScore, achievedScore: 0, reason: `Sử dụng sai hoặc không dùng Slide Master. Lỗi: ${errors.join(' ')}` };
}


export function gradePptxManually(parsedData: ParsedPowerPointFormatData): GradingResult {
    const details: GradingDetail[] = [];

    // Cập nhật mapping để thêm hàm check mới
    const ruleMappings: { [key: string]: (data: ParsedPowerPointFormatData) => GradingDetail } = {
        filename: checkFilename,
        headerFooter: checkHeaderFooter,
        transitions: checkTransitions,
        objects: checkObjects,
        slideMaster: checkSlideMaster, // <-- THÊM HÀM MỚI
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