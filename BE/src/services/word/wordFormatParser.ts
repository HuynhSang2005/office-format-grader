import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import type { ParsedWordData, Paragraph, TextRun, Table, TableCell } from '../../types/word/wordFormat.types';


// function parseParagraph để phân tích một đoạn văn bản 
function parseParagraph(pNode: any): Paragraph {
  const paragraph: Paragraph = { runs: [] };
  const pPr = pNode['w:pPr']?.[0];
  if (pPr) {
    // Lấy thông tin căn lề
    const alignment = pPr['w:jc']?.[0]?.$?.val;
    if (alignment) {
      paragraph.alignment = alignment;
    }

    // Lấy thông tin thụt lề
    const indent = pPr['w:ind']?.[0]?.$;
    if (indent) {
      paragraph.indentation = {
        left: indent.left ? parseInt(indent.left) : undefined,
        right: indent.right ? parseInt(indent.right) : undefined,
        firstLine: indent.firstLine ? parseInt(indent.firstLine) : undefined,
        hanging: indent.hanging ? parseInt(indent.hanging) : undefined,
      };
    }

    // Lấy tên style (dùng cho Headings)
    const style = pPr['w:pStyle']?.[0]?.$?.val;
    if (style) {
      paragraph.styleName = style;
    }

    // Lấy thông tin danh sách (list)
    const numPr = pPr['w:numPr']?.[0];
    if (numPr) {
      const listId = numPr['w:numId']?.[0]?.$?.val;
      const level = numPr['w:ilvl']?.[0]?.$?.val;
      if (listId && level) {
        paragraph.listInfo = {
          listId: listId,
          level: parseInt(level),
        };
      }
    }
  }

  const runsXml = pNode['w:r'] || [];
  for (const r of runsXml) {
    const text = r['w:t']?.[0]?._ || r['w:t']?.[0] || '';
    if (!text) continue;

    const properties = r['w:rPr']?.[0] || {};
    const run: TextRun = { text };

    if (properties['w:b']) run.isBold = true;
    if (properties['w:i']) run.isItalic = true;
    if (properties['w:u']) run.underline = properties['w:u'][0].$.val;
    if (properties['w:color']) run.color = properties['w:color'][0].$.val;
    if (properties['w:sz']) run.size = parseInt(properties['w:sz'][0].$.val) / 2;
    if (properties['w:rFonts']) {
      run.font = properties['w:rFonts'][0].$.ascii || properties['w:rFonts'][0].$.hAnsi;
    }

    paragraph.runs.push(run);
  }
  return paragraph;
}

// renew function parseTable để phân tích một bảng
function parseTable(tblNode: any): Table {
  const table: Table = { type: 'table', rows: [] };
  const tableRowsXml = tblNode['w:tr'] || [];

  for (const tr of tableRowsXml) {
    const row: TableCell[] = [];
    const tableCellsXml = tr['w:tc'] || [];

    for (const tc of tableCellsXml) {
      const cell: TableCell = { content: [] };
      const paragraphsXml = tc['w:p'] || [];
      for (const p of paragraphsXml) {
        cell.content.push(parseParagraph(p));
      }
      row.push(cell);
    }
    table.rows.push(row);
  }
  return table;
}

// parseWordWithFormat để phân tích file Word với định dạng
export async function parseWordWithFormat(filePath: string): Promise<ParsedWordData> {
  try {
    const zip = new AdmZip(filePath);
    const docXmlEntry = zip.getEntry('word/document.xml');
    if (!docXmlEntry) throw new Error('File document.xml không tồn tại...');

    const xmlContent = docXmlEntry.getData().toString('utf-8');
    // dùng explicitChildren và preserveChildrenOrder để giữ đúng thứ tự các block
    const parsedXml = await parseStringPromise(xmlContent, { explicitChildren: true, preserveChildrenOrder: true });

    const bodyChildren = parsedXml['w:document']['w:body'][0].$$;
    const extractedContent: (Paragraph | Table)[] = [];

    for (const element of bodyChildren) {
      // Vòng lặp chính giờ sẽ kiểm tra loại của mỗi block
      if (element['#name'] === 'w:p') {
        extractedContent.push(parseParagraph(element));
      } else if (element['#name'] === 'w:tbl') {
        extractedContent.push(parseTable(element));
      }
    }

    return { content: extractedContent };
  } catch (error) {
    console.error(`Lỗi khi phân tích file Word tại ${filePath}:`, error);
    throw new Error('Không thể phân tích file Word.');
  }
}