import { createFileRoute, redirect } from '@tanstack/react-router';
import { Container } from '@mantine/core';
import { useAuthStore } from '@/store/authStore';
import { FileUpload } from '@/features/grading/components';
import type { GradeResult } from '@/types';

/**
 * Component for the upload route where authenticated users can upload and grade documents.
 * @returns {JSX.Element} The rendered upload page component.
 */
function UploadPage() {
  const handleGradeComplete = (result: GradeResult) => {
    console.log('Grade completed:', result);
    // This could redirect to a detailed results page or show a notification
  };

  return (
    <Container size="lg" py="xl">
      <FileUpload onGradeComplete={handleGradeComplete} />
    </Container>
  );
}

export const Route = createFileRoute('/upload')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: UploadPage,
});
