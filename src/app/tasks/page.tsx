"use client";

import React, { useState, useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { ModernSelect, STATUS_OPTIONS } from "../../components/ModernSelect";
import { useApp, TaskItem } from "../../context/AppContext";

export default function TasksPage() {
  const {
    courses,
    enrichedTasks,
    handleStatusChange,
    handleDeleteTask,
    handleToggleSubtask,
    handleAddSubtask,
    handleOpenEditTask,
  } = useApp();

  const [filterCourse, setFilterCourse] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterTimeRange, setFilterTimeRange] = useState<string>("ALL");
  const [subtaskTitleMap, setSubtaskTitleMap] = useState<Record<string, string>>({});

  const filteredTasks = useMemo(() => {
    return enrichedTasks.filter((t) => {
      if (filterCourse !== "ALL" && t.courseCode !== filterCourse) return false;
      if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
      if (filterTimeRange === "OVERDUE" && t.status !== "OVERDUE" && (t.status === "SELESAI" || t.reminder.hoursRemaining >= 0)) return false;
      if (filterTimeRange === "24H" && (t.reminder.hoursRemaining > 24 || t.reminder.hoursRemaining < 0)) return false;
      if (filterTimeRange === "3D" && (t.reminder.hoursRemaining > 72 || t.reminder.hoursRemaining < 0)) return false;
      if (filterTimeRange === "7D" && (t.reminder.hoursRemaining > 168 || t.reminder.hoursRemaining < 0)) return false;
      return true;
    });
  }, [enrichedTasks, filterCourse, filterPriority, filterTimeRange]);

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Bar Filter */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter Mata Kuliah
            </label>
            <ModernSelect
              value={filterCourse}
              onChange={setFilterCourse}
              options={[
                { value: "ALL", label: "Semua Mata Kuliah" },
                ...courses.map((c) => ({
                  value: c.code,
                  label: `${c.code} - ${c.name}`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter Prioritas
            </label>
            <ModernSelect
              value={filterPriority}
              onChange={setFilterPriority}
              options={[
                { value: "ALL", label: "Semua Prioritas" },
                {
                  value: "TINGGI",
                  label: "Prioritas Tinggi",
                  dotColor: "bg-rose-500",
                },
                {
                  value: "SEDANG",
                  label: "Prioritas Sedang",
                  dotColor: "bg-amber-500",
                },
                {
                  value: "RENDAH",
                  label: "Prioritas Rendah",
                  dotColor: "bg-emerald-500",
                },
              ]}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Rentang Tenggat
            </label>
            <ModernSelect
              value={filterTimeRange}
              onChange={setFilterTimeRange}
              options={[
                { value: "ALL", label: "Semua Waktu" },
                {
                  value: "OVERDUE",
                  label: "Overdue (Lewat Tenggat)",
                  dotColor: "bg-rose-500",
                },
                { value: "24H", label: "Dalam 24 Jam (H-1)" },
                { value: "3D", label: "Dalam 3 Hari (H-3)" },
                { value: "7D", label: "Minggu Ini (7 Hari)" },
              ]}
            />
          </div>
        </div>

        {/* Daftar Kartu Tugas + Checklist Sub-tugas */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-white text-center space-y-1.5 shadow-sm">
            <p className="text-xs font-bold text-slate-700">
              Tidak Ada Tugas yang Sesuai dengan Filter
            </p>
            <p className="text-[11px] text-slate-400">
              Ubah opsi filter di atas atau tambahkan tugas baru melalui tombol di bagian atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#B6252A]">
                      {t.courseCode} • {t.courseName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(t.status === "OVERDUE" || (t.status !== "SELESAI" && t.reminder.hoursRemaining < 0)) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-[#9F1D22] border border-rose-300">
                          Overdue
                        </span>
                      )}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          t.source === "CELOE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.source}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span>
                      Tenggat:{" "}
                      {new Date(t.dueDate).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>•</span>
                    <span className={t.status === "OVERDUE" || (t.status !== "SELESAI" && t.reminder.hoursRemaining < 0) ? "text-[#9F1D22] font-semibold" : ""}>
                      {t.status === "SELESAI"
                        ? "Selesai"
                        : t.status === "OVERDUE"
                        ? "Overdue (Terlewat)"
                        : t.reminder.hoursRemaining < 0
                        ? `Terlambat ${Math.abs(Math.round(t.reminder.hoursRemaining))} jam`
                        : `${t.reminder.hoursRemaining} jam lagi`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">{t.description}</p>

                  {/* Progress Bar Sub-tugas */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Progres Sub-tugas</span>
                      <span>{t.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B6252A] transition-all"
                        style={{ width: `${t.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist Sub-tugas */}
                  <div className="mt-3 space-y-1.5">
                    {t.subtasks.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={s.isCompleted}
                            onChange={() => handleToggleSubtask(t.id, s.id)}
                            className="rounded text-[#B6252A]"
                          />
                          <span
                            className={
                              s.isCompleted
                                ? "line-through text-slate-400"
                                : "text-slate-800"
                            }
                          >
                            {s.title}
                          </span>
                        </div>
                        {s.assigneeNim && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {s.assigneeName?.split(" ")[0]} ({s.assigneeNim})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Tambah Sub-tugas */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Tambah checklist sub-tugas..."
                      value={subtaskTitleMap[t.id] || ""}
                      onChange={(e) =>
                        setSubtaskTitleMap((prev) => ({
                          ...prev,
                          [t.id]: e.target.value,
                        }))
                      }
                      className="flex-1 text-base sm:text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                    <button
                      onClick={() => {
                        const title = subtaskTitleMap[t.id] || "";
                        handleAddSubtask(t.id, title);
                        setSubtaskTitleMap((prev) => ({ ...prev, [t.id]: "" }));
                      }}
                      className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg font-medium"
                    >
                      + Sub-tugas
                    </button>
                  </div>
                </div>

                {/* Footer Status, Ubah & Hapus */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <ModernSelect
                    value={t.status}
                    onChange={(val) =>
                      handleStatusChange(
                        t.id,
                        val as TaskItem["status"]
                      )
                    }
                    options={STATUS_OPTIONS}
                    className="min-w-[170px]"
                  />

                  {t.source === "MANUAL" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTask(t)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ubah Tugas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#9F1D22] text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
