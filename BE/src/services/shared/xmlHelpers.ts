import { parseStringPromise } from 'xml2js';

export async function parseXmlString(xml: string): Promise<any> {
  return parseStringPromise(xml, {
    explicitChildren: true,
    preserveChildrenOrder: true,
    explicitArray: true, // Đảm bảo mọi node đều là array
  });
}
