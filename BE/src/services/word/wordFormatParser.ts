import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import type { ParsedWordData, Paragraph, TextRun } from '../../types/word/wordFormat.types';

export async function parseWordWithFormat(filePath: string): Promise<ParsedWordData> {
  try {
    const zip = new AdmZip(filePath);
    const docXmlEntry = zip.getEntry('word/document.xml');

    if (!docXmlEntry) {
      throw new Error('File document.xml không tồn tại trong file .docx.');
    }

    const xmlContent = docXmlEntry.getData().toString('utf-8');
    const parsedXml = await parseStringPromise(xmlContent);

    const paragraphsXml = parsedXml['w:document']['w:body'][0]['p'];
    const extractedContent: Paragraph[] = [];

    for (const p of paragraphsXml) {
      const paragraph: Paragraph = { runs: [] };
      const pPr = p['w:pPr']?.[0]; // Lấy thuộc tính của đoạn văn

      // Lấy ra thông tin định dạng đoạn văn
      if (pPr) {
        // Lấy thông tin căn lề
        const alignment = pPr['w:jc']?.[0]?.$?.val;
        if (alignment) {
          paragraph.alignment = alignment;
        }

        // Lấy thông tin thụt lề (đơn vị là twentieths of a point)
        const indent = pPr['w:ind']?.[0]?.$;
        if (indent) {
          paragraph.indentation = {
            left: indent.left ? parseInt(indent.left) : undefined,
            right: indent.right ? parseInt(indent.right) : undefined,
            firstLine: indent.firstLine ? parseInt(indent.firstLine) : undefined,
            hanging: indent.hanging ? parseInt(indent.hanging) : undefined,
          };
        }
      }

      const runsXml = p['w:r'] || [];
      for (const r of runsXml) {
        const text = r['w:t']?.[0]?._ || r['w:t']?.[0] || '';
        if (!text) continue;

        const properties = r['w:rPr']?.[0] || {};
        const run: TextRun = { text };

        // Kiểm tra các thuộc tính định dạng
        if (properties['w:b']) run.isBold = true;
        if (properties['w:i']) run.isItalic = true;
        if (properties['w:u']) run.underline = properties['w:u'][0].$.val;
        if (properties['w:color']) run.color = properties['w:color'][0].$.val;

        // Font size được lưu bằng 1/2 point. Ví dụ: 24 = 12pt
        if (properties['w:sz']) run.size = parseInt(properties['w:sz'][0].$.val) / 2;

        if (properties['w:rFonts']) {
            run.font = properties['w:rFonts'][0].$.ascii || properties['w:rFonts'][0].$.hAnsi;
        }

        paragraph.runs.push(run);
      }

      if (paragraph.runs.length > 0) {
        extractedContent.push(paragraph);
      }
    }

    return { content: extractedContent };
  } catch (error) {
    console.error(`Lỗi khi phân tích file Word tại ${filePath}:`, error);
    throw new Error('Không thể phân tích file Word.');
  }
}