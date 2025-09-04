import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Flex } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { notifications } from '@mantine/notifications';
import { login } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';

/**
 * The main login form component.
 * Handles user input, validation, and API submission for authentication.
 * @returns {JSX.Element} The rendered login form.
 */
export function LoginForm() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      notifications.show({
        title: 'Thành công',
        message: 'Đăng nhập thành công!',
        color: 'green',
      });
      setUser(data.user);
      navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
        color: 'red',
      });
      console.error('Login failed:', error);
    },
  });

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Password validation  
    if (!password) {
      newErrors.password = 'Mật khẩu không được để trống';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      mutation.mutate({ email, password });
    }
  };

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ minWidth: 400 }}>
        <Title order={2} ta="center" mb="xl">
          Đăng nhập
        </Title>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <PasswordInput
              label="Mật khẩu"
              placeholder="Mật khẩu của bạn"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Button type="submit" fullWidth mt="xl" loading={mutation.isPending}>
              Đăng nhập
            </Button>
          </Stack>
        </form>
      </Paper>
    </Flex>
  );
}
