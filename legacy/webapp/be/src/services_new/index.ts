/**
 * Services Index
 * Centralized exports for all application services
 * 
 * This follows domain-driven design principles with clear separation of concerns:
 * - AI: AI-powered grading and analysis
 * - Document: Document parsing and processing
 * - Export: Data export and report generation
 * - File: File processing and management
 * - Grading: Manual grading and evaluation
 * - Rubric: Rubric and criteria management
 */

// AI Services
export * from './ai';

// Document Services
export * from './document';

// Export Services
export * from './export';

// File Services
export * from './file';

// Grading Services
export * from './grading';

// Rubric Services
export * from './rubric';

// Service factory functions for dependency injection
export { createAIGradingService } from './factories/ai.factory';
export { createDocumentServices } from './factories/document.factory';
export { createGradingServices } from './factories/grading.factory';