/** Kiểm tra đuôi file .pptx */
export function isPowerpoint(name: string): boolean {
  return name.toLowerCase().endsWith('.pptx');
}
