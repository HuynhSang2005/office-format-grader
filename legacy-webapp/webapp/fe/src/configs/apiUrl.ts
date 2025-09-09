export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export function apiUrl(path = '') {
  // Nếu truyền vào URL tuyệt đối thì giữ nguyên (hữu ích cho trường hợp đặc biệt)
  if (/^https?:\/\//i.test(path)) return path;

  // Path rỗng -> trả về base luôn
  if (!path) return API_BASE_URL;

  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}