import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
// Giả sử type của bạn được đặt tên là ParsedWordContentData
import type { ParsedWordContentData } from '../../../types/word/word.types';

/**
 * Hàm helper để trích xuất text từ một node paragraph (<w:p>).
 * @param pNode - Node XML của một đoạn văn.
 * @returns Chuỗi văn bản thuần túy.
 */
function extractTextFromParagraphNode(pNode: any): string {
    let paragraphText = '';
    const runs = pNode['w:r'] || [];
    for (const r of runs) {
        const textNode = r['w:t']?.[0];
        if (textNode) {
            // Xử lý cả trường hợp text nằm trong tag <_>
            paragraphText += (typeof textNode === 'object' ? textNode._ : textNode) || '';
        }
    }
    return paragraphText;
}

/**
 * Phân tích file .docx để trích xuất toàn bộ nội dung văn bản,
 * bao gồm cả văn bản trong các bảng biểu.
 * @param filePath - Đường dẫn đến file .docx.
 * @returns - Một object chứa mảng các đoạn văn bản.
 */
export async function parseWordFile(filePath: string): Promise<ParsedWordContentData> {
  try {
    const zip = new AdmZip(filePath);
    const docXmlEntry = zip.getEntry('word/document.xml');

    if (!docXmlEntry) {
      throw new Error('File document.xml không tồn tại trong file .docx.');
    }

    const xmlContent = docXmlEntry.getData().toString('utf-8');
    // Thêm tùy chọn để giữ đúng thứ tự của paragraph và table
    const parsedXml = await parseStringPromise(xmlContent, { 
        explicitChildren: true, 
        preserveChildrenOrder: true 
    });

    const bodyNode = parsedXml['w:document']?.[0]?.['w:body']?.[0];
    if (!bodyNode) {
        return { paragraphs: [] }; // Trả về rỗng nếu không có body
    }

    const bodyChildren = bodyNode.$$ || []; // $$ chứa tất cả các node con (p, tbl,...)
    const extractedParagraphs: string[] = [];

    for (const element of bodyChildren) {
        // Trường hợp 1: Element là một đoạn văn (<w:p>)
        if (element['#name'] === 'w:p') {
            const text = extractTextFromParagraphNode(element);
            if (text) extractedParagraphs.push(text);
        }
        // Trường hợp 2: Element là một bảng (<w:tbl>)
        else if (element['#name'] === 'w:tbl') {
            const rows = element['w:tr'] || [];
            for (const row of rows) {
                const cells = row['w:tc'] || [];
                for (const cell of cells) {
                    const paragraphsInCell = cell['w:p'] || [];
                    for (const pInCell of paragraphsInCell) {
                        const text = extractTextFromParagraphNode(pInCell);
                        if (text) extractedParagraphs.push(text);
                    }
                }
            }
        }
    }

    return { paragraphs: extractedParagraphs };
  } catch (error) {
    console.error(`Lỗi khi phân tích file Word tại ${filePath}:`, error);
    throw new Error('Không thể phân tích file Word.');
  }
}

export async function parseWordContent(filePath: string): Promise<{ paragraphs: string[] }> {
    return parseWordFile(filePath);
}