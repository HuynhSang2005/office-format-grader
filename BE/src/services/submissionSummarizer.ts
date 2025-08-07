import type { ParsedWordData, Paragraph, TextRun } from '../types/word/wordFormat.types';
import type { ParsedPowerPointFormatData, FormattedSlide, Shape } from '../types/power_point';
import { DateTime } from 'luxon';
import { isParagraph, isTable, isTextRun } from '../types/word/guards/wordGuards';

function getTextFromParagraphs(paragraphs: Paragraph[]): string[] {
    return paragraphs.map(
        p => p.runs.filter(isTextRun).map(r => r.text).join('')
    ).filter(Boolean);
}

/**
 * Tóm tắt dữ liệu chi tiết từ trình phân tích Word.
 */
function summarizeDocx(rawDocx: ParsedWordData) {
    const headings = rawDocx.content
        .filter(isParagraph)
        .filter(block => !!block.styleName?.startsWith('Heading'))
        .map((block) => ({
            level: parseInt(block.styleName!.replace('Heading', ''), 10),
            text: block.runs.filter(isTextRun).map(r => r.text).join(''),
        }));

    const plainParagraphs = rawDocx.content
        .filter(isParagraph)
        .filter(block => !block.styleName)
        .map((block) => {
            const firstTextRun = block.runs.find(isTextRun);
            return {
                text: block.runs.filter(isTextRun).map(r => r.text).join(''),
                style: {
                    font: firstTextRun?.font,
                    size: firstTextRun?.size,
                    bold: firstTextRun?.isBold,
                    italic: firstTextRun?.isItalic,
                    color: firstTextRun?.color,
                    alignment: block.alignment,
                }
            };
        });

    const tables = rawDocx.content
        .filter(isTable)
        .map((table) => ({
            rows: table.rows.length,
            columns: table.rows[0]?.length || 0,
            hasHeader: true,
            sampleData: table.rows.slice(0, 2).map((row) =>
                row.map((cell) =>
                    cell.content
                        .filter(isParagraph)
                        .map((p) => p.runs.filter(isTextRun).map((r) => r.text).join(''))
                        .join(' ')
                )
            ),
        }));

    const images = rawDocx.content
        .filter(isParagraph)
        .flatMap(block => block.runs)
        .filter((run: any) => run.type === 'drawing' && run.drawingType === 'image')
        .map((image: any) => ({
            caption: image.caption || `Image: ${image.imageName}`,
            size: (image.width * image.height > 1000000) ? 'medium' : 'small',
        }));

    return {
        headings,
        tocDetected: !!rawDocx.toc,
        paragraphs: plainParagraphs,
        tables,
        images,
        headers: rawDocx.headers ? rawDocx.headers.flatMap(h => getTextFromParagraphs(h.content.filter(isParagraph))) : [],
        footers: rawDocx.footers ? rawDocx.footers.flatMap(f => getTextFromParagraphs(f.content.filter(isParagraph))) : [],
        hyperlinks: [],
        wordCount: rawDocx.metadata?.wordCount || null,
        pageCount: rawDocx.metadata?.pageCount || null,
    };
}

/**
 * Trích xuất text từ shape PowerPoint
 */
function extractTextFromShape(shape: Shape): string {
    if (!shape.textRuns || shape.textRuns.length === 0) {
        return '';
    }
    
    return shape.textRuns.map(run => run.text || '').join('');
}

/**
 * Nhận diện loại shape dựa trên dữ liệu của nó
 */
function identifyShapeType(shape: Shape): string {
    if (shape.chartData) return 'Chart';
    if (shape.tableData) return 'Table';
    if (shape.smartArt) return 'SmartArt';
    if (shape.wordArt) return 'WordArt';
    
    // Xác định nếu là placeholder dựa trên tên
    const name = shape.name.toLowerCase();
    if (name.includes('title')) return 'Title';
    if (name.includes('content')) return 'Content';
    if (name.includes('text')) return 'Text';
    
    return 'Shape';
}

/**
 * Tóm tắt thông tin về animation
 */
function summarizeAnimations(slide: FormattedSlide) {
    if (!slide.animations) return [];
    
    const effectTypes: string[] = [];
    
    // Hàm đệ quy để trích xuất tất cả các loại hiệu ứng
    function extractEffectTypes(node: any) {
        if (node.effect && node.effect.type) {
            effectTypes.push(node.effect.type);
        }
        
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child: any) => extractEffectTypes(child));
        }
    }
    
    extractEffectTypes(slide.animations);
    
    return effectTypes.length > 0 ? effectTypes : ['unknown_effect'];
}

/**
 * Tóm tắt dữ liệu chi tiết từ trình phân tích PowerPoint.
 * Phiên bản được cải tiến để làm việc với cấu trúc dữ liệu mới
 */
function summarizePptx(rawPptx: ParsedPowerPointFormatData) {
    if (!rawPptx.slides || !Array.isArray(rawPptx.slides)) {
        return {
            slideCount: rawPptx.slideCount || 0,
            slides: [],
            hasHeaderFooter: false,
            hasHyperlink: false,
            hasAnimation: false,
            hasMedia: false,
            theme: null,
            metadata: null
        };
    }

    const slides = rawPptx.slides.map((slide: FormattedSlide) => {
        if (!slide.shapes || !Array.isArray(slide.shapes)) {
            return {
                slideNumber: slide.slideNumber,
                layout: slide.layout || 'Unknown',
                title: '',
                content: [],
                footer: slide.displayInfo?.showsFooter ? 'Has Footer' : '',
                hasTransition: !!slide.transition,
                hasSound: !!slide.transition?.sound,
                animations: [],
                objects: []
            };
        }

        const titleShape = slide.shapes.find(s => s.name.toLowerCase().includes('title'));
        const contentShapes = slide.shapes.filter(s => !s.name.toLowerCase().includes('title'));

        return {
            slideNumber: slide.slideNumber,
            layout: slide.layout || 'Unknown',
            title: titleShape ? extractTextFromShape(titleShape) : '',
            content: contentShapes.map(s => extractTextFromShape(s)).filter(Boolean),
            footer: slide.displayInfo?.showsFooter ? 'Has Footer' : '',
            hasNotes: !!slide.notes,
            hasTransition: !!slide.transition,
            hasSound: !!slide.transition?.sound,
            animations: summarizeAnimations(slide),
            objects: Array.from(new Set(slide.shapes.map(identifyShapeType))),
        };
    });

    // Tạo tóm tắt về theme
    const themeSummary = rawPptx.theme ? {
        name: rawPptx.theme.name || 'Unknown',
        colorCount: typeof rawPptx.theme.colors === 'object' ? Object.keys(rawPptx.theme.colors || {}).length : 0,
        mainFont: typeof rawPptx.theme.fonts === 'object' ? 'Available' : 'Unknown'
    } : null;
    
    // Tạo tóm tắt về metadata
    const metadataSummary = rawPptx.documentProperties ? {
        title: rawPptx.documentProperties.title || null,
        creator: rawPptx.documentProperties.creator || null,
        lastModifiedBy: rawPptx.documentProperties.lastModifiedBy || null,
        created: rawPptx.documentProperties.created || null,
        modified: rawPptx.documentProperties.modified || null
    } : null;

    return {
        slideCount: rawPptx.slideCount,
        slides,
        hasHeaderFooter: rawPptx.slides.some(s => s.displayInfo?.showsFooter || s.displayInfo?.showsSlideNumber),
        hasHyperlink: rawPptx.slides.some(s => s.shapes?.some(sh => sh.textRuns?.some(r => r.hyperlink))),
        hasAnimation: rawPptx.slides.some(s => s.animations),
        hasMedia: Array.isArray(rawPptx.mediaFiles) && rawPptx.mediaFiles.length > 0,
        theme: themeSummary,
        metadata: metadataSummary
    };
}

/**
 * Trích xuất thông tin sinh viên từ tên file
 * Format: MSSV-Họ Tên.extension
 */
function extractStudentInfo(filename: string) {
    const base = filename.split('.')[0] || '';
    const parts = base.split('-');
    if (parts.length < 2) {
        return { id: 'Unknown', name: 'Unknown' };
    }
    const id = parts.shift()!;
    const name = parts.join(' ');
    return { id, name };
}

/**
 * Main function to create the final submission summary object.
 * Được cải tiến để xử lý dữ liệu theo định dạng mới
 */
export function createSubmissionSummary(
    submissionFiles: { filename: string, type: 'docx' | 'pptx', rawData: any }[],
    rubricFile?: { filename: string, rawData: any }
) {
    // Nếu không có file nào, trả về đối tượng rỗng
    if (!submissionFiles || submissionFiles.length === 0) {
        return {
            submission: {
                filename: "Unknown",
                submittedAt: DateTime.now().setZone('Asia/Ho_Chi_Minh').toISO(),
                student: { id: 'Unknown', name: 'Unknown' },
                files: []
            }
        };
    }

    const studentInfo = extractStudentInfo(submissionFiles[0]?.filename || '');

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

    // Format date/time for Vietnam (Asia/Ho_Chi_Minh)
    const submittedAt = DateTime.now().setZone('Asia/Ho_Chi_Minh').toISO();

    // Tạo đối tượng submission
    const result: any = {
        submission: {
            filename: submissionFiles[0]?.filename || "Unknown",
            submittedAt,
            student: studentInfo,
            files: summarizedFiles,
        }
    };
    
    // Thêm thông tin rubric nếu có
    if (rubricFile) {
        result.submission.rubric = {
            filename: rubricFile.filename,
            parsedAs: 'text',
            content: rubricFile.rawData.paragraphs || []
        };
    }

    return result;
}