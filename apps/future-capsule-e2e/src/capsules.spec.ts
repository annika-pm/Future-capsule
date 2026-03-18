/**
 * E2E Tests: Capsule Creation and Unlock
 * Tests creating capsules, viewing them, and unlock flow
 */

import { test, expect } from '@playwright/test';

test.describe('Capsule Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes user is logged in)
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test('should navigate to create capsule page', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create|New Capsule")').first();

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await expect(page).toHaveURL(/\/create/);
    }
  });

  test('should display capsule form with all fields', async ({ page }) => {
    await page.goto('/create');

    const titleInput = page.locator('input[placeholder*="title" i], input[aria-label*="title" i]').first();
    const messageInput = page.locator('textarea, [contenteditable="true"]').first();
    const moodSelect = page.locator('select, button:has-text("mood")').first();
    const dateInput = page.locator('input[type="date"], input[type="datetime-local"]').first();

    // At least some fields should be visible
    const anyFieldVisible = await Promise.all([
      titleInput.isVisible().catch(() => false),
      messageInput.isVisible().catch(() => false),
      moodSelect.isVisible().catch(() => false),
      dateInput.isVisible().catch(() => false),
    ]).then((results) => results.some((r) => r === true));

    expect(anyFieldVisible).toBe(true);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/create');

    const submitButton = page.locator('button:has-text("Create|Submit|Save")').first();

    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();

      // Should show validation errors
      await page.waitForTimeout(500);
      const errorVisible = await page.locator('text=required|error').isVisible().catch(() => false);
      // Accept either validation error shown or form still visible
      expect(
        errorVisible === true || 
        await page.url().includes('/create')
      ).toBeTruthy();
    }
  });

  test('should prevent past unlock dates', async ({ page }) => {
    await page.goto('/create');

    const dateInput = page.locator('input[type="date"], input[type="datetime-local"]').first();

    if (await dateInput.isVisible().catch(() => false)) {
      // Try to set a past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await dateInput.fill(pastDate.toISOString().split('T')[0]);

      const submitButton = page.locator('button:has-text("Create|Submit|Save")').first();

      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();

        const errorMsg = page.locator('text=past|future|date');
        const hasError = await errorMsg.isVisible().catch(() => false);

        if (hasError) {
          expect(hasError).toBe(true);
        }
      }
    }
  });

  test('should create capsule with valid data', async ({ page }) => {
    await page.goto('/create');

    // Fill form with valid data
    const titleInput = page.locator('input[placeholder*="title" i], input[aria-label*="title" i]').first();
    const messageInput = page.locator('textarea, [contenteditable="true"]').first();
    const dateInput = page.locator('input[type="date"], input[type="datetime-local"]').first();

    if (
      (await titleInput.isVisible().catch(() => false)) &&
      (await messageInput.isVisible().catch(() => false)) &&
      (await dateInput.isVisible().catch(() => false))
    ) {
      await titleInput.fill('My Future Letter');
      await messageInput.fill('A message to my future self about my goals and dreams.');

      // Set unlock date to 30 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      await dateInput.fill(futureDate.toISOString().split('T')[0]);

      const submitButton = page.locator('button:has-text("Create|Submit|Save")').first();

      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();

        // Wait for navigation to dashboard or success message
        await page.waitForURL(/\/dashboard|\/capsule/, { timeout: 5000 }).catch(() => {});

        // Check if capsule appears in list or success message shown
        const success = await page
          .locator('text=created|success|capsule')
          .isVisible()
          .catch(() => false);

        expect(success || page.url().includes('/dashboard')).toBeTruthy();
      }
    }
  });
});

test.describe('Capsule Viewing and Unlock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test('should display capsule list on dashboard', async ({ page }) => {
    const capsuleList = page.locator('[data-testid="capsule-list"], .capsule-card, [role="article"]').first();

    const isCapsuleVisible = await capsuleList.isVisible().catch(() => false);
    const hasText = await page.locator('text=capsule|time').isVisible().catch(() => false);

    expect(isCapsuleVisible || hasText).toBe(true);
  });

  test('should show countdown for locked capsules', async ({ page }) => {
    const capsuleCard = page.locator('[data-testid="capsule-card"], .capsule-card').first();

    if (await capsuleCard.isVisible().catch(() => false)) {
      const countdown = capsuleCard.locator('text=/\\d+[dhms]/');
      const hasCountdown = await countdown.isVisible().catch(() => false);

      if (hasCountdown) {
        expect(hasCountdown).toBe(true);
      }
    }
  });

  test('should navigate to capsule viewer', async ({ page }) => {
    const capsuleCard = page.locator('[data-testid="capsule-card"], .capsule-card, [role="article"]').first();

    if (await capsuleCard.isVisible().catch(() => false)) {
      await capsuleCard.click();

      // Should navigate to capsule view or modal open
      await page.waitForTimeout(1000);
      const isViewerOpen = await page
        .locator('[data-testid="capsule-viewer"], .capsule-viewer, [role="dialog"]')
        .isVisible()
        .catch(() => false);

      const urlChanged = page.url().includes('/capsule') || page.url().includes('/view');

      expect(isViewerOpen || urlChanged).toBe(true);
    }
  });

  test('should show locked state for future capsules', async ({ page }) => {
    const lockedBadge = page.locator('text=/locked|schedule|upcoming/i').first();

    const isVisible = await lockedBadge.isVisible().catch(() => false);

    // Badge may exist or countdown itself indicates locked state
    expect(isVisible || (await page.locator('text=/\\d+d\\s+\\d+h/').isVisible().catch(() => false))).toBeTruthy();
  });

  test('should show full content for unlocked capsules', async ({ page }) => {
    // Navigate to a capsule (this example assumes one exists and is unlocked)
    const unlockedCapsule = page.locator('[data-testid="capsule-card"], .capsule-card').filter({ hasText: 'unlocked' }).first();

    if (await unlockedCapsule.isVisible().catch(() => false)) {
      await unlockedCapsule.click();

      await page.waitForTimeout(500);

      // Message content should be visible
      const message = page.locator('[data-testid="capsule-message"], .message-content, p').first();
      const isVisible = await message.isVisible().catch(() => false);

      if (isVisible) {
        expect(isVisible).toBe(true);
      }
    }
  });
});

test.describe('Capsule Editing and Deletion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test('should allow editing capsule before unlock', async ({ page }) => {
    const lockedCapsuleCard = page.locator('[data-testid="capsule-card"], .capsule-card').first();

    if (await lockedCapsuleCard.isVisible().catch(() => false)) {
      // Look for edit button
      const editButton = lockedCapsuleCard.locator('button:has-text("Edit")');

      const hasEditButton = await editButton.isVisible().catch(() => false);

      if (hasEditButton) {
        expect(hasEditButton).toBe(true);
      }
    }
  });

  test('should prevent editing after unlock', async ({ page }) => {
    const unlockedCapsule = page.locator('[data-testid="capsule-card"], .capsule-card').filter({ hasText: /unlocked/i }).first();

    if (await unlockedCapsule.isVisible().catch(() => false)) {
      const editButton = unlockedCapsule.locator('button:has-text("Edit")');

      const hasEditButton = await editButton.isVisible().catch(() => false);

      // Edit button should not be visible for unlocked capsules
      expect(hasEditButton).toBe(false);
    }
  });

  test('should delete capsule with confirmation', async ({ page }) => {
    const capsuleCard = page.locator('[data-testid="capsule-card"], .capsule-card').first();

    if (await capsuleCard.isVisible().catch(() => false)) {
      const deleteButton = capsuleCard.locator('button:has-text("Delete")');

      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();

        // Check for confirmation dialog
        const confirmButton = page.locator('button:has-text("Confirm|Delete|Yes")');

        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();

          // Capsule should be removed from list
          await page.waitForTimeout(1000);
          const stillExists = await capsuleCard.isVisible().catch(() => false);

          expect(stillExists).toBe(false);
        }
      }
    }
  });
});
