import type { FormattedSlide, ThemeData } from "../types/power_point";

/**
 * define cho các thuộc tính metadata của document
 */
export interface DocumentProperties {
    title?: string;
    creator?: string;
    lastModifiedBy?: string;
    revision?: number;
    created?: string;
    modified?: string;
    company?: string;
    category?: string;
    subject?: string;
    description?: string;
    keywords?: string[];
    language?: string;
};