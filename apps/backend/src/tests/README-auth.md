# Authentication System Testing Documentation

## Overview

This document describes the comprehensive testing strategy for the JWT-based authentication system implemented in the Office Vibe Code backend.

## Test Structure

The authentication system is tested at multiple levels:

### 1. Unit Tests

Located in:
- `src/tests/middlewares/auth.middleware.test.ts`
- `src/tests/controllers/auth.controller.test.ts`
- `src/tests/services/user.service.test.ts`

These tests verify individual components in isolation.

### 2. Integration Tests

Located in:
- `src/tests/integration/auth.integration.test.ts`

These tests verify that multiple components work together correctly.

### 3. End-to-End Tests

Located in:
- `src/tests/e2e/auth.e2e.test.ts`

These tests simulate real user interactions with the authentication system.

## Test Coverage

### Middleware Tests (`auth.middleware.test.ts`)

1. Token validation:
   - Requests without tokens are rejected
   - Invalid tokens are rejected
   - Valid tokens from Authorization header are accepted
   - Valid tokens from cookies are accepted
   - Expired tokens are rejected
   - Cookie tokens take precedence over header tokens

### Controller Tests (`auth.controller.test.ts`)

1. User information retrieval:
   - Current user information is returned correctly
2. Logout functionality:
   - Logout clears authentication cookies

### Service Tests (`user.service.test.ts`)

1. Module imports:
   - UserService is imported correctly

### Integration Tests (`auth.integration.test.ts`)

1. Complete flow:
   - Token creation → authentication → protected route access
   - Invalid token rejection

### E2E Tests (`auth.e2e.test.ts`)

1. Login flow:
   - Successful login with valid credentials
   - Rejection of invalid credentials
2. Protected route access:
   - Rejection of access without token
   - Access granted with valid token (cookie)
   - Access granted with valid token (Authorization header)
3. Logout flow:
   - Successful logout and cookie clearing
4. User information:
   - Current user info retrieval with valid token
   - Rejection of requests without token

## Running Tests

To run all authentication tests:

```bash
bun test src/tests/middlewares/auth.middleware.test.ts src/tests/controllers/auth.controller.test.ts src/tests/services/user.service.test.ts src/tests/integration/auth.integration.test.ts src/tests/e2e/auth.e2e.test.ts
```

To run a specific test suite:

```bash
# Middleware tests
bun test src/tests/middlewares/auth.middleware.test.ts

# Controller tests
bun test src/tests/controllers/auth.controller.test.ts

# E2E tests
bun test src/tests/e2e/auth.e2e.test.ts
```

## Test Results

All tests should pass with the following results:
- 6 middleware tests
- 2 controller tests
- 1 service test
- 2 integration tests
- 8 E2E tests

Total: 19 tests, 0 failures

## Logging

All authentication tests use Vietnamese logging consistent with the rest of the application:
- ✅ [INFO] for successful operations
- ⚠️ [WARN] for expected errors (like invalid tokens)
- ❌ [ERROR] for unexpected errors

## Security Considerations Tested

1. HttpOnly cookies prevent XSS attacks
2. Token expiration is properly enforced
3. Invalid tokens are rejected
4. Secure flag is set appropriately based on environment
5. SameSite attribute prevents CSRF attacks