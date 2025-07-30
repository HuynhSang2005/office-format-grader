import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import type {
  ParsedWordData,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  ImageRun,
  HeaderFooterContent,
} from "../../types/word/wordFormat.types";

function parseParagraph(
  pNode: any,
  relationships: Map<string, string>
): Paragraph {
  const paragraph: Paragraph = { runs: [] };
  const pPr = pNode["w:pPr"]?.[0];
  if (pPr) {
    // Lấy thông tin căn lề
    const alignment = pPr["w:jc"]?.[0]?.$?.val;
    if (alignment) {
      paragraph.alignment = alignment;
    }
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
    if (style) {
      paragraph.styleName = style;
    }
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
    // check là có phải là drawing không
    const drawing = r["w:drawing"]?.[0];

    if (drawing) {
      const extent = drawing["wp:inline"]?.[0]?.["wp:extent"]?.[0]?.$;
      const embedId =
        drawing["wp:inline"]?.[0]?.["a:graphic"]?.[0]?.["a:graphicData"]?.[0]?.[
          "pic:pic"
        ]?.[0]?.["pic:blipFill"]?.[0]?.["a:blip"]?.[0]?.$?.["r:embed"];

      if (embedId && extent) {
        const imageName = relationships.get(embedId) || "unknown";
        const imageRun: ImageRun = {
          type: "image",
          imageName: imageName,
          width: parseInt(extent.cx),
          height: parseInt(extent.cy),
        };
        paragraph.runs.push(imageRun);
      }
    } else {
      const text = r["w:t"]?.[0]?._ || r["w:t"]?.[0] || "";
      if (!text) continue;

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
      paragraph.runs.push(run);
    }
  }
  return paragraph;
}

function parseTable(tblNode: any, relationships: Map<string, string>): Table {
  const table: Table = { type: "table", rows: [] };
  const tableRowsXml = tblNode["w:tr"] || [];

  for (const tr of tableRowsXml) {
    const row: TableCell[] = [];
    const tableCellsXml = tr["w:tc"] || [];

    for (const tc of tableCellsXml) {
      const cell: TableCell = { content: [] };
      const paragraphsXml = tc["w:p"] || [];
      for (const p of paragraphsXml) {
        cell.content.push(parseParagraph(p, relationships));
      }
      row.push(cell);
    }
    table.rows.push(row);
  }
  return table;
}

function parseBlockContent(
  bodyNode: any,
  relationships: Map<string, string>
): (Paragraph | Table)[] {
  const content: (Paragraph | Table)[] = [];
  const children = bodyNode?.$$ || []; // $$ để lấy tất cả các node con

  for (const element of children) {
    if (element["#name"] === "w:p") {
      content.push(parseParagraph(element, relationships));
    } else if (element["#name"] === "w:tbl") {
      content.push(parseTable(element, relationships));
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
      const relsXml = await parseStringPromise(
        relsEntry.getData().toString("utf-8")
      );
      for (const rel of relsXml.Relationships.Relationship) {
        const id = rel.$.Id;
        const target = rel.$.Target;
        const type = rel.$.Type;
        relationships.set(id, target);

        // Tìm các tham chiếu đến header và footer
        if (type.endsWith("/header")) headerRels.push({ id, path: target });
        if (type.endsWith("/footer")) footerRels.push({ id, path: target });
      }
    }

    // Phân tích nội dung chính của tài liệu
    const docXmlEntry = zip.getEntry("word/document.xml");
    if (!docXmlEntry) throw new Error("File document.xml không tồn tại...");
    const docXml = await parseStringPromise(
      docXmlEntry.getData().toString("utf-8"),
      { explicitChildren: true, preserveChildrenOrder: true }
    );
    const mainContent = parseBlockContent(
      docXml["w:document"][0]["w:body"][0],
      relationships
    );

    // Phân tích nội dung các file header
    const headers: HeaderFooterContent[] = [];
    for (const rel of headerRels) {
      const headerXmlEntry = zip.getEntry(`word/${rel.path}`);
      if (headerXmlEntry) {
        const headerXml = await parseStringPromise(
          headerXmlEntry.getData().toString("utf-8"),
          { explicitChildren: true, preserveChildrenOrder: true }
        );
        // Tái sử dụng logic parse block
        headers.push({
          type: "default", // Cần logic phức tạp hơn để xác định type 'first'/'even'
          content: parseBlockContent(headerXml["w:hdr"][0], relationships),
        });
      }
    }

    // Phân tích nội dung các file footer
    const footers: HeaderFooterContent[] = [];
    for (const rel of footerRels) {
      const footerXmlEntry = zip.getEntry(`word/${rel.path}`);
      if (footerXmlEntry) {
        const footerXml = await parseStringPromise(
          footerXmlEntry.getData().toString("utf-8"),
          { explicitChildren: true, preserveChildrenOrder: true }
        );
        footers.push({
          type: "default",
          content: parseBlockContent(footerXml["w:ftr"][0], relationships),
        });
      }
    }

    return {
      content: mainContent,
      headers: headers.length > 0 ? headers : undefined,
      footers: footers.length > 0 ? footers : undefined,
    };
  } catch (error) {
    console.error(`Lỗi khi phân tích file Word tại ${filePath}:`, error);
    throw new Error("Không thể phân tích file Word.");
  }
}
