import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import path from 'node:path';
import type {
  ParsedPowerPointFormatData,
  FormattedSlide,
  SlideDisplayInfo,
  TransitionEffect,
  AnimationNode,
  ThemeData,
  ColorScheme
} from '../../../types/power_point/powerpointFormat.types';
import type { SlideLayoutData } from '../../../types/power_point/powerpointStyles';
import { parseMasterOrLayout } from '../parsers/styleParser';
import { extractShapesFromSlide } from '../parsers/shapeParser';
import { parseAnimationNode } from '../animationParser';
async function parseNotesForSlide(zip: AdmZip, slidePath: string): Promise<string | undefined> {
  try {
    const slideRelsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
    const slideRelsEntry = zip.getEntry(slideRelsPath);
    if (!slideRelsEntry) return undefined;

    const slideRelsXml = await parseStringPromise(slideRelsEntry.getData().toString('utf-8'));
    if (!slideRelsXml.Relationships.Relationship) return undefined;

    const notesRel = slideRelsXml.Relationships.Relationship.find(
      (r: any) => r.$.Type.endsWith('/notesSlide')
    );

    if (!notesRel) return undefined;

    const notesPath = `ppt/notesSlides/${path.basename(notesRel.$.Target)}`;
    const notesXmlRaw = zip.getEntry(notesPath)?.getData().toString('utf-8');
    if (!notesXmlRaw) return undefined;

    const notesXml = await parseStringPromise(notesXmlRaw);

    // Trích xuất tất cả các đoạn text từ trong notes
    let notesText = '';
    const paragraphs = notesXml['p:notes']['p:cSld'][0]['p:spTree'][0]['p:sp']?.[0]?.['p:txBody']?.[0]?.['a:p'] || [];

    for (const p of paragraphs) {
      const runs = p['a:r'] || [];
      for (const r of runs) {
        notesText += r['a:t']?.[0] || '';
      }
      notesText += '\n'; // Thêm ký tự xuống dòng giữa các paragraph
    }

    return notesText.trim() || undefined;

  } catch (error) {
    console.warn(`Could not parse notes for slide ${slidePath}:`, error);
    return undefined;
  }
}
export async function parsePowerPointFormat(
  zip: AdmZip,
  filePath: string
): Promise<ParsedPowerPointFormatData> {
  try {
    // Khai báo các biến phạm vi hàm
    const masterPaths: string[] = [];
    const layoutPaths: string[] = [];

    const presentationEntry = zip.getEntry('ppt/presentation.xml');
    if (!presentationEntry) throw new Error('Không tìm thấy file ppt/presentation.xml');
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


    // Xử lý themeData
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
        themeData ?? { name: '', colorScheme: {}, fontScheme: { majorFont: '', minorFont: '' } },
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
        );
        if (effectTypeKey) {
          transition = {
            type: effectTypeKey.replace('p:', ''),
            duration: durationStr ? parseInt(durationStr, 10) : undefined,
          };
          const soundNode = transitionNode['p:sound']?.[0];
          if (soundNode) {
            const soundNameNode = soundNode['a:prstSnd']?.[0];
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
        const rootTimeNodeKey = Object.keys(timingNode)[0];
        if (rootTimeNodeKey) {
          animations = parseAnimationNode({ [rootTimeNodeKey]: timingNode[rootTimeNodeKey] });
        }
      }
      const notes = await parseNotesForSlide(zip, slidePath);
      formattedSlides.push({
        slideNumber: slideCounter++,
        layout: layoutName,
        displayInfo: displayInfo,
        transition: transition,
        shapes,
        animations: animations,
        notes: notes, 
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