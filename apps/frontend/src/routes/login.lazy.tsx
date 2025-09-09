/**
 * @file login.lazy.tsx
 * @description Login page component based on Mantine Authentication form example
 * @author Nguyễn Huỳnh Sang
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Alert,
  Center,
  Select,
} from '@mantine/core'
import { IconLogin, IconUser, IconLock } from '@tabler/icons-react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth.store'
import { LoginRequestSchema, type LoginRequest } from '../schemas/auth.schema'
import { zodResolver } from '../lib/zod-resolver'

// Demo accounts data
const demoAccounts = [
  { email: "admin@example.com", password: "admin123", label: "Admin Account" },
  { email: "user1@example.com", password: "user123", label: "User-1 Account" },
  { email: "user2@example.com", password: "user123", label: "User-2 Account" }
];

export const Route = createLazyFileRoute('/login')({
  component: LoginRoute,
})

export function LoginRoute() {
  const { login, loading, error } = useAuthStore()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  })
  
  // Function to auto-fill selected demo account
  const fillDemoAccount = () => {
    if (selectedAccount) {
      const account = demoAccounts.find(acc => acc.email === selectedAccount);
      if (account) {
        setValue('email', account.email);
        setValue('password', account.password);
      }
    }
  }
  
  const onSubmit = async (data: LoginRequest) => {
    try {
      setLoginError(null)
      await login(data.email, data.password)
      // Use router navigation instead of window.location for better SPA experience
      navigate({ to: '/dashboard' })
    } catch (err: unknown) {
      // Handle different types of errors
      if (err instanceof Error) {
        // If it's a network error or other Error instance
        setLoginError(err.message || 'Đăng nhập thất bại')
      } else if (typeof err === 'object' && err !== null) {
        // If it's an object with response data (axios-like error)
        const errorObj = err as { response?: { data?: { message?: string } } }
        const errorMessage = errorObj?.response?.data?.message || 'Đăng nhập thất bại'
        setLoginError(errorMessage)
      } else {
        // Fallback for other error types
        setLoginError('Đăng nhập thất bại')
      }
    }
  }
  
  return (
    <Center className="min-h-screen">
      <Container size="md" my={40}>
        <Title ta="center" className="font-bold">
          Office Format Grader
        </Title>
        <Text c="dimmed" size="md" ta="center" mt={10}>
          Hệ thống chấm điểm tài liệu tự động
        </Text>

        <Paper withBorder shadow="md" p={40} mt={30} radius="md">
          {(loginError || error) && (
            <Alert 
              color="red" 
              mb="md"
              title={loginError || error}
            />
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              {...register('email')}
              error={errors.email?.message}
              required
              size="sm"
              leftSection={<IconUser size={16} />}
            />
            
            <PasswordInput
              label="Mật khẩu"
              placeholder="Mật khẩu của bạn"
              {...register('password')}
              error={errors.password?.message}
              required
              mt="sm"
              size="sm"
              leftSection={<IconLock size={16} />}
            />
            
            <Group justify="space-between" mt={20} mb={20} >
              <Checkbox label="Ghi nhớ đăng nhập" />
            </Group>
            
            <Button 
              leftSection={<IconLogin size={16} />}
              type="submit" 
              fullWidth 
              mt="sm"
              loading={loading}
              size="sm"
            >
              Đăng nhập
            </Button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Text size="sm">Tài khoản demo:</Text>
            <Select
              placeholder="Chọn tài khoản demo"
              data={demoAccounts.map(account => ({
                value: account.email,
                label: account.label
              }))}
              value={selectedAccount}
              onChange={setSelectedAccount}
              mt="xs"
              size="sm"
              clearable
            />
            <Button 
              variant="outline" 
              fullWidth 
              mt="sm" 
              size="sm"
              onClick={fillDemoAccount}
              disabled={!selectedAccount}
            >
              Điền tự động
            </Button>
          </div>
        </Paper>
        
        <Text size="md" c="dimmed" ta="center" mt="xl">
          © {new Date().getFullYear()} Office Format Grader. All rights reserved.
        </Text>
      </Container>
    </Center>
  )
}

export default LoginRoute