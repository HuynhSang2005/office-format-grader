export async function analyzePowerPoint({ 
  file, 
  mode = 'full' 
}: { 
  file: File, 
  mode: 'full' | 'overview' 
}) {
  const url = `http://localhost:3000/api/powerpoint/analyze?mode=${mode}`;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Lỗi khi phân tích file PowerPoint.');
  }

  const data = await response.json();
  
  // Chuyển đổi dữ liệu từ backend sang định dạng mà frontend mong đợi
  const backendData = data.data;
  return {
    fileName: backendData.document.fileName,
    slideCount: backendData.document.slideCount,
    hasCharts: backendData.slides?.some(slide => slide.shapes?.some(shape => shape.type === 'chart')) || false,
    hasTables: backendData.slides?.some(slide => slide.shapes?.some(shape => shape.type === 'table')) || false,
    metadata: {
      title: backendData.document.properties?.title || '',
      author: backendData.document.properties?.creator || '',
      company: backendData.document.properties?.company || '',
      createdAt: backendData.document.properties?.created || '',
      modifiedAt: backendData.document.properties?.modified || ''
    },
    // Nếu mode là full, thêm thông tin slides
    ...(mode === 'full' ? {
      slides: backendData.slides?.map(slide => ({
        slideNumber: slide.number,
        title: slide.title || '',
        elementCount: (slide.shapes || []).length,
        hasChart: slide.shapes?.some(shape => shape.type === 'chart') || false,
        hasTable: slide.shapes?.some(shape => shape.type === 'table') || false,
        hasImage: slide.shapes?.some(shape => shape.type === 'image' || shape.type === 'picture') || false
      })) || []
    } : {})
  };
}
