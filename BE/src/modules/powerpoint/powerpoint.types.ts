export interface PowerPointSlide {
  slideNumber: number;
  text: string[];
}

export interface ParsedPowerPointData {
  slideCount: number;
  slides: PowerPointSlide[];
}