import type { RubricCriterion } from '../types/grading.types';

export const powerpointRubric: RubricCriterion[] = [
  {
    id: 'filename',
    criterion: 'Đặt tên tập tin đúng quy ước',
    maxScore: 0.5,
    levels: [
      { score: 0.5, description: 'Tên tập tin rõ ràng, chính xác, đủ thông tin; đúng cấu trúc quy ước' },
      { score: 0.25, description: 'Tên tập tin rõ ràng, cấu trúc cơ bản đúng; chỉ thiếu ít thông tin' },
      { score: 0, description: 'Không biết đặt tên tập tin đúng quy ước' },
    ],
  },
  {
    id: 'headerFooter',
    criterion: 'Dùng Header/Footer',
    maxScore: 0.5,
    levels: [
        { score: 0.5, description: 'Tạo đầy đủ và hoàn toàn chính xác (có đủ các yếu tố và trừ slide tiêu đề).' },
        { score: 0.25, description: 'Tạo được nhưng còn thiếu sót hoặc áp dụng cho cả slide tiêu đề.' },
        { score: 0, description: 'Không sử dụng được Header/ Footer.' },
    ]
  },
  {
    id: 'transitions',
    criterion: 'Hiệu ứng chuyển động (Transition)',
    maxScore: 1.0,
    levels: [
        { score: 1.0, description: 'Áp dụng hiệu ứng và âm thanh phù hợp, hiệu quả.' },
        { score: 0.5, description: 'Chỉ dùng được hiệu ứng hình ảnh hoặc chỉ có âm thanh.' },
        { score: 0.25, description: 'Dùng hiệu ứng/âm thanh chưa đúng, không phù hợp.' },
        { score: 0, description: 'Không áp dụng hiệu ứng chuyển slide.' },
    ]
  },
  {
    id: 'objects',
    criterion: 'Chèn đối tượng',
    maxScore: 1.0,
    levels: [
        { score: 1.0, description: 'Chèn đầy đủ và chính xác các đối tượng theo yêu cầu (tối thiểu 2).' },
        { score: 0.5, description: 'Chèn chưa đủ các đối tượng theo yêu cầu.' },
        { score: 0, description: 'Không biết chèn đối tượng hoặc chèn sai loại.' },
    ]
  },
];