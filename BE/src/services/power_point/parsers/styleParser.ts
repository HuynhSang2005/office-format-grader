import { parseStringPromise } from "xml2js";
import type { PlaceholderStyle, SlideLayoutData, TextStyle } from "../../../types/power_point/powerpointStyles";

/**
 * Hàm helper để trích xuất các thuộc tính style từ một node <a:defRPr> hoặc tương tự.
 * @param rPrNode - Node XML chứa các thuộc tính run.
 * @returns Một đối tượng TextStyle.
 */
function parseTextStyleFromRprNode(rPrNode: any): TextStyle {
  if (!rPrNode) return {};

  const properties = rPrNode.$ || {};
  const textStyle: TextStyle = {};

  if (properties.sz) {
    textStyle.size = parseInt(properties.sz, 10) / 100;
  }
  if (properties.b === '1') textStyle.isBold = true;
  if (properties.i === '1') textStyle.isItalic = true;

  const fontNode = rPrNode['a:latin']?.[0];
  if (fontNode?.$?.typeface) {
    textStyle.font = fontNode.$.typeface;
  }

  const colorNode = rPrNode['a:solidFill']?.[0]?.['a:srgbClr']?.[0];
  if (colorNode?.$?.val) {
    textStyle.color = colorNode.$.val;
  }

  return textStyle;
}

/**
 * Phân tích một file Slide Master hoặc Slide Layout để lấy các style mặc định.
 * @param zip - Đối tượng AdmZip.
 * @param filePath - Đường dẫn đến file XML cần phân tích.
 * @returns Dữ liệu style đã được trích xuất.
 */
export async function parseMasterOrLayout(zip: any, filePath: string): Promise<SlideLayoutData> {
  const xmlRaw = zip.getEntry(filePath)?.getData().toString("utf-8");
  if (!xmlRaw) return { styles: [] };

  const xml = await parseStringPromise(xmlRaw);
  const styles: PlaceholderStyle[] = [];

  const rootNode = xml['p:sldMaster'] || xml['p:sldLayout'];
  const txStyles = rootNode?.['p:txStyles']?.[0];

  if (txStyles) {
    // Phân tích Title Style
    const titleStyleNode = txStyles['p:titleStyle']?.[0];
    if (titleStyleNode) {
      styles.push({
        type: 'title',
        defaultStyle: parseTextStyleFromRprNode(titleStyleNode['a:defRPr']?.[0]),
      });
    }

    // Phân tích Body Style
    const bodyStyleNode = txStyles['p:bodyStyle']?.[0];
    if (bodyStyleNode) {
      const levelStyles: (TextStyle | undefined)[] = Array(9).fill(undefined);
      for (let i = 1; i <= 9; i++) {
        const lvlPrNode = bodyStyleNode[`a:lvl${i}pPr`]?.[0];
        if (lvlPrNode) {
          levelStyles[i - 1] = parseTextStyleFromRprNode(lvlPrNode['a:defRPr']?.[0]);
        }
      }
      styles.push({
        type: 'body',
        defaultStyle: parseTextStyleFromRprNode(bodyStyleNode['a:defRPr']?.[0]),
        levelStyles,
      });
    }

    // Phân tích Other Style (dùng cho các placeholder như slide number, footer, date)
    const otherStyleNode = txStyles['p:otherStyle']?.[0];
    if (otherStyleNode) {
       styles.push({
        type: 'other',
        defaultStyle: parseTextStyleFromRprNode(otherStyleNode['a:defRPr']?.[0]),
      });
    }
  }

  return { styles };
}