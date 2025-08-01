import type { ThemeData } from "../../../types/power_point/powerpointFormat.types";
import type { SlideLayoutData, TextStyle } from "../../../types/power_point/powerpointStyles";

function parseTextStyleFromRprNode(rPrNode: any): TextStyle {
  if (!rPrNode) return {};

  const properties = rPrNode.$ || {};
  const textStyle: TextStyle = {};

  // Lấy font size (giá trị trong XML là pt * 100)
  if (properties.sz) {
    textStyle.size = parseInt(properties.sz, 10) / 100;
  }
  
  // Lấy các thuộc tính boolean
  if (properties.b === '1') textStyle.isBold = true;
  if (properties.i === '1') textStyle.isItalic = true;

  // Lấy font chữ
  const fontNode = rPrNode['a:latin']?.[0];
  if (fontNode?.$?.typeface) {
    textStyle.font = fontNode.$.typeface;
  }

  // Lấy màu sắc
  const colorNode = rPrNode['a:solidFill']?.[0]?.['a:srgbClr']?.[0];
  if (colorNode?.$?.val) {
    textStyle.color = colorNode.$.val;
  }

  return textStyle;
}

/**
 * "Bộ giải quyết style" cho một text run.
 * Nó sẽ đi ngược chuỗi kế thừa để tìm ra style cuối cùng.
 * @returns một đối tượng TextStyle hoàn chỉnh.
 */
export function resolveTextStyle(
  textRunNode: any,
  paragraphNode: any,
  shapeNode: any,
  layoutData: SlideLayoutData,
  masterData: SlideLayoutData,
  themeData: ThemeData,
): TextStyle {
  // Logic xác định loại placeholder (ví dụ: 'title', 'body', 'sldNum'...)
  const placeholderType = shapeNode?.['p:nvSpPr']?.[0]?.['p:nvPr']?.[0]?.['p:ph']?.[0]?.$?.type || 'body';
  const paragraphLevel = parseInt(paragraphNode.$?.lvl || '0', 10);

  // 1. Bắt đầu với style mặc định từ Theme
  const isTitlePlaceholder = placeholderType === 'title' || placeholderType === 'ctrTitle' || placeholderType === 'subTitle';
  const baseStyle: TextStyle = {
      font: isTitlePlaceholder ? themeData.fontScheme.majorFont : themeData.fontScheme.minorFont,
  };

  // 2. Áp dụng (ghi đè) style từ Slide Master
  const masterPlaceholderStyle = masterData.styles.find(s => s.type === placeholderType);
  const masterLevelStyle = masterPlaceholderStyle?.levelStyles?.[paragraphLevel];
  Object.assign(baseStyle, masterPlaceholderStyle?.defaultStyle, masterLevelStyle);

  // 3. Áp dụng (ghi đè) style từ Slide Layout
  const layoutPlaceholderStyle = layoutData.styles.find(s => s.type === placeholderType);
  const layoutLevelStyle = layoutPlaceholderStyle?.levelStyles?.[paragraphLevel];
  Object.assign(baseStyle, layoutPlaceholderStyle?.defaultStyle, layoutLevelStyle);

  // 4. Áp dụng (ghi đè) định dạng cuối cùng từ chính text run
  const directStyle = parseTextStyleFromRprNode(textRunNode['a:rPr']?.[0]);
  Object.assign(baseStyle, directStyle);

  return baseStyle;
}