import type { AnimationNode, AnimationEffect } from "../../../types/power_point/powerpointFormat.types";

/**
 * Hàm helper để đọc chi tiết một node hiệu ứng.
 * @param effectNode - Node XML chứa một hiệu ứng cụ thể (ví dụ: <p:anim>)
 * @returns - Thông tin chi tiết về hiệu ứng.
 */
function getEffectDetails(effectNode: any): Partial<AnimationEffect> {
    const details: Partial<AnimationEffect> = { effectType: 'unknown' };

    // Cấu trúc của một hiệu ứng rất phức tạp, đây là ví dụ cho hiệu ứng 'flyIn'
    const cBhvr = effectNode?.['p:cBhvr']?.[0];
    if (!cBhvr) return details;

    const animMotion = cBhvr['p:animMotion']?.[0];
    if (animMotion?.$?.path) {
        // Đây có thể là một hiệu ứng di chuyển theo đường dẫn (motion path)
    } else if (animMotion) {
        details.effectType = 'flyIn'; // Mặc định cho animMotion
        details.direction = animMotion.$?.from || undefined;
    }

    // Ví dụ cho hiệu ứng 'appear' (fadeIn, fadeOut)
    const anim = cBhvr['p:anim']?.[0];
    if(anim) {
        // Hiệu ứng fadeIn/fadeOut thường được định nghĩa bằng cách thay đổi thuộc tính
        const attrName = anim['p:cBhvr']?.[0]?.['p:cTn']?.[0]?.['p:attrNameLst']?.[0]?.['p:attrName']?.[0];
        if (attrName === 'style.opacity') {
            details.effectType = 'fade';
        }
    }

    // Cần thêm rất nhiều logic `if/else` ở đây để xử lý các loại hiệu ứng khác
    // như wipe, split, grow, ...

    return details;
}

/**
 * HÀM ĐỆ QUY ĐỂ PARSE CÂY ANIMATION (phiên bản nâng cấp)
 */
export function parseAnimationTree(timeNode: any): AnimationNode | null {
    // Lấy thẻ chính của node (p:par, p:seq, ...)
    const nodeKey = Object.keys(timeNode).find(k => k.startsWith('p:'));
    if (!nodeKey) return null;

    const nodeContent = timeNode[nodeKey][0];
    const nodeAttributes = nodeContent.$ || {};
    const commonTn = nodeContent['c:cTn']?.[0];

    // Đảm bảo trigger là string, mặc định là 'onDemand'
    const trigger: string = commonTn?.$?.presetClass ?? 'onDemand';

    const baseNode: Partial<AnimationNode> = {
        trigger,
        delay: commonTn?.$?.delay ? parseInt(commonTn.$.delay) : undefined,
        duration: commonTn?.$?.dur ? parseInt(commonTn.$.dur) : undefined,
    };

    // Nếu là node tuần tự hoặc song song, tiếp tục gọi đệ quy
    if (nodeKey === 'p:par' || nodeKey === 'p:seq') {
        const childrenNodes = nodeContent['p:childTnLst']?.[0];
        if (!childrenNodes) return null;

        return {
            ...baseNode,
            type: nodeKey === 'p:par' ? 'parallel' : 'sequence',
            children: Object.keys(childrenNodes)
                .map(key => parseAnimationTree({ [key]: childrenNodes[key] }))
                .filter((child): child is AnimationNode => child !== null)
        } as AnimationNode;
    } else {
        // Nếu là node hiệu ứng cuối cùng (leaf node)
        const targetShapeId = commonTn?.['p:tgtEl']?.[0]?.['p:spTgt']?.[0]?.$?.spid;
        if (!targetShapeId) return null;

        const effectDetails = getEffectDetails(commonTn);

        return {
            ...baseNode,
            type: 'effect',
            effect: {
                shapeId: targetShapeId,
                ...effectDetails,
            }
        } as AnimationNode;
    }
}