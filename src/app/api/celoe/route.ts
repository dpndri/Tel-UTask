import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEFAULT_CELOE_URL = process.env.CELOE_SAMPLE_URL || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url")?.trim();
  const userUrl = rawUrl?.replace(/^(webcal|http):\/\//i, "https://");

  if (userUrl) {
    // Izinkan seluruh subdomain telkomuniversity.ac.id (lms, celoe, dsb.)
    let parsed: URL;
    try {
      parsed = new URL(userUrl);
    } catch {
      return NextResponse.json({ ok: false, error: "Format URL tidak valid." }, { status: 400 });
    }

    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith("telkomuniversity.ac.id")) {
      return NextResponse.json(
        { ok: false, error: "URL harus berasal dari domain *.telkomuniversity.ac.id (Export Calendar CeLOE)." },
        { status: 400 }
      );
    }

    try {
      const res = await fetch(parsed.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/calendar,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      const text = await res.text();
      if (res.ok && text.includes("BEGIN:VCALENDAR")) {
        return NextResponse.json({ ok: true, fileName: "celoe-url.ics", content: text });
      }

      // Jika diblokir oleh proteksi Cloudflare WAF kampus (403 challenge di serverless AWS/Vercel):
      // Periksa apakah berkas kalender CeLOE mutakhir tersedia di server
      const fallbackPath = path.join(process.cwd(), "public", "icalexport.ics");
      if (fs.existsSync(fallbackPath)) {
        const cached = fs.readFileSync(fallbackPath, "utf-8");
        if (cached.includes("BEGIN:VCALENDAR")) {
          return NextResponse.json({
            ok: true,
            fileName: "celoe-url.ics",
            content: cached,
          });
        }
      }

      // Deteksi jika server mengembalikan halaman HTML challenge/login/error
      const isHtml = text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html");
      const errorMsg = isHtml
        ? `Server CeLOE (Status ${res.status}) meminta autentikasi ulang atau diblokir proteksi kampus. Silakan unduh berkas .ics dari CeLOE dan gunakan tombol 'Unggah Berkas' di bawah.`
        : `Server CeLOE merespons status ${res.status}. Pastikan URL kalender masih berlaku.`;

      return NextResponse.json(
        { ok: false, error: errorMsg, status: res.status, preview: text.slice(0, 150) },
        { status: 502 }
      );
    } catch (err: any) {
      const fallbackPath = path.join(process.cwd(), "public", "icalexport.ics");
      if (fs.existsSync(fallbackPath)) {
        const cached = fs.readFileSync(fallbackPath, "utf-8");
        if (cached.includes("BEGIN:VCALENDAR")) {
          return NextResponse.json({
            ok: true,
            fileName: "celoe-url.ics",
            content: cached,
          });
        }
      }
      return NextResponse.json(
        { ok: false, error: `Gagal menghubungi server CeLOE: ${err.message || err}` },
        { status: 502 }
      );
    }
  }

  if (DEFAULT_CELOE_URL) {
    try {
      const res = await fetch(DEFAULT_CELOE_URL, { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("BEGIN:VCALENDAR")) {
          return NextResponse.json({
            ok: true,
            fileName: "icalexport.ics",
            content: text,
          });
        }
      }
    } catch {
      // Fallback ke file lokal jika sedang offline
    }
  }

  try {
    const fallbackPath = path.join(process.cwd(), "public", "icalexport.ics");
    if (fs.existsSync(fallbackPath)) {
      const content = fs.readFileSync(fallbackPath, "utf-8");
      return NextResponse.json({
        ok: true,
        fileName: "icalexport.ics",
        content,
      });
    }
  } catch {
    // Abaikan
  }

  return NextResponse.json(
    { ok: false, error: "Gagal mengambil data kalender CeLOE (.ics)." },
    { status: 500 }
  );
}
