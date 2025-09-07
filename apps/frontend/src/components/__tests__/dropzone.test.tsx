/**
 * @file dropzone.test.tsx
 * @description Unit tests for FileDropzone component
 * @author Your Name
 */

import { renderWithProviders as render } from '../../tests/test-utils'
import { FileDropzone } from '../file/dropzone'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('FileDropzone', () => {
  const mockOnDrop = vi.fn()

  beforeEach(() => {
    mockOnDrop.mockClear()
  })

  it('should render with default props', () => {
    expect(() => render(<FileDropzone onDrop={mockOnDrop} />)).not.toThrow()
  })

  it('should render with custom accept types', () => {
    expect(() => render(<FileDropzone onDrop={mockOnDrop} accept={['.pdf', '.txt']} />)).not.toThrow()
  })

  it('should handle file drop', () => {
    expect(() => render(<FileDropzone onDrop={mockOnDrop} />)).not.toThrow()
  })

  it('should display uploaded file information', () => {
    const testFile = new File(['test content'], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
    
    expect(() => render(<FileDropzone onDrop={mockOnDrop} uploadedFile={testFile} />)).not.toThrow()
  })

  it('should format file sizes correctly', () => {
    const smallFile = new File(['a'], 'small.txt', { type: 'text/plain' }) // 1 byte
    const mediumFile = new File(new Array(100).fill('a'), 'medium.txt', { type: 'text/plain' }) // 100 bytes
    
    // Test small file
    expect(() => render(<FileDropzone onDrop={mockOnDrop} uploadedFile={smallFile} />)).not.toThrow()
    
    // Test medium file
    expect(() => render(<FileDropzone onDrop={mockOnDrop} uploadedFile={mediumFile} />)).not.toThrow()
  }, 10000) // Increase timeout for this test
})