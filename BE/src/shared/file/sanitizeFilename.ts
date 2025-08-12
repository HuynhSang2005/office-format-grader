// Chuyển đổi chuỗi thành tên file an toàn, không dấu
export function sanitizeFilename(filename: string): string {
  const withoutDiacritics = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const withoutD = withoutDiacritics.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return withoutD.replace(/[^a-zA-Z0-9-._]/g, '-');
}
