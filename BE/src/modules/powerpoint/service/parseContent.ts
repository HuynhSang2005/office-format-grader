import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import type { ParsedPowerPointData, PowerPointSlide } from '../../../types/power_point/powerpoint.types';

// Method này trích xuất text từ một đối tượng slide đã được parse
function extractTextFromSlide(slideXmlObject: any): string[] {
  const texts: string[] = [];
  // Text trong slide thường nằm trong cấu trúc a:p (paragraph) -> a:r (run) -> a:t (text)
  const paragraphs = slideXmlObject?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp']
    ?.map((sp: any) => sp?.['p:txBody']?.[0]?.['a:p'])
    .flat()
    .filter(Boolean);

  if (!paragraphs) return [];

  for (const p of paragraphs) {
    let fullText = '';
    if (p['a:r']) {
      for (const r of p['a:r']) {
        if (r['a:t'] && r['a:t'][0]) {
          fullText += r['a:t'][0];
        }
      }
    }
    if (fullText) {
      texts.push(fullText);
    }
  }
  return texts;
}


export async function parsePowerPointFile(filePath: string): Promise<ParsedPowerPointData> {
  try {
    const zip = new AdmZip(filePath);
    // 1. Đọc file _rels để tìm file presentation chính
    const relsEntry = zip.getEntry('ppt/_rels/presentation.xml.rels');
    if (!relsEntry) throw new Error('Không tìm thấy file presentation relationships.');
    const relsXml = await parseStringPromise(relsEntry.getData().toString('utf-8'));
    const slideEntries = relsXml.Relationships.Relationship.filter(
      (r: any) => r.$.Type.endsWith('/slide')
    );

    const slides: PowerPointSlide[] = [];
    let slideCounter = 1;

    // 2. Lặp qua từng slide entry để xử lý
    for (const slideEntry of slideEntries) {
      const slidePath = `ppt/${slideEntry.$.Target}`;
      const slideXmlRaw = zip.getEntry(slidePath)?.getData().toString('utf-8');
      if (!slideXmlRaw) continue;

      const slideXml = await parseStringPromise(slideXmlRaw);
      const texts = extractTextFromSlide(slideXml);

      slides.push({
        slideNumber: slideCounter++,
        text: texts,
      });
    }

    return {
      slideCount: slides.length,
      slides: slides,
    };
  } catch (error) {
    console.error(`Lỗi khi phân tích file PowerPoint tại ${filePath}:`, error);
    throw new Error('Không thể phân tích file PowerPoint.');
  }
}