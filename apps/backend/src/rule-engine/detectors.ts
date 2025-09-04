/**
 * @file detectors.ts
 * @description Map các detector functions cho từng DetectorKey
 * @author Nguyễn Huỳnh Sang
 */

import type { DetectorFn } from '@/types/rule-engine.types';

// Copy từ Prompt A - các detector key được hỗ trợ
// sẽ được implement ở phase riêng DOCX / PPTX
export type DetectorKey =
  // DOCX detectors
  | 'docx.toc'
  | 'docx.headerFooter'
  | 'docx.layoutArt'
  | 'docx.table'
  | 'docx.equation'
  | 'docx.tabs'
  | 'docx.smartArt'
  | 'docx.hyperlinks'
  // PPTX detectors
  | 'pptx.save'
  | 'pptx.slidesFromOutline'
  | 'pptx.theme'
  | 'pptx.slideMaster'
  | 'pptx.headerFooter'
  | 'pptx.hyperlinks'
  | 'pptx.transitions'
  | 'pptx.animations'
  | 'pptx.objects'
  | 'pptx.artistic'
  | 'pptx.exportPdf'
  // Common detectors
  | 'common.filenameConvention'
  | 'common.exportPdf';

export const detectors: Record<DetectorKey, DetectorFn> = {
  // DOCX Detectors
  'docx.toc': (features: any) => {
    const { toc } = features;
    
    if (!toc.exists) {
      return {
        passed: false,
        points: 0,
        level: 'toc_0',
        reason: 'Không có mục lục hoặc tạo thủ công'
      };
    }
    
    if (toc.isAutomatic && toc.entryCount >= 3 && toc.hasPageNumbers && toc.isUpdated) {
      return {
        passed: true,
        points: 1.5,
        level: 'toc_2',
        reason: 'TOC tự động đầy đủ, phân cấp, số trang chính xác'
      };
    }
    
    return {
      passed: true,
      points: 0.75,
      level: 'toc_1',
      reason: 'Có mục lục tự động nhưng chưa đầy đủ'
    };
  },
  
  'docx.headerFooter': (features: any) => {
    const { headerFooter } = features;
    
    if (!headerFooter.hasHeader && !headerFooter.hasFooter) {
      return {
        passed: false,
        points: 0,
        level: 'hf_0',
        reason: 'Không có header/footer'
      };
    }
    
    if (headerFooter.hasHeader && headerFooter.hasFooter && headerFooter.hasPageNumbers && headerFooter.headerContent && headerFooter.footerContent) {
      return {
        passed: true,
        points: 1,
        level: 'hf_2',
        reason: 'Header/Footer đầy đủ thông tin, đúng vị trí'
      };
    }
    
    return {
      passed: true,
      points: 0.5,
      level: 'hf_1',
      reason: 'Có header/footer nhưng thiếu thông tin'
    };
  },
  
  'docx.layoutArt': (features: any) => {
    const { columns, dropCap, pictures, wordArt } = features;
    
    // Count how many layout elements are present
    let elementCount = 0;
    if (columns.hasColumns) elementCount++;
    if (dropCap.exists) elementCount++;
    if (pictures.count > 0) elementCount++;
    if (wordArt.count > 0) elementCount++;
    
    if (elementCount < 2) {
      return {
        passed: false,
        points: 0,
        level: 'layout_0',
        reason: 'Thiếu hơn 2 yếu tố hoặc không có'
      };
    }
    
    if (elementCount === 2 || elementCount === 3) {
      return {
        passed: true,
        points: 0.5,
        level: 'layout_1',
        reason: 'Có 2-3 yếu tố nhưng chưa chuẩn'
      };
    }
    
    // For 4 elements, check quality
    if (columns.hasColumns && columns.columnCount >= 2 && 
        dropCap.exists && dropCap.linesCount && dropCap.linesCount >= 2 &&
        pictures.count > 0 && pictures.hasWrapping &&
        wordArt.count > 0 && wordArt.hasEffects) {
      return {
        passed: true,
        points: 2,
        level: 'layout_4',
        reason: 'Đủ 4 yếu tố chất lượng cao, spacing hoàn hảo'
      };
    }
    
    if (elementCount === 4) {
      return {
        passed: true,
        points: 1.5,
        level: 'layout_3',
        reason: 'Đủ 4 yếu tố, chất lượng khá, spacing ổn'
      };
    }
    
    return {
      passed: true,
      points: 1,
      level: 'layout_2',
      reason: 'Có đủ 4 yếu tố nhưng chất lượng chưa cao'
    };
  },
  
  'docx.table': (features: any) => {
    const { tables } = features;
    
    if (tables.count === 0) {
      return {
        passed: false,
        points: 0,
        level: 'table_0',
        reason: 'Không có bảng nào'
      };
    }
    
    if (tables.hasFormatting && tables.hasBorders && tables.hasShading && tables.hasHeaderRow) {
      return {
        passed: true,
        points: 1.5,
        level: 'table_2',
        reason: 'Bảng đúng mẫu, có màu nền, border, spacing'
      };
    }
    
    return {
      passed: true,
      points: 0.75,
      level: 'table_1',
      reason: 'Có bảng nhưng format đơn giản'
    };
  },
  
  'docx.equation': (features: any) => {
    const { equations } = features;
    
    if (equations.count === 0) {
      return {
        passed: false,
        points: 0,
        level: 'eq_0',
        reason: 'Không có phương trình hoặc viết tay'
      };
    }
    
    if (equations.isUsingEquationEditor && equations.complexity !== 'simple') {
      return {
        passed: true,
        points: 1.5,
        level: 'eq_2',
        reason: 'Dùng Equation Editor, công thức chính xác'
      };
    }
    
    return {
      passed: true,
      points: 0.75,
      level: 'eq_1',
      reason: 'Có dùng Equation nhưng đơn giản'
    };
  },
  
  'docx.tabs': (features: any) => {
    const { tabStops } = features;
    
    if (!tabStops.hasCustomTabs) {
      return {
        passed: false,
        points: 0,
        level: 'tabs_0',
        reason: 'Không sử dụng tab stops'
      };
    }
    
    if (tabStops.isConsistent && tabStops.tabCount >= 3) {
      return {
        passed: true,
        points: 1,
        level: 'tabs_2',
        reason: 'Tab stops chính xác, văn bản thẳng hàng'
      };
    }
    
    return {
      passed: true,
      points: 0.5,
      level: 'tabs_1',
      reason: 'Có dùng tabs nhưng chưa chính xác'
    };
  },
  
  'docx.smartArt': (features: any) => {
    const { smartArt } = features;
    
    if (smartArt.count === 0) {
      return {
        passed: false,
        points: 0,
        level: 'smart_0',
        reason: 'Không có SmartArt nào'
      };
    }
    
    if (smartArt.hasCustomContent && smartArt.complexity !== 'simple') {
      return {
        passed: true,
        points: 1.5,
        level: 'smart_2',
        reason: 'SmartArt đúng loại, nội dung rõ ràng'
      };
    }
    
    return {
      passed: true,
      points: 0.75,
      level: 'smart_1',
      reason: 'Có SmartArt nhưng đơn giản'
    };
  },
  
  'docx.hyperlinks': (features: any) => {
    const { hyperlinks } = features;
    
    // Add null check for hyperlinks object
    if (!hyperlinks || hyperlinks.count === 0) {
      return {
        passed: false,
        points: 0,
        level: 'link_0',
        reason: 'Không có hyperlink nào'
      };
    }
    
    if (hyperlinks.hasExternalLinks && hyperlinks.hasInternalLinks && hyperlinks.isWorking) {
      return {
        passed: true,
        points: 1,
        level: 'link_2',
        reason: 'Có hyperlink hoạt động tốt, đúng đích'
      };
    }
    
    return {
      passed: true,
      points: 0.5,
      level: 'link_1',
      reason: 'Có hyperlink nhưng chưa hiệu quả'
    };
  },
  
  // PPTX Detectors
  'pptx.save': (features: any) => {
    // Delegate to common filename convention detector
    return detectors['common.filenameConvention'](features);
  },

  'pptx.slidesFromOutline': (features: any) => {
    const { outline } = features;
    
    if (!outline.hasOutlineSlides) {
      return {
        passed: false,
        points: 0,
        level: 'outline_0',
        reason: 'Không sử dụng chức năng tạo từ outline'
      };
    }
    
    if (outline.levels.length >= 3 && 
        outline.levels.some((l: any) => l.level >= 2)) {
      return {
        passed: true,
        points: 1,
        level: 'outline_2',
        reason: 'Tạo slide từ outline với cấu trúc rõ ràng'
      };
    }
    
    return {
      passed: true,
      points: 0.5,
      level: 'outline_1',
      reason: 'Có sử dụng outline nhưng cấu trúc chưa tốt'
    };
  },

  'pptx.theme': (features: any) => {
    const { theme } = features;
    
    if (!theme.name || theme.name === 'Office Theme') {
      return {
        passed: false,
        points: 0,
        level: 'theme_0',
        reason: 'Sử dụng theme mặc định'
      };
    }
    
    if (theme.isCustom && theme.colorScheme && theme.fontScheme) {
      return {
        passed: true,
        points: 1,
        level: 'theme_2',
        reason: 'Theme phù hợp với nội dung và chuyên nghiệp'
      };
    }
    
    return {
      passed: true,
      points: 0.5,
      level: 'theme_1',
      reason: 'Có áp dụng theme nhưng chưa phù hợp'
    };
  },

  'pptx.slideMaster': (features: any) => {
    const { slideMaster, slideMasterDetail } = features;
    
    // Nếu không có thông tin chi tiết, fallback về logic cũ
    if (!slideMasterDetail) {
      if (!slideMaster.isModified) {
        return {
          passed: false,
          points: 0,
          level: 'master_0',
          reason: 'Không có tùy chỉnh Slide Master'
        };
      }
      
      return {
        passed: true,
        points: 1,
        level: 'master_1',
        reason: 'Đã tùy chỉnh Slide Master đúng chuẩn'
      };
    }
    
    // Kiểm tra font và size cho titleSlide
    const hasTitleSlideFormat = slideMasterDetail.titleSlideFont === 'Times New Roman' && 
                                slideMasterDetail.titleSlideFontSize === 32 &&
                                slideMasterDetail.titleSlideSubTitleFont === 'Arial' && 
                                slideMasterDetail.titleSlideSubTitleFontSize === 28;
    
    // Kiểm tra font và size cho titleAndContent
    const hasTitleContentFormat = slideMasterDetail.titleAndContentFont === 'Times New Roman' && 
                                  slideMasterDetail.titleAndContentFontSize === 28 &&
                                  slideMasterDetail.titleAndContentBodyFont === 'Arial' && 
                                  slideMasterDetail.titleAndContentBodyFontSize === 24;
    
    // Chia nhỏ thành 2 sub-level
    let points = 0;
    let level = 'master_0';
    let reason = '';
    
    if (hasTitleSlideFormat && hasTitleContentFormat) {
      points = 1;
      level = 'master_2';
      reason = 'Slide Master đúng font/size cho cả title slide và title+content';
    } else if (hasTitleSlideFormat || hasTitleContentFormat) {
      points = 0.5;
      level = 'master_1';
      reason = 'Slide Master đúng font/size cho một trong hai loại layout';
    } else {
      points = 0;
      level = 'master_0';
      reason = 'Slide Master chưa đúng font/size yêu cầu';
    }
    
    return {
      passed: points > 0,
      points,
      level,
      reason
    };
  },

  'pptx.headerFooter': (features: any) => {
    const { headerFooter } = features;
    
    if (!headerFooter.hasSlideNumber && !headerFooter.hasDate && !headerFooter.hasFooter) {
      return {
        passed: false,
        points: 0,
        level: 'header_0',
        reason: 'Không có header/footer'
      };
    }
    
    // Kiểm tra footer có chứa họ tên sinh viên & số trang (trừ slide đầu)
    const hasFooterText = headerFooter.footerText && headerFooter.footerText.trim() !== '';
    const hasProperFooter = hasFooterText && headerFooter.hasSlideNumber;
    
    // Chia nhỏ thành 2 sub-level
    let points = 0;
    let level = 'header_0';
    let reason = '';
    
    if (hasProperFooter && headerFooter.hasDate) {
      points = 0.5;
      level = 'header_2';
      reason = 'Footer có họ tên & số trang, có ngày tháng';
    } else if (hasProperFooter) {
      points = 0.25;
      level = 'header_1';
      reason = 'Footer có họ tên & số trang';
    } else {
      points = 0;
      level = 'header_0';
      reason = 'Header/footer chưa đầy đủ';
    }
    
    return {
      passed: points > 0,
      points,
      level,
      reason
    };
  },

  'pptx.hyperlinks': (features: any) => {
    const { hyperlinks } = features;
    
    if (!hyperlinks || hyperlinks.count === 0) {
      return {
        passed: false,
        points: 0,
        level: 'pptx_link_0',
        reason: 'Không có hyperlink nào'
      };
    }
    
    if (hyperlinks.hasExternalLinks && hyperlinks.hasInternalLinks && hyperlinks.isWorking) {
      return {
        passed: true,
        points: 1,
        level: 'pptx_link_2',
        reason: 'Có hyperlink hoạt động tốt, đúng đích'
      };
    }
    
    return {
      passed: true,
      points: 0.5,
      level: 'pptx_link_1',
      reason: 'Có hyperlink nhưng chưa hiệu quả'
    };
  },

  'pptx.transitions': (features: any) => {
    const { transitions } = features;
    
    if (transitions.length === 0) {
      return {
        passed: false,
        points: 0,
        level: 'transition_0',
        reason: 'Không có hiệu ứng chuyển slide'
      };
    }
    
    // Kiểm tra tất cả slide có transition
    const allSlidesHaveTransition = transitions.length > 0;
    
    // Kiểm tra slide 2 có sound
    const slide2HasSound = transitions.some((t: any) => t.slideIndex === 1 && t.hasSound);
    
    // Chia nhỏ thành 2 sub-level
    let points = 0;
    let level = 'transition_0';
    let reason = '';
    
    if (allSlidesHaveTransition && slide2HasSound) {
      points = 1;
      level = 'transition_2';
      reason = 'Tất cả slide có transition, slide 2 có sound';
    } else if (allSlidesHaveTransition) {
      points = 0.5;
      level = 'transition_1';
      reason = 'Tất cả slide có transition';
    } else {
      points = 0;
      level = 'transition_0';
      reason = 'Không có hiệu ứng chuyển slide';
    }
    
    return {
      passed: points > 0,
      points,
      level,
      reason
    };
  },

  'pptx.animations': (features: any) => {
    const { animations } = features;
    
    if (animations.length === 0) {
      return {
        passed: false,
        points: 0,
        level: 'anim_0',
        reason: 'Không có animation nào'
      };
    }
    
    // Kiểm tra tất cả slide có animation
    const hasAnimations = animations.length > 0;
    
    // Kiểm tra animation chuyên nghiệp (nhiều loại khác nhau)
    const animationTypes = new Set(animations.map((a: any) => a.animationType));
    const isProfessional = animationTypes.size >= 2;
    
    // Chia nhỏ thành 2 sub-level
    let points = 0;
    let level = 'anim_0';
    let reason = '';
    
    if (hasAnimations && isProfessional) {
      points = 1;
      level = 'anim_2';
      reason = 'Có animation chuyên nghiệp, đa dạng loại';
    } else if (hasAnimations) {
      points = 0.5;
      level = 'anim_1';
      reason = 'Có animation cơ bản';
    } else {
      points = 0;
      level = 'anim_0';
      reason = 'Không có animation nào';
    }
    
    return {
      passed: points > 0,
      points,
      level,
      reason
    };
  },

  'pptx.objects': (features: any) => {
    const { objects } = features;
    
    // Đếm số lượng SmartArt, Chart, Shape, WordArt
    const specialObjects = objects.filter((o: any) => 
      o.type === 'smartart' || o.type === 'chart' || o.type === 'shape' || o.type === 'image'
    );
    
    const objectCount = specialObjects.length;
    
    // Chia nhỏ thành 2 sub-level
    let points = 0;
    let level = 'obj_0';
    let reason = '';
    
    if (objectCount >= 2) {
      // Kiểm tra sự đa dạng của objects
      const objectTypes = new Set(specialObjects.map((o: any) => o.type));
      const isDiverse = objectTypes.size >= 2;
      
      if (isDiverse) {
        points = 1;
        level = 'obj_2';
        reason = 'Có ≥ 2 objects đa dạng (SmartArt, Chart, Shape, Image...)';
      } else {
        points = 0.5;
        level = 'obj_1';
        reason = 'Có ≥ 2 objects';
      }
    } else {
      points = 0;
      level = 'obj_0';
      reason = 'Ít hơn 2 objects đặc biệt';
    }
    
    return {
      passed: points > 0,
      points,
      level,
      reason
    };
  },

  'pptx.artistic': (features: any) => {
    const { theme, slideMaster, objects, animations, transitions } = features;
    
    let artisticScore = 0;
    
    // Theme đẹp
    if (theme.isCustom) artisticScore += 0.5;
    
    // Slide master được chỉnh sửa
    if (slideMaster.isModified) artisticScore += 0.5;
    
    // Đa dạng đối tượng
    const objectTypes = new Set(objects.map((o: any) => o.type));
    if (objectTypes.size >= 3) artisticScore += 0.5;
    
    // Hiệu ứng phong phú
    if (animations.length >= 3) artisticScore += 0.25;
    if (transitions.length >= 2) artisticScore += 0.25;
    
    // Chia nhỏ thành 2 sub-level
    let points = 0;
    let level = 'art_0';
    let reason = '';
    
    if (artisticScore >= 1.5) {
      points = 1.5;
      level = 'art_2';
      reason = 'Rất sáng tạo, thẩm mỹ cao, bố cục khoa học';
    } else if (artisticScore >= 0.75) {
      points = 0.75;
      level = 'art_1';
      reason = 'Có tính thẩm mỹ, bố cục khá ổn';
    } else {
      points = 0;
      level = 'art_0';
      reason = 'Bố cục đơn giản, ít tính thẩm mỹ';
    }
    
    return {
      passed: points > 0,
      points,
      level,
      reason
    };
  },

  'pptx.exportPdf': (features: any) => {
    // Delegate to common export PDF detector
    return detectors['common.exportPdf'](features);
  },

  // Common Detectors
  'common.filenameConvention': (features: any) => {
    const { filename } = features;
    
    // Enhanced patterns for Vietnamese student naming conventions
    const patterns = [
      // Pattern 1: MSSV-Họ Tên-Buổi.ext (with hyphens)
      // Example: 049306003690-Nguyễn Đoan Trang-DEPPT01.pptx
      /^\d{12}[\-_][A-ZÀ-Ỹ][a-zà-ỹ\s]+[\-_][A-Z]{2,}\d{2,3}\.(pptx|docx)$/i,
      
      // Pattern 2: MSSV_Họ Tên_Buổi.ext (with underscores)
      // Example: 089306003634_Đinh Thị Xuân Nhi_BaiThietKePowerpoint.pptx
      /^\d{12}_[A-ZÀ-Ỹ][a-zà-ỹ\s]+_[A-Za-zÀ-Ỹà-ỹ\s\d]+\.(pptx|docx)$/i,
      
      // Pattern 3: MSSV- Họ Tên_Session.ext (space after dash)
      // Example: 052206004465- Hà Quốc Nguyên Sinh_DEW01.DOCX
      /^\d{12}-\s[A-ZÀ-Ỹ][a-zà-ỹ\s]+_[A-Z]+\d{2,3}\.(pptx|docx)$/i,
      
      // Pattern 4: MSSV-Họ Tên -Session.docx (space before dash)
      // Example: 056306003357-Phạm Tú Uyên -DEW01.docx
      /^\d{12}-[A-ZÀ-Ỹ][a-zà-ỹ\s]+\s-[A-Z]+\d{2,3}\.(pptx|docx)$/i
    ];
    
    // Check against all patterns
    const isValid = patterns.some(pattern => pattern.test(filename));
    
    if (isValid) {
      return {
        passed: true,
        points: 0.5,
        level: 'save_1',
        reason: 'Tên file đúng định dạng <MSSV>_<Họ Tên>_<Buổi>.ext'
      };
    }
    
    // Additional validation for partial matches
    const hasStudentId = /^\d{12}/.test(filename);
    const hasVietnameseName = /[A-ZÀ-Ỹ][a-zà-ỹ\s]+/.test(filename);
    const hasSession = /[A-Z]{2,}\d{2,}|BaiThietKe/i.test(filename);
    
    if (hasStudentId && hasVietnameseName && hasSession) {
      return {
        passed: false,
        points: 0.25,
        level: 'save_0',
        reason: 'Tên file gần đúng nhưng còn lỗi format nhỏ'
      };
    }
    
    return {
      passed: false,
      points: 0,
      level: 'save_0',
      reason: 'Tên file không theo định dạng yêu cầu'
    };
  },
  
  'common.exportPdf': (features: any) => {
    const { hasPdfExport, pdfPageCount } = features;
    
    if (!hasPdfExport) {
      return {
        passed: false,
        points: 0,
        level: 'pdf_0',
        reason: 'Không có file PDF hoặc có lỗi'
      };
    }
    
    // Kiểm tra PDF có số trang hợp lý
    if (pdfPageCount && pdfPageCount > 0) {
      return {
        passed: true,
        points: 0.5,
        level: 'pdf_1',
        reason: 'Xuất PDF chính xác, không lỗi layout'
      };
    }
    
    return {
      passed: false,
      points: 0,
      level: 'pdf_0',
      reason: 'File PDF có vấn đề về layout'
    };
  }
} as const;

// Helper function để lấy detector theo key
export function getDetector(key: DetectorKey): DetectorFn {
  const detector = detectors[key];
  if (!detector) {
    throw new Error(`Detector không tồn tại: ${key}`);
  }
  return detector;
}

// Helper function để kiểm tra detector có tồn tại không
export function hasDetector(key: DetectorKey): boolean {
  return key in detectors;
}

// [INFO] Đã cập nhật detector PPTX chi tiết – không trùng
