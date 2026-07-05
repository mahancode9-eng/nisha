import { test, expect } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:9000";

test("homepage renders", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});

test("backend health endpoint responds", async ({ request }) => {
  const res = await request.get(`${API_URL}/api/v1/health`);
  expect(res.ok()).toBeTruthy();
});

test("backend sends request id and security headers", async ({ request }) => {
  const res = await request.get(`${API_URL}/api/v1/health`);
  expect(res.headers()["x-request-id"]).toBeTruthy();
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
});
