// Animation parser for PowerPoint
import type { AnimationNode, AnimationEffect } from '../../types/power_point/powerpointFormat.types';

export function parseAnimationNode(nodeElement: any): AnimationNode {
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
