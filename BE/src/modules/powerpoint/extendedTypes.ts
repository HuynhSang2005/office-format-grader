/**
 * Extended types for PowerPoint format parsing
 */

import type { 
  Shape as BaseShape,
  FormattedTextRun as BaseFormattedTextRun,
  FormattedSlide as BaseFormattedSlide,
  PowerPointTheme as BasePowerPointTheme,
  WordArtEffect,
  TransitionEffect
} from './powerpointFormat.types';

/**
 * Định nghĩa thuộc tính fill cho Shape
 */
export interface ShapeFill {
  type?: 'solid' | 'gradient' | 'picture' | 'pattern';
  color?: string;
  opacity?: number;
  gradient?: {
    stops: {color: string, position: number}[];
    angle?: number;
  };
}

/**
 * Định nghĩa thuộc tính outline cho Shape
 */
export interface ShapeOutline {
  width?: number;
  color?: string;
  style?: 'solid' | 'dash' | 'dot' | 'dashDot';
}

/**
 * Định nghĩa cấu trúc hyperlink mở rộng
 */
export interface HyperlinkData {
  url?: string;
  target?: string;
  tooltip?: string;
}

/**
 * Định nghĩa animation cho Shape
 */
export interface ShapeAnimation {
  type: string;
  duration?: number;
  delay?: number;
  trigger?: 'onClick' | 'withPrevious' | 'afterPrevious';
  direction?: string;
  customDuration?: boolean;
  customStartTime?: boolean;
  customEffect?: boolean;
}

/**
 * Định nghĩa theme colors
 */
export interface PowerPointThemeColors {
  accent1?: string;
  accent2?: string;
  accent3?: string;
  accent4?: string;
  accent5?: string;
  accent6?: string;
  background1?: string;
  background2?: string;
  text1?: string;
  text2?: string;
}

/**
 * Định nghĩa theme fonts
 */
export interface PowerPointThemeFonts {
  heading?: string;
  body?: string;
}

/**
 * Mở rộng Shape để bổ sung các thuộc tính phân tích
 */
export interface ExtendedShape extends BaseShape {
  fill?: ShapeFill;
  outline?: ShapeOutline;
  animations?: ShapeAnimation[];
}

/**
 * Mở rộng PowerPoint Theme
 */
export interface ExtendedPowerPointTheme extends BasePowerPointTheme {
  colors?: PowerPointThemeColors;
  fonts?: PowerPointThemeFonts;
}

/**
 * Mở rộng FormattedSlide để sử dụng Shape đã mở rộng
 */
export interface ExtendedFormattedSlide extends Omit<BaseFormattedSlide, 'shapes'> {
  theme?: ExtendedPowerPointTheme;
  shapes?: ExtendedShape[]; 
}

/**
 * Mở rộng FormattedTextRun để hỗ trợ hyperlink đa dạng
 */
export interface ExtendedFormattedTextRun extends Omit<BaseFormattedTextRun, 'hyperlink'> {
  hyperlink?: string | HyperlinkData;
}

// Re-export các types không xung đột
export type { WordArtEffect, TransitionEffect };