"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  calculateRecommendationScore,
  evaluateReminderStage,
} from "../lib/priority";
import {
  parseCeloeIcs,
  isCeloeOpensTitle,
  formatCleanDescription,
  generateSmartSubtasks,
} from "../lib/celoe-parser";
import {
  fetchMembersFromSupabase,
  upsertMemberToSupabase,
  deleteMemberFromSupabase,
  fetchWorkspaceFromSupabase,
  syncWorkspaceToSupabase,
  resetWorkspaceInSupabase,
  deleteTaskFromSupabase,
  deleteSubtaskFromSupabase,
  updateSubtaskStatusInSupabase,
  batchUpdateTaskStatusInSupabase,
} from "../lib/supabase-service";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export type UserRole = "Mahasiswa" | "Ketua Kelompok";

export interface MemberAccount {
  nim: string;
  name: string;
  role: UserRole;
}

export const TEAM_MEMBERS: MemberAccount[] = [
  { nim: "103012500187", name: "Muhammad Irgie Dapiandri", role: "Ketua Kelompok" },
];

export const formatRoleDisplay = (role: UserRole) =>
  role === "Ketua Kelompok" ? "Mahasiswa • Ketua Kelompok" : "Mahasiswa";

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  assigneeNim?: string;
  assigneeName?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  courseCode: string;
  courseName: string;
  credits: number;
  dueDate: string;
  status: "BELUM_DIKERJAKAN" | "SEDANG_DIKERJAKAN" | "OVERDUE" | "SELESAI";
  priority: "TINGGI" | "SEDANG" | "RENDAH";
  category: "INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR";
  difficulty: number;
  source: "CELOE" | "MANUAL";
  completedOnTime?: boolean;
  subtasks: Subtask[];
}

export interface CourseItem {
  code: string;
  name: string;
  credits: number;
  classCode: string;
  fromCeloe?: boolean;
}

export const INITIAL_COURSES: CourseItem[] = [
  { code: "CAK2AAB3", name: "Analisis dan Perancangan Perangkat Lunak", credits: 3, classCode: "IF-49-08" },
  { code: "CAK2EAB4", name: "Struktur Data", credits: 4, classCode: "IF-49-08" },
  { code: "CAK2CAB3", name: "Sistem Basis Data", credits: 3, classCode: "IF-49-08" },
  { code: "CAK2DAB3", name: "Sistem Operasi", credits: 3, classCode: "IF-49-08" },
  { code: "CAK2BAB2", name: "Analisis Kompleksitas Algoritma", credits: 2, classCode: "IF-49-08" },
  { code: "CAK2FAB2", name: "Teori Bahasa dan Automata", credits: 2, classCode: "IF-49-08" },
  { code: "CAK2GAB3", name: "Teori Peluang", credits: 3, classCode: "IF-49-08" },
  { code: "UBKXCCB2", name: "Bahasa Indonesia", credits: 2, classCode: "IF-48-GAB0506" },
];

export const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3600 * 1000).toISOString();

export interface EnrichedTask extends TaskItem {
  score: number;
  reminder: ReturnType<typeof evaluateReminderStage>;
  progressPercent: number;
}

interface AppContextType {
  isMounted: boolean;
  isLoggedIn: boolean;
  currentUser: MemberAccount;
  members: MemberAccount[];
  courses: CourseItem[];
  tasks: TaskItem[];
  enrichedTasks: EnrichedTask[];
  importedIcsHashes: string[];
  celoeFileName: string | null;
  celoeIcsInput: string;
  syncStatus: "SUCCESS" | "ERROR" | null;
  syncMessage: string | null;
  isSyncing: boolean;
  setIsSyncing: (val: boolean) => void;
  setCeloeFileName: (val: string | null) => void;
  setCeloeIcsInput: (val: string) => void;
  setSyncStatus: (val: "SUCCESS" | "ERROR" | null) => void;
  setSyncMessage: (val: string | null) => void;

  // Actions
  login: (nim: string, role: UserRole) => void;
  register: (name: string, nim: string, role: UserRole) => void;
  logout: () => void;
  loadWorkspaceForNim: (nim: string) => void;
  handleImportCeloeIcs: (rawOverride?: string) => void;
  processLoadedIcsFile: (fileName: string, content: string) => void;
  handleFillSampleIcs: () => Promise<void>;
  handleResetAllData: () => void;
  handleStatusChange: (
    taskId: string,
    newStatus: "BELUM_DIKERJAKAN" | "SEDANG_DIKERJAKAN" | "OVERDUE" | "SELESAI"
  ) => void;
  handleCompleteTasks: (taskIds: string[]) => void;
  handleDeleteTask: (taskId: string) => void;
  handleToggleSubtask: (taskId: string, subtaskId: string) => void;
  handleAddSubtask: (taskId: string, title: string) => void;
  handleReassignSubtask: (taskId: string, subtaskId: string, newNim: string) => void;
  handleDeleteSubtask: (taskId: string, subtaskId: string) => void;
  handleAddMember: (nim: string, name: string) => void;
  handleDeleteMember: (nim: string) => void;
  handleAddGroupSubtask: (taskId: string, title: string, assigneeNim: string) => void;

  // Modals & Form Handlers
  showAddModal: boolean;
  setShowAddModal: (val: boolean) => void;
  editingTaskId: string | null;
  setEditingTaskId: (val: string | null) => void;
  addModalMode: "REGULAR" | "GROUP_PROJECT";
  setAddModalMode: (val: "REGULAR" | "GROUP_PROJECT") => void;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newDesc: string;
  setNewDesc: (val: string) => void;
  newCourse: string;
  setNewCourse: (val: string) => void;
  newDueDate: string;
  setNewDueDate: (val: string) => void;
  newPriority: "TINGGI" | "SEDANG" | "RENDAH";
  setNewPriority: (val: "TINGGI" | "SEDANG" | "RENDAH") => void;
  newCategory: "INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR";
  setNewCategory: (val: "INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR") => void;
  newDifficulty: number;
  setNewDifficulty: (val: number) => void;
  handleOpenEditTask: (task: TaskItem) => void;
  handleCreateManualTask: (e: React.FormEvent) => void;
  defaultDueDate: () => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<MemberAccount>(TEAM_MEMBERS[0]);
  const [members, setMembers] = useState<MemberAccount[]>(TEAM_MEMBERS);

  // Default mata kuliah & tugas kosong ([]) kecuali akun NIM pernah sinkronisasi .ics
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [importedIcsHashes, setImportedIcsHashes] = useState<string[]>([]);
  const [celoeFileName, setCeloeFileName] = useState<string | null>(null);
  const [celoeIcsInput, setCeloeIcsInput] = useState("");
  const [syncStatus, setSyncStatus] = useState<"SUCCESS" | "ERROR" | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal tambah/ubah tugas manual
  const defaultDueDate = () => {
    const d = new Date(Date.now() + 48 * 3600 * 1000);
    return d.toISOString().split("T")[0];
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [addModalMode, setAddModalMode] = useState<"REGULAR" | "GROUP_PROJECT">("REGULAR");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCourse, setNewCourse] = useState(INITIAL_COURSES[0].code);
  const [newDueDate, setNewDueDate] = useState(defaultDueDate);
  const [newPriority, setNewPriority] = useState<"TINGGI" | "SEDANG" | "RENDAH">("TINGGI");
  const [newCategory, setNewCategory] = useState<"INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR">("PRAKTIKUM");
  const [newDifficulty, setNewDifficulty] = useState(4);

  // Referensi WebSocket Channel Realtime untuk Broadcast Instan Antar-Device
  const realtimeChannelRef = useRef<any>(null);
  const isResettingRef = useRef<boolean>(false);
  const cdcDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const broadcastWorkspaceUpdate = (action: string, data?: any) => {
    if (realtimeChannelRef.current && currentUser?.nim) {
      realtimeChannelRef.current.send({
        type: "broadcast",
        event: "workspace_updated",
        payload: {
          nim: currentUser.nim.trim().toLowerCase(),
          action,
          data,
          timestamp: Date.now(),
        },
      });
    }
  };

  // Inisialisasi awal dari Supabase & localStorage (Memastikan sesi tidak terputus)
  useEffect(() => {
    async function init() {
      let activeMembers = TEAM_MEMBERS;
      try {
        localStorage.removeItem("telutask_members_v1");
        // Coba muat anggota dari Supabase terlebih dahulu
        const remoteMembers = await fetchMembersFromSupabase();
        if (remoteMembers && remoteMembers.length > 0) {
          activeMembers = remoteMembers;
          setMembers(remoteMembers);
        } else {
          const savedMembers = localStorage.getItem("telutask_members_v2");
          if (savedMembers) {
            const parsed = JSON.parse(savedMembers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              activeMembers = parsed;
              setMembers(parsed);
            }
          }
        }

        const activeSessionNim = localStorage.getItem("telutask_session_nim");
        if (activeSessionNim) {
          const matched =
            activeMembers.find(
              (m) => m.nim.toLowerCase() === activeSessionNim.toLowerCase()
            ) ||
            TEAM_MEMBERS.find(
              (m) => m.nim.toLowerCase() === activeSessionNim.toLowerCase()
            );
          if (matched) {
            setCurrentUser(matched);
            setIsLoggedIn(true);
            await loadWorkspaceForNim(matched.nim);
          }
        }
      } catch {
        // Abaikan
      } finally {
        // Hanya set isMounted true setelah verifikasi sesi selesai untuk mencegah race condition logout
        setIsMounted(true);
      }
    }
    init();
  }, []);

  // Simpan anggota ke localStorage & Supabase
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("telutask_members_v2", JSON.stringify(members));
    } catch {
      // Abaikan
    }
  }, [members, isMounted]);

  // Simpan otomatis ke Supabase & localStorage per NIM
  useEffect(() => {
    if (!isMounted || !isLoggedIn || !currentUser.nim) return;
    if (isResettingRef.current) return;

    if (courses.length > 0 || tasks.length > 0) {
      // Simpan ke Supabase di background secara pasif (tanpa broadcast agar tidak memicu echo loop)
      syncWorkspaceToSupabase(currentUser.nim, courses, tasks);

      // Simpan juga ke cache offline localStorage
      try {
        localStorage.setItem(
          `telutask_user_data_${currentUser.nim.trim().toLowerCase()}`,
          JSON.stringify({
            hasSyncedIcs: true,
            courses,
            tasks,
            importedIcsHashes,
            celoeFileName,
          })
        );
      } catch {
        // Abaikan
      }
    }
  }, [isMounted, isLoggedIn, currentUser.nim, courses, tasks, importedIcsHashes, celoeFileName]);

  // Supabase Realtime: Sinkronisasi instan antar-device via WebSocket Broadcast + Debounced Postgres CDC
  useEffect(() => {
    const client = supabase;
    if (
      !isMounted ||
      !isLoggedIn ||
      !currentUser.nim ||
      !isSupabaseConfigured() ||
      !client
    ) {
      return;
    }

    const currentNim = currentUser.nim.trim().toLowerCase();

    // Debounce refresh dari Postgres CDC agar penghapusan bertahap tidak memicu flickering/stuttering
    const triggerDebouncedRefresh = () => {
      if (isResettingRef.current) return;
      if (cdcDebounceRef.current) clearTimeout(cdcDebounceRef.current);
      cdcDebounceRef.current = setTimeout(async () => {
        if (isResettingRef.current) return;
        const fresh = await fetchWorkspaceFromSupabase(currentNim);
        if (fresh && !isResettingRef.current) {
          setCourses(fresh.courses);
          setTasks(fresh.tasks);
          if (fresh.courses.length === 0 && fresh.tasks.length === 0) {
            try {
              localStorage.removeItem(`telutask_user_data_${currentNim}`);
            } catch {
              // Abaikan
            }
          }
        }
      }, 300);
    };

    const channel = client
      .channel("telutask-realtime-sync")
      .on("broadcast", { event: "workspace_updated" }, async (payload: any) => {
        if (payload?.payload?.nim === currentNim) {
          const action = payload?.payload?.action;

          // Tangani reset secara instan di memori tanpa query database parsial
          if (action === "RESET_ALL") {
            isResettingRef.current = true;
            if (cdcDebounceRef.current) clearTimeout(cdcDebounceRef.current);
            setCourses([]);
            setTasks([]);
            setImportedIcsHashes([]);
            setCeloeFileName(null);
            setCeloeIcsInput("");
            try {
              localStorage.removeItem(`telutask_user_data_${currentNim}`);
            } catch {
              // Abaikan
            }
            setTimeout(() => {
              isResettingRef.current = false;
            }, 1500);
            return;
          }

          // Tangani perubahan status tugas secara instan tanpa query database
          if (action === "STATUS_CHANGE" && payload?.payload?.data) {
            const { taskId, newStatus } = payload.payload.data;
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: newStatus,
                      completedOnTime:
                        newStatus === "SELESAI"
                          ? new Date(t.dueDate).getTime() >= Date.now()
                          : t.completedOnTime,
                    }
                  : t
              )
            );
            return;
          }

          // Tangani penambahan tugas baru secara instan
          if (action === "TASK_CREATED" && payload?.payload?.data?.task) {
            const newTask = payload.payload.data.task;
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
            return;
          }

          // Tangani penghapusan tugas secara instan
          if (action === "DELETE_TASK" && payload?.payload?.data?.taskId) {
            const delId = payload.payload.data.taskId;
            setTasks((prev) => prev.filter((t) => t.id !== delId));
            return;
          }

          // Aksi lainnya: perbarui dari database
          if (!isResettingRef.current) {
            const fresh = await fetchWorkspaceFromSupabase(currentNim);
            if (fresh && !isResettingRef.current) {
              setCourses(fresh.courses);
              setTasks(fresh.tasks);
            }
          }
        }
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        triggerDebouncedRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        triggerDebouncedRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks" },
        triggerDebouncedRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        async () => {
          const freshMembers = await fetchMembersFromSupabase();
          if (freshMembers && freshMembers.length > 0) {
            setMembers(freshMembers);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (cdcDebounceRef.current) clearTimeout(cdcDebounceRef.current);
      client.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [isMounted, isLoggedIn, currentUser.nim]);

  const loadWorkspaceForNim = async (nim: string) => {
    setSyncMessage(null);
    setSyncStatus(null);
    setCeloeIcsInput("");

    // 1. Coba ambil dari Supabase
    try {
      const remote = await fetchWorkspaceFromSupabase(nim);
      if (remote) {
        if (remote.courses.length > 0 || remote.tasks.length > 0) {
          const coursesList = remote.courses.length > 0 ? remote.courses : INITIAL_COURSES;
          setCourses(coursesList);
          setTasks(remote.tasks);
          setImportedIcsHashes(["synced-supabase"]);
          return;
        } else {
          // Data di Supabase sah ada tapi kosong (karena baru di-reset)
          // Berikan daftar mata kuliah resmi IF-49-08 agar dropdown matkul tidak pernah kosong
          setCourses(INITIAL_COURSES);
          setTasks([]);
          setImportedIcsHashes([]);
          setCeloeFileName(null);
          try {
            localStorage.removeItem(`telutask_user_data_${nim.trim().toLowerCase()}`);
          } catch {
            // Abaikan
          }
          return;
        }
      }
    } catch {
      // Abaikan jika offline
    }

    // 2. Fallback ke cache localStorage
    try {
      const raw = localStorage.getItem(
        `telutask_user_data_${nim.trim().toLowerCase()}`
      );
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.hasSyncedIcs &&
          Array.isArray(parsed.courses) &&
          Array.isArray(parsed.tasks)
        ) {
          const coursesList = parsed.courses.length > 0 ? parsed.courses : INITIAL_COURSES;
          setCourses(coursesList);
          // Buang tugas "... opens" hasil sinkron lama; hanya "closes" yang jadi tenggat
          setTasks(
            parsed.tasks.filter(
              (t: TaskItem) => !(t.source === "CELOE" && isCeloeOpensTitle(t.title))
            )
          );
          setImportedIcsHashes(
            Array.isArray(parsed.importedIcsHashes)
              ? parsed.importedIcsHashes
              : ["synced"]
          );
          setCeloeFileName(parsed.celoeFileName || null);
          return;
        }
      }
    } catch {
      // Abaikan
    }

    // 3. Fallback default mata kuliah kurikulum resmi IF-49-08
    setCourses(INITIAL_COURSES);
    setTasks([]);
    setImportedIcsHashes([]);
    setCeloeFileName(null);
  };

  const login = (nim: string, role: UserRole) => {
    const matched = members.find(
      (m) => m.nim.toLowerCase() === nim.toLowerCase()
    );
    if (!matched) return;
    const sessionUser: MemberAccount = {
      ...matched,
      role,
    };
    setCurrentUser(sessionUser);
    setIsLoggedIn(true);
    localStorage.setItem("telutask_session_nim", matched.nim);
    loadWorkspaceForNim(matched.nim);
  };

  const register = (name: string, nim: string, role: UserRole) => {
    const newMember: MemberAccount = {
      nim,
      name,
      role,
    };
    upsertMemberToSupabase(newMember);
    setMembers((prev) => {
      const exists = prev.some((m) => m.nim.toLowerCase() === nim.toLowerCase());
      if (exists) {
        return prev.map((m) =>
          m.nim.toLowerCase() === nim.toLowerCase() ? newMember : m
        );
      }
      return [...prev, newMember];
    });
    setCurrentUser(newMember);
    setIsLoggedIn(true);
    localStorage.setItem("telutask_session_nim", nim);
    loadWorkspaceForNim(nim);
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("telutask_session_nim");
    setTasks([]);
    setCourses([]);
    setCeloeFileName(null);
  };

  // Hitung skor rekomendasi & reminder
  const enrichedTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .map((t) => {
        const score = calculateRecommendationScore(
          {
            dueDate: t.dueDate,
            credits: t.credits,
            difficulty: t.difficulty,
            status: t.status,
          },
          now
        );
        const reminder = evaluateReminderStage(t.dueDate, t.status, now);
        const completedSubtasks = t.subtasks.filter((s) => s.isCompleted).length;
        const progressPercent =
          t.subtasks.length > 0
            ? Math.round((completedSubtasks / t.subtasks.length) * 100)
            : t.status === "SELESAI"
            ? 100
            : t.status === "SEDANG_DIKERJAKAN"
            ? 50
            : 0;

        return { ...t, score, reminder, progressPercent };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks]);

  const computeAutoCeloeStatus = (
    dueDateIso: string
  ): "SEDANG_DIKERJAKAN" | "BELUM_DIKERJAKAN" => {
    const nowMs = Date.now();
    const dueMs = new Date(dueDateIso).getTime();
    const oneWeekMs = 7 * 24 * 3600 * 1000;
    if (dueMs >= nowMs && dueMs <= nowMs + oneWeekMs) {
      return "SEDANG_DIKERJAKAN";
    }
    return "BELUM_DIKERJAKAN";
  };

  const checkCeloeSyncState = (parsed: ReturnType<typeof parseCeloeIcs>) => {
    const currentCourseMap = new Map(
      courses.map((c) => [c.code.toUpperCase(), c])
    );
    const hasLegacyCourses = courses.some(
      (c) =>
        c.code.startsWith("CII") ||
        c.code.startsWith("MK-") ||
        c.code.startsWith("GAB") ||
        c.classCode === "IF-49-04"
    );

    const uniqueIcsCourses = new Map<
      string,
      { code: string; name: string; classCode: string; credits: number }
    >();
    parsed.forEach((ev) => {
      const code = ev.courseCode.toUpperCase();
      if (!uniqueIcsCourses.has(code)) {
        uniqueIcsCourses.set(code, {
          code,
          name: ev.courseName,
          classCode: ev.classCode,
          credits: ev.credits,
        });
      }
    });

    const isCoursesSynced =
      !hasLegacyCourses &&
      uniqueIcsCourses.size > 0 &&
      Array.from(uniqueIcsCourses.values()).every((ic) => {
        const existing = currentCourseMap.get(ic.code);
        return (
          existing &&
          existing.name === ic.name &&
          existing.classCode === ic.classCode
        );
      });

    const currentTaskMap = new Map(tasks.map((t) => [t.id, t]));
    const isTasksSynced =
      parsed.length > 0 &&
      parsed.every((ev) => {
        const existingTask = currentTaskMap.get(ev.uid);
        return (
          existingTask &&
          existingTask.title === ev.title &&
          existingTask.dueDate === ev.dueDate &&
          existingTask.courseCode.toUpperCase() ===
            ev.courseCode.toUpperCase() &&
          existingTask.courseName === ev.courseName &&
          existingTask.subtasks.length > 0 &&
          !existingTask.description.includes("Links:")
        );
      });

    return {
      isCoursesSynced,
      isTasksSynced,
      uniqueIcsCourses,
    };
  };

  const processLoadedIcsFile = (fileName: string, content: string) => {
    setCeloeFileName(fileName);
    setCeloeIcsInput(content);

    const parsed = parseCeloeIcs(content);
    const { isCoursesSynced, isTasksSynced } = checkCeloeSyncState(parsed);

    if (parsed.length > 0 && isCoursesSynced && isTasksSynced) {
      setSyncStatus("ERROR");
      setSyncMessage(
        `Validasi Duplikasi: Daftar Mata Kuliah dan seluruh ${parsed.length} Isi Tugas pada file "${fileName}" sudah terdaftar dan sinkron di sistem.`
      );
    } else {
      setSyncMessage(null);
      setSyncStatus(null);
    }
  };

  // rawOverride: isi .ics yang baru diambil dari URL (state celoeIcsInput belum ter-update di render ini)
  const handleImportCeloeIcs = (rawOverride?: string) => {
    const raw = (rawOverride ?? celoeIcsInput).trim();
    if (!raw) {
      setSyncStatus("ERROR");
      setSyncMessage(
        "Belum ada file kalender (.ics) yang dipilih. Silakan unggah file .ics dari CeLOE terlebih dahulu (atau klik 'Muat File Contoh .ics')."
      );
      return;
    }

    const parsed = parseCeloeIcs(raw);
    if (parsed.length === 0) {
      setSyncStatus("ERROR");
      setSyncMessage(
        "Format iCal (BEGIN:VEVENT ... END:VEVENT) tidak valid atau tidak ditemukan di dalam file."
      );
      return;
    }

    const { isCoursesSynced, isTasksSynced, uniqueIcsCourses } =
      checkCeloeSyncState(parsed);

    if (isCoursesSynced && isTasksSynced) {
      setSyncStatus("ERROR");
      setSyncMessage(
        `Validasi Duplikasi: Baik daftar Mata Kuliah (${
          uniqueIcsCourses.size
        } matkul) maupun seluruh Isi Tugas (${
          parsed.length
        } tugas) di dalam file "${
          celoeFileName || "icalexport.ics"
        }" sudah sama dan terdaftar di sistem.`
      );
      return;
    }

    const updatedCourseMap = new Map<string, CourseItem>();
    uniqueIcsCourses.forEach((ic) => {
      updatedCourseMap.set(ic.code, {
        code: ic.code,
        name: ic.name,
        credits: ic.credits,
        classCode: ic.classCode,
        fromCeloe: true,
      });
    });

    courses.forEach((c) => {
      const codeKey = c.code.toUpperCase();
      const isLegacy =
        codeKey.startsWith("CII") ||
        codeKey.startsWith("MK-") ||
        codeKey.startsWith("GAB") ||
        c.classCode === "IF-49-04";
      if (!isLegacy && !updatedCourseMap.has(codeKey)) {
        updatedCourseMap.set(codeKey, c);
      }
    });

    const mergedCourses = Array.from(updatedCourseMap.values());
    setCourses(mergedCourses);

    const existingIds = new Set(tasks.map((p) => p.id));
    const existingCompositeKeys = new Set(
      tasks.map(
        (p) =>
          `${p.title.toLowerCase()}__${p.courseCode.toLowerCase()}__${p.dueDate}`
      )
    );

    const importedTasks: TaskItem[] = parsed.map((ev) => {
      const matchedCourse = updatedCourseMap.get(ev.courseCode.toUpperCase()) || {
        code: ev.courseCode,
        name: ev.courseName,
        credits: ev.credits,
        classCode: ev.classCode,
      };
      const autoStatus = computeAutoCeloeStatus(ev.dueDate);
      const smartSubtasks = ev.subtasks.map((s, idx) => ({
        ...s,
        isCompleted: autoStatus === "SEDANG_DIKERJAKAN" ? idx === 0 : false,
      }));
      return {
        id: ev.uid,
        title: ev.title,
        description: ev.description,
        courseCode: matchedCourse.code,
        courseName: matchedCourse.name,
        credits: matchedCourse.credits,
        dueDate: ev.dueDate,
        status: autoStatus,
        completedOnTime: undefined,
        priority:
          ev.category === "TUGAS_BESAR" || ev.category === "PRAKTIKUM"
            ? "TINGGI"
            : "SEDANG",
        category: ev.category,
        difficulty:
          ev.category === "TUGAS_BESAR"
            ? 5
            : ev.category === "PRAKTIKUM"
            ? 4
            : 3,
        source: "CELOE",
        subtasks: smartSubtasks,
      };
    });

    const newOnes = importedTasks.filter(
      (i) =>
        !existingIds.has(i.id) &&
        !existingCompositeKeys.has(
          `${i.title.toLowerCase()}__${i.courseCode.toLowerCase()}__${i.dueDate}`
        )
    );

    setTasks((prev) => {
      const updatedPrev = prev.map((oldTask) => {
        const foundInFile = importedTasks.find((it) => it.id === oldTask.id);
        if (foundInFile) {
          return {
            ...oldTask,
            title: foundInFile.title,
            description: foundInFile.description,
            courseCode: foundInFile.courseCode,
            courseName: foundInFile.courseName,
            credits: foundInFile.credits,
            dueDate: foundInFile.dueDate,
            category: foundInFile.category,
            subtasks:
              oldTask.subtasks.length > 0
                ? oldTask.subtasks
                : foundInFile.subtasks,
            status:
              oldTask.status === "SELESAI" ? "SELESAI" : foundInFile.status,
          };
        }
        return oldTask;
      });
      return [...newOnes, ...updatedPrev];
    });

    const signature = parsed.map((e) => e.uid).sort().join("|");
    setImportedIcsHashes((prev) =>
      prev.includes(signature) ? prev : [...prev, signature]
    );

    const inProgressWeekCount = importedTasks.filter(
      (t) => t.status === "SEDANG_DIKERJAKAN"
    ).length;

    setSyncStatus("SUCCESS");
    if (!isCoursesSynced && newOnes.length === 0) {
      setSyncMessage(
        `Berhasil menyinkronkan ${uniqueIcsCourses.size} Mata Kuliah & Kelas sesuai LMS CeLOE (${inProgressWeekCount} tugas pada rentang seminggu ini otomatis berstatus Sedang Dikerjakan)!`
      );
    } else if (isCoursesSynced && newOnes.length > 0) {
      setSyncMessage(
        `Berhasil menambahkan ${newOnes.length} tugas baru dari Kalender CeLOE LMS (${inProgressWeekCount} tugas minggu ini otomatis berstatus Sedang Dikerjakan)!`
      );
    } else {
      setSyncMessage(
        `Berhasil menyinkronkan ${uniqueIcsCourses.size} Mata Kuliah KRS dan ${newOnes.length} tugas dari Kalender CeLOE LMS (${inProgressWeekCount} tugas minggu ini otomatis berstatus Sedang Dikerjakan)!`
      );
    }
    broadcastWorkspaceUpdate("IMPORT_ICS");
  };

  const handleFillSampleIcs = async () => {
    try {
      const res = await fetch("/api/celoe");
      const data = await res.json();
      if (data.ok && data.content) {
        processLoadedIcsFile(data.fileName || "icalexport.ics", data.content);
        return;
      }
    } catch {
      // Fallback
    }
    const sample = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:235441@lms.telkomuniversity.ac.id
SUMMARY:TP Modul 7 - Stack is due
DESCRIPTION:Jawaban dikumpulkan dalam bentuk FILE PDF dengan format TP_MOD_XX_NIM_NAMA.
CATEGORIES:PRAK-26271-CAK2EAB4-IF
DTEND:${new Date(Date.now() + 36 * 3600 * 1000)
      .toISOString()
      .replace(/[-:]/g, "")
      .slice(0, 15)}Z
END:VEVENT
END:VCALENDAR`;
    processLoadedIcsFile("icalexport.ics", sample);
  };

  const handleResetAllData = () => {
    isResettingRef.current = true;
    if (cdcDebounceRef.current) clearTimeout(cdcDebounceRef.current);

    setCourses([]);
    setTasks([]);
    setImportedIcsHashes([]);
    setCeloeFileName(null);
    setCeloeIcsInput("");
    try {
      localStorage.removeItem(
        `telutask_user_data_${currentUser.nim.trim().toLowerCase()}`
      );
    } catch {
      // Abaikan
    }

    // Broadcast instan agar device lain langsung mengosongkan memori seketika (mencegah stutter/flicker)
    broadcastWorkspaceUpdate("RESET_ALL");

    // Hapus di Supabase secara paralel di background
    resetWorkspaceInSupabase(currentUser.nim).finally(() => {
      setTimeout(() => {
        isResettingRef.current = false;
      }, 1500);
    });

    setSyncStatus("SUCCESS");
    setSyncMessage(
      "Seluruh daftar Mata Kuliah (KRS) dan Tugas berhasil dikosongkan. Anda dapat mengimpor ulang file kalender (.ics) CeLOE."
    );
  };

  const handleStatusChange = (
    taskId: string,
    newStatus: "BELUM_DIKERJAKAN" | "SEDANG_DIKERJAKAN" | "OVERDUE" | "SELESAI"
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedOnTime:
                newStatus === "SELESAI"
                  ? new Date(t.dueDate).getTime() >= Date.now()
                  : t.completedOnTime,
            }
          : t
      )
    );
    broadcastWorkspaceUpdate("STATUS_CHANGE", { taskId, newStatus });
    syncWorkspaceToSupabase(currentUser.nim, courses, tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const handleCompleteTasks = (taskIds: string[]) => {
    if (!taskIds.length) return;
    const idSet = new Set(taskIds);
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) =>
        idSet.has(t.id)
          ? {
              ...t,
              status: "SELESAI",
              completedOnTime: new Date(t.dueDate).getTime() >= now,
            }
          : t
      )
    );
    broadcastWorkspaceUpdate("COMPLETE_TASKS");
    batchUpdateTaskStatusInSupabase(taskIds, "SELESAI");
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    broadcastWorkspaceUpdate("DELETE_TASK", { taskId });
    deleteTaskFromSupabase(taskId);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    let nextCompleted = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) => {
            if (s.id === subtaskId) {
              nextCompleted = !s.isCompleted;
              return { ...s, isCompleted: nextCompleted };
            }
            return s;
          }),
        };
      })
    );
    updateSubtaskStatusInSupabase(subtaskId, nextCompleted);
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                {
                  id: `sub-${Date.now()}`,
                  title: title.trim(),
                  isCompleted: false,
                },
              ],
            }
          : t
      )
    );
  };

  const handleReassignSubtask = (
    taskId: string,
    subtaskId: string,
    newNim: string
  ) => {
    const member = members.find((m) => m.nim === newNim);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId
                  ? {
                      ...s,
                      assigneeNim: member?.nim,
                      assigneeName: member?.name,
                    }
                  : s
              ),
            }
          : t
      )
    );
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
            }
          : t
      )
    );
    deleteSubtaskFromSupabase(subtaskId);
  };

  const handleAddMember = (nim: string, name: string) => {
    if (!nim || !name) return;
    if (!members.some((m) => m.nim === nim)) {
      const newM: MemberAccount = { nim, name, role: "Mahasiswa" };
      setMembers((prev) => [...prev, newM]);
      upsertMemberToSupabase(newM);
    }
  };

  const handleDeleteMember = (nim: string) => {
    if (!nim || nim === currentUser.nim) return;
    setMembers((prev) => prev.filter((m) => m.nim !== nim));
    deleteMemberFromSupabase(nim);
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.assigneeNim === nim
            ? { ...s, assigneeNim: undefined, assigneeName: undefined }
            : s
        ),
      }))
    );
  };

  const handleAddGroupSubtask = (
    taskId: string,
    title: string,
    assigneeNim: string
  ) => {
    if (!title.trim()) return;
    const member = members.find((m) => m.nim === assigneeNim) || members[0];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                {
                  id: `sub-${Date.now()}`,
                  title: title.trim(),
                  isCompleted: false,
                  assigneeNim: member.nim,
                  assigneeName: member.name,
                },
              ],
            }
          : t
      )
    );
  };

  const handleOpenEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setAddModalMode(task.category === "TUGAS_BESAR" ? "GROUP_PROJECT" : "REGULAR");
    setNewTitle(task.title);
    setNewDesc(task.description);
    setNewCourse(task.courseCode);
    setNewCategory(task.category);
    setNewPriority(task.priority);
    setNewDifficulty(task.difficulty);
    const parsedDate = new Date(task.dueDate);
    if (!isNaN(parsedDate.getTime())) {
      const yyyy = parsedDate.getFullYear();
      const mm = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(parsedDate.getDate()).padStart(2, "0");
      setNewDueDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setNewDueDate(defaultDueDate());
    }
    setShowAddModal(true);
  };

  const handleCreateManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const course =
      courses.find((c) => c.code === newCourse) ||
      courses[0] ||
      INITIAL_COURSES[0];

    const dueDateIso = newDueDate
      ? new Date(`${newDueDate}T23:59:00`).toISOString()
      : hoursFromNow(48);

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                title: newTitle.trim(),
                description:
                  newDesc.trim() || "Dicatat secara manual (di luar CeLOE).",
                courseCode: course.code,
                courseName: course.name,
                credits: course.credits,
                dueDate: dueDateIso,
                priority: newPriority,
                category:
                  addModalMode === "GROUP_PROJECT" ? "TUGAS_BESAR" : newCategory,
                difficulty: Number(newDifficulty),
              }
            : t
        )
      );
      setEditingTaskId(null);
      setNewTitle("");
      setNewDesc("");
      setShowAddModal(false);
      return;
    }

    const newId = `manual-${Date.now()}`;
    const created: TaskItem = {
      id: newId,
      title: newTitle.trim(),
      description: newDesc.trim() || "Dicatat secara manual (di luar CeLOE).",
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      dueDate: dueDateIso,
      status: "BELUM_DIKERJAKAN",
      priority: newPriority,
      category:
        addModalMode === "GROUP_PROJECT" ? "TUGAS_BESAR" : newCategory,
      difficulty: Number(newDifficulty),
      source: "MANUAL",
      subtasks: [],
    };

    const updatedTasks = [created, ...tasks];
    setTasks(updatedTasks);
    broadcastWorkspaceUpdate("TASK_CREATED", { task: created });
    syncWorkspaceToSupabase(currentUser.nim, courses, updatedTasks);
    setEditingTaskId(null);
    setNewTitle("");
    setNewDesc("");
    setShowAddModal(false);
  };

  return (
    <AppContext.Provider
      value={{
        isMounted,
        isLoggedIn,
        currentUser,
        members,
        courses,
        tasks,
        enrichedTasks,
        importedIcsHashes,
        celoeFileName,
        celoeIcsInput,
        syncStatus,
        syncMessage,
        isSyncing,
        setIsSyncing,
        setCeloeFileName,
        setCeloeIcsInput,
        setSyncStatus,
        setSyncMessage,

        login,
        register,
        logout,
        loadWorkspaceForNim,
        handleImportCeloeIcs,
        processLoadedIcsFile,
        handleFillSampleIcs,
        handleResetAllData,
        handleStatusChange,
        handleCompleteTasks,
        handleDeleteTask,
        handleToggleSubtask,
        handleAddSubtask,
        handleReassignSubtask,
        handleDeleteSubtask,
        handleAddMember,
        handleDeleteMember,
        handleAddGroupSubtask,

        showAddModal,
        setShowAddModal,
        editingTaskId,
        setEditingTaskId,
        addModalMode,
        setAddModalMode,
        newTitle,
        setNewTitle,
        newDesc,
        setNewDesc,
        newCourse,
        setNewCourse,
        newDueDate,
        setNewDueDate,
        newPriority,
        setNewPriority,
        newCategory,
        setNewCategory,
        newDifficulty,
        setNewDifficulty,
        handleOpenEditTask,
        handleCreateManualTask,
        defaultDueDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
