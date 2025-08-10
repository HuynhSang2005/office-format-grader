import type { ParsedPowerPointFormatData } from "../../../types/power_point";
import type { GradingDetail } from "../../types.ts";
import { 
  findRubricCriterion, 
  createMissingCriterionResult, 
  createNoDataResult,
  calculateScore 
} from "../../rubric/helpers.ts";

/**
 * Kiểm tra tính nghệ thuật, sáng tạo và phù hợp trong thiết kế PowerPoint
 */
export function checkCreativity(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = findRubricCriterion('creativity');
    
    if (!rule) {
        return createMissingCriterionResult('creativity', "Tính nghệ thuật, sáng tạo, phù hợp");
    }
    
    if (!data.slides || data.slides.length === 0) {
        return createNoDataResult(rule, "Không có slide nào để đánh giá tính sáng tạo.");
    }

    // Tính điểm đa dạng đối tượng
    const objectDiversityScore = calculateObjectDiversity(data.slides);
    
    // Tính điểm cân đối bố cục
    const layoutBalanceScore = calculateLayoutBalance(data.slides);
    
    // Tính điểm tổng hợp (thang điểm 0-1)
    const totalScore = (
        objectDiversityScore * 0.5 + // Đa dạng đối tượng
        layoutBalanceScore * 0.5    // Cân đối bố cục
    );
    
    // Sử dụng hàm helper để tính điểm dựa trên rubric
    let customReason = "";
    if (totalScore >= 0.8) {
        customReason = "Trình bày sáng tạo, nghệ thuật, phù hợp nội dung. Sử dụng màu sắc, font chữ nhất quán và bố cục cân đối.";
    } else if (totalScore >= 0.5) {
        customReason = "Trình bày tương đối tốt, còn vài điểm chưa phù hợp về màu sắc, font chữ hoặc bố cục.";
    } else {
        customReason = "Trình bày thiếu sáng tạo, không phù hợp nội dung. Màu sắc không hài hòa, font chữ không nhất quán, bố cục chưa cân đối.";
    }
    
    return calculateScore(rule, totalScore, customReason);
}

/**
 * Tính điểm đa dạng đối tượng (0-1)
 */
function calculateObjectDiversity(slides: any[]): number {
    // Đếm các loại đối tượng khác nhau trên mỗi slide
    const objectTypes = new Set<string>();
    let totalShapeCount = 0;
    
    slides.forEach(slide => {
        if (slide.shapes) {
            slide.shapes.forEach((shape: any) => {
                totalShapeCount++;
                
                // Xác định loại đối tượng
                if (shape.tableData) objectTypes.add('table');
                if (shape.chartData) objectTypes.add('chart');
                if (shape.smartArt) objectTypes.add('smartArt');
                if (shape.wordArt) objectTypes.add('wordArt');
                
                // Kiểm tra các loại shape đặc biệt
                const name = shape.name?.toLowerCase() || '';
                if (name.includes('icon') || name.includes('symbol')) objectTypes.add('icon');
                if (name.includes('arrow') || name.includes('connector')) objectTypes.add('connector');
                if (name.includes('shape') && !objectTypes.has('shape')) objectTypes.add('shape');
            });
        }
    });
    
    // Tính điểm dựa trên số loại đối tượng và tỷ lệ đối tượng/slide
    const typesScore = Math.min(objectTypes.size / 5, 1); // Tối đa 5 loại đối tượng
    const densityScore = Math.min(totalShapeCount / (slides.length * 3), 1); // Trung bình 3 đối tượng/slide
    
    return (typesScore * 0.6 + densityScore * 0.4);
}

/**
 * Tính điểm cân đối bố cục (0-1)
 */
function calculateLayoutBalance(slides: any[]): number {
    let totalBalanceScore = 0;
    
    slides.forEach(slide => {
        if (slide.shapes && slide.shapes.length > 0) {
            // Phân tích vị trí các đối tượng
            const shapes = slide.shapes;
            const shapesWithCoords = shapes.filter((s: any) => s.transform);
            
            if (shapesWithCoords.length === 0) {
                totalBalanceScore += 0.5; // Không thể đánh giá
                return;
            }
            
            // Tính trọng tâm của các đối tượng
            let centerX = 0, centerY = 0;
            let totalArea = 0;
            
            shapesWithCoords.forEach((shape: any) => {
                const { x, y, width, height } = shape.transform;
                const area = width * height;
                centerX += (x + width/2) * area;
                centerY += (y + height/2) * area;
                totalArea += area;
            });
            
            centerX /= totalArea;
            centerY /= totalArea;
            
            // Tính độ lệch so với trung tâm lý tưởng (0.5, 0.5)
            const idealX = 0.5, idealY = 0.5;
            const offsetX = Math.abs(centerX - idealX);
            const offsetY = Math.abs(centerY - idealY);
            
            // Điểm càng cao khi trọng tâm càng gần trung tâm
            const balanceScore = 1 - Math.min(Math.sqrt(offsetX*offsetX + offsetY*offsetY) / 0.5, 1);
            totalBalanceScore += balanceScore;
        } else {
            totalBalanceScore += 0.5; // Điểm trung bình cho slide không có đối tượng
        }
    });
    
    // Trung bình cộng điểm các slide
    return totalBalanceScore / slides.length;
}