# Production-Readiness Standards

This document defines standards for production-ready code in the farmer-app project.

## Core Requirements

### 1. No Debug Code
- ❌ Remove ALL `console.log()`, `console.error()`, `console.warn()`
- ❌ Remove all `debugger;` statements
- ❌ Remove commented-out code blocks

### 2. Error Handling & User Feedback
- ✅ Non-technical, user-friendly error messages only
- ✅ All API errors caught and translated to user messages
- ✅ Network errors: "Check your internet connection"
- ✅ Timeout errors (>30s): "Request took too long, please retry"
- ✅ 401 errors: Auto-redirect to login
- ✅ 403 errors: "Permission denied"
- ✅ 404 errors: "Not found"
- ✅ 500 errors: "Server error, try later"
- ✅ Empty state messages when no data

### 3. Network & Performance
- ✅ HTTP timeout: 30 seconds on all requests
- ✅ Retry logic: Exponential backoff (1s → 2s → 4s, max 3 retries)
- ✅ Caching: Reference data (states, cities, locations) with 24-hour TTL
- ✅ Search/filters: Use `switchMap` to prevent race conditions
- ✅ Loading indicators on all async operations

### 4. Security
- ✅ Auth tokens on all protected requests
- ✅ Auto-retry on 401 with token refresh (no user interruption)
- ✅ No sensitive data in errors/logs (no IDs, tokens, PII, passwords)
- ✅ Form validation (client + server)
- ✅ No credentials in URLs

### 5. Memory Management
- ✅ RxJS subscriptions cleaned with `takeUntil(destroy$)` pattern
- ✅ `destroy$` subject in `ngOnDestroy`
- ✅ Event listeners removed on destroy
- ✅ Timers cleared (setTimeout, setInterval)
- ✅ Polling stopped on navigation

### 6. User Experience
- ✅ Buttons disabled during loading (prevent double-clicks)
- ✅ Toast notifications for all feedback
- ✅ Confirmation dialogs for destructive actions
- ✅ Back button works properly
- ✅ Responsive design

### 7. Code Quality
- ✅ No `any` types (use strict TypeScript)
- ✅ Clear, descriptive variable names
- ✅ Functions < 100 lines
- ✅ Single responsibility principle
- ✅ DRY (Don't Repeat Yourself)
- ✅ Consistent formatting and indentation

### 8. Translations
- ✅ NO hardcoded user-facing text
- ✅ ALL UI text has i18n keys
- ✅ All error messages translated

### 9. Deployment
- ✅ Environment variables for API URLs (no hardcoded endpoints)
- ✅ Production build: minification ON, AOT ON
- ✅ No test data in production code
- ✅ Feature flags for gradual rollout if needed
