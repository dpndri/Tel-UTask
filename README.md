# Tel-UTask — Sistem Manajemen Tugas Akademik & Prioritas Deadline Universitas Telkom

Aplikasi manajemen tugas perkuliahan, praktikum, dan proyek tugas besar mahasiswa **Universitas Telkom** yang dirancang dan diimplementasikan secara mandiri berbasis dokumen **Laporan Elisitasi dan Spesifikasi Kebutuhan Fungsional (FR-01 s.d. FR-12)**.

## Pengembang (Tugas Mandiri)
- **Muhammad Irgie Dapiandri** (`103012500187`) — *Desain Arsitektur & Implementasi Web Mandiri*

## Tech Stack (100% Free Tier)
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: Supabase (PostgreSQL Cloud) + Local Offline Cache Fallback
- **Sinkronisasi CeLOE**: Parser iCalendar (`.ics`) standar Moodle CeLOE Telkom University tanpa memerlukan API internal kampus
- **Deployment**: Vercel (Production)

## Cara Menjalankan di Lokal

1. Pastikan **Node.js LTS** sudah ter-install (unduh gratis di [nodejs.org](https://nodejs.org/) atau jalankan `winget install OpenJS.NodeJS.LTS` di terminal).
2. Buka terminal di folder `d:\Project` lalu install dependencies:
   ```bash
   npm install
   ```
3. Setup database SQLite & data awal (seed):
   ```bash
   npm run db:setup
   ```
4. Jalankan server development:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:3000` di browser.
