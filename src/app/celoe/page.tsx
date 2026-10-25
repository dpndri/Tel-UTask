"use client";

import React, { useEffect, useRef, useState } from "react";
import { Trash2, Upload, FileText, Link2, Download, ExternalLink } from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { useApp } from "../../context/AppContext";

export default function CeloePage() {
  const {
    currentUser,
    courses,
    tasks,
    celoeFileName,
    setCeloeFileName,
    setCeloeIcsInput,
    syncStatus,
    setSyncStatus,
    syncMessage,
    setSyncMessage,
    processLoadedIcsFile,
    handleFillSampleIcs,
    handleImportCeloeIcs,
    handleResetAllData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL Export Calendar CeLOE disimpan per NIM agar sinkron berikutnya cukup 1 klik
  const urlKey = `telutask_celoe_url_${currentUser.nim.trim().toLowerCase()}`;
  const [celoeUrl, setCeloeUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  useEffect(() => {
    setCeloeUrl(localStorage.getItem(urlKey) || "");
  }, [urlKey]);

  const handleSyncFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = celoeUrl.trim();
    if (!url) return;
    setIsFetchingUrl(true);
    try {
      const res = await fetch(`/api/celoe?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!data.ok) {
        setSyncStatus("ERROR");
        setSyncMessage(data.error || "Gagal mengambil kalender dari URL CeLOE.");
        return;
      }
      localStorage.setItem(urlKey, url);
      processLoadedIcsFile(data.fileName, data.content);
      handleImportCeloeIcs(data.content);
    } catch {
      setSyncStatus("ERROR");
      setSyncMessage("Gagal menghubungi server. Periksa koneksi internet Anda.");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleSelectIcsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content =
        typeof ev.target?.result === "string" ? ev.target.result : "";
      processLoadedIcsFile(file.name, content);
      handleImportCeloeIcs(content);
    };
    reader.readAsText(file);
  };

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daftar Mata Kuliah KRS Aktif */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Profil Akademik & Mata Kuliah Aktif (KRS)
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                {courses.length} Mata Kuliah •{" "}
                {courses.reduce((acc, c) => acc + c.credits, 0)} SKS
              </span>
              {(courses.length > 0 || tasks.length > 0) && (
                <button
                  type="button"
                  onClick={handleResetAllData}
                  className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-[#9F1D22] border border-rose-200/80 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Kosongkan seluruh mata kuliah dan tugas"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset Semua</span>
                </button>
              )}
            </div>
          </div>
          {courses.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                Daftar Mata Kuliah & Tugas Kosong
              </p>
              <p className="text-[11px] text-slate-500">
                Silakan unggah file kalender (.ics) di panel kanan dan klik{" "}
                <strong>Jalankan Sinkronisasi Tugas CeLOE</strong> untuk memuat mata kuliah & tugas secara otomatis.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {courses.map((c) => (
                <div
                  key={c.code}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#B6252A]">
                        {c.code}
                      </span>
                      <span>—</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {c.name}
                      </span>
                      {c.fromCeloe && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
                          Sinkron CeLOE
                        </span>
                      )}
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Kelas: {c.classCode}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold shrink-0">
                    {c.credits} SKS
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Impor Tugas CeLOE via Unggah File iCal (.ics) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                Impor Tugas CeLOE LMS via Kalender (.ics)
              </h2>
              <button
                type="button"
                onClick={handleFillSampleIcs}
                className="text-[11px] font-semibold text-[#9F1D22] bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-lg transition"
              >
                Muat File Contoh .ics
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Tidak memerlukan password SSO ataupun API internal kampus. Cukup unduh file{" "}
              <strong>Export Calendar (.ics)</strong> dari menu Calendar CeLOE Moodle Anda lalu unggah di bawah ini:
            </p>

            {/* Sinkron via URL Export Calendar CeLOE */}
            <form
              onSubmit={handleSyncFromUrl}
              className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2"
            >
              <label
                htmlFor="celoe-url"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700"
              >
                <Link2 className="w-3.5 h-3.5 text-[#9F1D22]" />
                Sinkron Otomatis via URL Kalender CeLOE
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  id="celoe-url"
                  type="url"
                  value={celoeUrl}
                  onChange={(e) => setCeloeUrl(e.target.value)}
                  placeholder="https://lms.telkomuniversity.ac.id/calendar/export_execute.php?..."
                  className="w-full sm:flex-1 min-w-0 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
                <button
                  type="submit"
                  disabled={isFetchingUrl || !celoeUrl.trim()}
                  className="px-3.5 py-2 rounded-lg bg-[#9F1D22] hover:bg-[#88181C] disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition"
                >
                  {isFetchingUrl ? "Mengambil..." : "Sinkronkan"}
                </button>
                {celoeUrl.trim() && (
                  <a
                    href={celoeUrl.trim().replace(/^webcal:\/\//i, "https://")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 transition flex items-center gap-1.5"
                    title="Buka / Unduh file .ics langsung dari browser Anda (jika server cloud diblokir Cloudflare kampus)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Unduh File</span>
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                CeLOE → Calendar → <strong>Export calendar</strong> → <strong>Get calendar URL</strong>, lalu tempel di sini. Jika sinkronisasi otomatis terhalang Cloudflare kampus, gunakan tombol <strong>Unduh File</strong> di samping lalu pilih berkasnya pada kotak di bawah.
              </p>
            </form>

            <p className="text-[11px] text-center text-slate-400">atau unggah file .ics secara manual</p>

            {/* Input File Tersembunyi */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,text/calendar"
              onChange={handleSelectIcsFile}
              className="hidden"
            />

            {/* Area Dropzone / Kartu File Terpilih */}
            {!celoeFileName ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (!droppedFile) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const content =
                      typeof ev.target?.result === "string"
                        ? ev.target.result
                        : "";
                    processLoadedIcsFile(droppedFile.name, content);
                    handleImportCeloeIcs(content);
                  };
                  reader.readAsText(droppedFile);
                }}
                className="border-2 border-dashed border-slate-200 hover:border-rose-300 bg-slate-50/70 hover:bg-rose-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-[#9F1D22]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik untuk memilih file <span className="text-[#9F1D22]">.ics</span> atau tarik file ke sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung file standar iCalendar (.ics) hasil ekspor kalender CeLOE LMS
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/70 text-[#9F1D22] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {celoeFileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      File kalender siap disinkronkan ke daftar tugas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition"
                  >
                    Ganti File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCeloeFileName(null);
                      setCeloeIcsInput("");
                      setSyncMessage(null);
                      setSyncStatus(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#9F1D22] text-[11px] font-semibold transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleImportCeloeIcs()}
              className="w-full py-2.5 rounded-xl bg-[#9F1D22] hover:bg-[#88181C] text-white text-xs font-bold shadow-sm transition"
            >
              Jalankan Sinkronisasi Tugas CeLOE
            </button>
            {syncMessage && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium ${
                  syncStatus === "ERROR"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                {syncMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
