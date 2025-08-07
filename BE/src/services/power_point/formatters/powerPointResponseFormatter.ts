/**
 * PowerPoint Response Formatter
 * Module này định nghĩa các hàm để chuẩn hóa response JSON từ PowerPoint service
 * cho API endpoints, đảm bảo tính nhất quán và dễ sử dụng cho FE
 */

import type {
  ParsedPowerPointFormatData,
  FormattedSlide,
  Shape,
  AnimationNode,
  DocumentProperties
} from '../../../types/power_point';

/**
 * Chuẩn hóa DocumentProperties để đảm bảo cấu trúc nhất quán
 */
export function formatDocumentProperties(props?: DocumentProperties): any {
  if (!props) return null;
  
  return {
    title: props.title || null,
    creator: props.creator || null,
    lastModifiedBy: props.lastModifiedBy || null,
    revision: props.revision || null,
    created: props.created || null,
    modified: props.modified || null,
    company: props.company || null,
    category: props.category || null,
    subject: props.subject || null,
    description: props.description || null,
    keywords: props.keywords || [],
    language: props.language || null,
  };
}

/**
 * Chuẩn hóa thông tin về theme
 */
export function formatTheme(theme?: any): any {
  if (!theme) return null;
  
  return {
    name: theme.name || null,
    colors: theme.colorScheme || {},
    fonts: {
      majorFont: theme.fontScheme?.majorFont || null,
      minorFont: theme.fontScheme?.minorFont || null
    }
  };
}

/**
 * Chuẩn hóa animation để loại bỏ thông tin không cần thiết
 */
export function formatAnimation(animation?: AnimationNode): any {
  if (!animation) return null;
  
  const result: any = {
    type: animation.type,
    trigger: animation.trigger,
  };
  
  if (animation.duration) result.duration = animation.duration;
  if (animation.delay) result.delay = animation.delay;
  if (animation.effect) result.effect = {
    shapeId: animation.effect.shapeId,
    type: animation.effect.effectType || null,
    direction: animation.effect.direction || null
  };
  
  if (animation.children && animation.children.length > 0) {
    result.children = animation.children.map((child: AnimationNode) => formatAnimation(child));
  }
  
  return result;
}

/**
 * Chuẩn hóa Shape để đơn giản hóa API response
 */
export function formatShape(shape: Shape): any {
  const result: any = {
    id: shape.id,
    name: shape.name,
    position: {
      x: shape.transform.x,
      y: shape.transform.y,
      width: shape.transform.width,
      height: shape.transform.height
    }
  };
  
  // Chỉ thêm các thuộc tính nếu có giá trị
  if (shape.textRuns && shape.textRuns.length > 0) {
    result.textContent = shape.textRuns.map((run: any) => ({
      text: run.text,
      formatting: {
        bold: run.isBold || false,
        italic: run.isItalic || false,
        font: run.font || null,
        size: run.size || null,
        color: run.color || null,
      },
      hyperlink: run.hyperlink || null
    }));
  }
  
  if (shape.tableData) {
    result.table = shape.tableData;
  }
  
  if (shape.chartData) {
    result.chart = {
      type: shape.chartData.type || null,
      title: shape.chartData.title || null,
      series: shape.chartData.series || []
    };
  }
  
  if (shape.wordArt) {
    result.wordArt = shape.wordArt;
  }
  
  if (shape.smartArt) {
    result.smartArt = {
      layout: shape.smartArt.layout || null,
      nodes: shape.smartArt.nodes || []
    };
  }
  
  return result;
}

/**
 * Chuẩn hóa một slide
 */
export function formatSlide(slide: FormattedSlide): any {
  const result: any = {
    number: slide.slideNumber,
    layout: slide.layout || null,
    hasNotes: !!slide.notes
  };
  
  // Thêm notes nếu có
  if (slide.notes) {
    result.notes = slide.notes;
  }
  
  // Thêm thông tin hiển thị
  if (slide.displayInfo) {
    result.display = {
      showsFooter: slide.displayInfo.showsFooter || false,
      showsDate: slide.displayInfo.showsDate || false,
      showsSlideNumber: slide.displayInfo.showsSlideNumber || false
    };
  }
  
  // Thêm thông tin transition
  if (slide.transition) {
    result.transition = {
      type: slide.transition.type || null,
      hasSound: !!slide.transition.sound
    };
    
    if (slide.transition.sound) {
      result.transition.sound = slide.transition.sound.name || null;
    }
  }
  
  // Thêm thông tin shapes
  if (slide.shapes && slide.shapes.length > 0) {
    result.shapes = slide.shapes.map((shape: Shape) => formatShape(shape));
  }
  
  // Thêm thông tin animation
  if (slide.animations) {
    result.animations = formatAnimation(slide.animations);
  }
  
  return result;
}

/**
 * Định dạng lại toàn bộ ParsedPowerPointFormatData thành một cấu trúc JSON 
 * nhất quán và dễ sử dụng cho FE
 */
export function formatPowerPointResponse(data: ParsedPowerPointFormatData): any {
  // Cấu trúc response chuẩn
  const response: any = {
    document: {
      fileName: data.fileName,
      slideCount: data.slideCount,
      properties: formatDocumentProperties(data.documentProperties)
    },
    theme: formatTheme(data.theme),
    media: {
      count: (data.mediaFiles || []).length,
      files: data.mediaFiles || []
    }
  };
  
  // Thêm slides với định dạng mới
  if (data.slides && data.slides.length > 0) {
    response.slides = data.slides.map((slide: FormattedSlide) => formatSlide(slide));
  } else {
    response.slides = [];
  }
  
  return response;
}

/**
 * Tạo response chi tiết cho một slide
 * Hữu ích khi cần lấy thông tin chi tiết về một slide cụ thể
 */
export function formatSingleSlideResponse(slide: FormattedSlide): any {
  return formatSlide(slide);
}

/**
 * Tạo response tổng quan cho presentation
 * Chỉ bao gồm thông tin cơ bản, không bao gồm slides
 * Hữu ích cho việc hiển thị thông tin tổng quan
 */
export function formatOverviewResponse(data: ParsedPowerPointFormatData): any {
  // Cấu trúc response tổng quan
  const response: any = {
    document: {
      fileName: data.fileName,
      slideCount: data.slideCount,
      properties: formatDocumentProperties(data.documentProperties)
    },
    theme: formatTheme(data.theme),
    media: {
      count: (data.mediaFiles || []).length
    },
    slideSummary: []
  };
  
  // Thêm thông tin tóm tắt về slides
  if (data.slides && data.slides.length > 0) {
    response.slideSummary = data.slides.map((slide: FormattedSlide) => ({
      number: slide.slideNumber,
      layout: slide.layout || null,
      hasNotes: !!slide.notes,
      shapeCount: (slide.shapes || []).length,
      hasAnimation: !!slide.animations
    }));
  }
  
  return response;
}
