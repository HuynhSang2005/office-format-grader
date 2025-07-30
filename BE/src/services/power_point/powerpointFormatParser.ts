import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import path from 'node:path';
import type {
  ParsedPowerPointFormatData,
  FormattedSlide,
  Shape,
  ShapeTransform,
  FormattedTextRun,
  TableData
} from '../../types/power_point/powerpointFormat.types';

// ---- THÊM HÀM TRỢ GIÚP MỚI ĐỂ PARSE BẢNG ----
function parseTableXml(tableElement: any): TableData {
  const rows: string[][] = [];
  const tableRows = tableElement['a:tr'] || [];

  for (const tr of tableRows) {
    const rowCells: string[] = [];
    const tableCells = tr['a:tc'] || [];
    for (const tc of tableCells) {
      let cellText = '';
      const paragraphs = tc['a:txBody']?.[0]?.['a:p'] || [];
      for (const p of paragraphs) {
        const runs = p['a:r'] || [];
        for (const r of runs) {
          cellText += r['a:t']?.[0] || '';
        }
      }
      rowCells.push(cellText);
    }
    rows.push(rowCells);
  }
  return { rows };
}

/**
 * Hàm trợ giúp để trích xuất các hình khối và định dạng của chúng từ một slide.
 */
function extractShapesFromSlide(slideXmlObject: any): Shape[] {
  const shapes: Shape[] = [];
  const spTree = slideXmlObject?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0];

  if (!spTree) return [];

  // Xử lý các shape thông thường (text, picture,...)
  const shapeElements = spTree['p:sp'] || [];
  for (const shapeElement of shapeElements) {
    // Lấy thông tin cơ bản của shape
    const id = shapeElement['p:nvSpPr'][0]['p:cNvPr'][0].$.id;
    const name = shapeElement['p:nvSpPr'][0]['p:cNvPr'][0].$.name;

    // Lấy thông tin vị trí và kích thước
    const xfrm = shapeElement['p:spPr'][0]['a:xfrm'][0];
    const transform: ShapeTransform = {
      x: parseInt(xfrm['a:off'][0].$.x, 10),
      y: parseInt(xfrm['a:off'][0].$.y, 10),
      width: parseInt(xfrm['a:ext'][0].$.cx, 10),
      height: parseInt(xfrm['a:ext'][0].$.cy, 10),
    };

    // Lấy thông tin text và định dạng
    const textRuns: FormattedTextRun[] = [];
    const paragraphs = shapeElement['p:txBody']?.[0]?.['a:p'] || [];

    for (const p of paragraphs) {
      const runs = p['a:r'] || [];
      for (const r of runs) {
        const text = r['a:t']?.[0] || '';
        const properties = r['a:rPr']?.[0]?.$ || {};
        textRuns.push({
          text,
          isBold: properties.b === '1',
          isItalic: properties.i === '1',
        });
      }
    }

    shapes.push({ id, name, transform, textRuns });
  }

  // handle graphic frames (có thể chứa bảng, chart,...) ----
  const graphicFrames = spTree['p:graphicFrame'] || [];
  for (const frame of graphicFrames) {
    const id = frame['p:nvGraphicFramePr'][0]['p:cNvPr'][0].$.id;
    const name = frame['p:nvGraphicFramePr'][0]['p:cNvPr'][0].$.name;
    const xfrm = frame['p:xfrm'][0];
    const transform: ShapeTransform = {
      x: parseInt(xfrm['a:off'][0].$.x, 10),
      y: parseInt(xfrm['a:off'][0].$.y, 10),
      width: parseInt(xfrm['a:ext'][0].$.cx, 10),
      height: parseInt(xfrm['a:ext'][0].$.cy, 10),
    };

    // Kiểm tra xem đối tượng có phải là một cái bảng không
    const tableElement = frame['a:graphic'][0]['a:graphicData'][0]['a:tbl']?.[0];
    let tableData: TableData | undefined = undefined;
    if (tableElement) {
      tableData = parseTableXml(tableElement);
    }

    shapes.push({ id, name, transform, textRuns: [], tableData });
  }

  return shapes;
}

/**
 * Phân tích file .pptx để trích xuất cấu trúc và định dạng chi tiết.
 */
export async function parsePowerPointWithFormat(filePath: string): Promise<ParsedPowerPointFormatData> {
  try {
    const zip = new AdmZip(filePath);

    // Lấy danh sách file media
    const mediaFiles = zip.getEntries()
      .filter(entry => entry.entryName.startsWith('ppt/media/'))
      .map(entry => entry.name);

    const relsEntry = zip.getEntry('ppt/_rels/presentation.xml.rels');
    if (!relsEntry) throw new Error('Không tìm thấy file presentation relationships.');

    const relsXml = await parseStringPromise(relsEntry.getData().toString('utf-8'));
    const slideEntries = relsXml.Relationships.Relationship.filter(
      (r: any) => r.$.Type.endsWith('/slide')
    );

    const formattedSlides: FormattedSlide[] = [];
    let slideCounter = 1;

    for (const slideEntry of slideEntries) {
      const slidePath = `ppt/${slideEntry.$.Target}`;
      const slideXmlRaw = zip.getEntry(slidePath)?.getData().toString('utf-8');
      if (!slideXmlRaw) continue;

      const slideXmlObject = await parseStringPromise(slideXmlRaw);
      const shapes = extractShapesFromSlide(slideXmlObject);

      // Lấy tên layout của slide
      let layoutName = 'Unknown';
      const layoutId = slideXmlObject['p:sld']?.['p:sldLayout']?.[0]?.$?.['r:id'];
      if (layoutId) {
        const slideRelsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
        const slideRelsEntry = zip.getEntry(slideRelsPath);
        if (slideRelsEntry) {
          const slideRelsXml = await parseStringPromise(slideRelsEntry.getData().toString('utf-8'));
          const layoutRel = slideRelsXml.Relationships.Relationship.find(
            (r: any) => r.$.Id === layoutId
          );
          if (layoutRel) {
            const layoutPath = `ppt/slideLayouts/${path.basename(layoutRel.$.Target)}`;
            const layoutXmlRaw = zip.getEntry(layoutPath)?.getData().toString('utf-8');
            if (layoutXmlRaw) {
              const layoutXml = await parseStringPromise(layoutXmlRaw);
              layoutName = layoutXml['p:sldLayout']?.['p:cSld']?.[0]?.$?.name || 'Unnamed Layout';
            }
          }
        }
      }

      formattedSlides.push({
        slideNumber: slideCounter++,
        layout: layoutName,
        shapes,
      });
    }

    return {
      slideCount: formattedSlides.length,
      mediaFiles,
      slides: formattedSlides,
    };
  } catch (error) {
    console.error(`Lỗi khi phân tích định dạng file PowerPoint tại ${filePath}:`, error);
    throw new Error('Không thể phân tích định dạng file PowerPoint.');
  }
}