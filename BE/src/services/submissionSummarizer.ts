import type { ParsedWordData, Paragraph, Table, TextRun } from '../types/word/wordFormat.types';
import type { ParsedPowerPointFormatData } from '../types/power_point/powerpointFormat.types';
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
            footer: slide.displayInfo.showsFooter ? '...' : '',
            hasTransition: !!slide.transition,
            hasSound: !!slide.transition?.sound,
            animations: slide.animations ? ['unknown_effect'] : [],
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
 */
export function createSubmissionSummary(
    submissionFiles: { filename: string, type: 'docx' | 'pptx', rawData: any }[],
    rubricFile: { filename: string, rawData: any }
) {
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

    return {
        submission: {
            filename: submissionFiles[0]?.filename || "Unknown",
            submittedAt,
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