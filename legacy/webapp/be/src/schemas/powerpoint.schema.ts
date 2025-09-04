import { z } from "zod";

/**
 * Schema for document properties
 */
export const DocumentPropertiesSchema = z.object({
  title: z.string().optional(),
  creator: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  revision: z.number().optional(),
  created: z.string().optional(),
  modified: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  subject: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string().optional(),
});

/**
 * Schema for shape transform properties
 */
export const ShapeTransformSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
});

/**
 * Schema for color scheme
 */
export const ColorSchemeSchema = z.object({
  dk1: z.string().optional(), // Dark 1
  lt1: z.string().optional(), // Light 1
  dk2: z.string().optional(), // Dark 2
  lt2: z.string().optional(), // Light 2
  accent1: z.string().optional(),
  accent2: z.string().optional(),
  accent3: z.string().optional(),
  accent4: z.string().optional(),
  accent5: z.string().optional(),
  accent6: z.string().optional(),
  hlink: z.string().optional(), // Hyperlink
  folHlink: z.string().optional(), // Followed hyperlink
});

/**
 * Schema for font scheme
 */
export const FontSchemeSchema = z.object({
  majorFont: z.string().optional(),
  minorFont: z.string().optional(),
});

/**
 * Schema for theme data
 */
export const ThemeDataSchema = z.object({
  name: z.string().optional(),
  colorScheme: ColorSchemeSchema.optional(),
  fontScheme: FontSchemeSchema.optional(),
  formatScheme: z.any().optional(),
});

/**
 * Schema for hyperlink data
 */
export const HyperlinkDataSchema = z.object({
  id: z.string().optional(),
  target: z.string().optional(),
  action: z.string().optional(),
  tooltip: z.string().optional(),
});

/**
 * Schema for shape fill
 */
export const ShapeFillSchema = z.object({
  type: z.enum(["solid", "gradient", "pattern", "picture", "none"]).optional(),
  color: z.string().optional(),
  transparency: z.number().min(0).max(100).optional(),
});

/**
 * Schema for shape outline
 */
export const ShapeOutlineSchema = z.object({
  color: z.string().optional(),
  width: z.number().optional(),
  style: z.string().optional(),
});

/**
 * Schema for animation effect
 */
export const AnimationEffectSchema = z.object({
  type: z.string().optional(),
  preset: z.string().optional(),
  duration: z.number().optional(),
  delay: z.number().optional(),
});

/**
 * Schema for animation node
 */
export const AnimationNodeSchema = z.object({
  effects: z.array(AnimationEffectSchema).optional(),
  timing: z.any().optional(),
});

/**
 * Schema for transition effect
 */
export const TransitionEffectSchema = z.object({
  type: z.string().optional(),
  duration: z.number().optional(),
  sound: z.string().optional(),
});

/**
 * Schema for formatted text run
 */
export const FormattedTextRunSchema = z.object({
  text: z.string(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  color: z.string().optional(),
  hyperlink: HyperlinkDataSchema.optional(),
});

/**
 * Schema for shape
 */
export const ShapeSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  transform: ShapeTransformSchema.optional(),
  fill: ShapeFillSchema.optional(),
  outline: ShapeOutlineSchema.optional(),
  textRuns: z.array(FormattedTextRunSchema).optional(),
  hyperlinks: z.array(HyperlinkDataSchema).optional(),
  animations: z.array(AnimationEffectSchema).optional(),
});

/**
 * Schema for table data
 */
export const TableDataSchema = z.object({
  rows: z.number().optional(),
  columns: z.number().optional(),
  data: z.array(z.array(z.string())).optional(),
});

/**
 * Schema for SmartArt node
 */
export const SmartArtNodeSchema = z.object({
  id: z.string().optional(),
  text: z.string().optional(),
  level: z.number().optional(),
  children: z.array(z.lazy(() => SmartArtNodeSchema)).optional(),
});

/**
 * Schema for SmartArt data
 */
export const SmartArtDataSchema = z.object({
  type: z.string().optional(),
  nodes: z.array(SmartArtNodeSchema).optional(),
});

/**
 * Schema for formatted slide
 */
export const FormattedSlideSchema = z.object({
  slideNumber: z.number(),
  title: z.string().optional(),
  content: z.array(z.string()).optional(),
  shapes: z.array(ShapeSchema).optional(),
  animations: AnimationNodeSchema.optional(),
  transitions: TransitionEffectSchema.optional(),
  headerFooter: z.object({
    header: z.string().optional(),
    footer: z.string().optional(),
    slideNumber: z.boolean().optional(),
    dateTime: z.string().optional(),
  }).optional(),
  layout: z.string().optional(),
  background: z.any().optional(),
  tables: z.array(TableDataSchema).optional(),
  charts: z.array(z.any()).optional(),
  smartArt: z.array(SmartArtDataSchema).optional(),
});

/**
 * Schema for parsed PowerPoint format data
 */
export const ParsedPowerPointFormatDataSchema = z.object({
  slides: z.array(FormattedSlideSchema).optional(),
  theme: ThemeDataSchema.optional(),
  documentProperties: DocumentPropertiesSchema.optional(),
  mediaFiles: z.array(z.string()).optional(),
  slideLayouts: z.array(z.any()).optional(),
  slideMasters: z.array(z.any()).optional(),
  notes: z.array(z.string()).optional(),
});

/**
 * Schema for manual grader request
 */
export const ManualGraderRequestSchema = z.object({
  submissionFile: z.instanceof(File, { message: "Submission file is required" }),
  mode: z.enum(["summary", "detailed"]).default("summary"),
});

/**
 * Schema for PowerPoint analysis response
 */
export const PowerPointAnalysisResponseSchema = z.object({
  fileType: z.literal("pptx"),
  formatData: ParsedPowerPointFormatDataSchema,
  analysis: z.object({
    slideCount: z.number().optional(),
    hasTheme: z.boolean().optional(),
    hasAnimations: z.boolean().optional(),
    hasTransitions: z.boolean().optional(),
    hasHeaderFooter: z.boolean().optional(),
    hasHyperlinks: z.boolean().optional(),
    mediaCount: z.number().optional(),
  }).optional(),
});

// Type exports
export type DocumentProperties = z.infer<typeof DocumentPropertiesSchema>;
export type ShapeTransform = z.infer<typeof ShapeTransformSchema>;
export type ColorScheme = z.infer<typeof ColorSchemeSchema>;
export type FontScheme = z.infer<typeof FontSchemeSchema>;
export type ThemeData = z.infer<typeof ThemeDataSchema>;
export type HyperlinkData = z.infer<typeof HyperlinkDataSchema>;
export type ShapeFill = z.infer<typeof ShapeFillSchema>;
export type ShapeOutline = z.infer<typeof ShapeOutlineSchema>;
export type AnimationEffect = z.infer<typeof AnimationEffectSchema>;
export type AnimationNode = z.infer<typeof AnimationNodeSchema>;
export type TransitionEffect = z.infer<typeof TransitionEffectSchema>;
export type FormattedTextRun = z.infer<typeof FormattedTextRunSchema>;
export type Shape = z.infer<typeof ShapeSchema>;
export type TableData = z.infer<typeof TableDataSchema>;
export type SmartArtNode = z.infer<typeof SmartArtNodeSchema>;
export type SmartArtData = z.infer<typeof SmartArtDataSchema>;
export type FormattedSlide = z.infer<typeof FormattedSlideSchema>;
export type ParsedPowerPointFormatData = z.infer<typeof ParsedPowerPointFormatDataSchema>;
export type ManualGraderRequest = z.infer<typeof ManualGraderRequestSchema>;
export type PowerPointAnalysisResponse = z.infer<typeof PowerPointAnalysisResponseSchema>;