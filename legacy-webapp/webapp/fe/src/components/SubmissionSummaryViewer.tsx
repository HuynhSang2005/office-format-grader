import { Card, Title, Text, Badge, Group, Stack, SimpleGrid, Divider } from '@mantine/core';
import type { SubmissionSummary } from '../types/api.types';
import { FileText, User, Book } from 'lucide-react';

interface SubmissionSummaryViewerProps {
  summary: SubmissionSummary;
}

export function SubmissionSummaryViewer({ summary }: SubmissionSummaryViewerProps) {
  const { submission, rubric } = summary;

  return (
    <Stack w="100%">
      <Card withBorder shadow="md" p="lg" radius="md">
        <Title order={3} mb="md">
          <User size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Thông tin sinh viên
        </Title>
        
        <Group>
          <Text>
            <span style={{ fontWeight: 600 }}>MSSV:</span> {submission.student?.id || 'Không có'}
          </Text>
          <Text>
            <span style={{ fontWeight: 600 }}>Họ tên:</span> {submission.student?.name || 'Không có'}
          </Text>
        </Group>
      </Card>
      
      <SimpleGrid cols={{ base: 1, sm: rubric ? 2 : 1 }} spacing="md" mt="md">
        <Card withBorder shadow="md" p="lg" radius="md">
          <Title order={3} mb="md">
            <FileText size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            File bài nộp
          </Title>
          
          <Stack gap="md">
            {submission.files.map((file, index) => (
              <Card key={index} withBorder p="sm">
                <Group justify="space-between">
                  <Text fw={600}>{file.filename}</Text>
                  <Badge color={file.type === 'docx' ? 'blue' : 'grape'}>{file.type.toUpperCase()}</Badge>
                </Group>
                
                <Divider my="sm" />
                
                {file.overview && (
                  <Stack gap="xs">
                    <Text size="sm">
                      <span style={{ fontWeight: 600 }}>Số trang/slide:</span> {file.type === 'docx' 
                        ? ((file.overview as any)?.pageCount || 'N/A') 
                        : ((file.overview as any)?.slideCount || 'N/A')}
                    </Text>
                    
                    {file.format && (
                      <>
                        {file.type === 'pptx' && (
                          <>
                            <Text size="sm">
                              <span style={{ fontWeight: 600 }}>Có biểu đồ:</span> {file.format.hasCharts ? 'Có' : 'Không'}
                            </Text>
                            <Text size="sm">
                              <span style={{ fontWeight: 600 }}>Có bảng:</span> {file.format.hasTables ? 'Có' : 'Không'}
                            </Text>
                          </>
                        )}
                      </>
                    )}
                  </Stack>
                )}
              </Card>
            ))}
          </Stack>
        </Card>
        
        {rubric && (
          <Card withBorder shadow="md" p="lg" radius="md">
            <Title order={3} mb="md">
              <Book size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              File tiêu chí đánh giá
            </Title>
            
            <Text>
              <span style={{ fontWeight: 600 }}>Tên file:</span> {rubric.filename}
            </Text>
          </Card>
        )}
      </SimpleGrid>
    </Stack>
  );
}
