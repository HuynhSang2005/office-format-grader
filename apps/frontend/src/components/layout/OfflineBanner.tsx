/**
 * @file OfflineBanner.tsx
 * @description Banner component to show when user is offline
 * @author Nguyễn Huỳnh Sang
 */

import { Alert } from '@mantine/core'
import { IconWifiOff } from '@tabler/icons-react'
import { useOffline } from '../../hooks/use-offline'

export function OfflineBanner() {
  const { isOffline } = useOffline()

  if (!isOffline) {
    return null
  }

  return (
    <Alert
      variant="light"
      color="yellow"
      title="Không có kết nối mạng"
      icon={<IconWifiOff />}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: 0,
        textAlign: 'center',
      }}
    >
      Bạn đang làm việc ở chế độ offline. Đa số tính năng có thể không khả dụng.
    </Alert>
  )
}