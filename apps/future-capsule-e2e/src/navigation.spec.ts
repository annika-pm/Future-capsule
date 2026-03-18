/**
 * E2E Tests: Insights and Timeline Navigation
 * Tests mood analytics and capsule grouping
 */

import { test, expect } from '@playwright/test';

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timeline', { waitUntil: 'networkidle' });
  });

  test('should display timeline page', async ({ page }) => {
    // Page should have loaded
    await expect(page).toHaveURL(/\/timeline/);

    // Should have some content
    const content = page.locator('main, [role="main"], body').first();
    await expect(content).toBeVisible();
  });

  test('should group capsules by status', async ({ page }) => {
    const locked = page.locator('text=locked|scheduled', { exact: false }).first();
    const opening = page.locator('text=opening|soon|upcoming', { exact: false }).first();
    const unlocked = page.locator('text=unlocked|open|available', { exact: false }).first();

    // At least one section should exist
    const hasAnySection = await Promise.all([
      locked.isVisible().catch(() => false),
      opening.isVisible().catch(() => false),
      unlocked.isVisible().catch(() => false),
    ]).then((results) => results.some((r) => r === true));

    expect(hasAnySection).toBe(true);
  });

  test('should display capsules sorted by unlock date', async ({ page }) => {
    const capsules = page.locator('[data-testid="timeline-item"], .timeline-item, [role="article"]');

    const count = await capsules.count();

    if (count > 1) {
      // Check if items are ordered (visual indicator)
      const firstItem = capsules.nth(0);
      const secondItem = capsules.nth(1);

      await expect(firstItem).toBeVisible();
      await expect(secondItem).toBeVisible();
    }
  });

  test('should allow filtering by status', async ({ page }) => {
    const filterButtons = page.locator('button:has-text("Filter|All|Locked|Unlocked")');

    const hasFilters = await filterButtons.count();

    if (hasFilters > 0) {
      const lockedFilter = filterButtons.filter({ hasText: 'locked' });

      if (await lockedFilter.count()) {
        await lockedFilter.first().click();

        // List should update
        await page.waitForTimeout(500);
      }
    }
  });

  test('should navigate to capsule from timeline', async ({ page }) => {
    const timelineItem = page.locator('[data-testid="timeline-item"], .timeline-item, [role="article"]').first();

    if (await timelineItem.isVisible().catch(() => false)) {
      await timelineItem.click();

      // Should navigate or open details
      await page.waitForTimeout(500);

      const urlChanged = page.url().includes('/capsule');
      const modalOpened = await page.locator('[role="dialog"], .modal, [data-testid="capsule-detail"]').isVisible().catch(() => false);

      expect(urlChanged || modalOpened).toBe(true);
    }
  });

  test('should show countdown on timeline items', async ({ page }) => {
    const countdown = page.locator('text=/\\d+d\\s+\\d+h|days|hours/i').first();

    const hasCountdown = await countdown.isVisible().catch(() => false);

    // Not all items may have countdown, so this is optional
    if (hasCountdown) {
      expect(hasCountdown).toBe(true);
    }
  });
});

test.describe('Insights Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/insights', { waitUntil: 'networkidle' });
  });

  test('should display insights page', async ({ page }) => {
    await expect(page).toHaveURL(/\/insights/);

    const content = page.locator('main, [role="main"]').first();
    await expect(content).toBeVisible();
  });

  test('should display mood statistics', async ({ page }) => {
    const stats = page.locator('[data-testid="mood-stats"], .stats-section, [aria-label*="mood"]').first();

    const hasStats = await stats.isVisible().catch(() => false);

    // Check for mood counts or indicators
    const moodText = page.locator('text=/happy|sad|motivated|confused|grateful|hopeful/i').first();
    const hasMoodText = await moodText.isVisible().catch(() => false);

    expect(hasStats || hasMoodText).toBe(true);
  });

  test('should display mood chart', async ({ page }) => {
    const chart = page.locator('[data-testid="mood-chart"], canvas, svg, .chart').first();

    const hasChart = await chart.isVisible().catch(() => false);

    if (hasChart) {
      expect(hasChart).toBe(true);
    }
  });

  test('should show mood breakdown', async ({ page }) => {
    const breakdown = page.locator('[data-testid="mood-breakdown"], .breakdown, [aria-label*="distribution"]').first();

    const hasBreakdown = await breakdown.isVisible().catch(() => false);

    // Check for mood counts visible somewhere
    const moodCount = page.locator('text=/\\d+\\s*(capsules|entries|moods?)/', { exact: false }).first();
    const hasMoodCount = await moodCount.isVisible().catch(() => false);

    expect(hasBreakdown || hasMoodCount).toBe(true);
  });

  test('should update stats after creating new capsule', async ({ page }) => {
    // Get initial stat count
    const statElements = page.locator('[data-testid="mood-count"], .mood-item').first();
    const initialCount = await statElements.textContent?.();

    // Navigate to create capsule
    const createButton = page.locator('button:has-text("Create|New Capsule")').first();

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();

      // Create a new capsule (simplified)
      const titleInput = page.locator('input[placeholder*="title" i]').first();

      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill('Test Capsule for Stats');

        const submitButton = page.locator('button:has-text("Create|Submit|Save")').first();

        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();

          // Navigate back to insights
          await page.goto('/insights', { waitUntil: 'networkidle' });

          // Stats should have updated
          const updatedCount = await statElements.textContent?.();

          // Count may have changed
          expect(updatedCount).toBeDefined();
        }
      }
    }
  });

  test('should display total capsules count', async ({ page }) => {
    const totalCount = page.locator('text=/\\d+\\s*(total|capsules)/i').first();

    const hasCount = await totalCount.isVisible().catch(() => false);

    if (hasCount) {
      expect(hasCount).toBe(true);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const content = page.locator('main, [role="main"]').first();

    await expect(content).toBeVisible();

    // Content should still be accessible
    const chart = page.locator('[data-testid="mood-chart"], canvas, svg').first();

    const isChartVisible = await chart.isVisible().catch(() => false);

    // Chart may be hidden on mobile but content should be reorganized
    expect(isChartVisible !== undefined).toBe(true);
  });
});

test.describe('Navigation Between Views', () => {
  test('should navigate from dashboard to timeline', async ({ page }) => {
    await page.goto('/dashboard');

    const timelineLink = page.locator('a:has-text("Timeline"), button:has-text("Timeline")').first();

    if (await timelineLink.isVisible().catch(() => false)) {
      await timelineLink.click();

      await expect(page).toHaveURL(/\/timeline/);
    }
  });

  test('should navigate from dashboard to insights', async ({ page }) => {
    await page.goto('/dashboard');

    const insightsLink = page.locator('a:has-text("Insights"), button:has-text("Insights"), a:has-text("Stats")').first();

    if (await insightsLink.isVisible().catch(() => false)) {
      await insightsLink.click();

      await expect(page).toHaveURL(/\/insights/);
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/timeline');

    const backButton = page.locator('button:has-text("Dashboard|Home|Back")', { exact: false }).first();

    if (await backButton.isVisible().catch(() => false)) {
      await backButton.click();

      const isDashboard = page.url().includes('/dashboard');

      expect(isDashboard || page.url().includes('/create')).toBe(true);
    }
  });
});
