/**
 * @file use-custom-rubric.ts
 * @description Custom hook for custom rubric functionality in grade flow
 * @author Your Name
 */

import { useQuery } from '@tanstack/react-query';
import { useRubricStore } from '../stores/rubric.store';
import { useAuthStore } from '../stores/auth.store';
import type { CustomRubricResponse } from '../schemas/custom-rubric.schema';

/**
 * Hook for managing custom rubrics in grade flow
 */
export const useCustomRubric = () => {
  const { user } = useAuthStore();
  const {
    rubrics,
    currentRubric,
    loading,
    error,
    listRubrics,
    getRubric,
    setCurrentRubric,
    clearError
  } = useRubricStore();

  /**
   * Load all custom rubrics for the current user
   */
  const loadRubrics = () => {
    if (user) {
      return listRubrics({ ownerId: user.id });
    }
  };

  /**
   * Load a specific rubric by ID
   */
  const loadRubric = (id: string) => {
    return getRubric(id);
  };

  /**
   * Set the current rubric for grading
   */
  const selectRubric = (rubric: CustomRubricResponse | null) => {
    setCurrentRubric(rubric);
  };

  /**
   * Query for listing rubrics
   */
  const rubricsQuery = useQuery({
    queryKey: ['customRubrics', user?.id],
    queryFn: loadRubrics,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Query for getting a specific rubric
   */
  const rubricQuery = useQuery({
    queryKey: ['customRubric', currentRubric?.id],
    queryFn: () => currentRubric?.id ? loadRubric(currentRubric.id) : Promise.resolve(null),
    enabled: !!currentRubric?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Data
    rubrics,
    currentRubric,
    loading,
    error,
    
    // Actions
    loadRubrics,
    loadRubric,
    selectRubric,
    clearError,
    
    // Queries
    rubricsQuery,
    rubricQuery
  };
}