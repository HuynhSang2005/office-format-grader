/**
 * @file login.lazy.tsx
 * @description Login page component based on Mantine Authentication form example
 * @author Your Name
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Alert,
  Center,
} from '@mantine/core'
import { IconLogin, IconUser, IconLock } from '@tabler/icons-react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth.store'
import { LoginRequestSchema, type LoginRequest } from '../schemas/auth.schema'
import { zodResolver } from '../lib/zod-resolver'

export const Route = createLazyFileRoute('/login')({
  component: LoginRoute,
})

export function LoginRoute() {
  const { login, loading, error } = useAuthStore()
  const [loginError, setLoginError] = useState<string | null>(null)
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  })
  
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
          
          <Text size="sm" ta="center" mt="md">
            Tài khoản demo: <Anchor href="#" onClick={(e) => {
              e.preventDefault()
              // Fill in demo credentials
              const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
              const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement
              if (emailInput && passwordInput) {
                emailInput.value = 'admin@example.com'
                passwordInput.value = 'admin123'
              }
            }}>Điền tự động</Anchor>
          </Text>
        </Paper>
        
        <Text size="md" c="dimmed" ta="center" mt="xl">
          © {new Date().getFullYear()} Office Format Grader. All rights reserved.
        </Text>
      </Container>
    </Center>
  )
}

export default LoginRoute