import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Sign in/i)
  })

  test('has sign in form', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[name="emailAddress"]').or(page.locator('input[type="email"]'))
    const passwordInput = page.locator('input[name="password"]').or(page.locator('input[type="password"]'))
    await expect(emailInput.or(page.locator('form'))).toBeVisible({ timeout: 10000 })
  })
})

test.describe('App Shell', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/voter/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
