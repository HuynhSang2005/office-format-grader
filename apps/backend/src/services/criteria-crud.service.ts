/**
 * @file criteria-crud.service.ts
 * @description Service xử lý CRUD operations cho criteria
 * @author Nguyễn Huỳnh Sang
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import type { Criterion, Level } from '@/types/criteria';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Type for the Prisma Criterion model
type PrismaCriterion = {
  id: string;
  name: string;
  description: string;
  detectorKey: string;
  maxPoints: number;
  levels: string; // JSON string representation of levels array
  createdAt: Date;
  updatedAt: Date;
};

// Helper function to convert Prisma Criterion to our Criterion type
function convertPrismaCriterionToCriterion(prismaCriterion: PrismaCriterion): Criterion {
  return {
    id: prismaCriterion.id,
    name: prismaCriterion.name,
    description: prismaCriterion.description,
    detectorKey: prismaCriterion.detectorKey as any, // Type assertion since we know it matches
    maxPoints: prismaCriterion.maxPoints,
    levels: JSON.parse(prismaCriterion.levels) as Level[]
  };
}

// Helper function to convert Criterion to Prisma Criterion data
function convertCriterionToPrismaData(criterion: Partial<Criterion>): any {
  const data: any = {};
  
  if (criterion.name !== undefined) data.name = criterion.name;
  if (criterion.description !== undefined) data.description = criterion.description;
  if (criterion.detectorKey !== undefined) data.detectorKey = criterion.detectorKey;
  if (criterion.maxPoints !== undefined) data.maxPoints = criterion.maxPoints;
  if (criterion.levels !== undefined) data.levels = JSON.stringify(criterion.levels);
  
  return data;
}

/**
 * Create a new criterion
 * @param data - Criterion data without id, createdAt, updatedAt
 * @returns The created criterion
 */
export async function createCriterion(data: Omit<Criterion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Criterion> {
  logger.info(`Creating new criterion: ${data.name}`);
  
  try {
    const prismaCriterion = await prisma.criterion.create({
      data: {
        name: data.name,
        description: data.description,
        detectorKey: data.detectorKey,
        maxPoints: data.maxPoints,
        levels: JSON.stringify(data.levels)
      }
    });
    
    logger.info(`Created criterion with ID: ${prismaCriterion.id}`);
    return convertPrismaCriterionToCriterion(prismaCriterion);
  } catch (error) {
    logger.error('Error creating criterion:', error);
    throw new Error(`Failed to create criterion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a criterion by ID
 * @param id - Criterion ID
 * @returns The criterion or null if not found
 */
export async function getCriterionById(id: string): Promise<Criterion | null> {
  logger.info(`Getting criterion by ID: ${id}`);
  
  try {
    const prismaCriterion = await prisma.criterion.findUnique({
      where: { id }
    });
    
    if (!prismaCriterion) {
      logger.debug(`Criterion not found: ${id}`);
      return null;
    }
    
    return convertPrismaCriterionToCriterion(prismaCriterion);
  } catch (error) {
    logger.error('Error getting criterion by ID:', error);
    throw new Error(`Failed to get criterion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update a criterion
 * @param id - Criterion ID
 * @param data - Partial criterion data to update
 * @returns The updated criterion
 */
export async function updateCriterion(id: string, data: Partial<Omit<Criterion, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Criterion> {
  logger.info(`Updating criterion: ${id}`);
  
  try {
    const prismaCriterion = await prisma.criterion.update({
      where: { id },
      data: convertCriterionToPrismaData(data)
    });
    
    logger.info(`Updated criterion: ${id}`);
    return convertPrismaCriterionToCriterion(prismaCriterion);
  } catch (error) {
    logger.error('Error updating criterion:', error);
    throw new Error(`Failed to update criterion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a criterion
 * @param id - Criterion ID
 */
export async function deleteCriterion(id: string): Promise<void> {
  logger.info(`Deleting criterion: ${id}`);
  
  try {
    await prisma.criterion.delete({
      where: { id }
    });
    
    logger.info(`Deleted criterion: ${id}`);
  } catch (error) {
    logger.error('Error deleting criterion:', error);
    throw new Error(`Failed to delete criterion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List all criteria
 * @returns Array of all criteria
 */
export async function listCriteria(): Promise<Criterion[]> {
  logger.info('Listing all criteria');
  
  try {
    const prismaCriteria = await prisma.criterion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return prismaCriteria.map(convertPrismaCriterionToCriterion);
  } catch (error) {
    logger.error('Error listing criteria:', error);
    throw new Error(`Failed to list criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List criteria by detector key
 * @param detectorKey - Detector key to filter by
 * @returns Array of criteria with the specified detector key
 */
export async function listCriteriaByDetector(detectorKey: string): Promise<Criterion[]> {
  logger.info(`Listing criteria by detector key: ${detectorKey}`);
  
  try {
    const prismaCriteria = await prisma.criterion.findMany({
      where: { detectorKey },
      orderBy: { createdAt: 'desc' }
    });
    
    return prismaCriteria.map(convertPrismaCriterionToCriterion);
  } catch (error) {
    logger.error('Error listing criteria by detector key:', error);
    throw new Error(`Failed to list criteria by detector key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}