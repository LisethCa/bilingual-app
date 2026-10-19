// Sistema de experiencia (XP). Reglas:
//  - El acceso a un nivel lo da la compra; el XP nunca bloquea contenido.
//  - El progreso es cuánto se completó (lecciones + lecturas).
//  - El XP es un premio con valores fijos, calculado siempre a partir de lo completado
//    (userProgress.completedLessons / completedReadings), así todos los usuarios ven
//    el mismo número en todas las pantallas.

export type LevelId = "A1" | "A2" | "B1";

export const XP = {
  lesson: 50,
  reading: 20,
  unitBonus: 100, // al completar todas las lecciones de una unidad (cuando se gana la insignia)
  finalExam: 300,
};

// exámenes finales de cada nivel: valen XP.finalExam en lugar de XP.lesson
const FINAL_EXAMS = new Set(["A1_MEGA_FINAL_EXAM", "A2_general_review"]);

// a partir de este progreso se sugiere el nivel siguiente
export const NEXT_LEVEL_HINT_AT = 0.8;

export const LEVELS: LevelId[] = ["A1", "A2", "B1"];

export const isFinalExam = (lessonId: string) => FINAL_EXAMS.has(lessonId);

export const lessonXp = (lessonId: string): number =>
  isFinalExam(lessonId) ? XP.finalExam : XP.lesson;

export type ProgressStats = {
  xp: number;
  lessonsDone: number;
  lessonsTotal: number;
  readingsDone: number;
  readingsTotal: number;
  /** 0..1, lecciones y lecturas */
  progress: number;
};

export type XpSummary = {
  total: number;
  byLevel: Record<LevelId, ProgressStats>;
  byUnit: Record<string, ProgressStats>;
};

type ReadingRef = { id: string; unitId: string };

const emptyStats = (): ProgressStats => ({
  xp: 0,
  lessonsDone: 0,
  lessonsTotal: 0,
  readingsDone: 0,
  readingsTotal: 0,
  progress: 0,
});

const levelOfUnit = (unitId: string): LevelId | null => {
  const m = unitId.match(/^unit(A1|A2|B1)_/);
  return m ? (m[1] as LevelId) : null;
};

/**
 * @param modules  documentos de la colección "modules" (con units)
 * @param readings lecturas (al menos id y unitId)
 */
export const summarizeXp = (
  modules: { units?: Record<string, any> }[],
  readings: ReadingRef[],
  completedLessons: Record<string, unknown> = {},
  completedReadings: Record<string, unknown> = {},
): XpSummary => {
  const byLevel = Object.fromEntries(
    LEVELS.map((l) => [l, emptyStats()]),
  ) as Record<LevelId, ProgressStats>;
  const byUnit: Record<string, ProgressStats> = {};
  const counted = new Set<string>(); // una lección listada en dos unidades suma una sola vez al nivel

  const readingsByUnit: Record<string, ReadingRef[]> = {};
  readings.forEach((r) => (readingsByUnit[r.unitId] ||= []).push(r));

  modules.forEach((m) =>
    Object.entries(m.units || {}).forEach(([unitId, unit]) => {
      const level = levelOfUnit(unitId);
      if (!level) return;
      const u = (byUnit[unitId] ||= emptyStats());
      const lvl = byLevel[level];
      const lessons: string[] = unit.lessons || [];

      lessons.forEach((id) => {
        const done = !!completedLessons[id];
        u.lessonsTotal++;
        if (done) {
          u.lessonsDone++;
          u.xp += lessonXp(id);
        }
        if (counted.has(id)) return;
        counted.add(id);
        lvl.lessonsTotal++;
        if (done) {
          lvl.lessonsDone++;
          lvl.xp += lessonXp(id);
        }
      });
      if (lessons.length && u.lessonsDone === lessons.length) {
        u.xp += XP.unitBonus;
        lvl.xp += XP.unitBonus;
      }

      (readingsByUnit[unitId] || []).forEach((r) => {
        const done = !!completedReadings[r.id];
        [u, lvl].forEach((s) => {
          s.readingsTotal++;
          if (done) {
            s.readingsDone++;
            s.xp += XP.reading;
          }
        });
      });
    }),
  );

  const withProgress = (s: ProgressStats) => {
    const total = s.lessonsTotal + s.readingsTotal;
    s.progress = total ? (s.lessonsDone + s.readingsDone) / total : 0;
  };
  Object.values(byUnit).forEach(withProgress);
  Object.values(byLevel).forEach(withProgress);

  return {
    total: LEVELS.reduce((sum, l) => sum + byLevel[l].xp, 0),
    byLevel,
    byUnit,
  };
};

/** Nivel que se está cursando: el primero comprado que todavía no está terminado (o el último comprado). */
export const currentLevel = (
  summary: XpSummary,
  purchased: Record<string, boolean> = {},
): LevelId => {
  const owned = LEVELS.filter((l) => purchased[l]);
  if (!owned.length) return "A1";
  return (
    owned.find((l) => summary.byLevel[l].progress < 1) ||
    owned[owned.length - 1]
  );
};
