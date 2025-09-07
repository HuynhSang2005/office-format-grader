/**
 * @file settings.lazy.tsx
 * @description Application settings page component
 * @author Your Name
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Button,
  Group,
  Select,
  Switch,
  NumberInput,
  Accordion,
  Alert
} from '@mantine/core'
import { IconPalette, IconBell, IconShield, IconDatabase } from '@tabler/icons-react'
import { useState } from 'react'
import { useMantineColorScheme } from '@mantine/core'

export const Route = createLazyFileRoute('/_auth/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { setColorScheme, colorScheme } = useMantineColorScheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(colorScheme === 'light' ? 'light' : 'dark')
  const [language, setLanguage] = useState('vi')
  const [autoSave, setAutoSave] = useState(true)
  const [maxConcurrent, setMaxConcurrent] = useState(5)

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      // Apply theme setting
      if (theme === 'light' || theme === 'dark') {
        setColorScheme(theme)
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Lưu cài đặt thành công!')
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.')
      console.error('Settings save error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Cài đặt</Title>
      
      {success && (
        <Alert 
          color="green" 
          mb="xl"
          title={success}
        />
      )}
      
      {error && (
        <Alert 
          color="red" 
          mb="xl"
          title={error}
        />
      )}
      
      <Accordion defaultValue="appearance">
        <Accordion.Item value="appearance">
          <Accordion.Control icon={<IconPalette size={16} />}>
            <Text fw={500}>Giao diện</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Card withBorder p="lg" radius="md">
              <Select
                label="Chủ đề"
                placeholder="Chọn chủ đề"
                data={[
                  { value: 'light', label: 'Sáng' },
                  { value: 'dark', label: 'Tối' },
                  { value: 'auto', label: 'Tự động' }
                ]}
                value={theme}
                onChange={(value) => value && setTheme(value as 'light' | 'dark' | 'auto')}
                mb="md"
              />
              
              <Select
                label="Ngôn ngữ"
                placeholder="Chọn ngôn ngữ"
                data={[
                  { value: 'vi', label: 'Tiếng Việt' },
                  { value: 'en', label: 'English' }
                ]}
                value={language}
                onChange={(value) => value && setLanguage(value)}
                mb="md"
              />
              
              <Switch
                label="Tự động lưu"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.currentTarget.checked)}
              />
            </Card>
          </Accordion.Panel>
        </Accordion.Item>
        
        <Accordion.Item value="notifications">
          <Accordion.Control icon={<IconBell size={16} />}>
            <Text fw={500}>Thông báo</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Card withBorder p="lg" radius="md">
              <Switch
                label="Bật thông báo"
                checked={notifications}
                onChange={(e) => setNotifications(e.currentTarget.checked)}
                mb="md"
              />
              
              <Switch
                label="Thông báo qua email"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.currentTarget.checked)}
                disabled={!notifications}
              />
            </Card>
          </Accordion.Panel>
        </Accordion.Item>
        
        <Accordion.Item value="processing">
          <Accordion.Control icon={<IconDatabase size={16} />}>
            <Text fw={500}>Xử lý tài liệu</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Card withBorder p="lg" radius="md">
              <NumberInput
                label="Số file xử lý đồng thời tối đa"
                value={maxConcurrent}
                onChange={(val) => typeof val === 'number' && setMaxConcurrent(val)}
                min={1}
                max={20}
                mb="md"
              />
              
              <Text size="sm" c="dimmed">
                Điều chỉnh số lượng file được xử lý đồng thời để tối ưu hiệu suất
              </Text>
            </Card>
          </Accordion.Panel>
        </Accordion.Item>
        
        <Accordion.Item value="security">
          <Accordion.Control icon={<IconShield size={16} />}>
            <Text fw={500}>Bảo mật</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Card withBorder p="lg" radius="md">
              <Button 
                color="red" 
                variant="outline"
                onClick={() => alert('Session management would be implemented here')}
              >
                Đăng xuất khỏi tất cả thiết bị
              </Button>
            </Card>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      
      <Group justify="flex-end" mt="xl">
        <Button 
          onClick={handleSave}
          loading={loading}
          size="md"
        >
          Lưu cài đặt
        </Button>
      </Group>
    </Container>
  )
}