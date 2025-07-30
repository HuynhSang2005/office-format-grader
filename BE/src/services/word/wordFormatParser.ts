import mammoth from 'mammoth';
import type { WordFormatData } from '../../types/wordFormat.types';


export async function parseWordWithFormat(filePath: string): Promise<WordFormatData> {
  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    return {
      html: result.value, // string HTML được convert từ file Word
      messages: result.messages, // Bất kỳ cảnh báo nào trong quá trình convert
    };
  } catch (error) {
    console.error(`Lỗi khi dùng mammoth để phân tích ${filePath}:`, error);
    throw new Error('Không thể phân tích định dạng file Word.');
  }
}