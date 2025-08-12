export interface RubricRule { criterion: string; maxScore: number; }

export const defaultRules: RubricRule[] = [
  { criterion: 'animations', maxScore: 1 },
];
