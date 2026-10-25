"use client";

import React, { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { ModernSelect, STATUS_OPTIONS } from "../../components/ModernSelect";
import { useApp, TaskItem } from "../../context/AppContext";

export default function CalendarPage() {
  const { courses, enrichedTasks, handleStatusChange } = useApp();

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedCalDate, setSelectedCalDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  });
  const [calCourseFilter, setCalCourseFilter] = useState<string>("ALL");

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dayHeaders = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const toLocalKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const todayNow = new Date();
  const todayKey = `${todayNow.getFullYear()}-${String(
    todayNow.getMonth() + 1
  ).padStart(2, "0")}-${String(todayNow.getDate()).padStart(2, "0")}`;

  const calTasks = enrichedTasks.filter((t) =>
    calCourseFilter === "ALL" ? true : t.courseCode === calCourseFilter
  );

  // Hitung hari dalam bulan
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Min, 1=Sen...
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const cells: Array<{ day: number | null; dateKey: string }> = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, dateKey: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${calYear}-${String(calMonth + 1).padStart(
      2,
      "0"
    )}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateKey: key });
  }

  const tasksOnSelectedDate = calTasks.filter(
    (t) => toLocalKey(t.dueDate) === selectedCalDate
  );

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const formatCat = (c: string) =>
    c === "TUGAS_BESAR"
      ? "Tugas Besar"
      : c === "PRAKTIKUM"
      ? "Praktikum"
      : "Tugas Individu";

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kiri: Grid Kalender Bulanan (8 Kolom Grid) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          {/* Baris Navigasi Bulan & Filter Mata Kuliah */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0"
              >
                &lt;
              </button>
              <h2 className="text-sm font-bold text-slate-800 min-w-[130px] text-center">
                {monthNames[calMonth]} {calYear}
              </h2>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0"
              >
                &gt;
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalYear(todayNow.getFullYear());
                  setCalMonth(todayNow.getMonth());
                  setSelectedCalDate(todayKey);
                }}
                className="ml-auto sm:ml-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition shrink-0"
              >
                Hari Ini
              </button>
            </div>

            <ModernSelect
              value={calCourseFilter}
              onChange={setCalCourseFilter}
              options={[
                { value: "ALL", label: "Semua Mata Kuliah" },
                ...courses.map((c) => ({
                  value: c.code,
                  label: `${c.code} - ${c.name}`,
                })),
              ]}
              align="right"
              className="w-full sm:w-auto sm:min-w-[220px]"
              size="sm"
            />
          </div>

          {/* Header Nama Hari (Sen - Min) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {dayHeaders.map((dh) => (
              <div
                key={dh}
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1"
              >
                {dh}
              </div>
            ))}
          </div>

          {/* Kotak Tanggal Bulanan (Dot Indicators di Ponsel, Stacking Text di Desktop) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((cell) => {
              if (cell.day === null) {
                return (
                  <div
                    key={cell.dateKey}
                    className="h-12 sm:h-24 rounded-xl bg-slate-50/40 border border-transparent"
                  />
                );
              }

              const dayTasks = calTasks.filter(
                (t) => toLocalKey(t.dueDate) === cell.dateKey
              );
              const isSelected = selectedCalDate === cell.dateKey;
              const isToday = todayKey === cell.dateKey;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedCalDate(cell.dateKey)}
                  className={`h-12 sm:h-24 p-1 sm:p-2 rounded-xl border text-left flex flex-col items-center sm:items-stretch justify-between transition overflow-hidden ${
                    isSelected
                      ? "bg-rose-50/70 border-[#9F1D22] ring-1.5 ring-rose-300"
                      : "bg-white hover:bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-center sm:justify-between w-full">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isToday
                          ? "bg-[#9F1D22] text-white"
                          : isSelected
                          ? "text-[#9F1D22] font-black"
                          : "text-slate-700"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tampilan Titik Indikator Warna di Ponsel (Sesuai Standar iOS/Android Calendar) */}
                  <div className="sm:hidden flex items-center justify-center gap-1 w-full pb-0.5">
                    {dayTasks.slice(0, 3).map((dt) => (
                      <span
                        key={dt.id}
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          dt.status === "SELESAI"
                            ? "bg-emerald-500"
                            : dt.status === "SEDANG_DIKERJAKAN"
                            ? "bg-amber-500"
                            : dt.status === "OVERDUE"
                            ? "bg-rose-600 ring-1 ring-rose-200"
                            : "bg-slate-400"
                        }`}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                    )}
                  </div>

                  {/* Tampilan Pill Teks di Desktop (>= sm) */}
                  <div className="hidden sm:block space-y-1 w-full overflow-hidden">
                    {dayTasks.slice(0, 2).map((dt) => (
                      <div
                        key={dt.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${
                          dt.status === "SELESAI"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : dt.status === "SEDANG_DIKERJAKAN"
                            ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                            : dt.status === "OVERDUE"
                            ? "bg-rose-100 text-[#9F1D22] border border-rose-300 font-semibold"
                            : "bg-slate-50 text-slate-700 border border-slate-200/60"
                        }`}
                      >
                        {dt.courseCode}: {dt.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="block text-[9px] text-slate-400 font-medium pl-1">
                        +{dayTasks.length - 2} lainnya
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Keterangan Warna Status */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full sm:rounded-sm bg-slate-400 sm:bg-slate-100 sm:border sm:border-slate-300" />
              <span>Belum Dikerjakan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full sm:rounded-sm bg-amber-500 sm:bg-amber-100 sm:border sm:border-amber-300" />
              <span>Sedang Dikerjakan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full sm:rounded-sm bg-rose-600 sm:bg-rose-100 sm:border sm:border-rose-300" />
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full sm:rounded-sm bg-emerald-500 sm:bg-emerald-100 sm:border sm:border-emerald-300" />
              <span>Selesai</span>
            </div>
          </div>
        </div>

        {/* Kanan: Detail Agenda pada Tanggal yang Dipilih (4 Kolom Grid) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9F1D22]">
                Detail Tenggat Tanggal
              </span>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                {new Date(`${selectedCalDate}T12:00:00`).toLocaleDateString(
                  "id-ID",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </h3>
            </div>

            {tasksOnSelectedDate.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600">
                  Tidak ada tenggat tugas pada tanggal ini
                </p>
                <p className="text-[11px] text-slate-400">
                  Klik tanggal yang memiliki label tugas di kalender untuk melihat detailnya.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasksOnSelectedDate.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#9F1D22]">
                        {t.courseCode} • {formatCat(t.category)}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Pukul{" "}
                        {new Date(t.dueDate).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t.description}
                    </p>
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Status:
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
                        size="sm"
                        className="min-w-[155px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daftar Ringkas Semua Tenggat Bulan Ini */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-700">
              Daftar Tanggal Tenggat Terdekat
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {calTasks.map((t) => {
                const dKey = toLocalKey(t.dueDate);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const d = new Date(t.dueDate);
                      setCalYear(d.getFullYear());
                      setCalMonth(d.getMonth());
                      setSelectedCalDate(dKey);
                    }}
                    className="w-full p-2 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-left text-xs transition"
                  >
                    <span className="truncate font-medium text-slate-700 pr-2">
                      {t.title}
                    </span>
                    <span className="text-[11px] font-semibold text-[#9F1D22] shrink-0">
                      {new Date(t.dueDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
