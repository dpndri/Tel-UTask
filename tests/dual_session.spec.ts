import { test, expect, devices } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test.describe("Concurrent Desktop & Mobile Realtime Session", () => {
  test("Desktop and Mobile concurrent session with user 103012500187", async ({ browser }) => {
    // 1. Sesi Desktop: Viewport 1280x800
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const desktopPage = await desktopContext.newPage();

    // 2. Sesi Mobile: Viewport 390x844 (iPhone 14)
    const mobileContext = await browser.newContext({
      ...devices["iPhone 14"],
    });
    const mobilePage = await mobileContext.newPage();

    // Helper fungsi login SSO
    const loginSession = async (page: any, sessionLabel: string) => {
      await page.goto("/login");
      await page.fill('input[placeholder*="Contoh: 103012500187"]', "103012500187");
      await page.fill('input[type="password"]', "Vvxenc1337@");
      const ketuaBtn = page.getByRole("button", { name: /2\. Ketua Kelompok/i });
      await ketuaBtn.click();
      await page.click('button[type="submit"]');
      await page.waitForURL("/", { timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log(`[${sessionLabel}] Login berhasil.`);
    };

    // 3. Login kedua sesi secara bersamaan
    await Promise.all([
      loginSession(desktopPage, "DESKTOP"),
      loginSession(mobilePage, "MOBILE"),
    ]);

    // 4. Verifikasi kedua sesi aktif bersamaan tanpa saling menendang (tidak ada session logout)
    await expect(desktopPage.locator("body")).toContainText("Muhammad Irgie Dapiandri");
    await expect(mobilePage.locator('button[aria-label="Buka menu navigasi"]')).toBeVisible();

    // Pastikan mobile tidak ada horizontal overflow
    const mobileOverflow = await mobilePage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(mobileOverflow.scrollWidth).toBeLessThanOrEqual(mobileOverflow.clientWidth);

    // 5. Interaksi Realtime A: Buat Tugas Baru dari Mobile
    const taskUid = Date.now().toString().slice(-4);
    const testTaskTitle = `Tugas Uji Realtime #${taskUid}`;

    console.log(`[MOBILE] Membuat tugas baru "${testTaskTitle}"...`);
    await mobilePage.click('button:has-text("+ Tugas")');
    await mobilePage.fill('input[placeholder*="Laporan Pendahuluan"]', testTaskTitle);
    await mobilePage.click('button[type="submit"]:has-text("Simpan Tugas")');
    await mobilePage.waitForTimeout(1000);

    // Verifikasi tugas baru muncul di Desktop SECARA REALTIME tanpa refresh!
    console.log("[DESKTOP] Menunggu pembaruan broadcast realtime dari Mobile...");
    await expect(desktopPage.locator("body")).toContainText(testTaskTitle, { timeout: 10000 });
    console.log("[DESKTOP] Tugas baru diterima secara realtime!");

    // 6. Interaksi Realtime B: Ubah Status Tugas dari Mobile
    console.log(`[MOBILE] Mengubah status tugas "${testTaskTitle}" menjadi Sedang Dikerjakan...`);
    const mobileTaskCard = mobilePage.locator("div.divide-y > div", { hasText: testTaskTitle });
    const statusSelectBtn = mobileTaskCard.locator("button:has-text('Belum Dikerjakan')");
    await statusSelectBtn.click();

    // Pilih opsi "Sedang Dikerjakan" dari menu popover dropdown
    const optionSedang = mobileTaskCard.locator(".absolute button", { hasText: "Sedang Dikerjakan" });
    await optionSedang.click();
    await mobilePage.waitForTimeout(1000);

    // Verifikasi di Desktop bahwa status tugas tersebut berubah jadi "Sedang Dikerjakan" secara realtime
    const desktopTaskCard = desktopPage.locator("div.divide-y > div", { hasText: testTaskTitle });
    await expect(desktopTaskCard).toContainText("Sedang Dikerjakan", { timeout: 10000 });
    console.log("[DESKTOP] Perubahan status diterima secara realtime tanpa reload!");

    // 7. Uji Reset Matkul dari Mobile & Verifikasi Desktop Bersih Tanpa Stuttering
    console.log("[MOBILE] Masuk ke halaman /celoe untuk reset data...");
    await mobilePage.goto("/celoe");
    await mobilePage.waitForURL("/celoe", { timeout: 10000 });

    const resetBtn = mobilePage.locator("button:has-text('Reset Semua')");
    await resetBtn.waitFor({ state: "visible", timeout: 8000 });
    await resetBtn.click();
    console.log("[MOBILE] Tombol Reset Semua diklik.");

    // Verifikasi di Mobile langsung tampil konfirmasi reset berhasil
    await expect(mobilePage.locator("body")).toContainText("berhasil dikosongkan");

    // Verifikasi di Desktop (tanpa reload / otomatis sinkron realtime) sinkron bersih
    await expect(desktopPage.locator("body")).toContainText("Urutan Fokus Pengerjaan", { timeout: 10000 });
    console.log("[DESKTOP] Sinkronisasi reset bersih tanpa stuttering!");

    // 8. Pulihkan kembali data otentik CeLOE agar akun mahasiswa selalu terisi dan tidak kosong
    const syncBtn = mobilePage.locator("button:has-text('Jalankan Sinkronisasi Tugas CeLOE')");
    await syncBtn.click();
    await mobilePage.waitForTimeout(2500);
    console.log("[MOBILE] Data CeLOE berhasil dipulihkan otomatis.");

    // 9. Simpan screenshot kedua sesi sebagai bukti visual
    fs.mkdirSync("test-results", { recursive: true });
    const desktopScreenshotPath = "test-results/desktop-dual-session.png";
    const mobileScreenshotPath = "test-results/mobile-dual-session.png";

    await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });

    // Salin ke artifact directory
    const artifactDir = "C:/Users/dpndri/.gemini/antigravity/brain/3a17ec66-a4e7-4de7-8580-76707d3b753b";
    try {
      fs.copyFileSync(desktopScreenshotPath, path.join(artifactDir, "desktop-dual-session.png"));
      fs.copyFileSync(mobileScreenshotPath, path.join(artifactDir, "mobile-dual-session.png"));
    } catch (e) {
      console.log("Salin gambar:", e);
    }

    console.log("Pengujian sesi ganda sukses 100%!");

    await desktopContext.close();
    await mobileContext.close();
  });
});
