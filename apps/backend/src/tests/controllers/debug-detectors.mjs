import { detectors } from '../../rule-engine/detectors.js';

console.log('Available detectors:');
console.log(Object.keys(detectors));

console.log('\nChecking specific detectors:');
console.log('Has common.exportPdf:', 'common.exportPdf' in detectors);
console.log('Has pptx.exportPdf:', 'pptx.exportPdf' in detectors);

console.log('\nTesting detectors:');
const testFeatures = { hasPdfExport: true, pdfPageCount: 5 };
if (detectors['common.exportPdf']) {
  console.log('common.exportPdf result:', detectors['common.exportPdf'](testFeatures));
}
if (detectors['pptx.exportPdf']) {
  console.log('pptx.exportPdf result:', detectors['pptx.exportPdf'](testFeatures));
}