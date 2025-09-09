import type { Drawing, Paragraph, Table, TextRun } from "../wordFormat.types";


export function isParagraph(block: any): block is Paragraph {
    return 'runs' in block;
}

export function isTable(block: any): block is Table {
    return block.type === 'table';
}

export function isTextRun(run: TextRun | Drawing): run is TextRun {
    return (run as TextRun).type === "text";
}