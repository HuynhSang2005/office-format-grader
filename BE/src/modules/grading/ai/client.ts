import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../../core/env.ts';
import { logger } from '../../../core/logger.ts';

let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

/** Lấy instance Gemini, lazy-init để tránh crash khi thiếu key. */
export function getAiModel() {
  if (!env.GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY missing');
  if (!model) {
    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    model = genAI.getGenerativeModel({ model: env.MODEL || 'models/gemini-2.5-flash-lite' });
    logger.info('AI model initialized');
  }
  return model;
}
