"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { useApp } from "../../context/AppContext";

export default function AnalyticsPage() {
  const { tasks, courses, enrichedTasks, handleStatusChange } = useApp();

  const now = Date.now();
  const total = tasks.length || 1;
  const doneCount = tasks.filter((t) => t.status === "SELESAI").length;

  const overdueTasks = enrichedTasks
    .filter(
      (t) =>
        t.status === "OVERDUE" ||
        (t.status !== "SELESAI" && new Date(t.dueDate).getTime() < now)
    )
    .sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
  const overdueCount = overdueTasks.length;

  const inProgressCount = tasks.filter(
    (t) =>
      t.status === "SEDANG_DIKERJAKAN" && new Date(t.dueDate).getTime() >= now
  ).length;

  const todoCount = tasks.filter(
    (t) =>
      t.status === "BELUM_DIKERJAKAN" && new Date(t.dueDate).getTime() >= now
  ).length;

  const completionRate = Math.round((doneCount / total) * 100);

  // Perhitungan SVG Donut Chart (r = 52, keliling = 2 * pi * 52 = 326.7256)
  const circumference = 2 * Math.PI * 52;
  const doneStroke = (doneCount / total) * circumference;
  const inProgressStroke = (inProgressCount / total) * circumference;
  const overdueStroke = (overdueCount / total) * circumference;
  const todoStroke = (todoCount / total) * circumference;

  // Distribusi beban tugas per hari (Sen - Min)
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  tasks.forEach((t) => {
    const jsDay = new Date(t.dueDate).getDay(); // 0=Min, 1=Sen, ...
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    dayCounts[idx] += 1;
  });
  const maxDayCount = Math.max(...dayCounts, 2);

  // Distribusi per Mata Kuliah
  const courseStats = courses.map((c) => {
    const cTasks = enrichedTasks.filter((t) => t.courseCode === c.code);
    const avgProgress =
      cTasks.length > 0
        ? Math.round(
            cTasks.reduce((acc, item) => acc + item.progressPercent, 0) /
              cTasks.length
          )
        : 0;
    return {
      ...c,
      taskCount: cTasks.length,
      avgProgress,
    };
  });

  // Sebaran Overdue per Mata Kuliah
  const overdueByCourse = courses
    .map((c) => {
      const list = overdueTasks.filter((t) => t.courseCode === c.code);
      return {
        ...c,
        count: list.length,
        pct:
          overdueCount > 0
            ? Math.round((list.length / overdueCount) * 100)
            : 0,
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxOverdueCourseCount = Math.max(
    ...overdueByCourse.map((c) => c.count),
    1
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Baris Ringkasan KPI (4 Kartu - Grid 2x2 di Mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-5 shadow-sm">
            <span className="text-xs text-slate-500">
              Total Beban Tugas
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 sm:mt-2">
              {tasks.length} Tugas
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
              {tasks.filter((t) => t.source === "CELOE").length} CeLOE •{" "}
              {tasks.filter((t) => t.source === "MANUAL").length} Non-CeLOE
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-5 shadow-sm">
            <span className="text-xs text-slate-500">
              Tugas Selesai
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 sm:mt-2">
              {doneCount}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
              {completionRate}% selesai
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-5 shadow-sm">
            <span className="text-xs text-slate-500">
              Sedang Dikerjakan
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 sm:mt-2">
              {inProgressCount}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
              {todoCount} belum mulai
            </p>
          </div>

          <div className="bg-white rounded-xl border border-rose-200/90 bg-rose-50/20 p-3.5 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9F1D22]">
                Tugas Overdue
              </span>
              <AlertCircle className="w-4 h-4 text-[#9F1D22]" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#9F1D22] mt-1 sm:mt-2">
              {overdueCount}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
              {Math.round((overdueCount / total) * 100)}% terlewat
            </p>
          </div>
        </div>

        {/* Baris Visualisasi Chart Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Donut Chart Status Penyelesaian Tugas */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Grafik Distribusi Status Tugas
              </h3>
              <p className="text-xs text-slate-500">
                Proporsi penyelesaian dari seluruh beban tugas aktif
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg
                  className="w-36 h-36 -rotate-90"
                  viewBox="0 0 128 128"
                >
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="16"
                  />
                  {/* Segmen Selesai (Hijau) */}
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={`${doneStroke} ${circumference}`}
                    strokeDashoffset={0}
                  />
                  {/* Segmen Sedang Dikerjakan (Kuning/Amber) */}
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    strokeDasharray={`${inProgressStroke} ${circumference}`}
                    strokeDashoffset={-doneStroke}
                  />
                  {/* Segmen Overdue (Merah Pekat / Rose) */}
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#e11d48"
                    strokeWidth="16"
                    strokeDasharray={`${overdueStroke} ${circumference}`}
                    strokeDashoffset={-(doneStroke + inProgressStroke)}
                  />
                  {/* Segmen Belum Dikerjakan (Mendatang / Slate) */}
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#94a3b8"
                    strokeWidth="16"
                    strokeDasharray={`${todoStroke} ${circumference}`}
                    strokeDashoffset={
                      -(doneStroke + inProgressStroke + overdueStroke)
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-slate-800">
                    {completionRate}%
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    Selesai
                  </span>
                </div>
              </div>

              {/* Legenda Donut Chart */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 flex-1">Selesai</span>
                  <span className="font-bold text-slate-900">
                    {doneCount} ({Math.round((doneCount / total) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
                  <span className="text-slate-600 flex-1">
                    Sedang Dikerjakan
                  </span>
                  <span className="font-bold text-slate-900">
                    {inProgressCount} (
                    {Math.round((inProgressCount / total) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="w-3 h-3 rounded-sm bg-rose-600 shrink-0" />
                  <span className="text-[#9F1D22] font-semibold flex-1">
                    Overdue
                  </span>
                  <span className="font-bold text-[#9F1D22]">
                    {overdueCount} (
                    {Math.round((overdueCount / total) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="w-3 h-3 rounded-sm bg-slate-400 shrink-0" />
                  <span className="text-slate-600 flex-1">
                    Belum Dikerjakan
                  </span>
                  <span className="font-bold text-slate-900">
                    {todoCount} ({Math.round((todoCount / total) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Vertical Bar Chart Beban Tenggat Tugas Mingguan per Hari */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Grafik Beban Tenggat Tugas Mingguan (Senin – Minggu)
              </h3>
              <p className="text-xs text-slate-500">
                Sebaran jumlah tenggat pengumpulan tugas berdasarkan hari dalam seminggu
              </p>
            </div>

            <div className="pt-4 pb-1 px-2 flex items-end justify-between gap-3 h-44 border-b border-slate-200">
              {dayLabels.map((day, idx) => {
                const count = dayCounts[idx];
                const heightPct = Math.max(
                  10,
                  Math.round((count / maxDayCount) * 100)
                );
                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1.5"
                  >
                    <span className="text-[11px] font-bold text-slate-700">
                      {count}
                    </span>
                    <div className="w-full max-w-[38px] bg-slate-100 rounded-t-lg h-28 flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          count > 0
                            ? "bg-gradient-to-t from-[#9F1D22] to-rose-500"
                            : "bg-slate-200"
                        }`}
                        style={{ height: `${count > 0 ? heightPct : 8}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between px-2 text-xs font-semibold text-slate-500">
              {dayLabels.map((day) => (
                <span key={day} className="flex-1 text-center">
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Grafik Riwayat & Histori Tugas Overdue (Fitur Baru) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Grafik Riwayat & Histori Tugas Overdue
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#9F1D22]">
                  {overdueCount} Tugas Terlewat
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Histori sebaran tugas yang melewati batas tenggat per mata kuliah beserta rincian keterlambatan
              </p>
            </div>
          </div>

          {overdueCount === 0 ? (
            <div className="p-8 rounded-xl bg-emerald-50/50 border border-dashed border-emerald-200 text-center space-y-1.5">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-800">
                Tidak Ada Riwayat Tugas Overdue
              </p>
              <p className="text-[11px] text-emerald-600">
                Luar biasa! Seluruh tugas yang telah melewati tenggat sudah diselesaikan dengan tuntas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kiri: Grafik Batang Overdue per Mata Kuliah (6 Kolom) */}
              <div className="lg:col-span-6 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Akumulasi Overdue per Mata Kuliah
                </p>
                <div className="space-y-3">
                  {overdueByCourse.map((oc) => (
                    <div key={oc.code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          <span className="text-[#9F1D22] font-bold">
                            {oc.code}
                          </span>{" "}
                          — {oc.name}
                        </span>
                        <span className="text-[#9F1D22] font-bold">
                          {oc.count} Tugas ({oc.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-[#9F1D22] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(
                              8,
                              Math.round(
                                (oc.count / maxOverdueCourseCount) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanan: Histori Daftar Tugas Overdue (6 Kolom) */}
              <div className="lg:col-span-6 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Histori Tugas Terlewatkan ({overdueCount})
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {overdueTasks.map((ot) => {
                    const isLate = ot.reminder.hoursRemaining < 0;
                    const hoursLate = Math.abs(
                      Math.round(ot.reminder.hoursRemaining)
                    );
                    const daysLate = Math.ceil(hoursLate / 24);
                    return (
                      <div
                        key={ot.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {ot.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-semibold text-[#9F1D22]">
                              {ot.courseCode}
                            </span>
                            <span>•</span>
                            <span>
                              Tenggat:{" "}
                              {new Date(ot.dueDate).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                }
                              )}
                            </span>
                            <span>•</span>
                            <span className="text-rose-600 font-medium">
                              {isLate
                                ? `Terlewat ${
                                    daysLate > 1
                                      ? `${daysLate} hari`
                                      : `${hoursLate} jam`
                                  }`
                                : "Overdue (Terlewat)"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(ot.id, "SELESAI")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold shrink-0 transition"
                          title="Tandai tugas ini selesai"
                        >
                          Selesai
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart 4: Horizontal Bar Chart Beban & Progres per Mata Kuliah */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Grafik Beban Tugas & Rata-rata Progres per Mata Kuliah
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan jumlah tugas dan persentase penyelesaian pada setiap mata kuliah aktif
            </p>
          </div>

          <div className="space-y-3">
            {courseStats.map((cs) => (
              <div key={cs.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    <span className="text-[#9F1D22] font-bold">
                      {cs.code}
                    </span>{" "}
                    — {cs.name}{" "}
                    <span className="text-slate-400 font-normal">
                      ({cs.credits} SKS)
                    </span>
                  </span>
                  <span className="text-slate-600 font-medium">
                    {cs.taskCount} Tugas •{" "}
                    <strong className="text-slate-900">
                      {cs.avgProgress}%
                    </strong>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#9F1D22] to-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        cs.taskCount > 0 ? Math.max(6, cs.avgProgress) : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
