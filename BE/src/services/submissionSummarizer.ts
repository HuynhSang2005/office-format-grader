import type { ParsedWordData } from '../types/word/wordFormat.types';
import type { ParsedPowerPointFormatData } from '../types/power_point/powerpointFormat.types';

// Hàm helper để lấy text từ một Paragraph
function getTextFromParagraphs(paragraphs: any[]): string[] {
    return paragraphs.map(p => p.runs.map((r: any) => r.text).join('')).filter(Boolean);
}

/**
 * Tóm tắt dữ liệu chi tiết từ trình phân tích Word.
 */
function summarizeDocx(rawDocx: ParsedWordData) {

    const headings = rawDocx.content
        .filter((block: any) => block.styleName?.startsWith('Heading'))
        .map((block: any) => ({
            level: parseInt(block.styleName.replace('Heading', '')),
            text: block.runs.map((r: any) => r.text).join(''),
        }));

    const plainParagraphs = rawDocx.content
        .filter((block: any) => !block.styleName) // Chỉ lấy các đoạn văn thường
        .map((block: any) => ({
            text: block.runs.map((r: any) => r.text).join(''),
            // Lấy style của run đầu tiên làm đại diện
            style: {
                font: block.runs[0]?.font,
                size: block.runs[0]?.size,
                bold: block.runs[0]?.isBold,
                italic: block.runs[0]?.isItalic,
                color: block.runs[0]?.color,
                alignment: block.alignment,
            }
        }));

    const tables = rawDocx.content
        .filter((block: any) => block.type === 'table')
        .map((table: any) => ({
            rows: table.rows.length,
            columns: table.rows[0]?.length || 0,
            hasHeader: true, // Giả định
            sampleData: table.rows.slice(0, 2).map((row: any) => 
                row.map((cell: any) => 
                    cell.content.map((p: any) => p.runs.map((r: any) => r.text).join('')).join(' ')
                )
            ),
        }));

    const images = rawDocx.content
        .flatMap((block: any) => block.runs || [])
        .filter((run: any) => run.type === 'image')
        .map((image: any) => ({
            caption: `Image: ${image.imageName}`, 
            size: (image.width * image.height > 1000000) ? 'medium' : 'small',
        }));

    return {
        headings,
        tocDetected: false, 
        paragraphs: plainParagraphs,
        tables,
        images,
        headers: rawDocx.headers ? rawDocx.headers.flatMap(h => getTextFromParagraphs(h.content)) : [],
        footers: rawDocx.footers ? rawDocx.footers.flatMap(f => getTextFromParagraphs(f.content)) : [],
        hyperlinks: [], 
        wordCount: null,
        pageCount: null, 
    };
}

/**
 * Tóm tắt dữ liệu chi tiết từ trình phân tích PowerPoint.
 */
function summarizePptx(rawPptx: ParsedPowerPointFormatData) {
    const slides = rawPptx.slides.map(slide => {
        const titleShape = slide.shapes.find(s => s.name.toLowerCase().includes('title'));
        const contentShapes = slide.shapes.filter(s => !s.name.toLowerCase().includes('title'));

        return {
            slideNumber: slide.slideNumber,
            layout: slide.layout,
            title: titleShape ? titleShape.textRuns.map(r => r.text).join('') : '',
            content: contentShapes.flatMap(s => s.textRuns.map(r => r.text)).filter(Boolean),
            footer: slide.displayInfo.showsFooter ? '...' : '', // Cần logic lấy text từ footer shape
            hasTransition: !!slide.transition,
            hasSound: !!slide.transition?.sound,
            animations: slide.animations ? ['unknown_effect'] : [], // Cần nâng cấp parser
            objects: Array.from(new Set(slide.shapes.map(s => {
                if (s.chartData) return 'Chart';
                if (s.tableData) return 'Table';
                if (s.smartArt) return 'SmartArt';
                if (s.wordArt) return 'WordArt';
                return 'Shape';
            }))),
        };
    });

    return {
        slideCount: rawPptx.slideCount,
        slides,
        hasHeaderFooter: rawPptx.slides.some(s => s.displayInfo.showsFooter || s.displayInfo.showsSlideNumber),
        hasHyperlink: rawPptx.slides.some(s => s.shapes.some(sh => sh.textRuns.some(r => r.hyperlink))),
        hasAnimation: rawPptx.slides.some(s => s.animations),
        hasMedia: rawPptx.mediaFiles.length > 0,
    };
}

/**
 * Hàm chính để tạo đối tượng submission cuối cùng.
 */
export function createSubmissionSummary(
    submissionFiles: { filename: string, type: 'docx' | 'pptx', rawData: any }[],
    rubricFile: { filename: string, rawData: any }
) {
    const studentInfo = { // Giả định lấy từ filename hoặc một nguồn khác
        id: submissionFiles[0]?.filename.split('_')[0] || 'Unknown',
        name: submissionFiles[0]?.filename.split('_')[1] || 'Unknown',
    };

    const summarizedFiles = submissionFiles.map(file => {
        let format;
        if (file.type === 'docx') {
            format = summarizeDocx(file.rawData);
        } else if (file.type === 'pptx') {
            format = summarizePptx(file.rawData);
        }

        return {
            type: file.type,
            filename: file.filename,
            mode: 'full',
            format,
        };
    });

    return {
        submission: {
            filename: "submission.zip", // Giả định
            submittedAt: new Date().toISOString(),
            student: studentInfo,
            files: summarizedFiles,
            rubric: {
                filename: rubricFile.filename,
                parsedAs: 'text',
                content: rubricFile.rawData.paragraphs,
            },
        },
    };
}