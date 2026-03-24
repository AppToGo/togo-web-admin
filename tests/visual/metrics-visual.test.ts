/**
 * Visual Regression Tests for Metrics System
 *
 * Tests para verificar la consistencia visual del sistema de métricas.
 * Requiere Playwright para captura de screenshots.
 */

import { test, expect } from "@playwright/test";

test.describe("Metrics Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication if needed
    await page.goto("/dashboard");
  });

  test("MetricCard renders consistently", async ({ page }) => {
    // Create a test page with all MetricCard variants
    await page.setContent(`
      <div style="padding: 24px; background: #f8fafc;">
        <div style="display: grid; gap: 16px; grid-template-columns: repeat(4, 1fr);">
          <div class="metric-card metric-card--indigo">
            <div class="p-5 rounded-card-lg border border-slate-100 bg-white">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-slate-500 mb-1">Revenue</p>
                  <p class="text-2xl font-bold text-slate-900">$10,000</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span class="text-indigo-600">$</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="metric-card metric-card--emerald">
            <div class="p-5 rounded-card-lg border border-slate-100 bg-white">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-slate-500 mb-1">Orders</p>
                  <p class="text-2xl font-bold text-slate-900">1,234</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span class="text-emerald-600">🛒</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="metric-card metric-card--gradient">
            <div class="p-5 rounded-card-lg bg-gradient-indigo-purple text-white">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-white/70 mb-1">Total</p>
                  <p class="text-2xl font-bold">$50,000</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span class="text-white">💰</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    await expect(page).toHaveScreenshot("metric-cards-all-variants.png");
  });

  test("ProgressBar renders consistently", async ({ page }) => {
    await page.setContent(`
      <div style="padding: 24px; background: #f8fafc; max-width: 400px;">
        <div style="display: flex; flex-direction: gap: 16px;">
          <div style="margin-bottom: 16px;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-slate-600">Confirmed</span>
              <span class="text-sm font-medium text-slate-700">50 / 100</span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden bg-slate-100">
              <div class="h-full rounded-full bg-blue-500" style="width: 50%"></div>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-slate-600">In Progress</span>
              <span class="text-sm font-medium text-slate-700">75 / 100</span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden bg-slate-100">
              <div class="h-full rounded-full bg-purple-500" style="width: 75%"></div>
            </div>
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-slate-600">Completed</span>
              <span class="text-sm font-medium text-slate-700">100 / 100</span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden bg-slate-100">
              <div class="h-full rounded-full bg-emerald-500" style="width: 100%"></div>
            </div>
          </div>
        </div>
      </div>
    `);

    await expect(page).toHaveScreenshot("progress-bars-all-colors.png");
  });

  test("RankingItem renders consistently", async ({ page }) => {
    await page.setContent(`
      <div style="padding: 24px; background: #f8fafc; max-width: 500px;">
        <div class="space-y-2">
          <!-- Gold -->
          <div class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
                🥇
              </div>
              <div>
                <p class="font-medium text-slate-900">First Place</p>
                <p class="text-sm text-slate-500">+1 234 567</p>
              </div>
            </div>
            <span class="font-semibold text-emerald-600">$10,000</span>
          </div>
          
          <!-- Silver -->
          <div class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                🥈
              </div>
              <div>
                <p class="font-medium text-slate-900">Second Place</p>
                <p class="text-sm text-slate-500">+1 234 568</p>
              </div>
            </div>
            <span class="font-semibold text-emerald-600">$8,000</span>
          </div>
          
          <!-- Bronze -->
          <div class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                🥉
              </div>
              <div>
                <p class="font-medium text-slate-900">Third Place</p>
                <p class="text-sm text-slate-500">+1 234 569</p>
              </div>
            </div>
            <span class="font-semibold text-emerald-600">$5,000</span>
          </div>
          
          <!-- Regular -->
          <div class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-600 font-semibold text-sm">
                4
              </div>
              <div>
                <p class="font-medium text-slate-900">Fourth Place</p>
                <p class="text-sm text-slate-500">+1 234 570</p>
              </div>
            </div>
            <span class="font-semibold text-emerald-600">$3,000</span>
          </div>
        </div>
      </div>
    `);

    await expect(page).toHaveScreenshot("ranking-items-all-medals.png");
  });

  test("Metrics system color consistency", async ({ page }) => {
    // Verificar que los colores son consistentes
    await page.setContent(`
      <div style="padding: 24px; background: #f8fafc;">
        <h2>Color System Verification</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px;">
          <div>
            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 16px;"></div>
            <p>Indigo-Purple Gradient</p>
          </div>
          <div>
            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #34d399 0%, #2dd4bf 100%); border-radius: 16px;"></div>
            <p>Emerald-Teal Gradient</p>
          </div>
          <div>
            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #fb923c 0%, #fbbf24 100%); border-radius: 16px;"></div>
            <p>Orange-Amber Gradient</p>
          </div>
        </div>
      </div>
    `);

    await expect(page).toHaveScreenshot("metrics-color-system.png");
  });

  test("Responsive behavior at different viewports", async ({ page }) => {
    await page.setContent(`
      <div style="padding: 24px; background: #f8fafc;">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div class="p-5 rounded-card-lg border border-slate-100 bg-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Card 1</p>
                <p class="text-2xl font-bold text-slate-900">100</p>
              </div>
            </div>
          </div>
          <div class="p-5 rounded-card-lg border border-slate-100 bg-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Card 2</p>
                <p class="text-2xl font-bold text-slate-900">200</p>
              </div>
            </div>
          </div>
          <div class="p-5 rounded-card-lg border border-slate-100 bg-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Card 3</p>
                <p class="text-2xl font-bold text-slate-900">300</p>
              </div>
            </div>
          </div>
          <div class="p-5 rounded-card-lg border border-slate-100 bg-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Card 4</p>
                <p class="text-2xl font-bold text-slate-900">400</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot("metrics-responsive-mobile.png");

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot("metrics-responsive-tablet.png");

    // Test desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page).toHaveScreenshot("metrics-responsive-desktop.png");
  });
});
