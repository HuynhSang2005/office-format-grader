import type { FormattedTextRun, Shape, FormattedSlide } from "../index"; // Import từ index để sử dụng types đã mở rộng
import type { TextRun, Drawing } from "../../word/wordFormat.types";

/**
 * Type guard cho TextRun từ Word
 */
export function isTextRun(run: any): run is TextRun {
    return run && run.type === 'text';
}

/**
 * Type guard để kiểm tra một đối tượng có phải là FormattedTextRun
 */
export function isFormattedTextRun(obj: any): obj is FormattedTextRun {
    return obj && typeof obj.text === 'string';
}

/**
 * Type guard để kiểm tra một đối tượng có phải là Shape
 */
export function isShape(obj: any): obj is Shape {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

/**
 * Type guard để kiểm tra một đối tượng có phải là FormattedSlide
 */
export function isFormattedSlide(obj: any): obj is FormattedSlide {
    return obj && typeof obj.slideNumber === 'number';
}