/**
 * @file analyze.controller.ts
 * @description Controller xử lý phân tích file PPTX/DOCX để debug
 * @author Nguyễn Huỳnh Sang
 */

import { Context } from 'hono';
import { logger } from '@core/logger';
import { getStoredFilePath } from '@services/storage.service';
import { extractFromDOCX } from '@/extractors/docx';
import { extractFromPPTX } from '@/extractors/pptx';

/**
 * Controller xử lý route debug phân tích file
 * @param c Context của Hono
 * @returns JSON chứa features đã extract từ file
 */
export async function analyzeFileController(c: Context) {
  const fileId = c.req.param('fileId');
  const fileType = c.req.query('type')?.toUpperCase(); // 'PPTX' hoặc 'DOCX'

  // Validate tham số
  if (!fileId) {
    logger.warn('[DEBUG] Thiếu fileId trong request');
    return c.json({ error: 'Thiếu fileId' }, 400);
  }

  if (!fileType || (fileType !== 'PPTX' && fileType !== 'DOCX')) {
    logger.warn(`[DEBUG] Loại file không hợp lệ: ${fileType}`);
    return c.json({ error: 'Thiếu hoặc loại file không hợp lệ. Sử dụng ?type=PPTX hoặc ?type=DOCX' }, 400);
  }

  try {
    logger.info(`[DEBUG] Bắt đầu phân tích file ${fileId} (${fileType})`);
    
    // Lấy đường dẫn file từ storage
    const filePath = await getStoredFilePath(fileId);
    
    // Đọc file buffer
    const fs = await import('fs/promises');
    const fileBuffer = await fs.readFile(filePath);
    
    // Extract features dựa trên loại file
    let features;
    if (fileType === 'PPTX') {
      features = await extractFromPPTX(fileBuffer, `${fileId}.pptx`);
    } else {
      features = await extractFromDOCX(fileBuffer, `${fileId}.docx`);
    }

    logger.info(`[DEBUG] Phân tích file ${fileId} thành công`);
    return c.json(features);
    
  } catch (error) {
    logger.error(`[ERROR] Không thể phân tích file ${fileId}`, error);
    return c.json({ 
      error: 'Không thể phân tích file', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
}