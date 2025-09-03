import AdmZip from 'adm-zip';
import { parseXmlString } from '../../shared/xmlHelpers';
import type { ParsedWordContentData } from '../../../types/word/word.types';

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

export async function parseWordFile(filePath: string): Promise<ParsedWordContentData> {
  try {
    const zip = new AdmZip(filePath);
    const docXmlEntry = zip.getEntry('word/document.xml');

    if (!docXmlEntry) {
      throw new Error('File document.xml không tồn tại trong file .docx.');
    }

    const xmlContent = docXmlEntry.getData().toString('utf-8');
    // SỬA LỖI: Gọi hàm helper thay vì gọi trực tiếp
    const parsedXml = await parseXmlString(xmlContent);

    const bodyNode = parsedXml['w:document']?.[0]?.['w:body']?.[0];
    if (!bodyNode) {
        return { paragraphs: [] };
    }

    const bodyChildren = bodyNode.$$ || [];// $$ chứa tất cả các node con (p, tbl,...)
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