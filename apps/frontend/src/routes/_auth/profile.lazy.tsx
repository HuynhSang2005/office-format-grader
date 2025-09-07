/**
 * @file profile.lazy.tsx
 * @description User profile page component
 * @author Your Name
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Flex, 
  Box,
  Avatar,
  Button,
  Group,
  TextInput,
  PasswordInput
} from '@mantine/core'
import { IconUser, IconMail, IconLock, IconEdit, IconCamera } from '@tabler/icons-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/use-auth'

export const Route = createLazyFileRoute('/_auth/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.email?.split('@')[0] || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Cập nhật thông tin thành công!')
      setEditing(false)
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.')
      console.error('Profile update error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.')
      console.error('Password change error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Text>Không thể tải thông tin người dùng.</Text>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Hồ sơ cá nhân</Title>
      
      <Card withBorder p="lg" radius="md" mb="xl">
        <Flex direction={{ base: 'column', sm: 'row' }} gap='xl'>
          <Box>
            <Flex direction="column" align="center">
              <Avatar 
                src={null} 
                alt={user.email} 
                size="xl" 
                radius="xl"
                mb="md"
              >
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Button 
                leftSection={<IconCamera size={16} />} 
                variant="outline" 
                size="xs"
              >
                Thay đổi ảnh
              </Button>
            </Flex>
          </Box>
          
          <Box style={{ flex: 1 }}>
            {editing ? (
              <>
                <TextInput
                  label="Họ tên"
                  placeholder="Nhập họ tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  mb="md"
                  leftSection={<IconUser size={16} />}
                />
                
                <TextInput
                  label="Email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  mb="md"
                  leftSection={<IconMail size={16} />}
                />
                
                <Group justify="flex-end" mt="xl">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditing(false)}
                  >
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleSave}
                    loading={loading}
                  >
                    Lưu thay đổi
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <Flex align="center" gap="sm" mb="md">
                  <IconUser size={16} color="var(--mantine-color-dimmed)" />
                  <Text fw={500}>{name || 'Chưa đặt tên'}</Text>
                </Flex>
                
                <Flex align="center" gap="sm" mb="md">
                  <IconMail size={16} color="var(--mantine-color-dimmed)" />
                  <Text>{user.email}</Text>
                </Flex>
                
                <Text size="sm" c="dimmed" mb="md">
                  Thành viên từ {new Date().toLocaleDateString('vi-VN')}
                </Text>
                
                <Button 
                  leftSection={<IconEdit size={16} />} 
                  onClick={() => setEditing(true)}
                  mt="md"
                >
                  Chỉnh sửa hồ sơ
                </Button>
              </>
            )}
          </Box>
        </Flex>
      </Card>
      
      {success && (
        <Text c="green" mb="xl">{success}</Text>
      )}
      
      {error && (
        <Text c="red" mb="xl">{error}</Text>
      )}
      
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="md">Đổi mật khẩu</Title>
        
        <PasswordInput
          label="Mật khẩu hiện tại"
          placeholder="Nhập mật khẩu hiện tại"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          mb="md"
          leftSection={<IconLock size={16} />}
        />
        
        <PasswordInput
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          mb="md"
          leftSection={<IconLock size={16} />}
        />
        
        <PasswordInput
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          mb="xl"
          leftSection={<IconLock size={16} />}
        />
        
        <Button 
          onClick={handleChangePassword}
          loading={loading}
        >
          Đổi mật khẩu
        </Button>
      </Card>
    </Container>
  )
}