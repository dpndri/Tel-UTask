"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { ModernSelect } from "../../components/ModernSelect";
import { useApp } from "../../context/AppContext";

export default function GroupsPage() {
  const {
    currentUser,
    members,
    enrichedTasks,
    handleToggleSubtask,
    handleReassignSubtask,
    handleDeleteSubtask,
    handleAddMember,
    handleDeleteMember,
    handleAddGroupSubtask,
    setShowAddModal,
    setAddModalMode,
    setEditingTaskId,
    setNewTitle,
    setNewDesc,
    setNewCategory,
    setNewDueDate,
    defaultDueDate,
  } = useApp();

  const isLeader = currentUser.role === "Ketua Kelompok";
  const groupTasks = enrichedTasks.filter(
    (t) => t.category === "TUGAS_BESAR"
  );

  const [selectedGroupTaskId, setSelectedGroupTaskId] = useState<string>("");
  const [newGroupSubtaskTitle, setNewGroupSubtaskTitle] = useState("");
  const [newGroupSubtaskNim, setNewGroupSubtaskNim] = useState(
    members[0]?.nim || ""
  );
  const [newMemberNim, setNewMemberNim] = useState("");
  const [newMemberName, setNewMemberName] = useState("");

  const activeGroupTask =
    groupTasks.find((t) => t.id === selectedGroupTaskId) || groupTasks[0];

  const onAddGroupSubtask = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    if (!newGroupSubtaskTitle.trim()) return;
    handleAddGroupSubtask(
      taskId,
      newGroupSubtaskTitle.trim(),
      newGroupSubtaskNim || members[0]?.nim || ""
    );
    setNewGroupSubtaskTitle("");
  };

  const onAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNim.trim() || !newMemberName.trim()) return;
    handleAddMember(newMemberNim.trim(), newMemberName.trim());
    setNewMemberNim("");
    setNewMemberName("");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Baris Pemilih Proyek Tugas Besar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Daftar Proyek Tugas Besar Aktif ({groupTasks.length})
              </h2>
              <p className="text-xs text-slate-500">
                {isLeader
                  ? "Pilih proyek Tugas Besar di bawah ini untuk membagi pekerjaan ke anggota atau buat proyek Tugas Besar baru."
                  : "Pilih proyek Tugas Besar untuk melihat pembagian tugas dan memperbarui progres bagian Anda."}
              </p>
            </div>
            {isLeader && (
              <button
                type="button"
                onClick={() => {
                  setEditingTaskId(null);
                  setAddModalMode("GROUP_PROJECT");
                  setNewTitle("");
                  setNewDesc("");
                  setNewCategory("TUGAS_BESAR");
                  setNewDueDate(defaultDueDate());
                  setShowAddModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#9F1D22] hover:bg-[#88181C] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Buat Tugas Besar Baru</span>
              </button>
            )}
          </div>

          {/* Pilihan Tab Proyek Tugas Besar */}
          {groupTasks.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-600">
                Belum ada Proyek Tugas Besar yang terdaftar
              </p>
              <p className="text-[11px] text-slate-400">
                {isLeader
                  ? "Klik tombol '+ Buat Tugas Besar Baru' di atas untuk memulai koordinasi kelompok."
                  : "Tugas Besar akan muncul di sini setelah didaftarkan oleh Ketua Kelompok atau disinkronkan dari CeLOE."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {groupTasks.map((gt) => {
                const isSelected = activeGroupTask?.id === gt.id;
                return (
                  <button
                    key={gt.id}
                    type="button"
                    onClick={() => setSelectedGroupTaskId(gt.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-rose-50/80 border-rose-300 ring-1 ring-rose-200"
                        : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#9F1D22]">
                          {gt.courseCode} • {gt.courseName}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">
                          {gt.progressPercent}%
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                        {gt.title}
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#9F1D22] transition-all"
                        style={{ width: `${gt.progressPercent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {activeGroupTask ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel Kiri: Form Bagi Tugas (Khusus Ketua) & Checklist Sub-tugas Proyek */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div>
                <span className="text-[11px] font-bold text-[#9F1D22] uppercase tracking-wider">
                  {activeGroupTask.courseCode} — {activeGroupTask.courseName}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {activeGroupTask.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tenggat:{" "}
                  {new Date(activeGroupTask.dueDate).toLocaleDateString(
                    "id-ID",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              {/* Form Bagi Sub-tugas ke Anggota (HANYA KETUA KELOMPOK) */}
              {isLeader ? (
                <form
                  onSubmit={(e) => onAddGroupSubtask(e, activeGroupTask.id)}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">
                      Bagi Sub-tugas ke Anggota Kelompok
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-[#9F1D22]">
                      Akses Ketua Kelompok
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      Nama Bagian / Sub-tugas
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupSubtaskTitle}
                      onChange={(e) =>
                        setNewGroupSubtaskTitle(e.target.value)
                      }
                      placeholder="Contoh: Desain ERD & Relasi Tabel"
                      className="mt-1 w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Ditugaskan Kepada (NIM & Nama)
                    </label>
                    <ModernSelect
                      value={newGroupSubtaskNim}
                      onChange={setNewGroupSubtaskNim}
                      options={members.map((m) => ({
                        value: m.nim,
                        label: m.name,
                        sublabel: `NIM: ${m.nim}`,
                      }))}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-[#9F1D22] hover:bg-[#88181C] text-white text-xs font-semibold shadow-sm transition"
                  >
                    + Bagi Sub-tugas ke Anggota
                  </button>
                </form>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    Mode Anggota Kelompok ({currentUser.name})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pembagian sub-tugas baru hanya dapat dilakukan oleh{" "}
                    <strong>Ketua Kelompok</strong>. Anda dapat mencentang sub-tugas yang ditugaskan kepada NIM Anda ({currentUser.nim}).
                  </p>
                </div>
              )}

              {/* Daftar Sub-tugas yang Sudah Dibagi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>
                    Daftar Pembagian Sub-tugas (
                    {activeGroupTask.subtasks.length})
                  </span>
                  <span>{activeGroupTask.progressPercent}% Selesai</span>
                </div>

                {activeGroupTask.subtasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-xl">
                    Belum ada pembagian sub-tugas untuk Tugas Besar ini.
                  </p>
                ) : (
                  activeGroupTask.subtasks.map((s) => {
                    const canToggle =
                      isLeader || s.assigneeNim === currentUser.nim;
                    return (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <label
                          className={`flex items-center gap-2 min-w-0 flex-1 ${
                            canToggle
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-75"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!canToggle}
                            checked={s.isCompleted}
                            onChange={() =>
                              handleToggleSubtask(activeGroupTask.id, s.id)
                            }
                            className="rounded text-[#9F1D22]"
                          />
                          <span
                            className={`truncate ${
                              s.isCompleted
                                ? "line-through text-slate-400"
                                : "text-slate-800 font-medium"
                            }`}
                          >
                            {s.title}
                          </span>
                        </label>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isLeader ? (
                            <>
                              <ModernSelect
                                value={s.assigneeNim || ""}
                                onChange={(val) =>
                                  handleReassignSubtask(
                                    activeGroupTask.id,
                                    s.id,
                                    val
                                  )
                                }
                                options={[
                                  {
                                    value: "",
                                    label: "Belum Ditentukan",
                                  },
                                  ...members.map((m) => ({
                                    value: m.nim,
                                    label: `${m.name.split(" ")[0]} (${
                                      m.nim
                                    })`,
                                    sublabel: m.name,
                                  })),
                                ]}
                                align="right"
                                size="sm"
                                className="min-w-[155px]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSubtask(
                                    activeGroupTask.id,
                                    s.id
                                  )
                                }
                                className="px-1.5 py-0.5 text-slate-400 hover:text-red-600 font-bold"
                                title="Hapus sub-tugas"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-mono bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                              {s.assigneeName?.split(" ")[0]} ({s.assigneeNim})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Panel Kanan: Tabel Progres per NIM Anggota pada Tugas Besar Terpilih */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Pantauan Progres Anggota pada Proyek Ini
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menampilkan pembagian tugas dan persentase penyelesaian tiap anggota berdasarkan NIM untuk proyek{" "}
                    <strong className="text-slate-700">
                      {activeGroupTask.title}
                    </strong>
                    .
                  </p>
                </div>

                <div className="overflow-x-auto no-scrollbar" tabIndex={0} role="region" aria-label="Tabel Anggota Kelompok">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 px-3">NIM</th>
                        <th className="py-2.5 px-3">Nama Anggota</th>
                        <th className="py-2.5 px-3">
                          Sub-tugas Ditugaskan
                        </th>
                        <th className="py-2.5 px-3">
                          Status Penyelesaian
                        </th>
                        {isLeader && (
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((member) => {
                        const memberSubtasks =
                          activeGroupTask.subtasks.filter(
                            (s) => s.assigneeNim === member.nim
                          );
                        const doneCount = memberSubtasks.filter(
                          (s) => s.isCompleted
                        ).length;
                        const pct =
                          memberSubtasks.length > 0
                            ? Math.round(
                                (doneCount / memberSubtasks.length) * 100
                              )
                            : 0;
                        return (
                          <tr key={member.nim}>
                            <td className="py-3 px-3 font-mono font-semibold text-[#9F1D22]">
                              {member.nim}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900">
                              {member.name}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {memberSubtasks.length > 0 ? (
                                <ul className="list-disc list-inside space-y-0.5">
                                  {memberSubtasks.map((s) => (
                                    <li
                                      key={s.id}
                                      className={
                                        s.isCompleted
                                          ? "line-through text-slate-400"
                                          : "text-slate-800"
                                      }
                                    >
                                      {s.title}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-400 italic">
                                  Belum ada sub-tugas
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-semibold">
                              {memberSubtasks.length > 0 ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                                    pct === 100
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {doneCount}/{memberSubtasks.length} Selesai ({pct}%)
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            {isLeader && (
                              <td className="py-3 px-3 text-right">
                                {member.nim !== currentUser.nim ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMember(member.nim)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#9F1D22] hover:bg-rose-50 transition"
                                    title="Hapus Anggota"
                                  >
                                    <Trash2 className="w-4 h-4 inline-block" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100">
                                    Anda
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Tambah Anggota Kelompok Baru berdasarkan NIM (HANYA KETUA KELOMPOK) */}
              {isLeader && (
                <form
                  onSubmit={onAddMember}
                  className="pt-4 border-t border-slate-100 flex flex-wrap items-end gap-2.5"
                >
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Tambah NIM Anggota Baru
                    </label>
                    <input
                      type="text"
                      value={newMemberNim}
                      onChange={(e) => setNewMemberNim(e.target.value)}
                      placeholder="Contoh: 103012500999"
                      className="mt-1 w-full text-base sm:text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Nama Mahasiswa
                    </label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Nama anggota kelompok..."
                      className="mt-1 w-full text-base sm:text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
                  >
                    + Tambah Anggota
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
