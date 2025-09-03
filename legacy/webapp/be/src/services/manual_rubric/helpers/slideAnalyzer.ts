import type { 
  Shape, 
  FormattedSlide, 
  FormattedTextRun,
  HyperlinkData
} from "../../../types/power_point"; 

/**
 * Tìm shape dựa theo tên (case-insensitive)
 */
export function findShapeByNamePattern(slide: FormattedSlide, namePattern: string): Shape | undefined {
  if (!slide.shapes) return undefined;
  
  return slide.shapes.find(shape => 
    shape.name.toLowerCase().includes(namePattern.toLowerCase())
  );
}

/**
 * Tìm shape title trong slide
 */
export function findTitleShape(slide: FormattedSlide): Shape | undefined {
  return findShapeByNamePattern(slide, 'title');
}

/**
 * Tìm shape subtitle trong slide
 */
export function findSubtitleShape(slide: FormattedSlide): Shape | undefined {
  // Tìm kiếm với nhiều từ khóa có thể
  const shape = findShapeByNamePattern(slide, 'subtitle') || 
                findShapeByNamePattern(slide, 'sub title') ||
                findShapeByNamePattern(slide, 'sub-title');
  return shape;
}

/**
 * Tìm shape nội dung trong slide
 */
export function findContentShape(slide: FormattedSlide): Shape | undefined {
  return findShapeByNamePattern(slide, 'content') || 
         findShapeByNamePattern(slide, 'text') ||
         findShapeByNamePattern(slide, 'body');
}

/**
 * Đếm số lượng đối tượng theo loại trong tất cả slides
 */
export function countObjectsByType(slides: FormattedSlide[]): Map<string, number> {
  const objectCounts = new Map<string, number>();
  
  slides.forEach(slide => {
    if (slide.shapes) {
      slide.shapes.forEach(shape => {
        // Kiểm tra các loại đối tượng đặc biệt
        if (shape.tableData) incrementCount(objectCounts, 'Table');
        if (shape.chartData) incrementCount(objectCounts, 'Chart');
        if (shape.smartArt) incrementCount(objectCounts, 'SmartArt');
        if (shape.wordArt) incrementCount(objectCounts, 'WordArt');
        
        // Đếm shape thông thường (không thuộc các loại đặc biệt trên)
        if (!shape.tableData && !shape.chartData && !shape.smartArt && !shape.wordArt) {
          incrementCount(objectCounts, 'Shape');
        }
      });
    }
  });
  
  return objectCounts;
}

/**
 * Kiểm tra xem slide có các hyperlink hay không
 */
export function checkSlidesForHyperlinks(slides: FormattedSlide[]): {
  count: number;
  validCount: number;
  validTargets: number;
} {
  let count = 0;
  let validCount = 0;
  let validTargets = 0;
  
  slides.forEach(slide => {
    if (slide.shapes) {
      slide.shapes.forEach(shape => {
        if (shape.textRuns) {
          shape.textRuns.forEach(run => {
            if (run.hyperlink) {
              count++;
              
              // Kiểm tra hyperlink có hợp lệ không (có URL hoặc target)
              const hyperlinkData = typeof run.hyperlink === 'string' 
                ? { url: run.hyperlink } 
                : run.hyperlink as HyperlinkData;
                
              if (hyperlinkData.url || hyperlinkData.target) {
                validCount++;
                
                // Kiểm tra target có đúng không (tồn tại, không trống)
                const target = hyperlinkData.target;
                if (target && target.trim().length > 0) {
                  validTargets++;
                }
              }
            }
          });
        }
      });
    }
  });
  
  return { count, validCount, validTargets };
}

/**
 * Kiểm tra các hiệu ứng animation trong slides
 */
export function checkSlidesAnimations(slides: FormattedSlide[]): {
  totalAnimations: number;
  slidesWithAnimation: number;
  customAnimations: number;
} {
  let totalAnimations = 0;
  let slidesWithAnimation = 0;
  let customAnimations = 0;
  
  slides.forEach(slide => {
    let hasAnimation = false;
    
    if (slide.shapes) {
      slide.shapes.forEach(shape => {
        // Đảm bảo type safety khi kiểm tra animations
        const animations = (shape as any).animations;
        if (animations && Array.isArray(animations) && animations.length > 0) {
          hasAnimation = true;
          totalAnimations += animations.length;
          
          // Kiểm tra xem có animation được tùy chỉnh không
          animations.forEach(anim => {
            if (anim.customDuration || anim.customStartTime || anim.customEffect) {
              customAnimations++;
            }
          });
        }
      });
    }
    
    if (hasAnimation) {
      slidesWithAnimation++;
    }
  });
  
  return { totalAnimations, slidesWithAnimation, customAnimations };
}

/**
 * Utility function để tăng số đếm trong map
 */
function incrementCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) || 0) + 1);
}