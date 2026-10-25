-- ==============================================================
-- Tel-UTask Supabase PostgreSQL Schema
-- Jalankan skrip ini sekali di Supabase Dashboard -> SQL Editor
-- ==============================================================

-- 1. Tabel Anggota / Akun Mahasiswa
CREATE TABLE IF NOT EXISTS public.members (
  nim VARCHAR(20) PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Mahasiswa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Masukkan akun default Ketua Kelompok
INSERT INTO public.members (nim, name, role)
VALUES ('103012500187', 'Muhammad Irgie Dapiandri', 'Ketua Kelompok')
ON CONFLICT (nim) DO NOTHING;

-- 2. Tabel Mata Kuliah (KRS per NIM)
CREATE TABLE IF NOT EXISTS public.courses (
  code VARCHAR(50) NOT NULL,
  user_nim VARCHAR(20) NOT NULL REFERENCES public.members(nim) ON DELETE CASCADE,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  class_code TEXT NOT NULL DEFAULT 'IF-49-08',
  from_celoe BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (code, user_nim)
);

-- 3. Tabel Tugas Akademik & Tugas Besar
CREATE TABLE IF NOT EXISTS public.tasks (
  id VARCHAR(100) PRIMARY KEY,
  user_nim VARCHAR(20) NOT NULL REFERENCES public.members(nim) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  course_code VARCHAR(50) NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'BELUM_DIKERJAKAN',
  priority VARCHAR(20) NOT NULL DEFAULT 'SEDANG',
  category VARCHAR(30) NOT NULL DEFAULT 'INDIVIDU',
  difficulty INTEGER NOT NULL DEFAULT 3,
  source VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index agar kueri tugas per mahasiswa dan tenggat waktu super cepat
CREATE INDEX IF NOT EXISTS idx_tasks_user_nim ON public.tasks(user_nim);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- 4. Tabel Sub-tugas & Checklist Pembagian Kelompok
CREATE TABLE IF NOT EXISTS public.subtasks (
  id VARCHAR(100) PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  assignee_nim VARCHAR(20),
  assignee_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);

-- Aktifkan Row Level Security (RLS) dengan akses penuh untuk anon public key
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write subtasks" ON public.subtasks FOR ALL USING (true) WITH CHECK (true);

-- 5. Aktifkan Realtime Replication (Supabase Realtime Broadcast)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subtasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
