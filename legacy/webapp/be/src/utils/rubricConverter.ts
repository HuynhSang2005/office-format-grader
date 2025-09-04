import type { RubricCriterion, RubricLevel } from "../types/grading.types";
import fs from 'fs/promises';
import path from 'path';

interface JsonRubricCriterion {
  criteria: string;
  max_score: number;
  levels: JsonRubricLevel[];
}

interface JsonRubricLevel {
  score: number;
  description: string;
}

interface JsonRubric {
  rubric: JsonRubricCriterion[];
}

/**
 * Ánh xạ ID cho từng tiêu chí từ tên tiêu chí
 */
const criteriaToIdMapping: Record<string, string> = {
  "Save": "filename",
  "Header/ Footer": "headerFooter",
  "Transitions": "transitions",
  "Objects": "objects",
  "Slide Master": "slideMaster",
  "Themes": "themes",
  "Slides From Outline": "slidesFromOutline",
  "Hyperlink": "hyperlink",
  "Animations": "animations",
  "Tính nghệ thuật, sáng tạo, phù hợp": "creativity",
  "Export PDF": "exportPdf"
};

/**
 * Chuyển đổi từ định dạng JSON sang RubricCriterion[]
 */
export async function convertJsonRubricToTypescript(): Promise<RubricCriterion[]> {
  try {
    const filePath = path.resolve(__dirname, '../shared/rubric.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonRubric: JsonRubric = JSON.parse(fileContent);
    
    return jsonRubric.rubric.map((criterion): RubricCriterion => {
      // Lấy ID từ mapping hoặc tạo ID từ tên tiêu chí
      const id = criteriaToIdMapping[criterion.criteria] || 
                criterion.criteria.toLowerCase().replace(/\s+/g, '');
      
      // Sắp xếp các level theo thứ tự điểm giảm dần
      const sortedLevels = criterion.levels ? 
        [...criterion.levels].sort((a, b) => b.score - a.score) : 
        [];
      
      return {
        id,
        criterion: criterion.criteria,
        maxScore: criterion.max_score,
        levels: sortedLevels.map(level => ({
          score: level.score,
          description: level.description
        }))
      };
    });
  } catch (error) {
    console.error("Error converting rubric JSON:", error);
    return defaultRubric;
  }
}

/**
 * Rubric mặc định khi không thể đọc từ file (chủ yếu handle fallback nếu có)
 */
export const defaultRubric: RubricCriterion[] = [
  {
    id: "filename",
    criterion: "Save",
    maxScore: 0.5,
    levels: [
      { score: 0.5, description: "Tên file tuân thủ đúng quy ước." },
      { score: 0, description: "Tên file không đúng cấu trúc yêu cầu." }
    ]
  },
  {
    id: "headerFooter",
    criterion: "Header/ Footer",
    maxScore: 0.5,
    levels: [
      { score: 0.5, description: "Đã áp dụng Header/Footer cho các slide nội dung và bỏ qua slide tiêu đề đúng quy cách." },
      { score: 0.25, description: "Đã áp dụng Header/Footer cho slide nội dung nhưng không bỏ qua slide tiêu đề." },
      { score: 0, description: "Không áp dụng đầy đủ Header/Footer cho tất cả slide nội dung." }
    ]
  },
  {
    id: "transitions",
    criterion: "Transitions",
    maxScore: 1.0,
    levels: [
      { score: 1.0, description: "Tất cả slide đều có hiệu ứng chuyển cảnh và slide 2 có âm thanh." },
      { score: 0.5, description: "Tất cả slide có hiệu ứng chuyển cảnh nhưng slide 2 thiếu âm thanh kèm theo." },
      { score: 0.25, description: "Chỉ một số slide có hiệu ứng chuyển cảnh." },
      { score: 0, description: "Không có slide nào được thiết lập hiệu ứng chuyển cảnh." }
    ]
  },
];