/**
 * @file rubric.types.ts
 * @description Type definitions for rubric-related data
 * @author Your Name
 */

export interface Level {
  points: number
  code: string
  name: string
  description: string
}

export interface Criterion {
  id: string
  name: string
  detectorKey: string
  maxPoints: number
  levels: Level[]
}

export interface Rubric {
  title: string
  version: string
  locale: string
  totalPoints: number
  scoring: {
    method: 'sum'
    rounding: 'half_up_0.25' | 'none'
  }
  criteria: Criterion[]
}