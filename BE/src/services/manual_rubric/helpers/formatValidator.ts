import type { 
  FormattedSlide, 
  Shape, 
  ShapeFill, 
  ShapeOutline,
  PowerPointTheme
} from "../../../types/power_point"; 

/**
 * Kiểm tra một shape có định dạng font và kích thước đúng quy định hay không
 */
export function validateShapeFormatting(
  shape: Shape | undefined,
  expectedFont: string,
  expectedSize: number
): string[] {
  const errors: string[] = [];
  
  if (!shape) {
    return ["Không tìm thấy shape phù hợp"];
  }
  
  if (!shape.textRuns || shape.textRuns.length === 0) {
    return ["Shape không có nội dung text"];
  }
  
  const textRun = shape.textRuns[0];
  
  // Kiểm tra null/undefined trước khi truy cập thuộc tính
  if (textRun) {
    if (textRun.font !== expectedFont) {
      errors.push(`Sai font (${textRun.font || "không rõ"} thay vì ${expectedFont})`);
    }
    
    if (textRun.size !== expectedSize) {
      errors.push(`Sai kích thước (${textRun.size || "không rõ"}pt thay vì ${expectedSize}pt)`);
    }
  }
  
  return errors;
}

/**
 * Kiểm tra xem slide có phải là slide trống không
 */
export function isEmptySlide(slide: FormattedSlide): boolean {
  return !slide.shapes || slide.shapes.length === 0;
}

/**
 * Kiểm tra xem slide có thuộc một layout cụ thể không
 */
export function isSlideWithLayout(slide: FormattedSlide, layoutName: string): boolean {
  return slide.layout === layoutName;
}

/**
 * Đánh giá theme dựa trên độ nhất quán và phù hợp
 */
export function evaluateThemeConsistency(slides: FormattedSlide[]): {
  hasCustomTheme: boolean;
  consistencyScore: number;
  colorSchemeQuality: number;
} {
  if (!slides || slides.length === 0) {
    return { hasCustomTheme: false, consistencyScore: 0, colorSchemeQuality: 0 };
  }
  
  // Kiểm tra slide đầu tiên có theme name không phải default
  const defaultThemes = ['Office Theme', 'Default Theme', ''];
  const themeName = (slides[0] as any)?.theme?.name || '';
  const hasCustomTheme = !defaultThemes.includes(themeName);
  
  // Tính điểm nhất quán dựa trên độ đồng nhất của font chính
  const titleFonts = new Set<string>();
  const bodyFonts = new Set<string>();
  let colorSchemeCount = 0;
  
  slides.forEach(slide => {
    if (slide.shapes) {
      // Tìm title và body shapes
      const titleShape = slide.shapes.find(s => s.name.toLowerCase().includes('title'));
      const bodyShapes = slide.shapes.filter(s => !s.name.toLowerCase().includes('title'));
      
      // Thu thập font từ title
      if (titleShape?.textRuns?.[0]?.font) {
        titleFonts.add(titleShape.textRuns[0].font);
      }
      
      // Thu thập font từ body
      bodyShapes.forEach(shape => {
        if (shape.textRuns?.[0]?.font) {
          bodyFonts.add(shape.textRuns[0].font);
        }
      });
      
      // Đếm số lượng màu sắc khác nhau
      const colors = new Set<string>();
      slide.shapes.forEach(shape => {
        shape.textRuns?.forEach(run => {
          if (run.color) colors.add(run.color);
        });
        // Sửa lỗi: Truy cập fill và outline thông qua type assertion
        const extendedShape = shape as any;
        if (extendedShape.fill?.color) colors.add(extendedShape.fill.color);
        if (extendedShape.outline?.color) colors.add(extendedShape.outline.color);
      });
      
      colorSchemeCount = Math.max(colorSchemeCount, colors.size);
    }
  });
  
  // Điểm nhất quán (tốt nhất là khi chỉ có 1-2 fonts cho title và 1-2 fonts cho body)
  const consistencyScore = 
    (titleFonts.size <= 2 ? 0.5 : titleFonts.size <= 3 ? 0.3 : 0.1) +
    (bodyFonts.size <= 2 ? 0.5 : bodyFonts.size <= 3 ? 0.3 : 0.1);
  
  // Điểm cho bảng màu (2-5 màu là tốt, quá ít hoặc quá nhiều đều không tốt)
  const colorSchemeQuality = 
    colorSchemeCount >= 2 && colorSchemeCount <= 5 ? 1.0 :
    colorSchemeCount <= 7 ? 0.7 :
    colorSchemeCount === 1 ? 0.3 : 0.1;
  
  return {
    hasCustomTheme,
    consistencyScore,
    colorSchemeQuality
  };
}