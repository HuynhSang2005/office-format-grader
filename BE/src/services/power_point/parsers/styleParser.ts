import { parseStringPromise } from "xml2js";
import type { PlaceholderStyle, SlideLayoutData, TextStyle } from "../../../types/power_point/powerpointStyles";

/**
 * Hàm helper để trích xuất các thuộc tính style từ một node <a:defRPr> hoặc <a:endParaRPr>.
 * @param rPrNode - Node XML chứa các thuộc tính run.
 * @returns Một đối tượng TextStyle.
 */
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

  // Xác định node gốc chứa style (có thể là master hoặc layout)
  const rootNode = xml['p:sldMaster'] || xml['p:sldLayout'];
  const txStyles = rootNode?.['p:txStyles']?.[0];

  if (txStyles) {
    // 1. Phân tích Title Style
    if (txStyles['p:titleStyle']?.[0]?.['a:defRPr']?.[0]) {
      styles.push({
        type: 'title', // hoặc 'ctrTitle' tùy vào ngữ cảnh
        defaultStyle: parseTextStyleFromRprNode(txStyles['p:titleStyle'][0]['a:defRPr'][0]),
      });
    }

    // 2. Phân tích Body Style (chứa nhiều cấp độ)
    if (txStyles['p:bodyStyle']?.[0]) {
      const bodyStyleNode = txStyles['p:bodyStyle'][0];
      const levelStyles: (TextStyle | undefined)[] = [];
      
      // Lặp qua 9 cấp độ style có thể có của một list
      for (let i = 1; i <= 9; i++) {
        const lvlPrNode = bodyStyleNode[`a:lvl${i}pPr`]?.[0];
        if (lvlPrNode) {
          levelStyles[i - 1] = parseTextStyleFromRprNode(lvlPrNode['a:defRPr']?.[0]);
        } else {
          levelStyles[i - 1] = undefined;
        }
      }

      styles.push({
        type: 'body',
        defaultStyle: parseTextStyleFromRprNode(bodyStyleNode['a:defRPr']?.[0]),
        levelStyles: levelStyles,
      });
    }
    
    // 3. Phân tích Other Style (dùng cho các placeholder còn lại)
    if (txStyles['p:otherStyle']?.[0]?.['a:defRPr']?.[0]) {
       styles.push({
        type: 'other',
        defaultStyle: parseTextStyleFromRprNode(txStyles['p:otherStyle'][0]['a:defRPr'][0]),
      });
    }
  }

  return { styles };
}