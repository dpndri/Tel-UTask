"use client";

import React, { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  RefreshCw,
  BarChart3,
  Plus,
  GraduationCap,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useApp, formatRoleDisplay } from "../context/AppContext";
import { ModernSelect } from "./ModernSelect";

const NAV_ITEMS = [
  {
    path: "/",
    label: "Prioritas & Pengingat",
    icon: LayoutDashboard,
  },
  {
    path: "/tasks",
    label: "Daftar Tugas & Sub-tugas",
    icon: CheckSquare,
  },
  {
    path: "/calendar",
    label: "Kalender Tenggat",
    icon: Calendar,
  },
  {
    path: "/groups",
    label: "Koordinasi Tugas Besar",
    icon: Users,
  },
  {
    path: "/celoe",
    label: "KRS & Impor CeLOE",
    icon: RefreshCw,
  },
  {
    path: "/analytics",
    label: "Analitik Produktivitas",
    icon: BarChart3,
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isMounted,
    isLoggedIn,
    currentUser,
    courses,
    enrichedTasks,
    logout,
    setIsSyncing,
    isSyncing,
    celoeIcsInput,
    handleImportCeloeIcs,
    setSyncMessage,
    setSyncStatus,
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
    handleCreateManualTask,
    defaultDueDate,
  } = useApp();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Tutup mobile drawer saat berpindah rute halaman
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Auth guard: jika belum login, arahkan ke /login
  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isMounted, isLoggedIn, router]);

  if (!isMounted || !isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-[#F4F6F9] flex flex-col items-center justify-center p-6 gap-3 text-slate-600 text-xs">
        <div className="w-8 h-8 border-2 border-[#9F1D22] border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-slate-700">Memuat sesi Tel-UTask...</p>
        <p className="text-[11px] text-slate-400">Jika tidak beralih otomatis, silakan klik tombol di bawah:</p>
        <button
          onClick={() => {
            window.location.href = "/login";
          }}
          className="mt-1 px-4 py-2 rounded-xl bg-[#9F1D22] hover:bg-[#88181C] text-white text-xs font-semibold shadow-sm transition"
        >
          Ke Halaman Login SSO
        </button>
      </div>
    );
  }

  const urgentCount = enrichedTasks.filter(
    (t) => t.status !== "SELESAI" && t.reminder.urgent
  ).length;

  const currentNav =
    NAV_ITEMS.find((n) => n.path === pathname) || NAV_ITEMS[0];
  const ActiveIcon = currentNav.icon;

  const totalSks = courses.reduce((acc, c) => acc + c.credits, 0);

  return (
    <div className="min-h-[100dvh] flex bg-[#F4F6F9] text-slate-800">
      {/* Mobile Drawer Backdrop & Slide-over Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs overscroll-contain transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[82vw] bg-white h-full flex flex-col z-10 shadow-2xl overscroll-contain">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 text-[#9F1D22] font-extrabold flex items-center justify-center text-xs shadow-sm">
                  TU
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                    Tel-UTask
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">
                    Academic Task & CeLOE
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Tutup menu navigasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Utama
              </p>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all active:scale-[0.98] select-none ${
                      isActive
                        ? "bg-rose-50/90 text-[#9F1D22] border border-rose-200/70 font-semibold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#9F1D22]" : "text-slate-400"
                        }`}
                      />
                      <span className="block text-xs leading-tight truncate">
                        {item.label}
                      </span>
                    </div>
                    {item.path === "/" && urgentCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-rose-200/80 text-[#9F1D22]"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {urgentCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 space-y-2.5">
              <div className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-left shadow-sm">
                <span className="block text-xs font-bold text-slate-800 truncate">
                  {currentUser.name}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">
                  NIM: {currentUser.nim}
                </span>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-[#9F1D22] border border-rose-200/60">
                  {formatRoleDisplay(currentUser.role)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  logout();
                  router.push("/login");
                }}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-50 active:scale-95 text-slate-600 hover:text-[#9F1D22] border border-slate-200/90 hover:border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition select-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar SSO</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar Navigasi Kiri (Desktop) */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200/90 flex-col shrink-0 sticky top-0 h-[100dvh] overscroll-contain">
        {/* Brand Logo Tel-UTask */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 text-[#9F1D22] font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
            TU
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-800 tracking-tight truncate">
              Tel-UTask
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              Academic Task & CeLOE Sync
            </p>
          </div>
        </div>

        {/* Menu Navigasi Berdasarkan URL Routing */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all active:scale-[0.98] select-none ${
                  isActive
                    ? "bg-rose-50/90 text-[#9F1D22] border border-rose-200/70 font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#9F1D22]" : "text-slate-400"
                    }`}
                  />
                  <span className="block text-xs leading-tight truncate">
                    {item.label}
                  </span>
                </div>
                {item.path === "/" && urgentCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-rose-200/80 text-[#9F1D22]"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {urgentCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar: Profil Mahasiswa Sesi Ini */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Akun Sesi Aktif</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SSO Aktif
            </span>
          </div>

          <div className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2.5 text-left shadow-sm">
            <span className="block text-xs font-bold text-slate-800 truncate">
              {currentUser.name}
            </span>
            <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
              NIM: {currentUser.nim}
            </span>
            <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-[#9F1D22] border border-rose-200/60">
              {formatRoleDisplay(currentUser.role)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-50 active:scale-95 text-slate-600 hover:text-[#9F1D22] border border-slate-200/90 hover:border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition select-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar SSO</span>
          </button>
        </div>
      </aside>

      {/* Area Konten Utama Kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Ringkas & Responsif */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Hamburger Button untuk Mobile */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 transition-all shrink-0 select-none"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-rose-50/80 border border-rose-200/60 text-[#9F1D22] items-center justify-center shrink-0 shadow-sm">
              <ActiveIcon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                  {currentNav.label}
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70 whitespace-nowrap">
                  Ganjil 2026/2027 • {totalSks} SKS
                </span>
              </div>
              <div className="hidden sm:flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {currentUser.name}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-600 border border-slate-200/60">
                  NIM {currentUser.nim}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">
                  {formatRoleDisplay(currentUser.role)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSyncing(true);
                router.push("/celoe");
                if (celoeIcsInput.trim()) {
                  handleImportCeloeIcs();
                } else {
                  setSyncMessage(null);
                  setSyncStatus(null);
                }
                setTimeout(() => setIsSyncing(false), 600);
              }}
              className="group p-2 sm:px-4 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-slate-700 border border-slate-200/90 shadow-sm text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              title="Sinkronisasi Jadwal CeLOE"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shrink-0" />
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-700 transition-transform ${
                  isSyncing ? "animate-spin text-[#9F1D22]" : ""
                }`}
              />
              <span className="hidden sm:inline">Sinkronisasi CeLOE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTaskId(null);
                setAddModalMode("REGULAR");
                setNewTitle("");
                setNewDesc("");
                setNewCategory("PRAKTIKUM");
                setNewDueDate(defaultDueDate());
                setShowAddModal(true);
              }}
              className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-b from-[#B6252A] to-[#9F1D22] hover:from-[#A32025] hover:to-[#88181C] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-white text-xs font-semibold shadow-sm ring-1 ring-inset ring-white/15 flex items-center gap-1.5 sm:gap-2 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="sm:hidden">+ Tugas</span>
              <span className="hidden sm:inline">Tugas Baru</span>
            </button>
          </div>
        </header>

        {/* Konten Halaman Aktif */}
        <main className="max-w-6xl w-full px-3.5 sm:px-6 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>

      {/* Modal Tambah / Ubah Tugas Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overscroll-contain">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92dvh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#9F1D22] uppercase tracking-wider">
                  {editingTaskId
                    ? "Mode Edit Tugas"
                    : addModalMode === "GROUP_PROJECT"
                    ? "Tugas Besar Baru"
                    : "Pencatatan Tugas Mandiri"}
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  {editingTaskId
                    ? "Ubah Data Tugas"
                    : addModalMode === "GROUP_PROJECT"
                    ? "Buat Proyek Tugas Besar Baru"
                    : "Catat Tugas Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTaskId(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Laporan Pendahuluan Modul 4"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Deskripsi / Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Catatan pengerjaan atau instruksi..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mata Kuliah
                  </label>
                  <ModernSelect
                    value={newCourse}
                    onChange={setNewCourse}
                    options={
                      courses.length > 0
                        ? courses.map((c) => ({
                            value: c.code,
                            label: `${c.code} - ${c.name}`,
                          }))
                        : [
                            {
                              value: "CAK2AAB3",
                              label: "CAK2AAB3 - Analisis dan Perancangan Perangkat Lunak",
                            },
                          ]
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tenggat Waktu
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kategori Tugas
                  </label>
                  <ModernSelect
                    value={newCategory}
                    onChange={(val) =>
                      setNewCategory(val as typeof newCategory)
                    }
                    options={[
                      { value: "PRAKTIKUM", label: "Praktikum" },
                      { value: "INDIVIDU", label: "Tugas Individu" },
                      { value: "TUGAS_BESAR", label: "Tugas Besar" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tingkat Kesulitan (1 - 5)
                  </label>
                  <ModernSelect
                    value={String(newDifficulty)}
                    onChange={(val) => setNewDifficulty(Number(val))}
                    options={[
                      { value: "1", label: "1 - Sangat Mudah" },
                      { value: "2", label: "2 - Mudah" },
                      { value: "3", label: "3 - Sedang" },
                      { value: "4", label: "4 - Sulit" },
                      { value: "5", label: "5 - Sangat Sulit" },
                    ]}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTaskId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold transition select-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#9F1D22] hover:bg-[#88181C] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-white text-xs font-semibold shadow-sm transition select-none"
                >
                  {editingTaskId ? "Simpan Perubahan" : "Simpan Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
