# Testing Suite for Office Vibe Code

This document describes the comprehensive testing setup for the Office Vibe Code project.

## Test Structure

```
src/tests/
├── extractors/           # Tests for document feature extraction
│   ├── docx.test.ts     # DOCX extractor tests
│   └── pptx.test.ts     # PPTX extractor tests
├── rule-engine/         # Tests for scoring and rule engine
│   └── scoring.test.ts  # Scoring logic tests
├── e2e/                 # End-to-end workflow tests
│   └── upload-grade-export.test.ts
└── fixtures/            # Test data fixtures
    ├── sample-docx-document.xml
    ├── sample-pptx-presentation.xml
    └── sample-pptx-slide.xml
```

## Test Categories

### 1. Extractor Tests

#### DOCX Extractor (`docx.test.ts`)
- **Purpose**: Validates DOCX document feature extraction functionality
- **Coverage**: 
  - Document structure analysis (pages, paragraphs, headings)
  - Table of Contents detection
  - Header/Footer information
  - Table detection and analysis
  - Error handling for malformed documents
  - Performance benchmarks

#### PPTX Extractor (`pptx.test.ts`)
- **Purpose**: Validates PowerPoint presentation feature extraction
- **Coverage**:
  - Slide information extraction
  - Theme detection and analysis
  - Slide master modifications
  - Hyperlinks, transitions, animations
  - Slide objects and outline structure
  - Error handling and performance

### 2. Rule Engine Tests

#### Scoring Tests (`scoring.test.ts`)
- **Purpose**: Validates the grading calculation logic
- **Coverage**:
  - Point rounding (half_up_0.25 method)
  - Criterion scoring with bounds checking
  - Total score calculation
  - Percentage calculations
  - Grade result creation
  - Batch statistics calculation
  - Integration workflows

### 3. End-to-End Tests

#### Upload-Grade-Export (`upload-grade-export.test.ts`)
- **Purpose**: Tests complete workflow from file upload to grading results
- **Coverage**:
  - File upload functionality (DOCX/PPTX)
  - Grading with different rubric modes (hard/custom/selective)
  - Result format validation
  - Error handling for invalid files/requests
  - Performance benchmarks
  - Complete workflow integration

## Running Tests

### Prerequisites
```bash
bun install
```

### Run All Tests
```bash
bun test
```

### Run Specific Test Categories
```bash
# Extractor tests only
bun test src/tests/extractors/

# Rule engine tests only  
bun test src/tests/rule-engine/

# End-to-end tests only
bun test src/tests/e2e/

# Individual test files
bun test src/tests/extractors/docx.test.ts
bun test src/tests/extractors/pptx.test.ts
bun test src/tests/rule-engine/scoring.test.ts
bun test src/tests/e2e/upload-grade-export.test.ts
```

### Test Configuration

Tests are configured using Vitest with the following setup:
- **Framework**: Vitest (configured in `vitest.config.ts`)
- **Environment**: Node.js
- **Timeout**: 10 seconds per test
- **Path Aliases**: Configured to match TypeScript paths (`@/`, `@core/`, etc.)

## Test Fixtures

### XML Fixtures
The test suite includes minimal XML fixtures that represent:
- DOCX document structure with tables, headings, TOC elements
- PPTX presentation with slides, themes, slide masters
- Sample slide content with various elements

### Mock Implementation
E2E tests use a mock HTTP server implementation that simulates:
- File upload responses
- Grading API responses with realistic grade results
- Error scenarios for testing edge cases

## Key Testing Principles

1. **Robustness**: Tests validate both success and failure scenarios
2. **Performance**: Tests include performance benchmarks to ensure reasonable execution times
3. **Isolation**: Each test is independent and doesn't rely on external services
4. **Comprehensive Coverage**: Tests cover all major features and edge cases
5. **Vietnamese Logging**: Tests validate Vietnamese language logging output

## Test Results Interpretation

- **✓ Pass**: Test completed successfully
- **✗ Fail**: Test failed with assertion error
- **Performance Tests**: Validate operations complete within reasonable time limits
- **Error Handling Tests**: Ensure graceful handling of invalid inputs

## Notes for Developers

1. **XML Parsing**: Some tests may show lower detection rates due to simplified XML fixtures. This is expected for testing purposes.
2. **Mock Responses**: E2E tests use mock implementations for testing the API interface without requiring real backend services.
3. **Vietnamese Text**: All logging and error messages should be in Vietnamese as per project requirements.
4. **Fixture Limitations**: Test fixtures are minimal examples - real document parsing may detect more features.

## Future Enhancements

- Add integration tests with real DOCX/PPTX files
- Enhance XML fixtures with more complex document structures
- Add performance regression testing
- Implement coverage reporting
- Add visual regression testing for exported results