// Table parser for PowerPoint
import type { TableData } from '../../../types/power_point/powerpointFormat.types';

export function parseTableXml(tableElement: any): TableData {
  const rows: string[][] = [];
  const tableRows = tableElement['a:tr'] || [];

  for (const tr of tableRows) {
    const rowCells: string[] = [];
    const tableCells = tr['a:tc'] || [];
    for (const tc of tableCells) {
      let cellText = '';
      const paragraphs = tc['a:txBody']?.[0]?.['a:p'] || [];
      for (const p of paragraphs) {
        const runs = p['a:r'] || [];
        for (const r of runs) {
          cellText += r['a:t']?.[0] || '';
        }
      }
      rowCells.push(cellText);
    }
    rows.push(rowCells);
  }
  return { rows };
}
