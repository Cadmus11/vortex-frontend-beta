import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Vortex/i)
  })

  test('has sign in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[id="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[id="password"]')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('App Shell', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/voter/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
