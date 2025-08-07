/**
 * Centralized exports for PowerPoint types
 * Đơn giản hóa và thống nhất cách import/export
 */

// Import các types cần thiết từ các file cơ bản
import type {
    ShapeTransform,
    SlideDisplayInfo,
    TableData,
    WordArtEffect,
    TransitionEffect,
    SmartArtNode,
    SmartArtData,
    AnimationEffect,
    AnimationNode,
    ColorScheme,
    FontScheme,
    ThemeData,
    PowerPointMediaFiles,
    Shape as BaseShape,
    FormattedSlide as BaseFormattedSlide,
    ParsedPowerPointFormatData as BaseParsedPowerPointFormatData
} from './powerpointFormat.types';

// Import các types khác
import type { ChartData } from './chart.types';
import type { PowerPointSlide, ParsedPowerPointData } from './powerpoint.types';
import type { TextStyle, PlaceholderStyle, SlideLayoutData } from './powerpointStyles.types';

// Import DocumentProperties từ interfaces
import type { DocumentProperties } from '../../interfaces/documentProperties.interfaces';
// Re-export để các file khác có thể import từ đây
export type { DocumentProperties };

// Import các extended types
import type {
    ShapeFill,
    ShapeOutline,
    HyperlinkData,
    ShapeAnimation,
    PowerPointThemeColors,
    PowerPointThemeFonts,
    ExtendedShape,
    ExtendedFormattedSlide,
    ExtendedFormattedTextRun,
    ExtendedPowerPointTheme
} from './extendedTypes';

// Re-export các types khác không bị xung đột
export type {
    // Từ powerpointFormat.types
    ShapeTransform,
    SlideDisplayInfo,
    TableData,
    WordArtEffect,
    TransitionEffect,
    SmartArtNode,
    SmartArtData,
    AnimationEffect,
    AnimationNode,
    ColorScheme,
    FontScheme,
    ThemeData,
    PowerPointMediaFiles,

    // Từ các file khác
    ChartData,
    PowerPointSlide,
    ParsedPowerPointData,
    TextStyle,
    PlaceholderStyle,
    SlideLayoutData,

    // Từ extendedTypes - helpers
    ShapeFill,
    ShapeOutline,
    HyperlinkData,
    ShapeAnimation,
    PowerPointThemeColors,
    PowerPointThemeFonts,
};

// Export các type chính mà code nên sử dụng
export type Shape = ExtendedShape;
export type FormattedTextRun = ExtendedFormattedTextRun;
export type PowerPointTheme = ExtendedPowerPointTheme;

// Đảm bảo FormattedSlide bao gồm animations
export interface FormattedSlide extends BaseFormattedSlide {
    animations?: AnimationNode;
    shapes?: Shape[];
}

// Đảm bảo ParsedPowerPointFormatData bao gồm mediaFiles và documentProperties
export interface ParsedPowerPointFormatData extends BaseParsedPowerPointFormatData {
    mediaFiles?: string[];
    documentProperties?: DocumentProperties;
    theme?: PowerPointTheme;
    slides?: FormattedSlide[];
}

// Export các guards
export * from './guards/powerpointGuards';