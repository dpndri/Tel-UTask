export interface ParsedSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ParsedCeloeEvent {
  uid: string;
  title: string;
  description: string;
  courseCode: string;
  courseName: string;
  classCode: string;
  credits: number;
  category: "INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR";
  dueDate: string;
  subtasks: ParsedSubtask[];
}

const TELU_COURSE_CATALOG: Record<string, { name: string; credits: number }> = {
  // Kurikulum 2024 S1 Informatika Telkom University (Kode Resmi 8 Karakter)
  CAK2AAB3: { name: "Analisis dan Perancangan Perangkat Lunak", credits: 3 },
  CAK2BAB2: { name: "Analisis Kompleksitas Algoritma", credits: 2 },
  CAK2CAB3: { name: "Sistem Basis Data", credits: 3 },
  CAK2DAB3: { name: "Sistem Operasi", credits: 3 },
  CAK2EAB4: { name: "Struktur Data", credits: 4 },
  CAK2FAB2: { name: "Teori Bahasa dan Automata", credits: 2 },
  CAK2GAB3: { name: "Teori Peluang", credits: 3 },
  UBKXCCB2: { name: "Bahasa Indonesia", credits: 2 },
  // Kurikulum Sebelumnya (Kode 6 Karakter)
  CII3B4: { name: "Rekayasa Perangkat Lunak", credits: 4 },
  CII2B4: { name: "Struktur Data", credits: 4 },
  CII2J4: { name: "Basis Data", credits: 4 },
  CII2G3: { name: "Sistem Operasi", credits: 3 },
  CII2H3: { name: "Jaringan Komputer", credits: 3 },
};

function parseClassCode(cleaned: string): string {
  const bsRegMatch = cleaned.match(/BS1([A-Z]{2})-(\d{2})-REG(\d{2})/i);
  if (bsRegMatch) {
    return `${bsRegMatch[1].toUpperCase()}-${bsRegMatch[2]}-${bsRegMatch[3]}`;
  }

  const bsGabMatch = cleaned.match(/BS1([A-Z]{2})-(\d{2})-REG-([A-Z0-9]+)/i);
  if (bsGabMatch) {
    return `${bsGabMatch[1].toUpperCase()}-${bsGabMatch[2]}-${bsGabMatch[3].toUpperCase()}`;
  }

  const stdMatch = cleaned.match(/\b([A-Z]{2,4}-\d{2}-[A-Z0-9]{2,8})\b/i);
  if (stdMatch) {
    return stdMatch[1].toUpperCase();
  }

  return "IF-49-08";
}

function parseCourseMetadata(
  rawCat: string,
  summaryText: string,
  descText: string
): {
  courseCode: string;
  courseName: string;
  classCode: string;
  credits: number;
  category: "INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR";
} {
  const cleaned = rawCat
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .trim();

  const isPrakCat = /^PRAK[-_]/i.test(cleaned);
  const classCode = parseClassCode(`${cleaned} ${summaryText}`);

  const combinedTitle = `${cleaned} ${summaryText} ${descText}`;
  let category: "INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR" = "INDIVIDU";
  if (
    isPrakCat ||
    /\b(praktikum|tp modul|jurnal modul|kuis awal modul|tes awal modul)\b/i.test(
      combinedTitle
    )
  ) {
    category = "PRAKTIKUM";
  } else if (
    /\b(tugas besar|tugas kelompok|project kelompok|kelompok tugas besar)\b/i.test(
      combinedTitle
    )
  ) {
    category = "TUGAS_BESAR";
  }

  const tokens = cleaned.split(/[-_\s:/,]+/).filter(Boolean);
  const codeToken = tokens.find(
    (t) =>
      !/^(PRAK|BS1[A-Z]+|REG\d*|GAB\d*|\d{4,5}|IF)$/i.test(t) &&
      /^[A-Z]{3,4}[A-Z0-9]{2,4}\d$/i.test(t)
  );

  if (codeToken) {
    const code = codeToken.toUpperCase();
    const catalogEntry = TELU_COURSE_CATALOG[code];

    const lastDigit = parseInt(code.slice(-1), 10);
    const inferredCredits =
      !isNaN(lastDigit) && lastDigit >= 1 && lastDigit <= 6 ? lastDigit : 3;

    return {
      courseCode: code,
      courseName: catalogEntry?.name || `Mata Kuliah ${code}`,
      classCode,
      credits: catalogEntry?.credits || inferredCredits,
      category,
    };
  }

  const fallbackCode = (tokens[0] || "CAK2AAB3").toUpperCase().slice(0, 10);
  return {
    courseCode: fallbackCode,
    courseName: cleaned || "Mata Kuliah CeLOE",
    classCode,
    credits: 3,
    category,
  };
}

/**
 * Merapikan teks deskripsi mentah dari file .ics CeLOE LMS:
 * - Menghapus blok Links: ------ [1] https://... yang merusak layout kartu
 * - Mengubah kalimat HURUF KAPITAL berlebih menjadi kalimat yang nyaman dibaca
 * - Merangkum instruksi utama (durasi, jumlah attempt, format file, dan ketentuan)
 */
export function formatCleanDescription(
  rawDesc: string,
  title: string,
  courseName: string
): string {
  if (!rawDesc || !rawDesc.trim()) {
    if (/kuis awal modul/i.test(title)) {
      return `Kuis kesiapan praktikum ${courseName} di CeLOE LMS sebelum sesi praktikum dimulai.`;
    }
    if (/post\s*test/i.test(title)) {
      return `Evaluasi akhir materi (Post-Test) mata kuliah ${courseName} melalui CeLOE LMS.`;
    }
    if (/quiz|kuis/i.test(title)) {
      return `Evaluasi pemahaman materi perkuliahan ${courseName} secara mandiri di CeLOE LMS.`;
    }
    if (/tugas kelompok/i.test(title)) {
      return `Penugasan kelompok mata kuliah ${courseName}. Kumpulkan hasil diskusi kelompok melalui CeLOE LMS.`;
    }
    return `Tugas akademik mata kuliah ${courseName}. Pastikan berkas jawaban diunggah ke CeLOE LMS sebelum batas waktu.`;
  }

  let text = rawDesc
    .replace(/\u00a0/g, " ")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    // Hapus bagian Links: ------ sampai akhir
    .replace(/Links:\s*-+[\s\S]*$/i, "")
    // Hapus penanda referensi [1], [2], dst.
    .replace(/\[\d+\]/g, "")
    // Hapus URL mentah yang panjang
    .replace(/https?:\/\/\S+/gi, "")
    // Hapus karakter markdown underscore atau backtick
    .replace(/[_`]/g, "")
    // Hapus frase kosong seperti "BATAS WAKTU PENGUMPULAN : ....." atau "Terima kasih"
    .replace(/batas waktu (pengerjaan|pengumpulan)\s*:\s*\.*$/gim, "")
    .replace(/\bterima kasih\b\.?/gi, "");

  // Pisahkan baris atau bullet, bersihkan masing-masing segmen
  const lines = text
    .split(/\n+|\s*\*\s+/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(
      (line) =>
        line.length > 1 &&
        !/^(clo|soal|ketentuan tugas|petunjuk tugas.*):?$/i.test(line) &&
        !/^pt module \d+/i.test(line) &&
        !/^tp modul \d+$/i.test(line)
    );

  // Jika mayoritas huruf kapital (ALL CAPS), ubah ke Sentence Case dengan tetap menjaga singkatan penting
  const normalizeCase = (str: string) => {
    const upperCount = (str.match(/[A-Z]/g) || []).length;
    const alphaCount = (str.match(/[A-Za-z]/g) || []).length;
    if (alphaCount > 8 && upperCount / alphaCount > 0.65) {
      const lowered = str.toLowerCase();
      const sentenceCased = lowered.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (m) =>
        m.toUpperCase()
      );
      return sentenceCased
        .replace(/\b(nim|pdf|jpg|png|lms|seb|clo|dfa|nfa|std|wib|pr|tp|s\.d\.|mac)\b/gi, (m) =>
          m.toUpperCase()
        )
        .replace(/\bcodeblocks\b/gi, "CodeBlocks")
        .replace(/\bxcode\b/gi, "Xcode")
        .replace(/\bwindows\b/gi, "Windows")
        .replace(/\busecase\b/gi, "Use Case")
        .replace(/\bclass diagram\b/gi, "Class Diagram")
        .replace(/\bactivity diagram\b/gi, "Activity Diagram");
    }
    return str;
  };

  const cleanedSegments = lines.map(normalizeCase);
  const joined = cleanedSegments.join(" • ").replace(/\s+/g, " ").trim();

  if (!joined) {
    return `Tugas akademik mata kuliah ${courseName} di CeLOE LMS.`;
  }

  return joined.length > 260 ? `${joined.slice(0, 257).trim()}...` : joined;
}

/**
 * Meng-generate checklist sub-tugas secara cerdas berdasarkan analisis konteks judul dan isi deskripsi .ics
 */
export function generateSmartSubtasks(
  uid: string,
  title: string,
  rawDesc: string,
  category: "INDIVIDU" | "PRAKTIKUM" | "TUGAS_BESAR",
  isCompleted: boolean
): ParsedSubtask[] {
  const combined = `${title} ${rawDesc}`.toLowerCase();
  const items: string[] = [];

  // 1. Tugas Pendahuluan (TP) Praktikum (CodeBlocks / Xcode / Format TP_MOD_XX_NIM_NAMA)
  if (/tp modul/i.test(title) || /codeblocks|tp_mod/i.test(combined)) {
    const modMatch = title.match(/modul\s*(\d+)/i);
    const modNum = modMatch ? modMatch[1].padStart(2, "0") : "XX";
    items.push(`Unduh dan pelajari modul soal ${title}`);
    items.push("Implementasi & uji kode program di CodeBlocks (Windows) / Xcode (Mac)");
    items.push(`Susun laporan jawaban PDF dengan format TP_MOD_${modNum}_NIM_NAMA`);
    items.push("Unggah berkas PDF ke CeLOE LMS sebelum tenggat waktu");
  }
  // 2. Pemodelan Analisis RPL: Use Case Diagram & Use Case Scenario
  else if (/usecase|use case/i.test(combined)) {
    items.push("Identifikasi aktor dan daftar kebutuhan fungsional sistem");
    items.push("Buat rancangan Use Case Diagram sesuai studi kasus");
    items.push("Susun tabel spesifikasi Use Case Scenario secara lengkap");
    items.push("Unggah dokumen hasil pemodelan individu ke CeLOE LMS");
  }
  // 3. Pemodelan RPL: Class Diagram & Activity Diagram
  else if (/class diagram|activity diagram/i.test(combined)) {
    items.push("Rancang Class Diagram beserta atribut, metode, dan relasi antar kelas");
    items.push("Buat pemodelan alur proses sistem pada Activity Diagram");
    items.push("Unggah berkas hasil pemodelan individu ke CeLOE LMS");
  }
  // 4. Pembentukan Kelompok Tugas Besar
  else if (/pembentukan kelompok/i.test(combined)) {
    items.push("Bentuk tim kelompok Tugas Besar sesuai ketentuan (3–5 mahasiswa)");
    items.push("Tentukan Ketua Kelompok dan pembagian peran anggota");
    items.push("Isi dan daftarkan nama & NIM anggota kelompok di CeLOE LMS");
  }
  // 5. Proyek / Tugas Kelompok
  else if (category === "TUGAS_BESAR" || /tugas kelompok|project #1/i.test(combined)) {
    items.push("Pelajari berkas instruksi proyek bersama seluruh anggota kelompok");
    items.push("Bagi rincian sub-tugas pengerjaan kepada anggota berdasarkan NIM");
    items.push("Gabungkan hasil pekerjaan anggota & lakukan pengecekan akhir");
    items.push("Unggah dokumen laporan kelompok ke CeLOE LMS");
  }
  // 6. Tugas Teori Bahasa & Automata: NFA Epsilon-move / Lazy Evaluation / STD
  else if (/lazy evaluation|epsilon|ε-move/i.test(combined)) {
    items.push("Pilih soal latihan sesuai NIM (NIM Ganjil: Latihan 1, NIM Genap: Latihan 2)");
    items.push("Susun tabel evaluasi lazy (lazy evaluation) secara lengkap");
    items.push("Gambarkan Diagram Transisi Keadaan (State Transition Diagram / STD)");
    items.push("Unggah softfile penyelesaian ke CeLOE LMS");
  }
  // 7. Tugas Minimisasi DFA / Bahasa Reguler
  else if (/minimisasi dfa|bahasa reguler/i.test(combined)) {
    items.push(`Pelajari kembali slide materi terkait ${title.replace(/^Pengumpulan\s+/i, "")}`);
    items.push("Kerjakan soal latihan mandiri pada halaman terakhir slide");
    items.push("Dokumentasikan langkah penyelesaian & unggah ke CeLOE LMS");
  }
  // 8. Tugas Struktur Data (Linked List, Stack, Queue, Tree - Tulis Tangan)
  else if (/singly linked list|doubly linked list|\bstack\b|\bqueue\b|\btree\b/i.test(title)) {
    if (/insert.*delete.*searching/i.test(combined)) {
      items.push("Kerjakan analisis operasi insert, delete, dan searching secara tulis tangan");
    } else {
      items.push(`Kerjakan soal latihan ${title.replace(/\[Tugas\]\s*/i, "")} dengan tulis tangan di kertas`);
    }
    items.push("Cantumkan Nama dan NIM pada lembar kertas jawaban");
    items.push("Foto/scan jawaban menjadi dokumen PDF dan unggah ke CeLOE LMS");
  }
  // 9. Tugas Teori Peluang (Sub CLO / Kelompok Maks 3 Orang / Onsite)
  else if (/peluang terjadinya|sub clo/i.test(combined)) {
    items.push("Diskusikan penyelesaian soal perhitungan peluang (maks. 3 mahasiswa)");
    items.push("Tuliskan langkah perhitungan peluang secara runtut");
    items.push("Unggah jawaban dalam format PDF/gambar saat sesi kelas atau responsi");
  }
  // 10. PR Kompleksitas Algoritma (Asimtotik / Iteratif)
  else if (/\bpr\s*[12]\b|berkas pr/i.test(combined)) {
    items.push("Selesaikan perhitungan matematis kompleksitas waktu & notasi asimtotik");
    items.push("Pindai (foto/scan) hasil pengerjaan (PDF/PNG/JPG maks. 2 MB)");
    items.push("Unggah berkas PR ke slot pengumpulan CeLOE LMS");
  }
  // 11. Kuis / Pre-Test / Post-Test / Try Out
  else if (/quiz|kuis|pre-test|post\s*test|try out|latihan/i.test(combined)) {
    const durMatch = combined.match(/(\d+)\s*menit/);
    const attMatch = combined.match(/(\d+)\s*(?:kali|x\s*attempt|attempt)/);
    items.push(`Pelajari materi perkuliahan terkait sebelum memulai ${title.replace(/\s+(opens|closes)$/i, "")}`);
    if (/\bseb\b|safe exam/i.test(combined)) {
      items.push("Aktifkan dan uji perangkat lunak Safe Exam Browser (SEB)");
    }
    if (/cheatsheet/i.test(combined)) {
      items.push("Siapkan 1 lembar cheatsheet A4 tulis tangan sesuai ketentuan dosen");
    }
    items.push(
      `Kerjakan soal evaluasi di CeLOE LMS${
        durMatch ? ` (durasi ${durMatch[1]} menit)` : ""
      }${attMatch ? ` — maks. ${attMatch[1]}x percobaan` : ""}`
    );
    items.push("Periksa kembali seluruh jawaban dan klik Submit sebelum batas waktu");
  }
  // 12. Default Tugas Individu Umum
  else {
    items.push(`Pelajari instruksi dan ketentuan pengerjaan ${title}`);
    items.push("Susun dokumen penyelesaian tugas sesuai format mata kuliah");
    items.push("Unggah berkas jawaban ke CeLOE LMS sebelum tenggat");
  }

  return items.map((subTitle, idx) => ({
    id: `sub-${uid}-${idx + 1}`,
    title: subTitle,
    isCompleted,
  }));
}

/**
 * Parser file iCalendar (.ics) standar Moodle CeLOE Universitas Telkom
 */
export const isCeloeOpensTitle = (title: string) => /\sopens\s*$/i.test(title.trim());

export function parseCeloeIcs(icsContent: string): ParsedCeloeEvent[] {
  const events: ParsedCeloeEvent[] = [];

  // Unfold baris multi-line sesuai standar RFC 5545 (CRLF/LF diikuti spasi atau tab)
  const unfolded = icsContent.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const endIdx = block.indexOf("END:VEVENT");
    const body = endIdx !== -1 ? block.slice(0, endIdx) : block;

    const uidMatch = body.match(/UID(?:;[^:]+)?:(.+)/);
    const summaryMatch = body.match(/SUMMARY(?:;[^:]+)?:(.+)/);
    const descMatch = body.match(/DESCRIPTION(?:;[^:]+)?:(.+)/);
    const categoriesMatch = body.match(/CATEGORIES(?:;[^:]+)?:(.+)/);
    const dtEndMatch =
      body.match(/DTEND(?:;[^:]+)?:(\d{8}T\d{6}Z?)/) ||
      body.match(/DTSTART(?:;[^:]+)?:(\d{8}T\d{6}Z?)/) ||
      body.match(/DTEND(?:;[^:]+)?:(\d{8})/) ||
      body.match(/DTSTART(?:;[^:]+)?:(\d{8})/);

    if (summaryMatch && dtEndMatch) {
      // Event "... opens" hanya penanda kuis dibuka; tenggat sebenarnya ada di event "... closes"
      if (isCeloeOpensTitle(summaryMatch[1])) continue;

      const rawDate = dtEndMatch[1].trim();
      const year = rawDate.slice(0, 4);
      const month = rawDate.slice(4, 6);
      const day = rawDate.slice(6, 8);
      const hour = rawDate.length >= 11 ? rawDate.slice(9, 11) : "23";
      const minute = rawDate.length >= 13 ? rawDate.slice(11, 13) : "59";
      const isUtc = rawDate.endsWith("Z");
      const isoDate = isUtc
        ? `${year}-${month}-${day}T${hour}:${minute}:00.000Z`
        : new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`).toISOString();

      const rawTitle = summaryMatch[1]
        .trim()
        .replace(/\\,/g, ",")
        .replace(/\\;/g, ";")
        .replace(/\s+is due$/i, "")
        .replace(/\s*\(Due date\)$/i, "");

      const rawDesc = descMatch ? descMatch[1].trim() : "";
      const rawCat = categoriesMatch ? categoriesMatch[1].trim() : "CAK2AAB3";
      const courseMeta = parseCourseMetadata(rawCat, rawTitle, rawDesc);

      const cleanDesc = formatCleanDescription(
        rawDesc,
        rawTitle,
        courseMeta.courseName
      );

      const uid = uidMatch
        ? uidMatch[1].trim()
        : `celoe-${Date.now()}-${Math.random()}`;
      const smartSubtasks = generateSmartSubtasks(
        uid,
        rawTitle,
        rawDesc,
        courseMeta.category,
        false
      );

      events.push({
        uid,
        title: rawTitle,
        description: cleanDesc,
        courseCode: courseMeta.courseCode,
        courseName: courseMeta.courseName,
        classCode: courseMeta.classCode,
        credits: courseMeta.credits,
        category: courseMeta.category,
        dueDate: isoDate,
        subtasks: smartSubtasks,
      });
    }
  }

  return events;
}
