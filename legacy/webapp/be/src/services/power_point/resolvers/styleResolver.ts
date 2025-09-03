import type { ThemeData, FormattedTextRun } from "../../../types/power_point/powerpointFormat.types";
import type { SlideLayoutData, TextStyle } from "../../../types/power_point/powerpointStyles.types";


export function resolveTextStyle(
  textRunNode: any,
  paragraphNode: any,
  shapeNode: any,
  layoutData?: SlideLayoutData,
  masterData?: SlideLayoutData,
  themeData?: ThemeData,
): FormattedTextRun {
  const text = textRunNode['a:t']?.[0] || '';
  const finalStyle: TextStyle = {};

  // Xác định loại placeholder và cấp độ của đoạn văn
  const ph = shapeNode?.['p:nvSpPr']?.[0]?.['p:nvPr']?.[0]?.['p:ph']?.[0];
  const placeholderType = ph?.$?.type || 'body';
  const paragraphLevel = parseInt(paragraphNode?.$?.lvl || '0', 10);

  // 1. Kế thừa từ Theme (cấp thấp nhất)
  if (themeData) {
    const isTitlePlaceholder = placeholderType === 'title' || placeholderType === 'ctrTitle';
    finalStyle.font = isTitlePlaceholder ? themeData.fontScheme.majorFont : themeData.fontScheme.minorFont;
  }

  // 2. Kế thừa từ Slide Master
  const masterPlaceholderStyle = masterData?.styles.find(s => s.type === placeholderType);
  const masterLevelStyle = masterPlaceholderStyle?.levelStyles?.[paragraphLevel];
  Object.assign(finalStyle, masterPlaceholderStyle?.defaultStyle, masterLevelStyle);

  // 3. Kế thừa từ Slide Layout
  const layoutPlaceholderStyle = layoutData?.styles.find(s => s.type === placeholderType);
  const layoutLevelStyle = layoutPlaceholderStyle?.levelStyles?.[paragraphLevel];
  Object.assign(finalStyle, layoutPlaceholderStyle?.defaultStyle, layoutLevelStyle);

  // 4. Định dạng trực tiếp trên run (ưu tiên cao nhất)
  const directRunProps = textRunNode['a:rPr']?.[0];
  if (directRunProps) {
      const directStyle: TextStyle = {};
      const props = directRunProps.$ || {};
      if (props.b === '1') directStyle.isBold = true;
      if (props.i === '1') directStyle.isItalic = true;
      if (props.sz) directStyle.size = parseInt(props.sz, 10) / 100;
      if (directRunProps['a:latin']?.[0]?.$?.typeface) directStyle.font = directRunProps['a:latin'][0].$.typeface;
      if (directRunProps['a:solidFill']?.[0]?.['a:srgbClr']?.[0]?.$?.val) directStyle.color = directRunProps['a:solidFill'][0]['a:srgbClr'][0].$.val;
      Object.assign(finalStyle, directStyle);
  }

  return {
    text: text,
    isBold: finalStyle.isBold || false,
    isItalic: finalStyle.isItalic || false,
    font: finalStyle.font,
    size: finalStyle.size,
    color: finalStyle.color
  };
}