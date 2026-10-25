"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
} from "lucide-react";
import { useApp, UserRole, formatRoleDisplay, TEAM_MEMBERS } from "../../context/AppContext";

async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginPage() {
  const router = useRouter();
  const { isMounted, isLoggedIn, members, login, register } = useApp();

  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [ssoIdentifier, setSsoIdentifier] = useState("");
  const [ssoPassword, setSsoPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("Mahasiswa");
  const [regName, setRegName] = useState("");
  const [regNim, setRegNim] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("Mahasiswa");
  const [showSsoPassword, setShowSsoPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Jika sudah login, redirect otomatis ke halaman utama /
  useEffect(() => {
    if (isMounted && isLoggedIn) {
      router.replace("/");
    }
  }, [isMounted, isLoggedIn, router]);

  const handleSsoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = ssoIdentifier.trim();
    const rawPass = ssoPassword.trim();

    if (!rawId || !rawPass) {
      setLoginError("Harap isi NIM / Username SSO dan Kata Sandi terlebih dahulu.");
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    const cleaned = rawId.replace(/@student\.telkomuniversity\.ac\.id$/i, "").trim().toLowerCase();
    const matched =
      members.find(
        (m) => m.nim.toLowerCase() === cleaned
      ) ||
      TEAM_MEMBERS.find(
        (m) => m.nim.toLowerCase() === cleaned
      );

    if (!matched) {
      setIsLoggingIn(false);
      setLoginError(
        `Akun dengan NIM/Username "${cleaned}" belum terdaftar. Silakan daftar terlebih dahulu melalui tab "Daftar Akun (Register)".`
      );
      return;
    }

    if (loginRole === "Ketua Kelompok" && matched.role !== "Ketua Kelompok") {
      setIsLoggingIn(false);
      setLoginError(
        `Validasi Role Ditolak: Akun "${matched.name}" (NIM: ${matched.nim}) belum pernah mengambil role Ketua Kelompok. Anda belum bisa login di sesi Ketua Kelompok dan hanya dapat masuk sebagai Mahasiswa.`
      );
      return;
    }

    // Verifikasi kata sandi dengan hash SHA-256
    try {
      const enteredHash = await hashPassword(rawPass);
      const rawStore = localStorage.getItem("telutask_auth_passwords");
      let authStore: Record<string, string> = rawStore ? JSON.parse(rawStore) : {};

      // Seed password akun default (Muhammad Irgie Dapiandri: Vvxenc1337@)
      if (!authStore["103012500187"]) {
        authStore["103012500187"] = await hashPassword("Vvxenc1337@");
        localStorage.setItem("telutask_auth_passwords", JSON.stringify(authStore));
      }

      if (authStore[cleaned]) {
        if (authStore[cleaned] !== enteredHash) {
          setIsLoggingIn(false);
          setLoginError("Kata sandi salah. Harap periksa kembali kata sandi akun SSO Anda.");
          return;
        }
      } else {
        // Ikat kata sandi pertama kali jika akun belum memiliki rekaman hash
        authStore[cleaned] = enteredHash;
        localStorage.setItem("telutask_auth_passwords", JSON.stringify(authStore));
      }
    } catch {
      // Fallback jika crypto API terkendala
    }

    login(matched.nim, loginRole);
    setIsLoggingIn(false);
    router.push("/");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = regName.trim();
    const nim = regNim.trim();
    const pass = regPassword.trim();

    if (!name || !nim || !pass) {
      setLoginError("Harap lengkapi Nama Mahasiswa, NIM, dan Kata Sandi untuk mendaftar.");
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const passHash = await hashPassword(pass);
      const rawStore = localStorage.getItem("telutask_auth_passwords");
      const authStore: Record<string, string> = rawStore ? JSON.parse(rawStore) : {};
      authStore[nim.toLowerCase()] = passHash;
      localStorage.setItem("telutask_auth_passwords", JSON.stringify(authStore));
    } catch {
      // Abaikan
    }

    register(name, nim, regRole);
    setIsLoggingIn(false);
    router.push("/");
  };

  return (
    <div className="min-h-[100dvh] bg-[#F4F6F9] flex flex-col justify-between p-4 sm:p-8 text-slate-800">
      {/* Top Header Ringkas */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9F1D22] text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
            TU
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">
              Tel-UTask • Universitas Telkom
            </h1>
            <p className="text-[11px] text-slate-500">
              Single Sign-On (SSO) & CeLOE LMS Academic Integration
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-semibold text-slate-600 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Server SSO & CeLOE Aktif
        </span>
      </div>

      {/* Kartu Utama Login & Register SSO */}
      <div className="max-w-5xl w-full mx-auto my-6 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Kolom Kiri: Branding Universitas Telkom */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#9F1D22] via-[#8E191E] to-[#6E1115] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-rose-200" />
              <span>Ekosistem Akademik S1 Informatika</span>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                Kelola Tenggat CeLOE & Prioritas Kuliah Lebih Terukur.
              </h2>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
                Terhubung langsung dengan kalender akademik CeLOE LMS dan data KRS kelas{" "}
                <span className="font-semibold text-white">IF-49-08</span> untuk menyusun prioritas pengerjaan tugas secara cerdas.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <p className="text-xs font-bold text-white">
                  1. Sinkronisasi Kalender CeLOE (.ics) Otomatis
                </p>
                <p className="text-[11px] text-rose-100/85 mt-0.5">
                  Impor jadwal kuis, Tugas Pendahuluan (TP), dan Tugas Besar lengkap dengan sub-tugas cerdas.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <p className="text-xs font-bold text-white">
                  2. Skor Rekomendasi & Pengingat Berjenjang
                </p>
                <p className="text-[11px] text-rose-100/85 mt-0.5">
                  Urutan fokus otomatis berdasarkan sisa waktu (H-3 Hari, H-1 Hari, H-3 Jam), bobot SKS, dan kesulitan.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <p className="text-xs font-bold text-white">
                  3. Koordinasi Tugas Besar Berbasis NIM
                </p>
                <p className="text-[11px] text-rose-100/85 mt-0.5">
                  Pembagian sub-tugas anggota kelompok secara transparan sesuai peran Ketua & Anggota.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-white/15 flex items-center justify-between text-[11px] text-rose-100/80 relative z-10">
            <span>Kurikulum 2024 • Fakultas Informatika</span>
            <span className="font-mono font-semibold text-white">IF-49-08</span>
          </div>
        </div>

        {/* Kolom Kanan: Tab Masuk SSO & Daftar Akun Baru */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9F1D22]">
                  Portal Autentikasi Mahasiswa
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {authMode === "LOGIN"
                    ? "Masuk dengan Akun SSO Tel-U"
                    : "Daftar Akun Mahasiswa & Ambil Role"}
                </h2>
              </div>

              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("LOGIN");
                    setLoginError(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    authMode === "LOGIN"
                      ? "bg-white text-[#9F1D22] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Masuk SSO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("REGISTER");
                    setLoginError(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    authMode === "REGISTER"
                      ? "bg-white text-[#9F1D22] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Daftar Akun (Register)
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-[#9F1D22]">
                {loginError}
              </div>
            )}

            {authMode === "LOGIN" ? (
              <form onSubmit={handleSsoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIM / Username SSO Telkom University
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ssoIdentifier}
                      onChange={(e) => setSsoIdentifier(e.target.value)}
                      placeholder="Contoh: 103012500187 atau username@student.telkomuniversity.ac.id"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="text"
                      className="w-full pl-10 pr-4 py-2.5 text-base sm:text-xs bg-slate-50/80 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#9F1D22] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kata Sandi SSO
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSsoPassword ? "text" : "password"}
                      value={ssoPassword}
                      onChange={(e) => setSsoPassword(e.target.value)}
                      placeholder="Masukkan kata sandi SSO"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 text-base sm:text-xs bg-slate-50/80 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#9F1D22] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSsoPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSsoPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Pilihan Ambil Role Saat Masuk */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ambil Peran Sesi Ini (Role)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole("Mahasiswa");
                        setLoginError(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                        loginRole === "Mahasiswa"
                          ? "bg-rose-50/80 border-[#9F1D22] ring-1 ring-rose-200"
                          : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          1. Mahasiswa
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Status Mahasiswa (bukan Ketua Kelompok)
                        </p>
                      </div>
                      {loginRole === "Mahasiswa" && (
                        <Check className="w-4 h-4 text-[#9F1D22] shrink-0 mt-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole("Ketua Kelompok");
                        const cleaned = ssoIdentifier
                          .replace(/@student\.telkomuniversity\.ac\.id$/i, "")
                          .trim();
                        const matched = members.find(
                          (m) =>
                            m.nim.toLowerCase() === cleaned.toLowerCase() ||
                            m.name.toLowerCase().includes(cleaned.toLowerCase())
                        );
                        if (matched && matched.role !== "Ketua Kelompok") {
                          setLoginError(
                            `Validasi Role Ditolak: Akun "${matched.name}" (NIM: ${matched.nim}) belum pernah mengambil role Ketua Kelompok. Anda belum bisa login di sesi Ketua Kelompok dan hanya dapat masuk sebagai Mahasiswa.`
                          );
                        } else {
                          setLoginError(null);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                        loginRole === "Ketua Kelompok"
                          ? "bg-rose-50/80 border-[#9F1D22] ring-1 ring-rose-200"
                          : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          2. Ketua Kelompok
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Mahasiswa + Akses Ketua Kelompok
                        </p>
                      </div>
                      {loginRole === "Ketua Kelompok" && (
                        <Check className="w-4 h-4 text-[#9F1D22] shrink-0 mt-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-[#B6252A] to-[#9F1D22] hover:from-[#A32025] hover:to-[#88181C] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
                >
                  <span>
                    {isLoggingIn
                      ? "Memverifikasi Sesi SSO..."
                      : `Masuk sebagai ${formatRoleDisplay(loginRole)}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Lengkap Mahasiswa
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Raka Pratama"
                      autoComplete="name"
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-slate-50/80 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#9F1D22] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIM Mahasiswa Tel-U
                    </label>
                    <input
                      type="text"
                      required
                      value={regNim}
                      onChange={(e) => setRegNim(e.target.value)}
                      placeholder="Contoh: 103012500412"
                      inputMode="numeric"
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs font-mono bg-slate-50/80 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#9F1D22] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Buat Kata Sandi Akun
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSsoPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-2.5 text-base sm:text-xs bg-slate-50/80 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#9F1D22] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSsoPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSsoPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pilih & Ambil Peran (Role)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Ketua Kelompok otomatis berstatus Mahasiswa
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegRole("Mahasiswa")}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                        regRole === "Mahasiswa"
                          ? "bg-rose-50/80 border-[#9F1D22] ring-1 ring-rose-200"
                          : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-900">
                          1. Mahasiswa
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                          Mahasiswa
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Mengelola tugas kuliah, sinkronisasi CeLOE (.ics), dan memperbarui progres sub-tugas kelompok pada NIM sendiri.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("Ketua Kelompok")}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                        regRole === "Ketua Kelompok"
                          ? "bg-rose-50/80 border-[#9F1D22] ring-1 ring-rose-200"
                          : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-900">
                          2. Ketua Kelompok
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-[#9F1D22]">
                          Mahasiswa + Ketua
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Sudah pasti <strong>Mahasiswa</strong>, ditambah akses membuat Tugas Besar baru dan membagi sub-tugas ke NIM anggota.
                      </p>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-[#B6252A] to-[#9F1D22] hover:from-[#A32025] hover:to-[#88181C] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
                >
                  <span>
                    {isLoggingIn
                      ? "Mendaftarkan Akun..."
                      : `Daftar & Ambil Role: ${formatRoleDisplay(regRole)}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-2">
            Terintegrasi dengan Single Sign-On (SSO) & CeLOE Learning Management System Universitas Telkom.
          </p>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto text-center text-[11px] text-slate-400">
        © 2026 Tel-UTask — Proyek Analisis dan Perancangan Perangkat Lunak (CAK2AAB3) • Kelas IF-49-08
      </div>
    </div>
  );
}
