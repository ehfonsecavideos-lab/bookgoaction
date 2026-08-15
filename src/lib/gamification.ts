export const XP_RULES = {
  day: 50,
  reflection: 20,
  week: 200,
  journey: 500,
} as const;

export type LevelDef = { level: number; name: string; min: number };

export const LEVELS: LevelDef[] = [
  { level: 1, name: "Explorador", min: 0 },
  { level: 2, name: "Aprendiz", min: 300 },
  { level: 3, name: "Praticante", min: 800 },
  { level: 4, name: "Disciplinado", min: 1500 },
  { level: 5, name: "Transformador", min: 2500 },
  { level: 6, name: "Mestre", min: 4000 },
];


export function levelFromXp(xp: number) {
  let current = LEVELS[0]!;
  for (const l of LEVELS) if (xp >= l.min) current = l;
  const next = LEVELS.find((l) => l.min > xp);
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.round(((xp - current.min) / span) * 100) : 100;
  return { ...current, next: next ?? null, progress };
}

export type BadgeDef = {
  type: string;
  title: string;
  description: string;
  icon: string;
};

export const BADGES: BadgeDef[] = [
  { type: "first_mission", title: "Primeira missão", description: "Você concluiu sua primeira missão prática.", icon: "🏆" },
  { type: "streak_3", title: "3 dias seguidos", description: "Três dias de prática consecutiva.", icon: "🔥" },
  { type: "streak_7", title: "7 dias seguidos", description: "Uma semana inteira de consistência.", icon: "🔥" },
  { type: "streak_14", title: "14 dias seguidos", description: "Duas semanas sem quebrar o ritmo.", icon: "🔥" },
  { type: "streak_21", title: "21 dias completos", description: "Você atravessou a jornada inteira em sequência.", icon: "🔥" },
  { type: "first_book", title: "Primeiro livro transformado", description: "Um livro virou prática de verdade.", icon: "📚" },
  { type: "books_3", title: "3 livros concluídos", description: "Três jornadas completas.", icon: "📚" },
  { type: "books_5", title: "5 livros concluídos", description: "Cinco jornadas completas.", icon: "📚" },
  { type: "perfect_week", title: "Semana perfeita", description: "Sete missões concluídas sem falhar.", icon: "⚡" },
  { type: "consistency_master", title: "Mestre da consistência", description: "Maior sequência de 14 dias ou mais.", icon: "💎" },
];

export function badgeByType(type: string) {
  return BADGES.find((b) => b.type === type);
}

export const PHASES = [
  { key: "COMPREENDER", label: "Compreender", range: "Dias 1–7" },
  { key: "APLICAR", label: "Aplicar", range: "Dias 8–14" },
  { key: "CONSOLIDAR", label: "Consolidar", range: "Dias 15–20" },
  { key: "TRANSFORMAR", label: "Transformar", range: "Dia 21" },
] as const;

export function phaseForDay(day: number) {
  if (day <= 7) return "COMPREENDER";
  if (day <= 14) return "APLICAR";
  if (day <= 20) return "CONSOLIDAR";
  return "TRANSFORMAR";
}

export const DIFFICULTY_OPTIONS = [
  { value: "muito_dificil", emoji: "😫", label: "Muito difícil" },
  { value: "dificil", emoji: "😕", label: "Difícil" },
  { value: "tranquila", emoji: "🙂", label: "Tranquila" },
  { value: "muito_boa", emoji: "😃", label: "Muito boa" },
  { value: "transformadora", emoji: "🤩", label: "Transformadora" },
] as const;
