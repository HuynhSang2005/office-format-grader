/** Kiểm tra đuôi file .docx */
export function isWord(name: string): boolean {
  return name.toLowerCase().endsWith('.docx');
}
