import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import type { ParsedWordData } from '../../types/word.types';

export async function parseWordFile(filePath: string): Promise<ParsedWordData> {
  try {
    const zip = new AdmZip(filePath);
    // Nội dung chính của file Word nằm trong word/document.xml
    const docXmlEntry = zip.getEntry('word/document.xml');

    if (!docXmlEntry) {
      throw new Error('File document.xml không tồn tại trong file .docx.');
    }

    const xmlContent = docXmlEntry.getData().toString('utf-8');
    const parsedXml = await parseStringPromise(xmlContent);

    // Cấu trúc XML của Word: w:document -> w:body -> w:p (paragraph)
    const paragraphsXml = parsedXml['w:document']['w:body'][0]['w:p'];
    const extractedParagraphs: string[] = [];

    for (const p of paragraphsXml) {
      let paragraphText = '';
      // Bên trong một paragraph là các w:r (run), chứa các w:t (text)
      if (p['w:r']) {
        for (const r of p['w:r']) {
          if (r['w:t'] && r['w:t'][0]) {
            // Nối các mẩu text trong cùng một đoạn lại với nhau
            paragraphText += (typeof r['w:t'][0] === 'object' ? r['w:t'][0]._ : r['w:t'][0]) || '';
          }
        }
      }
      if (paragraphText) {
        extractedParagraphs.push(paragraphText);
      }
    }

    return { paragraphs: extractedParagraphs };
  } catch (error) {
    console.error(`Lỗi khi phân tích file Word tại ${filePath}:`, error);
    throw new Error('Không thể phân tích file Word.');
  }
}