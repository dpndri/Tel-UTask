export interface PriorityInput {
  dueDate: Date | string;
  credits: number;    // Bobot SKS (1 - 4)
  difficulty: number; // Tingkat kesulitan (1 - 5)
  status: string;
}

export interface ReminderInfo {
  stage: "OVERDUE" | "H_MINUS_3_HOURS" | "H_MINUS_1_DAY" | "H_MINUS_3_DAYS" | "SAFE";
  label: string;
  hoursRemaining: number;
  urgent: boolean;
}

/**
 * FR-10: Menghasilkan skor rekomendasi urutan pengerjaan (0 - 100)
 * Berdasarkan sisa waktu tenggat (55%), bobot SKS (25%), dan tingkat kesulitan (20%).
 */
export function calculateRecommendationScore(item: PriorityInput, now = new Date()): number {
  if (item.status === "SELESAI") return 0;

  const due = new Date(item.dueDate).getTime();
  const hoursLeft = (due - now.getTime()) / (1000 * 60 * 60);

  let urgencyScore = 0;
  if (hoursLeft <= 0) {
    urgencyScore = 100; // Terlewat / hari ini
  } else if (hoursLeft <= 6) {
    urgencyScore = 98;
  } else if (hoursLeft <= 24) {
    urgencyScore = 90;
  } else if (hoursLeft <= 72) {
    urgencyScore = 75;
  } else if (hoursLeft <= 168) {
    urgencyScore = 50;
  } else {
    urgencyScore = Math.max(10, 40 - Math.floor(hoursLeft / 48));
  }

  const sksScore = Math.min(100, (item.credits / 4) * 100);
  const difficultyScore = Math.min(100, (item.difficulty / 5) * 100);

  return Math.round(urgencyScore * 0.55 + sksScore * 0.25 + difficultyScore * 0.2);
}

/**
 * FR-07: Pengingat berjenjang pada H-3 hari, H-1 hari, dan H-3 jam sebelum tenggat.
 */
export function evaluateReminderStage(dueDate: Date | string, status: string, now = new Date()): ReminderInfo {
  if (status === "SELESAI") {
    return { stage: "SAFE", label: "Selesai", hoursRemaining: 0, urgent: false };
  }

  const due = new Date(dueDate).getTime();
  const hoursRemaining = Math.round(((due - now.getTime()) / (1000 * 60 * 60)) * 10) / 10;

  if (status === "OVERDUE" || hoursRemaining < 0) {
    return {
      stage: "OVERDUE",
      label:
        hoursRemaining < 0
          ? `Terlambat ${Math.abs(Math.round(hoursRemaining))} jam`
          : "Overdue (Terlewat)",
      hoursRemaining,
      urgent: true,
    };
  }
  if (hoursRemaining <= 3) {
    return {
      stage: "H_MINUS_3_HOURS",
      label: `Pengingat H-3 Jam (${hoursRemaining} jam lagi!)`,
      hoursRemaining,
      urgent: true,
    };
  }
  if (hoursRemaining <= 24) {
    return {
      stage: "H_MINUS_1_DAY",
      label: `Pengingat H-1 Hari (${Math.round(hoursRemaining)} jam lagi)`,
      hoursRemaining,
      urgent: true,
    };
  }
  if (hoursRemaining <= 72) {
    return {
      stage: "H_MINUS_3_DAYS",
      label: `Pengingat H-3 Hari (${Math.ceil(hoursRemaining / 24)} hari lagi)`,
      hoursRemaining,
      urgent: false,
    };
  }

  return {
    stage: "SAFE",
    label: `${Math.ceil(hoursRemaining / 24)} hari lagi`,
    hoursRemaining,
    urgent: false,
  };
}
