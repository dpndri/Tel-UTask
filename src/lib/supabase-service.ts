import { supabase, isSupabaseConfigured } from "./supabase";
import type { MemberAccount, CourseItem, TaskItem, Subtask } from "../context/AppContext";

/**
 * Memuat daftar anggota kelompok dari tabel 'members' di Supabase
 */
export async function fetchMembersFromSupabase(): Promise<MemberAccount[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from("members")
      .select("nim, name, role")
      .order("created_at", { ascending: true });

    if (error || !data) return null;
    return data as MemberAccount[];
  } catch {
    return null;
  }
}

/**
 * Simpan atau perbarui data anggota di Supabase
 */
export async function upsertMemberToSupabase(member: MemberAccount): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from("members").upsert(
      {
        nim: member.nim,
        name: member.name,
        role: member.role,
      },
      { onConflict: "nim" }
    );
    return !error;
  } catch {
    return false;
  }
}

/**
 * Hapus anggota dari tabel 'members' di Supabase
 */
export async function deleteMemberFromSupabase(nim: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from("members").delete().eq("nim", nim);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Memuat workspace (Mata Kuliah & Tugas) per NIM mahasiswa dari Supabase
 */
export async function fetchWorkspaceFromSupabase(
  nim: string
): Promise<{ courses: CourseItem[]; tasks: TaskItem[] } | null> {
  if (!isSupabaseConfigured() || !supabase || !nim) return null;
  try {
    const normalizedNim = nim.trim();

    // 1. Ambil Mata Kuliah
    const { data: coursesData, error: coursesErr } = await supabase
      .from("courses")
      .select("code, name, credits, class_code, from_celoe")
      .eq("user_nim", normalizedNim);

    if (coursesErr) return null;

    const courses: CourseItem[] = (coursesData || []).map((c) => ({
      code: c.code,
      name: c.name,
      credits: c.credits,
      classCode: c.class_code,
      fromCeloe: c.from_celoe,
    }));

    // 2. Ambil Tugas beserta Sub-tugas
    const { data: tasksData, error: tasksErr } = await supabase
      .from("tasks")
      .select(
        `
        id,
        title,
        description,
        course_code,
        course_name,
        credits,
        due_date,
        status,
        priority,
        category,
        difficulty,
        source,
        subtasks (
          id,
          title,
          is_completed,
          assignee_nim,
          assignee_name
        )
      `
      )
      .eq("user_nim", normalizedNim)
      .order("due_date", { ascending: true });

    if (tasksErr) return null;

    const tasks: TaskItem[] = (tasksData || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      courseCode: t.course_code,
      courseName: t.course_name,
      credits: t.credits,
      dueDate: t.due_date,
      status: t.status,
      priority: t.priority,
      category: t.category,
      difficulty: t.difficulty,
      source: t.source,
      subtasks: (t.subtasks || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        isCompleted: s.is_completed,
        assigneeNim: s.assignee_nim,
        assigneeName: s.assignee_name,
      })),
    }));

    return { courses, tasks };
  } catch {
    return null;
  }
}

/**
 * Sinkronisasi Mata Kuliah dan Tugas ke Supabase
 */
export async function syncWorkspaceToSupabase(
  nim: string,
  courses: CourseItem[],
  tasks: TaskItem[]
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !nim) return false;
  try {
    const normalizedNim = nim.trim();

    // 1. Simpan courses
    if (courses.length > 0) {
      const courseRows = courses.map((c) => ({
        code: c.code,
        name: c.name,
        credits: c.credits,
        class_code: c.classCode,
        from_celoe: Boolean(c.fromCeloe),
        user_nim: normalizedNim,
      }));

      await supabase
        .from("courses")
        .upsert(courseRows, { onConflict: "code,user_nim" });
    }

    // 2. Simpan tasks
    if (tasks.length > 0) {
      const taskRows = tasks.map((t) => ({
        id: t.id,
        user_nim: normalizedNim,
        title: t.title,
        description: t.description,
        course_code: t.courseCode,
        course_name: t.courseName,
        credits: t.credits,
        due_date: t.dueDate,
        status: t.status,
        priority: t.priority,
        category: t.category,
        difficulty: t.difficulty,
        source: t.source,
      }));

      await supabase.from("tasks").upsert(taskRows, { onConflict: "id" });

      // 3. Simpan subtasks
      const subtaskRows: any[] = [];
      tasks.forEach((t) => {
        t.subtasks.forEach((s) => {
          subtaskRows.push({
            id: s.id,
            task_id: t.id,
            title: s.title,
            is_completed: s.isCompleted,
            assignee_nim: s.assigneeNim || null,
            assignee_name: s.assigneeName || null,
          });
        });
      });

      if (subtaskRows.length > 0) {
        await supabase
          .from("subtasks")
          .upsert(subtaskRows, { onConflict: "id" });
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Hapus seluruh data mata kuliah dan tugas per NIM di Supabase saat reset data
 */
export async function resetWorkspaceInSupabase(nim: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !nim) return false;
  try {
    const normalizedNim = nim.trim();
    // Hapus tasks dan courses secara paralel (Promise.all) untuk mencegah race condition CDC
    await Promise.all([
      supabase.from("tasks").delete().eq("user_nim", normalizedNim),
      supabase.from("courses").delete().eq("user_nim", normalizedNim),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hapus tugas tunggal beserta sub-tugasnya dari Supabase
 */
export async function deleteTaskFromSupabase(taskId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !taskId) return false;
  try {
    await supabase.from("subtasks").delete().eq("task_id", taskId);
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Hapus sub-tugas tunggal dari Supabase
 */
export async function deleteSubtaskFromSupabase(subtaskId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !subtaskId) return false;
  try {
    const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Perbarui status selesai sub-tugas di Supabase
 */
export async function updateSubtaskStatusInSupabase(
  subtaskId: string,
  isCompleted: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !subtaskId) return false;
  try {
    const { error } = await supabase
      .from("subtasks")
      .update({ is_completed: isCompleted })
      .eq("id", subtaskId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Perbarui status batch tugas (misal 'Selesaikan Semua' di tab Overdue) di Supabase
 */
export async function batchUpdateTaskStatusInSupabase(
  taskIds: string[],
  status: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !taskIds.length) return false;
  try {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .in("id", taskIds);
    return !error;
  } catch {
    return false;
  }
}
