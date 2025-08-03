import { Group, Text, rem } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import type { DropzoneProps } from '@mantine/dropzone';
import { Upload, X, FileText } from 'lucide-react';

export function FileDropzone(props: Partial<DropzoneProps>) {
  return (
    <Dropzone
      onDrop={(files) => console.log('accepted files', files)}
      onReject={(files) => console.log('rejected files', files)}
      maxSize={50 * 1024 ** 2}
      {...props}
      style={{ flex: 1 }}
    >
      <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <Upload
            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <X
            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <FileText
            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
          />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Kéo file vào đây hoặc nhấn để chọn
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            Đính kèm một file duy nhất, không quá 50MB
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}