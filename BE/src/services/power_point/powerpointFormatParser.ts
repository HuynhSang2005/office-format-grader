import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import path from 'node:path';
import type {
  ParsedPowerPointFormatData,
  FormattedSlide,
  Shape,
  ShapeTransform,
  FormattedTextRun,
  TableData,
  SlideDisplayInfo,
  TransitionEffect
} from '../../types/power_point/powerpointFormat.types';

// để phân tích một bảng từ XML
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


// để trích xuất các hình khối và định dạng của chúng từ một slide.
function extractShapesFromSlide(slideXmlObject: any): Shape[] {
  const shapes: Shape[] = [];
  const spTree = slideXmlObject?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0];

  if (!spTree) return [];

  // Gộp cả shape thường và graphicFrame vào một mảng để xử lý chung
  const allElements = [...(spTree['p:sp'] || []), ...(spTree['p:graphicFrame'] || [])];

  for (const element of allElements) {
    // Lấy id, name, transform
    const nvPr = element['p:nvSpPr']?.[0]?.['p:cNvPr']?.[0] ||
                 element['p:nvGraphicFramePr']?.[0]?.['p:cNvPr']?.[0];
    if (!nvPr) continue;
    const id = nvPr.$.id;
    const name = nvPr.$.name;

    const xfrm = element['p:spPr']?.[0]?.['a:xfrm']?.[0] ||
                 element['p:xfrm']?.[0];
    if (!xfrm) continue;
    const transform: ShapeTransform = {
      x: parseInt(xfrm['a:off'][0].$.x, 10),
      y: parseInt(xfrm['a:off'][0].$.y, 10),
      width: parseInt(xfrm['a:ext'][0].$.cx, 10),
      height: parseInt(xfrm['a:ext'][0].$.cy, 10),
    };

    // Lấy các đoạn text và định dạng của chúng
    const textRuns: FormattedTextRun[] = [];
    const paragraphs = element['p:txBody']?.[0]?.['a:p'] || [];

    for (const p of paragraphs) {
      const runs = p['a:r'] || [];
      for (const r of runs) {
        const text = r['a:t']?.[0] || '';
        const properties = r['a:rPr']?.[0]?.$ || {};
        const fontInfo = r['a:rPr']?.[0]?.['a:latin']?.[0]?.$ || {};

        // Lấy size (giá trị trong XML là pt * 100, ví dụ 1800 = 18pt)
        const size = properties.sz ? parseInt(properties.sz, 10) / 100 : undefined;

        textRuns.push({
          text,
          isBold: properties.b === '1',
          isItalic: properties.i === '1',
          font: fontInfo.typeface,
          size: size,
        });
      }
    }

    // Kiểm tra nếu là bảng thì parse bảng
    let tableData: TableData | undefined = undefined;
    const tableElement = element['a:graphic']?.[0]?.['a:graphicData']?.[0]?.['a:tbl']?.[0];
    if (tableElement) {
      tableData = parseTableXml(tableElement);
    }

    shapes.push({ id, name, transform, textRuns, tableData });
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

      // lấy thông tin header, footer, slide number
      const slideProperties = slideXmlObject['p:sld']['p:cSld'][0].$ || {};
      const masterShapesVisible = slideProperties.showMasterSp !== '0';

      const displayInfo: SlideDisplayInfo = {
        // Mặc định là hiển thị nếu master shapes được hiển thị
        showsFooter: masterShapesVisible,
        showsDate: masterShapesVisible,
        showsSlideNumber: masterShapesVisible,
      };

      // Tìm các placeholder cụ thể bị ẩn trên slide này
      const phs = slideXmlObject['p:sld']['p:cSld'][0]['p:spTree'][0]['p:sp']
        ?.map((sp: any) => sp['p:nvSpPr']?.[0]?.['p:nvPr']?.[0]?.['p:ph']?.[0])
        .filter(Boolean);

      if (phs) {
        for (const ph of phs) {
          if (ph.$.type === 'ftr') displayInfo.showsFooter = ph.$.sz !== '0';
          if (ph.$.type === 'dt') displayInfo.showsDate = ph.$.sz !== '0';
          if (ph.$.type === 'sldNum') displayInfo.showsSlideNumber = ph.$.sz !== '0';
        }
      }

      // lấy ra transition effect 
      let transition: TransitionEffect | undefined = undefined;
      const transitionNode = slideXmlObject['p:sld']['p:transition']?.[0];

      if (transitionNode) {
        const durationStr = transitionNode.$?.dur;
        // Lấy tên của thẻ con đầu tiên, đó chính là loại hiệu ứng
        const effectTypeNode = Object.keys(transitionNode).find(key => key !== '$');
        if (effectTypeNode) {
          transition = {
            type: effectTypeNode.replace('p:', ''),
            duration: durationStr ? parseInt(durationStr, 10) : undefined,
          };
        }
      }

      formattedSlides.push({
        slideNumber: slideCounter++,
        layout: layoutName,
        displayInfo: displayInfo,
        transition: transition,
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