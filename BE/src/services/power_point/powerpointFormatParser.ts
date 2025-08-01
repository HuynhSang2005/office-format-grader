import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import path from 'node:path';
import type {
  ParsedPowerPointFormatData,
  FormattedSlide,
  Shape,
  ShapeTransform,
  FormattedTextRun,
  TableData,
  SlideDisplayInfo,
  TransitionEffect,
  AnimationNode,
  AnimationEffect,
  ThemeData,
  ColorScheme
} from '../../types/power_point/powerpointFormat.types';
import { parseChart } from './chartParser';
import type { ChartData } from '../../types/power_point/chart.types';
import { parseMasterOrLayout } from './styleParser';
import type { SlideLayoutData } from '../../types/power_point/powerpointStyles';
import { resolveTextStyle } from './styleResolver';
import { parseTableXml } from './tableParser';

// để phân tích một bảng từ XML


// để trích xuất các hình khối và định dạng của chúng từ một slide.
function extractShapesFromSlide(
  slideXmlObject: any,
  relationships: Map<string, string>,
  layoutData: SlideLayoutData,
  masterData: SlideLayoutData,
  themeData: ThemeData,
  slidePath: string,
  zip: AdmZip
): Shape[] {
  const shapes: Shape[] = [];
  const spTree = slideXmlObject?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0];

  if (!spTree) return [];

  // Gộp cả shape thường và graphicFrame vào một mảng để xử lý chung
  const shapeElements = spTree['p:sp'] || [];
  for (const shapeElement of shapeElements) {
    // Lấy id, name, transform
    const nvPr = shapeElement['p:nvSpPr']?.[0]?.['p:cNvPr']?.[0];
    if (!nvPr) continue;
    const id = nvPr.$.id;
    const name = nvPr.$.name;

    const xfrm = shapeElement['p:spPr']?.[0]?.['a:xfrm']?.[0];
    if (!xfrm) continue;
    const transform: ShapeTransform = {
      x: parseInt(xfrm['a:off'][0].$.x, 10),
      y: parseInt(xfrm['a:off'][0].$.y, 10),
      width: parseInt(xfrm['a:ext'][0].$.cx, 10),
      height: parseInt(xfrm['a:ext'][0].$.cy, 10),
    };

    // Lấy các đoạn text và định dạng của chúng
    const textRuns: FormattedTextRun[] = [];
    const paragraphs = shapeElement['p:txBody']?.[0]?.['a:p'] || [];

    for (const p of paragraphs) {
      const runs = p['a:r'] || [];
      for (const r of runs) {
        const text = r['a:t']?.[0] || '';

        // ---- THAY THẾ LOGIC CŨ BẰNG LỜI GỌI RESOLVER ----
        const resolvedStyle = resolveTextStyle(r, p, shapeElement, layoutData, masterData, themeData);

        let hyperlink: string | undefined = undefined;
        const hlinkClick = r['a:rPr']?.[0]?.['a:hlinkClick']?.[0];
        if (hlinkClick && hlinkClick.$ && hlinkClick.$['r:id'] && relationships) {
          hyperlink = relationships.get(hlinkClick.$['r:id']);
        }

        textRuns.push({
          text,
          isBold: !!resolvedStyle.isBold,
          isItalic: !!resolvedStyle.isItalic,
          font: resolvedStyle.font,
          size: resolvedStyle.size,
          hyperlink,
        });
      }
    }

    shapes.push({ id, name, transform, textRuns });
  }

  // Xử lý các graphicFrame (có thể là bảng hoặc biểu đồ)
  const graphicFrames = spTree['p:graphicFrame'] || [];
  for (const frame of graphicFrames) {
    const nvPr = frame['p:nvGraphicFramePr']?.[0]?.['p:cNvPr']?.[0];
    if (!nvPr) continue;
    const id = nvPr.$.id;
    const name = nvPr.$.name;
    const xfrm = frame['p:xfrm']?.[0];
    if (!xfrm) continue;
    const transform: ShapeTransform = {
      x: parseInt(xfrm['a:off'][0].$.x, 10),
      y: parseInt(xfrm['a:off'][0].$.y, 10),
      width: parseInt(xfrm['a:ext'][0].$.cx, 10),
      height: parseInt(xfrm['a:ext'][0].$.cy, 10),
    };

    // Kiểm tra nếu là bảng thì parse bảng
    const tableElement = frame['a:graphic']?.[0]?.['a:graphicData']?.[0]?.['a:tbl']?.[0];
    let tableData: TableData | undefined = undefined;
    if (tableElement) {
      tableData = parseTableXml(tableElement);
    }

    // Kiểm tra nếu là biểu đồ thì parse biểu đồ
    let chartData: ChartData | undefined = undefined;
    const chartRef = frame['a:graphic']?.[0]?.['a:graphicData']?.[0]?.['a:chart']?.[0];
    if (chartRef && slidePath && zip) {
      const chartId = chartRef.$['r:id'];
      const slideRelsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
      const slideRelsEntry = zip.getEntry(slideRelsPath);
      if (slideRelsEntry) {
        const slideRelsXml = parseStringPromise(slideRelsEntry.getData().toString('utf-8'));
        slideRelsXml.then((relsXml) => {
          const chartRel = relsXml.Relationships.Relationship.find((r: any) => r.$.Id === chartId);
          if (chartRel) {
            const chartPath = `ppt/charts/${path.basename(chartRel.$.Target)}`;
            parseChart(zip, chartPath).then((data) => {
              chartData = data;
            });
          }
        });
      }
    }


    shapes.push({ id, name, transform, textRuns: [], tableData, chartData });
  }

  return shapes;
}

/**
 * HÀM ĐỆ QUY ĐỂ PARSE CÂY ANIMATION
 * @param nodeElement - Một node trong cây XML (ví dụ: một thẻ <p:par>, <p:seq>...)
 */
function parseAnimationNode(nodeElement: any): AnimationNode {
    const nodeName = Object.keys(nodeElement).find(k => k.startsWith('p:')) || '';
    const nodeAttributes = nodeElement[nodeName][0].$;

    const basicNode: Partial<AnimationNode> = {
        trigger: nodeAttributes?.presetClass || 'onDemand', // onClick
        delay: nodeAttributes?.delay ? parseInt(nodeAttributes.delay) : undefined,
    };

    // Nếu là node tuần tự hoặc song song, tiếp tục gọi đệ quy
    if (nodeName === 'p:par' || nodeName === 'p:seq') {
        const childNodes = nodeElement[nodeName][0]['p:tnLst']?.[0] || {};
        return {
            ...basicNode,
            type: nodeName === 'p:par' ? 'parallel' : 'sequence',
            children: Object.keys(childNodes).map(key => parseAnimationNode({ [key]: childNodes[key] }))
        } as AnimationNode;
    } else {
        // Nếu là node hiệu ứng cuối cùng (leaf node)
        const targetShapeId = nodeElement[nodeName][0]['c:cTn']?.[0]?.['p:tgtEl']?.[0]?.['p:spTgt']?.[0]?.$.spid;
        // Loại hiệu ứng cần được phân tích sâu hơn từ các thẻ con
        const effectType = 'unknown'; // Cần logic phức tạp để xác định

        return {
            ...basicNode,
            type: 'effect',
            effect: {
                shapeId: targetShapeId,
                type: effectType,
            } as AnimationEffect,
        } as AnimationNode;
    }
}

/**
 * Phân tích file .pptx để trích xuất cấu trúc và định dạng chi tiết.
 */
export async function parsePowerPointWithFormat(filePath: string): Promise<ParsedPowerPointFormatData> {
  try {
    const zip = new AdmZip(filePath);

    // Lấy danh sách các slide master và layout
    const masterPaths: string[] = [];
    const layoutPaths: string[] = [];

    // Duyệt qua presentation.xml để lấy danh sách master và layout
    const presentationEntry = zip.getEntry('ppt/presentation.xml');
    if (presentationEntry) {
      const presentationXml = await parseStringPromise(presentationEntry.getData().toString('utf-8'));
      // Lấy masterIdList
      const masterIdList = presentationXml['p:presentation']?.['p:sldMasterIdLst']?.[0]?.['p:sldMasterId'] || [];
      for (const master of masterIdList) {
        const rId = master.$['r:id'];
        // Tìm đường dẫn master từ presentation.xml.rels
        const presRelsEntry = zip.getEntry('ppt/_rels/presentation.xml.rels');
        if (presRelsEntry) {
          const presRelsXml = await parseStringPromise(presRelsEntry.getData().toString('utf-8'));
          const rel = presRelsXml.Relationships.Relationship.find((r: any) => r.$.Id === rId);
          if (rel) {
            const masterPath = `ppt/${rel.$.Target.replace(/^\//, '')}`;
            masterPaths.push(masterPath);

            // Lấy layout từ master .rels
            const masterRelsPath = `ppt/slideMasters/_rels/${path.basename(masterPath)}.rels`;
            const masterRelsEntry = zip.getEntry(masterRelsPath);
            if (masterRelsEntry) {
              const masterRelsXml = await parseStringPromise(masterRelsEntry.getData().toString('utf-8'));
              const layoutRels = masterRelsXml.Relationships.Relationship.filter((r: any) =>
                r.$.Type.endsWith('/slideLayout')
              );
              for (const layoutRel of layoutRels) {
                const layoutPath = `ppt/${layoutRel.$.Target.replace(/^\//, '')}`;
                if (!layoutPaths.includes(layoutPath)) layoutPaths.push(layoutPath);
              }
            }
          }
        }
      }
    }

    const masterData = new Map<string, SlideLayoutData>();
    for (const mPath of masterPaths) {
      masterData.set(mPath, await parseMasterOrLayout(zip, mPath));
    }

    const layoutData = new Map<string, SlideLayoutData>();
    for (const lPath of layoutPaths) {
      layoutData.set(lPath, await parseMasterOrLayout(zip, lPath));
    }

    // Lấy danh sách file media
    const mediaFiles = zip.getEntries()
      .filter(entry => entry.entryName.startsWith('ppt/media/'))
      .map(entry => entry.name);

    const relsEntry = zip.getEntry('ppt/_rels/presentation.xml.rels');
    if (!relsEntry) throw new Error('Không tìm thấy file presentation relationships.');

    const relsXml = await parseStringPromise(relsEntry.getData().toString('utf-8'));
    const slideEntries = relsXml.Relationships.Relationship.filter(
      (r: any) => r.$.Type.endsWith('/slide')
    );

    let themeData: ThemeData | undefined = undefined;
    const presentationRelsEntry = zip.getEntry('ppt/_rels/presentation.xml.rels');
    if (presentationRelsEntry) {
      const presentationRelsXml = await parseStringPromise(presentationRelsEntry.getData().toString('utf-8'));
      const themeRel = presentationRelsXml.Relationships.Relationship.find(
        (r: any) => r.$.Type.endsWith('/theme')
      );

      if (themeRel) {
        const themePath = `ppt/${themeRel.$.Target}`;
        const themeXmlRaw = zip.getEntry(themePath)?.getData().toString('utf-8');
        if (themeXmlRaw) {
          const themeXml = await parseStringPromise(themeXmlRaw);
          const themeElements = themeXml['a:theme']['a:themeElements'][0];
          const themeName = themeXml['a:theme'].$.name;

          // Trích xuất bảng màu (Color Scheme)
          const colorSchemeNode = themeElements['a:clrScheme'][0];
          const colors: ColorScheme = {};
          for (const colorKey in colorSchemeNode) {
            if (colorKey.startsWith('a:')) {
              const colorName = colorKey.substring(2);
              const srgbClr = colorSchemeNode[colorKey][0]['a:srgbClr']?.[0].$.val;
              if (srgbClr) colors[colorName] = srgbClr;
            }
          }

          // Trích xuất bộ font (Font Scheme)
          const fontSchemeNode = themeElements['a:fontScheme'][0];
          const majorFont = fontSchemeNode['a:majorFont'][0]['a:latin'][0].$.typeface;
          const minorFont = fontSchemeNode['a:minorFont'][0]['a:latin'][0].$.typeface;

          themeData = {
            name: themeName,
            colorScheme: colors,
            fontScheme: { majorFont, minorFont },
          };
        }
      }
    }

    const formattedSlides: FormattedSlide[] = [];
    let slideCounter = 1;

    for (const slideEntry of slideEntries) {
      const slidePath = `ppt/${slideEntry.$.Target}`;
      const slideXmlRaw = zip.getEntry(slidePath)?.getData().toString('utf-8');
      if (!slideXmlRaw) continue;

      const slideXmlObject = await parseStringPromise(slideXmlRaw);

      // 1. Đọc file _rels của slide để tạo bản đồ tra cứu hyperlink
      const slideRelsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
      const slideRelationships = new Map<string, string>();
      const slideRelsEntry = zip.getEntry(slideRelsPath);
      let layoutPathForSlide: string | undefined = undefined;
      let masterPathForSlide: string | undefined = undefined;
      if (slideRelsEntry) {
        const slideRelsXml = await parseStringPromise(slideRelsEntry.getData().toString('utf-8'));
        if (slideRelsXml.Relationships.Relationship) {
          for (const rel of slideRelsXml.Relationships.Relationship) {
            if (rel.$.TargetMode === 'External') {
              slideRelationships.set(rel.$.Id, rel.$.Target);
            }
            // Tìm layout cho slide
            if (rel.$.Type && rel.$.Type.endsWith('/slideLayout')) {
              layoutPathForSlide = `ppt/${rel.$.Target.replace(/^\//, '')}`;
            }
            // Tìm master cho slide (nếu có)
            if (rel.$.Type && rel.$.Type.endsWith('/slideMaster')) {
              masterPathForSlide = `ppt/${rel.$.Target.replace(/^\//, '')}`;
            }
          }
        }
      }

      // fallback: nếu không tìm thấy masterPathForSlide, lấy master đầu tiên
      if (!masterPathForSlide && masterPaths.length > 0) {
        masterPathForSlide = masterPaths[0];
      }
      // fallback: nếu không tìm thấy layoutPathForSlide, lấy layout đầu tiên
      if (!layoutPathForSlide && layoutPaths.length > 0) {
        layoutPathForSlide = layoutPaths[0];
      }

      // Lấy đúng SlideLayoutData, nếu không có thì bỏ qua slide này
      const layoutDataForSlide = layoutPathForSlide ? layoutData.get(layoutPathForSlide) : undefined;
      const masterDataForSlide = masterPathForSlide ? masterData.get(masterPathForSlide) : undefined;
      if (!layoutDataForSlide || !masterDataForSlide) continue;

      const shapes = extractShapesFromSlide(
        slideXmlObject,
        slideRelationships,
        layoutDataForSlide,
        masterDataForSlide,
        themeData ?? { name: '', colorScheme: {}, fontScheme: { majorFont: '', minorFont: '' } }, // đảm bảo không undefined
        slidePath,
        zip
      );

      // Lấy tên layout của slide
      let layoutName = 'Unknown';
      const layoutId = slideXmlObject['p:sld']?.['p:sldLayout']?.[0]?.$?.['r:id'];
      if (layoutId) {
        const slideRelsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
        const slideRelsEntry = zip.getEntry(slideRelsPath);
        if (slideRelsEntry) {
          const slideRelsXml = await parseStringPromise(slideRelsEntry.getData().toString('utf-8'));
          const layoutRel = slideRelsXml.Relationships.Relationship.find(
            (r: any) => r.$.Id === layoutId
          );
          if (layoutRel) {
            const layoutPath = `ppt/slideLayouts/${path.basename(layoutRel.$.Target)}`;
            const layoutXmlRaw = zip.getEntry(layoutPath)?.getData().toString('utf-8');
            if (layoutXmlRaw) {
              const layoutXml = await parseStringPromise(layoutXmlRaw);
              layoutName = layoutXml['p:sldLayout']?.['p:cSld']?.[0]?.$?.name || 'Unnamed Layout';
            }
          }
        }
      }

      // lấy thông tin header, footer, slide number
      const slideProperties = slideXmlObject['p:sld']['p:cSld'][0].$ || {};
      const masterShapesVisible = slideProperties.showMasterSp !== '0';

      const displayInfo: SlideDisplayInfo = {
        showsFooter: !!masterShapesVisible,
        showsDate: !!masterShapesVisible,
        showsSlideNumber: !!masterShapesVisible,
      };

      // Tìm các placeholder cụ thể bị ẩn trên slide này
      const phs = slideXmlObject['p:sld']['p:cSld'][0]['p:spTree'][0]['p:sp']
        ?.map((sp: any) => sp['p:nvSpPr']?.[0]?.['p:nvPr']?.[0]?.['p:ph']?.[0])
        .filter(Boolean);

      if (phs) {
        for (const ph of phs) {
          if (ph.$.type === 'ftr') displayInfo.showsFooter = ph.$.sz !== '0' ? true : false;
          if (ph.$.type === 'dt') displayInfo.showsDate = ph.$.sz !== '0' ? true : false;
          if (ph.$.type === 'sldNum') displayInfo.showsSlideNumber = ph.$.sz !== '0' ? true : false;
        }
      }

      // lấy ra transition effect 
      let transition: TransitionEffect | undefined = undefined;
      const transitionNode = slideXmlObject['p:sld']['p:transition']?.[0];

      if (transitionNode) {
          const durationStr = transitionNode.$?.dur;
          const effectTypeKey = Object.keys(transitionNode).find(
              key => key !== '$' && key !== 'p:sound'
          ); // Loại trừ thẻ sound

          if (effectTypeKey) {
              transition = {
                  type: effectTypeKey.replace('p:', ''),
                  duration: durationStr ? parseInt(durationStr, 10) : undefined,
              };

              const soundNode = transitionNode['p:sound']?.[0];
              if (soundNode) {
                  const soundNameNode = soundNode['a:prstSnd']?.[0]; // Âm thanh có sẵn
                  if (soundNameNode && soundNameNode.$?.prst) {
                      transition.sound = { name: soundNameNode.$.prst };
                  }
              }
          }
      }

      // Lấy thông tin animation
      let animations: AnimationNode | undefined = undefined;
      const timingNode = slideXmlObject['p:sld']['p:timing']?.[0]?.['p:tnLst']?.[0];

      if (timingNode) {
        // Lấy node gốc của cây (thường là một thẻ <p:par>)
        const rootTimeNodeKey = Object.keys(timingNode)[0];
        if (rootTimeNodeKey) {
          animations = parseAnimationNode({ [rootTimeNodeKey]: timingNode[rootTimeNodeKey] });
        }
      }

      formattedSlides.push({
        slideNumber: slideCounter++,
        layout: layoutName,
        displayInfo: displayInfo,
        transition: transition,
        shapes,
        animations: animations ? [animations] : undefined,
      });
    }

    return {
      slideCount: formattedSlides.length,
      mediaFiles,
      theme: themeData,
      slides: formattedSlides,
    };
  } catch (error) {
    console.error(`Lỗi khi phân tích định dạng file PowerPoint tại ${filePath}:`, error);
    throw new Error('Không thể phân tích định dạng file PowerPoint.');
  }
}