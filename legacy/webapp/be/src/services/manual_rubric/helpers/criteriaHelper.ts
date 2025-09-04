import type { FormattedSlide, Shape } from "../../../types/power_point";

/**
 * Helper cho transitions: Phân tích hiệu ứng chuyển cảnh
 */
export function analyzeTransitions(slides: FormattedSlide[]): {
  slidesWithTransition: number;
  totalSlides: number;
  slide2HasSound: boolean;
} {
  if (!slides || slides.length === 0) {
    return { slidesWithTransition: 0, totalSlides: 0, slide2HasSound: false };
  }
  
  const slidesWithTransition = slides.filter(s => !!s.transition).length;
  const slide2HasSound = slides.length > 1 && !!slides[1]?.transition?.sound?.name;
  
  return {
    slidesWithTransition,
    totalSlides: slides.length,
    slide2HasSound
  };
}

/**
 * Helper cho header/footer: Phân tích thiết lập header/footer
 */
export function analyzeHeaderFooter(slides: FormattedSlide[]): {
  contentSlidesWithFooter: number;
  contentSlidesTotal: number;
  titleSlideHasNoFooter: boolean;
} {
  if (!slides || slides.length === 0) {
    return { contentSlidesWithFooter: 0, contentSlidesTotal: 0, titleSlideHasNoFooter: false };
  }
  
  // Slide nội dung (từ slide 2 trở đi)
  const contentSlides = slides.filter(s => s.slideNumber > 1);
  const contentSlidesWithFooter = contentSlides.filter(s => 
    s.displayInfo?.showsFooter === true && 
    s.displayInfo?.showsDate === true && 
    s.displayInfo?.showsSlideNumber === true
  ).length;
  
  // Slide tiêu đề (slide 1)
  const titleSlide = slides[0];
  const titleSlideHasNoFooter = titleSlide ? 
                              (!titleSlide.displayInfo?.showsFooter &&
                              !titleSlide.displayInfo?.showsSlideNumber) : false;
  
  return {
    contentSlidesWithFooter,
    contentSlidesTotal: contentSlides.length,
    titleSlideHasNoFooter
  };
}

/**
 * Helper cho hyperlink: Phân tích các hyperlink trong slide
 */
export function analyzeHyperlinks(slides: FormattedSlide[]): {
  totalHyperlinks: number;
  validHyperlinks: number;
  slidesWithHyperlink: number;
} {
  let totalHyperlinks = 0;
  let validHyperlinks = 0;
  let slidesWithHyperlink = 0;
  
  if (!slides || slides.length === 0) {
    return { totalHyperlinks: 0, validHyperlinks: 0, slidesWithHyperlink: 0 };
  }
  
  slides.forEach(slide => {
    let slideHasHyperlink = false;
    
    if (slide.shapes) {
      slide.shapes.forEach(shape => {
        if (shape.textRuns) {
          shape.textRuns.forEach(run => {
            if (run.hyperlink) {
              totalHyperlinks++;
              slideHasHyperlink = true;
              
              // Kiểm tra tính hợp lệ của hyperlink
              const hyperlinkData = typeof run.hyperlink === 'string' 
                ? { url: run.hyperlink } 
                : run.hyperlink;
              
              if (hyperlinkData.url || (typeof hyperlinkData === 'object' && 'target' in hyperlinkData)) {
                validHyperlinks++;
              }
            }
          });
        }
      });
    }
    
    if (slideHasHyperlink) {
      slidesWithHyperlink++;
    }
  });
  
  return {
    totalHyperlinks,
    validHyperlinks,
    slidesWithHyperlink
  };
}

/**
 * Helper cho animations: Phân tích animations
 */
export function analyzeAnimations(slides: FormattedSlide[]): {
  totalAnimations: number;
  slidesWithAnimation: number;
  differentAnimationTypes: Set<string>;
  customAnimations: number;
} {
  let totalAnimations = 0;
  let slidesWithAnimation = 0;
  const differentAnimationTypes = new Set<string>();
  let customAnimations = 0;
  
  slides?.forEach(slide => {
    let hasAnimation = false;
    
    slide.shapes?.forEach(shape => {
      const animations = (shape as any).animations;
      
      if (animations && Array.isArray(animations) && animations.length > 0) {
        hasAnimation = true;
        totalAnimations += animations.length;
        
        animations.forEach((anim: any) => {
          if (anim.type) {
            differentAnimationTypes.add(anim.type);
          }
          
          if (anim.customDuration || anim.customStartTime || anim.customEffect) {
            customAnimations++;
          }
        });
      }
    });
    
    if (hasAnimation) {
      slidesWithAnimation++;
    }
  });
  
  return {
    totalAnimations,
    slidesWithAnimation,
    differentAnimationTypes,
    customAnimations
  };
}

/**
 * Helper cho objects: Phân tích các đối tượng trong slides
 */
export function analyzeObjects(slides: FormattedSlide[]): {
  objectTypes: Map<string, number>;
  totalObjects: number;
  slidesWithObject: number;
} {
  const objectTypes = new Map<string, number>();
  let totalObjects = 0;
  let slidesWithObject = 0;
  
  slides?.forEach(slide => {
    let hasObject = false;
    
    if (slide.shapes && slide.shapes.length > 0) {
      slide.shapes.forEach(shape => {
        // Không tính các shape chỉ là placeholder text
        if (isPlaceholderShape(shape)) {
          return;
        }
        
        totalObjects++;
        hasObject = true;
        
        // Phân loại đối tượng
        if (shape.tableData) {
          incrementMapCount(objectTypes, 'Table');
        } else if (shape.chartData) {
          incrementMapCount(objectTypes, 'Chart');
        } else if (shape.smartArt) {
          incrementMapCount(objectTypes, 'SmartArt');
        } else if (shape.wordArt) {
          incrementMapCount(objectTypes, 'WordArt');
        } else if ((shape as any).fill?.type === 'picture') {
          incrementMapCount(objectTypes, 'Picture');
        } else {
          incrementMapCount(objectTypes, 'Shape');
        }
      });
    }
    
    if (hasObject) {
      slidesWithObject++;
    }
  });
  
  return {
    objectTypes,
    totalObjects,
    slidesWithObject
  };
}

/**
 * Helper cho slideMaster: Phân tích việc sử dụng slide master
 */
export function analyzeSlideMaster(slides: FormattedSlide[]): {
  hasConsistentLayouts: boolean;
  hasTitleSlide: boolean;
  hasContentSlide: boolean;
  consistentFormatting: boolean;
  titleSlideFormatting: boolean;
} {
  if (!slides || slides.length === 0) {
    return {
      hasConsistentLayouts: false,
      hasTitleSlide: false,
      hasContentSlide: false,
      consistentFormatting: false,
      titleSlideFormatting: false
    };
  }
  
  // Kiểm tra layout
  const hasTitleSlide = slides.some(s => s.layout === 'Title Slide');
  const hasContentSlide = slides.some(s => s.layout === 'Title and Content');
  
  // Kiểm tra nhất quán layout
  const layouts = slides.map(s => s.layout).filter(Boolean);
  const uniqueLayouts = new Set(layouts);
  const hasConsistentLayouts = layouts.length > 0 && uniqueLayouts.size <= 3;
  
  // Kiểm tra nhất quán định dạng
  const titleFonts = new Set<string>();
  const bodyFonts = new Set<string>();
  
  slides.forEach(slide => {
    if (!slide.shapes) return;
    
    // Tìm title shape
    const titleShape = slide.shapes.find(s => s.name.toLowerCase().includes('title'));
    if (titleShape?.textRuns?.[0]?.font) {
      titleFonts.add(titleShape.textRuns[0].font);
    }
    
    // Tìm các shape nội dung
    const contentShapes = slide.shapes.filter(s => !s.name.toLowerCase().includes('title'));
    contentShapes.forEach(shape => {
      if (shape.textRuns?.[0]?.font) {
        bodyFonts.add(shape.textRuns[0].font);
      }
    });
  });
  
  const consistentFormatting = titleFonts.size <= 2 && bodyFonts.size <= 2;
  
  // Kiểm tra formatting riêng cho title slide
  const titleSlide = slides.find(s => s.layout === 'Title Slide');
  let titleSlideFormatting = false;
  
  if (titleSlide) {
    const titleShape = titleSlide.shapes?.find(s => s.name.toLowerCase().includes('title'));
    const subtitleShape = titleSlide.shapes?.find(s => 
      s.name.toLowerCase().includes('subtitle') || 
      s.name.toLowerCase().includes('sub-title')
    );
    
    titleSlideFormatting = 
      !!titleShape?.textRuns?.length && 
      !!subtitleShape?.textRuns?.length;
  }
  
  return {
    hasConsistentLayouts,
    hasTitleSlide,
    hasContentSlide,
    consistentFormatting,
    titleSlideFormatting
  };
}

/**
 * Helper cho themes: Phân tích theme
 */
export function analyzeTheme(slides: FormattedSlide[]): {
  hasCustomTheme: boolean;
  consistencyScore: number;
  colorSchemeQuality: number;
} {
  if (!slides || slides.length === 0) {
    return { hasCustomTheme: false, consistencyScore: 0, colorSchemeQuality: 0 };
  }
  
  // Kiểm tra slide đầu tiên có theme name không phải default
  const defaultThemes = ['Office Theme', 'Default Theme', ''];
  // Sửa lỗi: Truy cập theme một cách an toàn với type assertion
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

/**
 * Helper cho slidesFromOutline: Phân tích cấu trúc outline
 */
export function analyzeOutlineStructure(slides: FormattedSlide[]): {
  hasConsistentTitles: boolean;
  hasHierarchicalContent: boolean;
  hasConsistentFormatting: boolean;
  hasProperListLevels: boolean;
} {
  if (!slides || slides.length === 0) {
    return {
      hasConsistentTitles: false,
      hasHierarchicalContent: false,
      hasConsistentFormatting: false,
      hasProperListLevels: false
    };
  }
  
  // Kiểm tra tính nhất quán của tiêu đề
  const titleTexts = slides.map(slide => {
    const titleShape = slide.shapes?.find((s: any) => 
      s.name?.toLowerCase().includes('title')
    );
    return titleShape?.textRuns?.[0]?.text || '';
  }).filter(Boolean);
  
  const hasConsistentTitles = titleTexts.length >= slides.length * 0.8;
  
  // Kiểm tra cấu trúc phân cấp trong nội dung
  let totalListItems = 0;
  let totalListLevels = 0;
  let contentWithProperFormatting = 0;
  let slidesWithLists = 0;
  
  slides.forEach(slide => {
    // Tìm shape nội dung (không phải tiêu đề)
    const contentShapes = slide.shapes?.filter((s: any) => 
      !s.name?.toLowerCase().includes('title')
    ) || [];
    
    let slideHasLists = false;
    
    contentShapes.forEach((shape: any) => {
      if (!shape.textRuns || shape.textRuns.length === 0) return;
      
      // Kiểm tra định dạng nhất quán
      const hasConsistentFont = shape.textRuns.every((run: any, i: number, arr: any[]) => 
        i === 0 || run.font === arr[0].font
      );
      
      if (hasConsistentFont) {
        contentWithProperFormatting++;
      }
      
      // Kiểm tra danh sách phân cấp
      const listLevels = new Set<number>();
      
      shape.textRuns.forEach((run: any) => {
        if (run.listLevel !== undefined) {
          listLevels.add(run.listLevel);
          totalListItems++;
          slideHasLists = true;
        }
      });
      
      totalListLevels += listLevels.size;
    });
    
    if (slideHasLists) {
      slidesWithLists++;
    }
  });
  
  // Đánh giá các tiêu chí
  const hasHierarchicalContent = slidesWithLists >= slides.length * 0.5;
  const hasConsistentFormatting = contentWithProperFormatting >= slides.length * 0.7;
  const hasProperListLevels = totalListLevels > 0 && totalListItems > 0 && 
                             totalListLevels >= Math.min(3, Math.floor(totalListItems / 3));
  
  return {
    hasConsistentTitles,
    hasHierarchicalContent,
    hasConsistentFormatting,
    hasProperListLevels
  };
}

/**
 * Helper cho creativity: Phân tích sự sáng tạo
 */
export function analyzeCreativity(slides: FormattedSlide[]): {
  objectDiversityScore: number;
  layoutBalanceScore: number;
} {
  if (!slides || slides.length === 0) {
    return { objectDiversityScore: 0, layoutBalanceScore: 0 };
  }
  
  // Tính điểm đa dạng đối tượng
  const objectDiversityScore = calculateObjectDiversity(slides);
  
  // Tính điểm cân đối bố cục
  const layoutBalanceScore = calculateLayoutBalance(slides);
  
  return {
    objectDiversityScore,
    layoutBalanceScore
  };
}

// ===== Private helper functions =====

/**
 * Tăng số đếm cho một khóa trong Map
 */
function incrementMapCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) || 0) + 1);
}

/**
 * Kiểm tra xem một shape có phải là placeholder text không
 */
function isPlaceholderShape(shape: Shape): boolean {
  const name = shape.name.toLowerCase();
  return (
    name.includes('placeholder') || 
    name.includes('title') || 
    name.includes('subtitle') ||
    name.includes('footer') ||
    name.includes('header') ||
    name.includes('date')
  );
}

/**
 * Tính điểm đa dạng đối tượng (0-1)
 */
function calculateObjectDiversity(slides: FormattedSlide[]): number {
  // Đếm các loại đối tượng khác nhau
  const objectTypes = new Set<string>();
  let totalShapeCount = 0;
  
  slides.forEach(slide => {
    if (slide.shapes) {
      slide.shapes.forEach((shape: any) => {
        if (isPlaceholderShape(shape)) return;
        
        totalShapeCount++;
        
        // Xác định loại đối tượng
        if (shape.tableData) objectTypes.add('table');
        if (shape.chartData) objectTypes.add('chart');
        if (shape.smartArt) objectTypes.add('smartArt');
        if (shape.wordArt) objectTypes.add('wordArt');
        if (shape.fill?.type === 'picture') objectTypes.add('picture');
        
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
function calculateLayoutBalance(slides: FormattedSlide[]): number {
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
