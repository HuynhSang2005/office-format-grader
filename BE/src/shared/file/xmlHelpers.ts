import { parseStringPromise } from 'xml2js';

/** Parse XML string thành object. */
export async function parseXmlString(xml: string): Promise<any> {
  return parseStringPromise(xml, {
    explicitChildren: true,
    preserveChildrenOrder: true,
    explicitArray: true,
  });
}
