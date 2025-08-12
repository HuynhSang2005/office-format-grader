import { animations } from './criteria/animations.ts';
import { transitions } from './criteria/transitions.ts';
import { themes } from './criteria/themes.ts';
import { headerFooter } from './criteria/headerFooter.ts';
import { hyperlink } from './criteria/hyperlink.ts';
import { objects } from './criteria/objects.ts';
import { slideMaster } from './criteria/slideMaster.ts';
import { slidesFromOutline } from './criteria/slidesFromOutline.ts';
import { filename } from './criteria/filename.ts';
import { creativity } from './criteria/creativity.ts';
import type { GradingResult } from '../../types/domain/grading.ts';

/**
 * Chấm điểm thủ công dựa trên các tiêu chí đơn giản.
 */
export function gradePptxManually(data: unknown): GradingResult {
  const details = [
    { criterion: 'animations', maxScore: 1, achievedScore: animations(), reason: '' },
    { criterion: 'transitions', maxScore: 1, achievedScore: transitions(), reason: '' },
    { criterion: 'themes', maxScore: 1, achievedScore: themes(), reason: '' },
    { criterion: 'headerFooter', maxScore: 1, achievedScore: headerFooter(), reason: '' },
    { criterion: 'hyperlink', maxScore: 1, achievedScore: hyperlink(), reason: '' },
    { criterion: 'objects', maxScore: 1, achievedScore: objects(), reason: '' },
    { criterion: 'slideMaster', maxScore: 1, achievedScore: slideMaster(), reason: '' },
    { criterion: 'slidesFromOutline', maxScore: 1, achievedScore: slidesFromOutline(), reason: '' },
    { criterion: 'filename', maxScore: 1, achievedScore: filename(), reason: '' },
    { criterion: 'creativity', maxScore: 1, achievedScore: creativity(), reason: '' },
  ];
  const totalAchievedScore = details.reduce((s, d) => s + d.achievedScore, 0);
  const totalMaxScore = details.reduce((s, d) => s + d.maxScore, 0);
  return { totalAchievedScore, totalMaxScore, details };
}
