// Chuyển đổi một chuỗi thành tên file an toàn, không dấu
export function sanitizeFilename(filename: string): string {
  // 1. Chuyển Unicode thành dạng NFD để tách dấu và chữ
  const withoutDiacritics = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // 2. Bỏ chữ 'đ'
  const withoutD = withoutDiacritics.replace(/đ/g, 'd').replace(/Đ/g, 'D');

  // 3. replace các ký tự không hợp lệ bằng dấu gạch ngang
  return withoutD.replace(/[^a-zA-Z0-9-._]/g, '-');
}