import { apiUrl } from "../configs/apiUrl";
import { assertOk } from "../lib/http";

export async function analyzePowerPoint({ 
  file, 
  mode = 'full' 
}: { 
  file: File, 
  mode: 'full' | 'overview' 
}) {
  const url = apiUrl(`/powerpoint/analyze?mode=${mode}`);
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  await assertOk(response, 'Lỗi khi phân tích file PowerPoint.');

  const data = await response.json();
  
  // define các interface để tránh lỗi "implicitly has an 'any' type"
  interface BackendShape {
    type: string;
    [key: string]: any;
  }

  interface BackendSlide {
    number: number;
    title?: string;
    shapes?: BackendShape[];
    [key: string]: any;
  }

  interface BackendDocumentProperties {
    title?: string;
    creator?: string;
    company?: string;
    created?: string;
    modified?: string;
    [key: string]: any;
  }

  interface BackendDocument {
    fileName: string;
    slideCount: number;
    properties?: BackendDocumentProperties;
    [key: string]: any;
  }

  interface BackendData {
    document: BackendDocument;
    slides?: BackendSlide[];
    [key: string]: any;
  }

  // Chuyển đổi dữ liệu từ backend sang định dạng mà frontend mong đợi
  const backendData: BackendData = data.data;
  return {
    fileName: backendData.document.fileName,
    slideCount: backendData.document.slideCount,
    hasCharts: backendData.slides?.some((slide: BackendSlide) => 
      slide.shapes?.some((shape: BackendShape) => shape.type === 'chart')) || false,
    hasTables: backendData.slides?.some((slide: BackendSlide) => 
      slide.shapes?.some((shape: BackendShape) => shape.type === 'table')) || false,
    metadata: {
      title: backendData.document.properties?.title || '',
      author: backendData.document.properties?.creator || '',
      company: backendData.document.properties?.company || '',
      createdAt: backendData.document.properties?.created || '',
      modifiedAt: backendData.document.properties?.modified || ''
    },
    // Nếu mode là full, thêm thông tin slides
    ...(mode === 'full' ? {
      slides: backendData.slides?.map((slide: BackendSlide) => ({
        slideNumber: slide.number,
        title: slide.title || '',
        elementCount: (slide.shapes || []).length,
        hasChart: slide.shapes?.some((shape: BackendShape) => shape.type === 'chart') || false,
        hasTable: slide.shapes?.some((shape: BackendShape) => shape.type === 'table') || false,
        hasImage: slide.shapes?.some((shape: BackendShape) => 
          shape.type === 'image' || shape.type === 'picture') || false
      })) || []
    } : {})
  };
}
