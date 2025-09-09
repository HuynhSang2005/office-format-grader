import { Card, Title, Text, List, Badge, Group, Stack } from '@mantine/core';
import type { PowerPointDetailedResult, PowerPointOverviewResult } from '../types/api.types';
import { Presentation, User, Building, Calendar, Layers } from 'lucide-react';

interface PowerPointResultViewerProps {
  data: PowerPointDetailedResult | PowerPointOverviewResult;
  mode: 'full' | 'overview';
}

export function PowerPointResultViewer({ data, mode }: PowerPointResultViewerProps) {
  const isDetailed = mode === 'full' && 'slides' in data;

  return (
    <Stack w="100%">
      <Card withBorder shadow="md" p="lg" radius="md">
        <Title order={3} mb="md">
          <Presentation size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Thông tin tổng quan
        </Title>
        
        <Group grow>
          <Text>
            <span style={{ fontWeight: 600 }}>Tên file:</span> {data.fileName}
          </Text>
          <Text>
            <span style={{ fontWeight: 600 }}>Số slide:</span> {data.slideCount}
          </Text>
        </Group>
        
        <Stack mt="md" gap="xs">
          <Group>
            <User size={16} />
            <Text>
              <span style={{ fontWeight: 600 }}>Tác giả:</span> {data.metadata.author || 'Không có'}
            </Text>
          </Group>
          
          <Group>
            <Building size={16} />
            <Text>
              <span style={{ fontWeight: 600 }}>Công ty:</span> {data.metadata.company || 'Không có'}
            </Text>
          </Group>
          
          <Group>
            <Calendar size={16} />
            <Text>
              <span style={{ fontWeight: 600 }}>Ngày tạo:</span> {data.metadata.createdAt ? new Date(data.metadata.createdAt).toLocaleString() : 'Không có'}
            </Text>
          </Group>
          
          <Group>
            <Calendar size={16} />
            <Text>
              <span style={{ fontWeight: 600 }}>Lần sửa cuối:</span> {data.metadata.modifiedAt ? new Date(data.metadata.modifiedAt).toLocaleString() : 'Không có'}
            </Text>
          </Group>
        </Stack>
      </Card>
      
      {isDetailed && (
        <Card withBorder shadow="md" p="lg" radius="md" mt="md">
          <Title order={3} mb="md">
            <Layers size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Thông tin chi tiết các slide
          </Title>
          
          <List spacing="md">
            {(data as PowerPointDetailedResult).slides.map((slide) => (
              <List.Item key={slide.slideNumber}>
                <Card withBorder p="sm">
                  <Group justify="space-between">
                    <Text fw={600}>Slide {slide.slideNumber}</Text>
                    {slide.title && <Text>{slide.title}</Text>}
                  </Group>
                  
                  <Group mt="xs" gap="xs">
                    <Badge>{slide.elementCount} phần tử</Badge>
                    {slide.hasChart && <Badge color="blue">Biểu đồ</Badge>}
                    {slide.hasTable && <Badge color="green">Bảng</Badge>}
                    {slide.hasImage && <Badge color="purple">Hình ảnh</Badge>}
                  </Group>
                </Card>
              </List.Item>
            ))}
          </List>
        </Card>
      )}
    </Stack>
  );
}
