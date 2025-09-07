/**
 * @file handlers.ts
 * @description MSW handlers for mocking API requests in tests
 * @author Your Name
 */

import { http, HttpResponse } from 'msw'

// Mock auth endpoints
export const authHandlers = [
  // Login
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    
    // Mock successful login
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: 1,
            email: 'test@example.com'
          }
        }
      })
    }
    
    // Mock failed login
    return HttpResponse.json({
      success: false,
      message: 'Email hoặc mật khẩu không đúng'
    }, { status: 401 })
  }),

  // Logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Đăng xuất thành công'
    })
  }),

  // Get current user
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: {
        user: {
          id: 1,
          email: 'test@example.com'
        }
      }
    })
  })
]

// Mock upload endpoints
export const uploadHandlers = [
  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return HttpResponse.json({
        success: false,
        message: 'Không tìm thấy file trong request'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: true,
      message: 'File đã được tải lên và chấm điểm hoàn thành',
      data: {
        fileId: 'test-file-id',
        fileName: file.name,
        fileSize: file.size,
        gradeResult: {
          id: 'grade-result-id',
          fileId: 'test-file-id',
          fileName: file.name,
          fileType: file.name.endsWith('.pptx') ? 'PPTX' : 'DOCX',
          score: 85,
          totalPoints: 100,
          feedback: 'Good work!',
          gradedAt: new Date().toISOString(),
          rubric: {
            id: 'rubric-id',
            name: 'Default Rubric',
            content: {
              criteria: [],
              totalPoints: 100
            }
          }
        }
      }
    })
  })
]

// Mock export endpoints
export const exportHandlers = [
  http.post('/api/export', async () => {
    // const _body = await request.json() as { fileType: string; dateRange: { from: string; to: string } }

    return HttpResponse.json({
      success: true,
      message: 'Export started successfully',
      data: {
        taskId: 'export-task-123',
        status: 'processing',
        estimatedCompletion: new Date(Date.now() + 30000).toISOString()
      }
    })
  }),

  http.get('/api/export/status/:taskId', () => {
    return HttpResponse.json({
      success: true,
      message: 'Export completed',
      data: {
        taskId: 'export-task-123',
        status: 'completed',
        downloadUrl: '/api/export/download/export-task-123',
        completedAt: new Date().toISOString()
      }
    })
  })
]

// Mock grade history endpoints
export const gradeHandlers = [
  http.get('/api/grade/history', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const fileType = url.searchParams.get('fileType')
    
    // Mock grade history data
    const mockGradeHistory = [
      {
        id: 'grade-1',
        filename: 'test1.pptx',
        fileType: 'PPTX',
        totalPoints: 85,
        gradedAt: new Date().toISOString(),
      },
      {
        id: 'grade-2',
        filename: 'test2.docx',
        fileType: 'DOCX',
        totalPoints: 92,
        gradedAt: new Date().toISOString(),
      }
    ]
    
    // Filter by fileType if provided
    const filteredHistory = fileType 
      ? mockGradeHistory.filter(item => item.fileType === fileType)
      : mockGradeHistory
    
    // Paginate results
    const paginatedResults = filteredHistory.slice(offset, offset + limit)
    
    return HttpResponse.json({
      success: true,
      message: 'Lấy lịch sử chấm điểm thành công',
      data: {
        results: paginatedResults,
        total: filteredHistory.length,
        limit,
        offset
      }
    })
  })
]

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...uploadHandlers,
  ...exportHandlers,
  ...gradeHandlers
]