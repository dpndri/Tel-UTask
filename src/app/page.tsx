"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil, RefreshCw, CheckCheck } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ModernSelect, STATUS_OPTIONS } from "../components/ModernSelect";
import { useApp, TaskItem } from "../context/AppContext";

export default function HomePage() {
  const {
    enrichedTasks,
    handleStatusChange,
    handleCompleteTasks,
    handleOpenEditTask,
  } = useApp();

  const [dashboardListMode, setDashboardListMode] = useState<"ACTIVE" | "OVERDUE" | "INACTIVE">("ACTIVE");

  // Partisi 1 kali iterasi O(N) menggunakan useMemo: jauh lebih cepat & bebas O(N^2)
  const {
    activeList,
    overdueList,
    inactiveTodoList,
    totalBelumDikerjakan,
    urgentTodayCount,
    upcomingCount,
    completedCount,
  } = useMemo(() => {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 3600 * 1000;

    const overdue: typeof enrichedTasks = [];
    const active: typeof enrichedTasks = [];
    const inactive: typeof enrichedTasks = [];
    let belumDikerjakanCount = 0;
    let urgentCount = 0;
    let upCount = 0;
    let compCount = 0;

    for (const t of enrichedTasks) {
      if (t.status === "BELUM_DIKERJAKAN") belumDikerjakanCount++;
      if (t.status === "SELESAI") {
        compCount++;
        continue;
      }

      const dueMs = new Date(t.dueDate).getTime();
      const isPastDue = t.status === "OVERDUE" || dueMs < now;

      if (isPastDue) {
        // Seluruh tugas berstatus Overdue atau melewati tenggat masuk ke tab Overdue
        overdue.push(t);
      } else if (t.status === "SEDANG_DIKERJAKAN" || dueMs <= now + oneWeekMs) {
        // Sedang dikerjakan atau tenggat dalam 7 hari ke depan masuk Tugas Aktif
        active.push(t);
        if (t.reminder.hoursRemaining <= 24) {
          urgentCount++;
        } else if (t.reminder.hoursRemaining <= 72) {
          upCount++;
        }
      } else {
        // Belum dikerjakan dan tenggat masih lebih dari 7 hari ke depan
        inactive.push(t);
      }
    }

    return {
      activeList: active,
      overdueList: overdue,
      inactiveTodoList: inactive,
      totalBelumDikerjakan: belumDikerjakanCount,
      urgentTodayCount: urgentCount,
      upcomingCount: upCount,
      completedCount: compCount,
    };
  }, [enrichedTasks]);

  const displayedList =
    dashboardListMode === "ACTIVE"
      ? activeList
      : dashboardListMode === "OVERDUE"
      ? overdueList
      : inactiveTodoList;

  const formatCategory = (cat: string) => {
    if (cat === "TUGAS_BESAR") return "Tugas Besar";
    if (cat === "PRAKTIKUM") return "Praktikum";
    return "Tugas Individu";
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Ringkasan Fokus Berdasarkan Waktu (Opsi B: Timeline Horizon) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Fokus Berdasarkan Waktu
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Kategori prioritas tugas berdasarkan rentang batas waktu penyelesaian.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {new Intl.DateTimeFormat("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date())}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Hari Ini & Overdue */}
            <div
              onClick={() => {
                if (overdueList.length > 0) {
                  setDashboardListMode("OVERDUE");
                } else {
                  setDashboardListMode("ACTIVE");
                }
              }}
              className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] select-none ${
                dashboardListMode === "OVERDUE"
                  ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-500 shadow-xs"
                  : "bg-rose-50/40 hover:bg-rose-50/70 border-rose-200/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-[#9F1D22]">Hari Ini & Overdue</span>
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {overdueList.length > 0 ? overdueList.length : urgentTodayCount}
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80 mt-1.5 font-medium">
                {overdueList.length > 0 ? `${overdueList.length} tugas lewat / < 24 jam` : "Tenggat mendesak hari ini"}
              </p>
            </div>

            {/* 2. 3 Hari Mendatang */}
            <div
              onClick={() => setDashboardListMode("ACTIVE")}
              className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] select-none ${
                dashboardListMode === "ACTIVE"
                  ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-500 shadow-xs"
                  : "bg-amber-50/40 hover:bg-amber-50/70 border-amber-200/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-amber-800">3 Hari Mendatang</span>
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {upcomingCount}
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-1.5 font-medium">
                Batas akhir pekan ini (H-3)
              </p>
            </div>

            {/* 3. Pekan Depan / Santai */}
            <div
              onClick={() => setDashboardListMode("INACTIVE")}
              className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] select-none ${
                dashboardListMode === "INACTIVE"
                  ? "bg-slate-100 border-slate-300 ring-2 ring-slate-400 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-slate-700">Pekan Depan / Nanti</span>
                <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {totalBelumDikerjakan}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Tenggat &gt; 7 hari ke depan
              </p>
            </div>

            {/* 4. Sudah Selesai */}
            <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 text-left select-none">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-emerald-800">Sudah Selesai</span>
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {completedCount}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-1.5 font-medium">
                {completedCount} dari {enrichedTasks.length} tugas tuntas
              </p>
            </div>
          </div>
        </div>

        {/* Daftar Tunggal Fokus Pengerjaan */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Urutan Fokus Pengerjaan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Diurutkan otomatis dari yang paling mendesak berdasarkan sisa waktu tenggat, bobot SKS, dan tingkat kesulitan.
              </p>
            </div>

            {/* Segmented Control 3 Kolom Rata di Mobile (Bebas Scrollbar), Inline di Desktop */}
            <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-center">
              <button
                type="button"
                onClick={() => setDashboardListMode("ACTIVE")}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition truncate active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F1D22]/40 ${
                  dashboardListMode === "ACTIVE"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="sm:hidden">Aktif ({activeList.length})</span>
                <span className="hidden sm:inline">Tugas Aktif ({activeList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDashboardListMode("OVERDUE")}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition truncate active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F1D22]/40 ${
                  dashboardListMode === "OVERDUE"
                    ? "bg-white text-[#9F1D22] shadow-sm font-bold"
                    : overdueList.length > 0
                    ? "text-[#9F1D22] hover:text-[#88181C] font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Overdue ({overdueList.length})
              </button>
              <button
                type="button"
                onClick={() => setDashboardListMode("INACTIVE")}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition truncate active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F1D22]/40 ${
                  dashboardListMode === "INACTIVE"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="sm:hidden">Belum ({inactiveTodoList.length})</span>
                <span className="hidden sm:inline">Tidak Aktif • Belum Dikerjakan ({inactiveTodoList.length})</span>
              </button>
            </div>
          </div>

          {/* Banner Aksi Khusus Tab Overdue: Selesaikan Semua */}
          {dashboardListMode === "OVERDUE" && overdueList.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs">
              <span className="font-semibold text-[#9F1D22]">
                Terdapat {overdueList.length} tugas yang telah melewati batas waktu tenggat
                {overdueList.some((t) => t.status === "OVERDUE") && (
                  <span className="text-slate-600 font-normal">
                    {" "}({overdueList.filter((t) => t.status === "OVERDUE").length} ditandai Overdue/Terlewat)
                  </span>
                )}.
              </span>
              {overdueList.some((t) => t.status !== "OVERDUE") && (
                <button
                  type="button"
                  onClick={() => {
                    const toComplete = overdueList
                      .filter((t) => t.status !== "OVERDUE")
                      .map((t) => t.id);
                    handleCompleteTasks(toComplete);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 active:translate-y-0 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all select-none"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>
                    Selesaikan Semua ({overdueList.filter((t) => t.status !== "OVERDUE").length})
                  </span>
                </button>
              )}
            </div>
          )}

          {displayedList.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-2.5">
              <p className="text-xs font-bold text-slate-700">
                {enrichedTasks.length === 0
                  ? "Belum Ada Mata Kuliah & Tugas pada Akun Ini"
                  : dashboardListMode === "ACTIVE"
                  ? "Tidak Ada Tugas Aktif Minggu Ini"
                  : dashboardListMode === "OVERDUE"
                  ? "Tidak Ada Tugas Overdue Minggu Ini"
                  : "Tidak Ada Tugas Tidak Aktif (Belum Dikerjakan)"}
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                {enrichedTasks.length === 0
                  ? "Akun ini belum pernah melakukan sinkronisasi file kalender (.ics) CeLOE. Silakan impor file .ics Anda untuk memuat daftar mata kuliah KRS dan seluruh tugas secara otomatis."
                  : "Anda dapat beralih tab atau menambahkan tugas baru."}
              </p>
              {enrichedTasks.length === 0 && (
                <div className="pt-1">
                  <Link
                    href="/celoe"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9F1D22] hover:bg-[#88181C] text-white text-xs font-semibold shadow-sm transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sinkronisasi File .ics CeLOE Sekarang</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedList.map((t, idx) => {
                const isOverdue =
                  t.status === "OVERDUE" ||
                  (t.status !== "SELESAI" && t.reminder.hoursRemaining < 0);
                const isVeryUrgent =
                  !isOverdue && t.reminder.stage === "H_MINUS_3_HOURS";
                const isToday =
                  !isOverdue && t.reminder.stage === "H_MINUS_1_DAY";

                return (
                  <div
                    key={t.id}
                    className="py-3.5 sm:py-4 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-2xl hover:bg-slate-50/90 active:bg-slate-100/70 active:scale-[0.995] transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 group"
                  >
                    {/* Kiri: Nomor Urut & Info Tugas */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                          idx === 0 && dashboardListMode === "ACTIVE"
                            ? "bg-gradient-to-b from-[#B6252A] to-[#9F1D22] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0 space-y-1 sm:space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-[#9F1D22] transition-colors">
                            {t.title}
                          </h3>
                          {t.source === "MANUAL" && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditTask(t)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-rose-50 active:scale-90 active:bg-rose-100 text-slate-600 hover:text-[#9F1D22] border border-slate-200/80 hover:border-rose-200 text-[10px] sm:text-[11px] font-medium transition select-none"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Ubah</span>
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                          {t.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 text-[10px] sm:text-[11px] text-slate-500">
                          <span className="font-bold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100/90 border border-slate-200/60">
                            {t.courseCode}
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-none">
                            {t.courseName}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            {t.credits} SKS
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#9F1D22] font-semibold text-[10px] border border-rose-200/60">
                            {formatCategory(t.category)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200/60">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.priority === "TINGGI"
                                  ? "bg-rose-500"
                                  : t.priority === "SEDANG"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            Prioritas {t.priority.toLowerCase()} (Skor {t.score})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kanan: Kolom Sisa Waktu & Dropdown Status (Responsif Stacking di Mobile) */}
                    <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pl-9 sm:pl-10 md:pl-0 w-full md:w-auto mt-1 md:mt-0">
                      <span
                        className={`w-28 sm:w-[110px] shrink-0 text-center text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border shadow-2xs ${
                          isOverdue
                            ? "bg-rose-50 text-[#9F1D22] border-rose-200/80 font-bold"
                            : dashboardListMode === "INACTIVE"
                            ? "bg-slate-100 text-slate-500 border-slate-200/90"
                            : isVeryUrgent
                            ? "bg-rose-50 text-[#9F1D22] border-rose-200/80"
                            : isToday
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-slate-50 text-slate-600 border-slate-200/90"
                        }`}
                      >
                        {isOverdue
                          ? "Overdue"
                          : dashboardListMode === "INACTIVE"
                          ? "Tidak Aktif"
                          : t.reminder.hoursRemaining <= 24
                          ? `${t.reminder.hoursRemaining} jam lagi`
                          : `${Math.ceil(
                              t.reminder.hoursRemaining / 24
                            )} hari lagi`}
                      </span>

                      <ModernSelect
                        value={t.status}
                        onChange={(val) =>
                          handleStatusChange(
                            t.id,
                            val as TaskItem["status"]
                          )
                        }
                        options={STATUS_OPTIONS}
                        align="right"
                        className="flex-1 md:flex-initial md:w-[175px]"
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
