import type {
  Shape,
  ShapeTransform,
  FormattedTextRun,
  ThemeData,
  TableData,
  SmartArtData,
} from '../../../types/power_point/powerpointFormat.types';
import type { SlideLayoutData } from '../../../types/power_point/powerpointStyles.types';
import { resolveTextStyle } from '../resolvers/styleResolver';
import type { WordArtEffect } from '../../../types/power_point/powerpointFormat.types';
import { parseSmartArt } from './smartArtParser';
import { parseTableXml } from './tableParser';
import { parseChart } from './chartParser';
import path from 'node:path';
import type { ChartData } from '../../../types/power_point/chart.types';
import AdmZip from 'adm-zip';

export async function extractShapesFromSlide(
  slideXmlObject: any,
  relationships: Map<string, string>,
  layoutData: SlideLayoutData,
  masterData: SlideLayoutData,
  themeData: ThemeData,
  slidePath: string,
  zip: AdmZip
): Promise<Shape[]> {
  const shapes: Shape[] = [];
  const spTree = slideXmlObject?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0];
  if (!spTree) return [];
  const shapeElements = spTree['p:sp'] || [];
  for (const shapeElement of shapeElements) {
    const nvPr = shapeElement['p:nvSpPr']?.[0]?.['p:cNvPr']?.[0];
    if (!nvPr) continue;
    const id = nvPr.$.id;
    const name = nvPr.$.name;
    const spPr = shapeElement['p:spPr']?.[0];
    const xfrm = spPr?.['a:xfrm']?.[0];
    if (!xfrm) continue;
    const transform: ShapeTransform = {
      x: parseInt(xfrm['a:off'][0].$.x, 10),
      y: parseInt(xfrm['a:off'][0].$.y, 10),
      width: parseInt(xfrm['a:ext'][0].$.cx, 10),
      height: parseInt(xfrm['a:ext'][0].$.cy, 10),
    };
    const textRuns: FormattedTextRun[] = [];
    const paragraphs = shapeElement['p:txBody']?.[0]?.['a:p'] || [];
    for (const p of paragraphs) {
      const runs = p['a:r'] || [];
      for (const r of runs) {
        const text = r['a:t']?.[0] || '';
        const resolvedStyle = resolveTextStyle(r, p, shapeElement, layoutData, masterData, themeData);
        let hyperlink: string | undefined = undefined;
        const hlinkClick = r['a:rPr']?.[0]?.['a:hlinkClick']?.[0];
        if (hlinkClick && hlinkClick.$ && hlinkClick.$['r:id'] && relationships) {
          hyperlink = relationships.get(hlinkClick.$['r:id']);
        }
        textRuns.push({
          text,
          isBold: !!resolvedStyle.isBold,
          isItalic: !!resolvedStyle.isItalic,
          font: resolvedStyle.font,
          size: resolvedStyle.size,
          hyperlink,
        });
      }
    }
    const wordArt = parseWordArtEffects(spPr);
    shapes.push({ id, name, transform, textRuns, wordArt });
  }

  // --- Xử lý <p:graphicFrame> để nhận diện SmartArt, Table, Chart ---
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

    const graphicData = frame['a:graphic']?.[0]?.['a:graphicData']?.[0];
    const graphicUri = graphicData?.$?.uri;

    let tableData: TableData | undefined = undefined;
    let chartData: ChartData | undefined = undefined;
    let smartArt: SmartArtData | undefined = undefined;

    // Phân loại đối tượng dựa trên URI
    if (graphicUri && graphicUri.includes('/diagram')) {
      // Xử lý SmartArt
      const diagramRelId = graphicData['dgm:relIds']?.[0]?.$?.['r:id'];
      if (diagramRelId) {
        const dataPath = relationships.get(diagramRelId); // Tra cứu trong .rels của slide
        if (dataPath) {
          const fullDataPath = `ppt/diagrams/${path.basename(dataPath)}`;
          smartArt = await parseSmartArt(zip, fullDataPath);
        }
      }
    } else if (graphicData['a:tbl']) {
      tableData = parseTableXml(graphicData['a:tbl'][0]);
    } else if (graphicData['a:chart']) {
      const chartRelId = graphicData['a:chart'][0]?.$?.['r:id'];
      if (chartRelId) {
        const relPath = relationships.get(chartRelId);
        if (relPath) {
          const chartPath = `ppt/charts/${path.basename(relPath)}`;
          chartData = await parseChart(zip, chartPath);
        }
      }
    }

    shapes.push({
      id,
      name,
      transform,
      textRuns: [],
      tableData,
      chartData,
      smartArt
    });
  }

  return shapes;
}

// --- THÊM HÀM HELPER MỚI ĐỂ PARSE HIỆU ỨNG WORDART ---
function parseWordArtEffects(spPrNode: any): WordArtEffect | undefined {
    if (!spPrNode) return undefined;

    const effects: WordArtEffect = {};
    let hasEffects = false;

    // 1. Phân tích hiệu ứng tô màu (Fill)
    const gradFill = spPrNode['a:gradFill']?.[0];
    if (gradFill) {
        hasEffects = true;
        const colors = gradFill['a:gsLst']?.[0]?.['a:gs']
            .map((gs: any) => gs['a:srgbClr']?.[0]?.$?.val)
            .filter(Boolean);
        effects.fill = { type: 'gradient', colors };
    }

    // 2. Phân tích hiệu ứng đổ bóng (Shadow)
    const effectList = spPrNode['a:effectLst']?.[0];
    if (effectList) {
        const shadow = effectList['a:prstShdw']?.[0];
        if (shadow?.$) {
            hasEffects = true;
            effects.shadow = {
                type: shadow.$.prst,
                color: shadow['a:srgbClr']?.[0]?.$?.val,
                blur: shadow.$?.blurRad ? parseInt(shadow.$.blurRad) : undefined,
                direction: shadow.$?.dir ? parseInt(shadow.$.dir) : undefined,
            };
        }
    }

    // Có thể mở rộng thêm các hiệu ứng khác như <a:scene3d>, <a:reflection> ở đây

    return hasEffects ? effects : undefined;
}
