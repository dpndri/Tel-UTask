import { test, expect } from "@playwright/test";

test.describe("Mobile Layout & Navigation Test", () => {
  test("User 103012500187 Login, No Overflow, and Hamburger Menu", async ({ page, isMobile }) => {
    // 1. Masuk ke halaman login
    await page.goto("/login");
    await expect(page).toHaveTitle(/Tel-UTask/);

    // 2. Isi kredensial SSO user
    await page.fill('input[placeholder*="Contoh: 103012500187"]', "103012500187");
    await page.fill('input[type="password"]', "Vvxenc1337@");

    // 3. Pilih role Ketua Kelompok
    const ketuaButton = page.getByRole("button", { name: /2\. Ketua Kelompok/i });
    await ketuaButton.click();

    // 4. Submit login form
    await page.click('button[type="submit"]');

    // 5. Tunggu redirect ke dashboard /
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page.locator("body")).toBeVisible();

    // Tunggu konten dimuat
    await page.waitForTimeout(1000);

    // 6. Verifikasi tidak ada horizontal scroll overflow
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // 7. Jika di perangkat mobile, uji hamburger menu
    if (isMobile) {
      const hamburgerBtn = page.locator('button[aria-label="Buka menu navigasi"]');
      await expect(hamburgerBtn).toBeVisible();

      // Buka menu hamburger
      await hamburgerBtn.click();
      const mobileDrawer = page.locator(".fixed.inset-0 aside");
      await expect(mobileDrawer).toBeVisible();

      // Tutup menu hamburger
      const closeBtn = page.locator('button[aria-label="Tutup menu navigasi"]');
      await closeBtn.click();
      await expect(mobileDrawer).not.toBeVisible();

      // Buka kembali dan navigasi ke Kalender
      await hamburgerBtn.click();
      await mobileDrawer.locator('a[href="/calendar"]').click();
      await page.waitForURL("/calendar", { timeout: 10000 });

      // Verifikasi no horizontal scroll di halaman kalender
      const calScroll = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(calScroll.scrollWidth).toBeLessThanOrEqual(calScroll.clientWidth);
    }

    // 8. Ambil screenshot bukti
    await page.screenshot({ path: `test-results/mobile-proof-${isMobile ? "mobile" : "desktop"}.png`, fullPage: false });
  });

  test("Reject login with incorrect password", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder*="Contoh: 103012500187"]', "103012500187");
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.getByRole("button", { name: /2\. Ketua Kelompok/i }).click();
    await page.click('button[type="submit"]');
    await expect(page.locator("body")).toContainText("Kata sandi salah");
  });
});
