// Shape parser for PowerPoint
import type { Shape, ShapeTransform, FormattedTextRun, SlideLayoutData, ThemeData } from '../../types/power_point/powerpointFormat.types';
import { resolveTextStyle } from './styleResolver';

export function extractShapesFromSlide(
  slideXmlObject: any,
  relationships: Map<string, string>,
  layoutData: SlideLayoutData,
  masterData: SlideLayoutData,
  themeData: ThemeData,
  slidePath: string,
  zip: any
): Shape[] {
  const shapes: Shape[] = [];
  const spTree = slideXmlObject?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0];
  if (!spTree) return [];
  const shapeElements = spTree['p:sp'] || [];
  for (const shapeElement of shapeElements) {
    const nvPr = shapeElement['p:nvSpPr']?.[0]?.['p:cNvPr']?.[0];
    if (!nvPr) continue;
    const id = nvPr.$.id;
    const name = nvPr.$.name;
    const xfrm = shapeElement['p:spPr']?.[0]?.['a:xfrm']?.[0];
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
    shapes.push({ id, name, transform, textRuns });
  }
  return shapes;
}
