/** Logger đơn giản phục vụ debug nhanh. */
export const logger = {
  info: (...a: unknown[]) => console.log('[INFO]', ...a),
  warn: (...a: unknown[]) => console.warn('[WARN]', ...a),
  error: (...a: unknown[]) => console.error('[ERROR]', ...a),
};
