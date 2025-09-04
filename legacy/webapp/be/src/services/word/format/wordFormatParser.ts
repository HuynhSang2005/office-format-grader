// Helper: find XML key flexibly (with or without prefix)
function findXmlKey(obj: any, suffix: string): string | undefined {
  return Object.keys(obj).find(
    key => key.endsWith(suffix) || key.toLowerCase() === suffix.replace(':', '').toLowerCase()
  );
}
import AdmZip from "adm-zip";
import { parseXmlString } from "../../shared/xmlHelpers";
import type {
  ParsedWordData,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  Drawing,
  HeaderFooterContent,
  DocumentMetadata,
  TocItem,
} from "../../../types/word/wordFormat.types";
import { parseChart } from "../../power_point/parsers/chartParser";


function parseRun(r: any, relationships: Map<string, string>, hyperlink?: string): TextRun | Drawing | null {
  // Xử lý image run
  const drawing = r["w:drawing"]?.[0];
  if (drawing) {
    const extent = drawing["wp:inline"]?.[0]?.["wp:extent"]?.[0]?.$;
    const embedId =
      drawing["wp:inline"]?.[0]?.["a:graphic"]?.[0]?.["a:graphicData"]?.[0]?.[
        "pic:pic"
      ]?.[0]?.["pic:blipFill"]?.[0]?.["a:blip"]?.[0]?.$?.["r:embed"];

    if (embedId && extent) {
      const imageName = relationships.get(embedId) || "unknown";
      return {
        type: "drawing",
        drawingType: "image",
        imageName: imageName,
        width: parseInt(extent.cx),
        height: parseInt(extent.cy),
      };
    }
    return null;
  }

  // Xử lý text run
  const text = r["w:t"]?.[0]?._ || r["w:t"]?.[0] || "";
  if (!text) return null;

  const properties = r["w:rPr"]?.[0] || {};
  const run: TextRun = { type: "text", text };

  if (properties["w:b"]) run.isBold = true;
  if (properties["w:i"]) run.isItalic = true;
  if (properties["w:u"]) run.underline = properties["w:u"][0].$.val;
  if (properties["w:color"]) run.color = properties["w:color"][0].$.val;
  if (properties["w:sz"])
    run.size = parseInt(properties["w:sz"][0].$.val) / 2;
  if (properties["w:rFonts"]) {
    run.font =
      properties["w:rFonts"][0].$.ascii ||
      properties["w:rFonts"][0].$.hAnsi;
  }
  if (hyperlink) run.hyperlink = hyperlink;

  return run;
}

async function parseParagraph(
  pNode: any,
  relationships: Map<string, string>,
  zip?: AdmZip // Truyền zip vào để đọc chart
): Promise<Paragraph> {
  const paragraph: Paragraph = { runs: [] };
  const pPr = pNode["w:pPr"]?.[0];
  if (pPr) {
    // Lấy thông tin căn lề
    const alignment = pPr["w:jc"]?.[0]?.$?.val;
    if (alignment) paragraph.alignment = alignment;
    // Lấy thông tin thụt lề
    const indent = pPr["w:ind"]?.[0]?.$;
    if (indent) {
      paragraph.indentation = {
        left: indent.left ? parseInt(indent.left) : undefined,
        right: indent.right ? parseInt(indent.right) : undefined,
        firstLine: indent.firstLine ? parseInt(indent.firstLine) : undefined,
        hanging: indent.hanging ? parseInt(indent.hanging) : undefined,
      };
    }
    // Lấy tên style (dùng cho Headings)
    const style = pPr["w:pStyle"]?.[0]?.$?.val;
    if (style) paragraph.styleName = style;
    // Lấy thông tin danh sách (list)
    const numPr = pPr["w:numPr"]?.[0];
    if (numPr) {
      const listId = numPr["w:numId"]?.[0]?.$?.val;
      const level = numPr["w:ilvl"]?.[0]?.$?.val;
      if (listId && level) {
        paragraph.listInfo = {
          listId: listId,
          level: parseInt(level),
        };
      }
    }
  }

  const runsXml = pNode["w:r"] || [];
  for (const r of runsXml) {
    // Nếu là chart (drawing dạng chart) thì xử lý đặc biệt
    const drawing = r["w:drawing"]?.[0];
    const inline = drawing?.["wp:inline"]?.[0];
    const graphicData = inline?.["a:graphic"]?.[0]?.["a:graphicData"]?.[0];
    const uri = graphicData?.$?.uri;
    if (drawing && inline && uri && uri.includes("/drawingml/2006/chart") && zip) {
      const extent = inline["wp:extent"]?.[0]?.$;
      const chartRefId = graphicData["c:chart"]?.[0]?.$?.["r:id"];
      if (chartRefId) {
        const chartPath = relationships.get(chartRefId);
        if (chartPath && extent) {
          const chartData = await parseChart(zip, `word/${chartPath}`);
          const drawingRun: Drawing = {
            type: "drawing",
            drawingType: "chart",
            chartData: chartData,
            width: parseInt(extent.cx),
            height: parseInt(extent.cy),
          };
          paragraph.runs.push(drawingRun);
          continue;
        }
      }
    }
    // Còn lại: dùng parseRun cho mọi trường hợp khác (text, image, ...)
    const run = parseRun(r, relationships);
    if (run) paragraph.runs.push(run);
  }

  return paragraph;
}

async function parseTable(tblNode: any, relationships: Map<string, string>, zip?: AdmZip): Promise<Table> {
  const table: Table = { type: "table", rows: [] };
  const tableRowsXml = tblNode["w:tr"] || [];

  for (const tr of tableRowsXml) {
    const row: TableCell[] = [];
    const tableCellsXml = tr["w:tc"] || [];

    for (const tc of tableCellsXml) {
      const cell: TableCell = { content: [] };
      const paragraphsXml = tc["w:p"] || [];
      for (const p of paragraphsXml) {
        cell.content.push(await parseParagraph(p, relationships, zip));
      }
      row.push(cell);
    }
    table.rows.push(row);
  }
  return table;
}

// Lưu ý: Hàm này cần là async vì parseParagraph và parseTable đều là async

async function parseBlockContent(
  bodyNode: any,
  relationships: Map<string, string>,
  zip?: AdmZip
): Promise<(Paragraph | Table)[]> {
  const content: (Paragraph | Table)[] = [];
  const children = bodyNode?.$$ || [];

  for (let i = 0; i < children.length; i++) {
    const element = children[i];

    if (element['#name'] === 'w:p') {
      const paragraph = await parseParagraph(element, relationships, zip);

      // KIỂM TRA XEM ĐOẠN VĂN NÀY CÓ CHỨA ẢNH KHÔNG
      const imageRun = paragraph.runs.find(
        r => r.type === 'drawing' && (r as Drawing).drawingType === 'image'
      ) as Drawing | undefined;

      if (imageRun) {
        // Nếu có, nhìn sang element tiếp theo
        const nextElement = children[i + 1];
        if (nextElement && nextElement['#name'] === 'w:p') {
          const nextParagraph = await parseParagraph(nextElement, relationships, zip);
          // Nếu đoạn văn tiếp theo có style là 'Caption'
          if (nextParagraph.styleName === 'Caption') {
            // Gán text của nó làm chú thích cho ảnh, chỉ lấy các TextRun
            imageRun.caption = nextParagraph.runs
              .filter(r => r.type === 'text')
              .map(r => (r as TextRun).text)
              .join('');
            i++;
          }
        }
      }
      content.push(paragraph);

    } else if (element['#name'] === 'w:tbl') {
      content.push(await parseTable(element, relationships, zip));
    }
  }
  return content;
}

export async function parseWordWithFormat(
  filePath: string
): Promise<ParsedWordData> {
  try {
    const zip = new AdmZip(filePath);

    // Đọc relationships để dùng chung
    const relsEntry = zip.getEntry("word/_rels/document.xml.rels");
    const relationships = new Map<string, string>();
    const headerRels: { id: string; path: string }[] = [];
    const footerRels: { id: string; path: string }[] = [];

    if (relsEntry) {
      const relsXml = await parseXmlString(
        relsEntry.getData().toString("utf-8")
      );
      const rels = relsXml.Relationships?.Relationship;
      if (rels && Array.isArray(rels)) {
        for (const rel of rels) {
          const id = rel.$.Id;
          const target = rel.$.Target;
          const type = rel.$.Type;
          relationships.set(id, target);
          // Tìm các tham chiếu đến header và footer
          if (type.endsWith("/header")) headerRels.push({ id, path: target });
          if (type.endsWith("/footer")) footerRels.push({ id, path: target });
        }
      }
    }

    // lấy metadata từ app.xml và core.xml
    const metadata: DocumentMetadata = {};

    // 1. Đọc file app.xml (số trang, số từ...)
    const appXmlEntry = zip.getEntry("docProps/app.xml");
    if (appXmlEntry) {
      const appXml = await parseXmlString(appXmlEntry.getData().toString("utf-8"));
      const props = appXml.Properties;
      if (props?.Pages?.[0]) metadata.pageCount = parseInt(props.Pages[0]);
      if (props?.Words?.[0]) metadata.wordCount = parseInt(props.Words[0]);
      if (props?.Characters?.[0]) metadata.charCount = parseInt(props.Characters[0]);
    }

    // 2. Đọc file core.xml (tác giả, ngày tạo...)
    const coreXmlEntry = zip.getEntry("docProps/core.xml");
    if (coreXmlEntry) {
      const coreXml = await parseXmlString(coreXmlEntry.getData().toString("utf-8"));
      const props = coreXml['cp:coreProperties'];
      if (props?.['dc:creator']?.[0]) metadata.author = props['dc:creator'][0];
      if (props?.['dcterms:created']?.[0]?._) metadata.createdAt = props['dcterms:created'][0]._;
      if (props?.['dcterms:modified']?.[0]?._) metadata.modifiedAt = props['dcterms:modified'][0]._;
    }

    // Phân tích nội dung chính của tài liệu
    const docXmlEntry = zip.getEntry("word/document.xml");
    if (!docXmlEntry) throw new Error("File document.xml không tồn tại...");
    const docXml = await parseXmlString(
      docXmlEntry.getData().toString("utf-8")
    );

    // Tìm key của document (có thể là 'w:document', 'document', hoặc có prefix khác)
    const docKey = findXmlKey(docXml, ':document') || findXmlKey(docXml, 'document');
    if (!docKey) throw new Error("Không tìm thấy node document chính.");
    const docArr = docXml[docKey];
    const docNode = Array.isArray(docArr) ? docArr[0] : docArr;

    if (!docNode || typeof docNode !== 'object') {
      throw new Error("Node document chính không hợp lệ hoặc rỗng.");
    }

    // Tìm key của body (có thể là 'w:body', 'body', hoặc có prefix khác)
    const bodyKey = findXmlKey(docNode, ':body') || findXmlKey(docNode, 'body');
    if (!bodyKey) {
      // Nếu không có body thì coi như content rỗng
      return { content: [], headers: undefined, footers: undefined, metadata: Object.keys(metadata).length > 0 ? metadata : undefined };
    }
    const bodyNode = docNode[bodyKey]?.[0];

    const mainContent = await parseBlockContent(bodyNode, relationships, zip);

    // Phân tích nội dung các file header
    const headers: HeaderFooterContent[] = [];
    for (const rel of headerRels) {
      const headerXmlEntry = zip.getEntry(`word/${rel.path}`);
      if (headerXmlEntry) {
        const headerXml = await parseXmlString(
          headerXmlEntry.getData().toString("utf-8")
        );
        // Tìm key header linh hoạt
        const headerKey = findXmlKey(headerXml, ':hdr') || findXmlKey(headerXml, 'hdr') || findXmlKey(headerXml, 'header');
        if (headerKey) {
          headers.push({
            type: "default",
            content: await parseBlockContent(headerXml[headerKey][0], relationships, zip),
          });
        }
      }
    }

    // Phân tích nội dung các file footer
    const footers: HeaderFooterContent[] = [];
    for (const rel of footerRels) {
      const footerXmlEntry = zip.getEntry(`word/${rel.path}`);
      if (footerXmlEntry) {
        const footerXml = await parseXmlString(
          footerXmlEntry.getData().toString("utf-8")
        );
        // Tìm key footer linh hoạt
        const footerKey = findXmlKey(footerXml, ':ftr') || findXmlKey(footerXml, 'ftr') || findXmlKey(footerXml, 'footer');
        if (footerKey) {
          footers.push({
            type: "default",
            content: await parseBlockContent(footerXml[footerKey][0], relationships, zip),
          });
        }
      }
    }

    // Phân tích mục lục (Table of Contents)
    const toc: TocItem[] = [];
    for (const block of mainContent) {
      // Mục lục chỉ nằm trong các đoạn văn
      if ('runs' in block && typeof block.styleName === 'string' && block.styleName.startsWith('TOC')) {
        toc.push({
          level: parseInt(block.styleName.replace('TOC', '')),
          text: block.runs
            .filter(r => r.type === 'text')
            .map(r => (r as TextRun).text)
            .join(''),
        });
      }
    }

    return {
      content: mainContent,
      headers: headers.length > 0 ? headers : undefined,
      footers: footers.length > 0 ? footers : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      toc: toc.length > 0 ? toc : undefined, 
    };
  } catch (error) {
    console.error(`Lỗi khi phân tích file Word tại ${filePath}:`, error);
    throw new Error("Không thể phân tích file Word.");
  }
}