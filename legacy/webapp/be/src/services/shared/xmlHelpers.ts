
// import { parseStringPromise } from 'xml2js';
// import type { ParserOptions } from 'xml2js';

// const defaultXmlOptions: ParserOptions = {
//   explicitChildren: true,
//   preserveChildrenOrder: true,
//   explicitRoot: false, 
// };

// export async function parseXmlString(xmlString: string): Promise<any> {
//   return parseStringPromise(xmlString, defaultXmlOptions);
// }
import { parseStringPromise } from 'xml2js';

export async function parseXmlString(xml: string): Promise<any> {
  return parseStringPromise(xml, {
    explicitChildren: true,
    preserveChildrenOrder: true,
    explicitArray: true, // Đảm bảo mọi node đều là array
  });
}