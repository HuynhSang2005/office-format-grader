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
  TransitionEffect,
  AnimationNode,
  AnimationEffect
} from '../../types/power_point/powerpointFormat.types';
import { parseChart } from './chartParser';
import type { ChartData } from '../../types/power_point/chart.types';

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
function extractShapesFromSlide(
  slideXmlObject: any,
  slidePath?: string,
  zip?: AdmZip,
  relationships?: Map<string, string>
): Shape[] {
  const shapes: Shape[] = [];
  const spTree = slideXmlObject?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0];

  if (!spTree) return [];

  // Gộp cả shape thường và graphicFrame vào một mảng để xử lý chung
  const shapeElements = spTree['p:sp'] || [];
  for (const element of shapeElements) {
    // Lấy id, name, transform
    const nvPr = element['p:nvSpPr']?.[0]?.['p:cNvPr']?.[0];
    if (!nvPr) continue;
    const id = nvPr.$.id;
    const name = nvPr.$.name;

    const xfrm = element['p:spPr']?.[0]?.['a:xfrm']?.[0];
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
        const size = properties.sz ? parseInt(properties.sz, 10) / 100 : undefined;

        let hyperlink: string | undefined = undefined;
        const hlinkClick = r['a:rPr']?.[0]?.['a:hlinkClick']?.[0];
        if (hlinkClick && hlinkClick.$ && hlinkClick.$['r:id'] && relationships) {
          hyperlink = relationships.get(hlinkClick.$['r:id']);
        }

        textRuns.push({
          text,
          isBold: properties.b === '1',
          isItalic: properties.i === '1',
          font: fontInfo.typeface,
          size: size,
          hyperlink: hyperlink, // <-- Thêm hyperlink vào đây
        });
      }
    }

    shapes.push({ id, name, transform, textRuns });
  }

  // Xử lý các graphicFrame (có thể là bảng hoặc biểu đồ)
  const graphicFrames = spTree['p:graphicFrame'] || [];
  for (const frame of graphicFrames) {
    const nvPr = frame['p:nvGraphicFramePr']?.[0]?.['p:cNvPr']?.[0];
    if (!nvPr) continue;
    const id = nvPr.$.id;
    const name = nvPr.$.name;
    const xfrm = frame['p:xfrm']?.[0];
    if (!xfrm) continue;
    const transform: ShapeTransform = {
      x: parseInt(xfrm['a:off'][0].$.x, 10),
      y: parseInt(xfrm['a:off'][0].$.y, 10),
      width: parseInt(xfrm['a:ext'][0].$.cx, 10),
      height: parseInt(xfrm['a:ext'][0].$.cy, 10),
    };

    // Kiểm tra nếu là bảng thì parse bảng
    const tableElement = frame['a:graphic']?.[0]?.['a:graphicData']?.[0]?.['a:tbl']?.[0];
    let tableData: TableData | undefined = undefined;
    if (tableElement) {
      tableData = parseTableXml(tableElement);
    }

    // Kiểm tra nếu là biểu đồ thì parse biểu đồ
    let chartData: ChartData | undefined = undefined;
    const chartRef = frame['a:graphic']?.[0]?.['a:graphicData']?.[0]?.['a:chart']?.[0];
    if (chartRef && slidePath && zip) {
      const chartId = chartRef.$['r:id'];
      const slideRelsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
      const slideRelsEntry = zip.getEntry(slideRelsPath);
      if (slideRelsEntry) {
        const slideRelsXml = parseStringPromise(slideRelsEntry.getData().toString('utf-8'));
        slideRelsXml.then((relsXml) => {
          const chartRel = relsXml.Relationships.Relationship.find((r: any) => r.$.Id === chartId);
          if (chartRel) {
            const chartPath = `ppt/charts/${path.basename(chartRel.$.Target)}`;
            parseChart(zip, chartPath).then((data) => {
              chartData = data;
            });
          }
        });
      }
    }


    shapes.push({ id, name, transform, textRuns: [], tableData, chartData });
  }

  return shapes;
}

/**
 * HÀM ĐỆ QUY ĐỂ PARSE CÂY ANIMATION
 * Đây là phiên bản MVP, chỉ xử lý các trường hợp cơ bản nhất.
 * @param nodeElement - Một node trong cây XML (ví dụ: một thẻ <p:par>, <p:seq>...)
 */
function parseAnimationNode(nodeElement: any): AnimationNode {
    const nodeName = Object.keys(nodeElement).find(k => k.startsWith('p:')) || '';
    const nodeAttributes = nodeElement[nodeName][0].$;

    const basicNode: Partial<AnimationNode> = {
        trigger: nodeAttributes?.presetClass || 'onDemand', // onClick
        delay: nodeAttributes?.delay ? parseInt(nodeAttributes.delay) : undefined,
    };

    // Nếu là node tuần tự hoặc song song, tiếp tục gọi đệ quy
    if (nodeName === 'p:par' || nodeName === 'p:seq') {
        const childNodes = nodeElement[nodeName][0]['p:tnLst']?.[0] || {};
        return {
            ...basicNode,
            type: nodeName === 'p:par' ? 'parallel' : 'sequence',
            children: Object.keys(childNodes).map(key => parseAnimationNode({ [key]: childNodes[key] }))
        } as AnimationNode;
    } else {
        // Nếu là node hiệu ứng cuối cùng (leaf node)
        const targetShapeId = nodeElement[nodeName][0]['c:cTn']?.[0]?.['p:tgtEl']?.[0]?.['p:spTgt']?.[0]?.$.spid;
        // Loại hiệu ứng cần được phân tích sâu hơn từ các thẻ con
        const effectType = 'unknown'; // Cần logic phức tạp để xác định

        return {
            ...basicNode,
            type: 'effect',
            effect: {
                shapeId: targetShapeId,
                type: effectType,
            } as AnimationEffect,
        } as AnimationNode;
    }
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

      // 1. Đọc file _rels của slide để tạo bản đồ tra cứu hyperlink
      const slideRelsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
      const slideRelationships = new Map<string, string>();
      const slideRelsEntry = zip.getEntry(slideRelsPath);
      if (slideRelsEntry) {
        const slideRelsXml = await parseStringPromise(slideRelsEntry.getData().toString('utf-8'));
        if (slideRelsXml.Relationships.Relationship) {
          for (const rel of slideRelsXml.Relationships.Relationship) {
            if (rel.$.TargetMode === 'External') {
              slideRelationships.set(rel.$.Id, rel.$.Target);
            }
          }
        }
      }

      // 2. Truyền slideRelationships vào extractShapesFromSlide
      const shapes = extractShapesFromSlide(slideXmlObject, slidePath, zip, slideRelationships);

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
          const effectTypeKey = Object.keys(transitionNode).find(
              key => key !== '$' && key !== 'p:sound'
          ); // Loại trừ thẻ sound

          if (effectTypeKey) {
              transition = {
                  type: effectTypeKey.replace('p:', ''),
                  duration: durationStr ? parseInt(durationStr, 10) : undefined,
              };

              const soundNode = transitionNode['p:sound']?.[0];
              if (soundNode) {
                  const soundNameNode = soundNode['a:prstSnd']?.[0]; // Âm thanh có sẵn
                  if (soundNameNode && soundNameNode.$?.prst) {
                      transition.sound = { name: soundNameNode.$.prst };
                  }
              }
          }
      }

      // Lấy thông tin animation
      let animations: AnimationNode | undefined = undefined;
      const timingNode = slideXmlObject['p:sld']['p:timing']?.[0]?.['p:tnLst']?.[0];

      if (timingNode) {
        // Lấy node gốc của cây (thường là một thẻ <p:par>)
        const rootTimeNodeKey = Object.keys(timingNode)[0];
        if (rootTimeNodeKey) {
          animations = parseAnimationNode({ [rootTimeNodeKey]: timingNode[rootTimeNodeKey] });
        }
      }

      formattedSlides.push({
        slideNumber: slideCounter++,
        layout: layoutName,
        displayInfo: displayInfo,
        transition: transition,
        shapes,
        animations: animations ? [animations] : undefined,
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