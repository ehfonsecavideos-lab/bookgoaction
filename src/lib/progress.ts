import { supabase } from "@/integrations/supabase/client";
import { BADGES, XP_RULES, levelFromXp, type BadgeDef } from "./gamification";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

async function awardBadges(userId: string, types: string[]) {
  const earned: BadgeDef[] = [];
  for (const type of types) {
    const badge = BADGES.find((b) => b.type === type);
    if (!badge) continue;
    const { error } = await supabase.from("achievements").insert({
      user_id: userId,
      type: badge.type,
      title: badge.title,
      description: badge.description,
    });
    if (!error) earned.push(badge);
  }
  return earned;
}

export type CompleteDayInput = {
  userId: string;
  journeyId: string;
  dayId: string;
  dayNumber: number;
  difficulty: string | null;
  reflection: string;
  note: string;
};

export async function completeDay(input: CompleteDayInput) {
  const { userId, journeyId, dayId, dayNumber, difficulty, reflection, note } = input;

  await supabase
    .from("journey_days")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", dayId);

  await supabase.from("check_ins").insert({
    journey_day_id: dayId,
    user_id: userId,
    difficulty,
    reflection: reflection || null,
    note: note || null,
  });

  await supabase
    .from("journey_days")
    .update({ status: "available" })
    .eq("journey_id", journeyId)
    .eq("day_number", dayNumber + 1)
    .eq("status", "locked");

  const { data: days } = await supabase
    .from("journey_days")
    .select("day_number, status")
    .eq("journey_id", journeyId);

  const completedCount = (days ?? []).filter((d) => d.status === "completed").length;
  const total = (days ?? []).length || 21;
  const progress = Math.round((completedCount / total) * 100);
  const journeyCompleted = completedCount >= total;

  await supabase
    .from("journeys")
    .update({
      progress,
      status: journeyCompleted ? "completed" : "in_progress",
      completed_at: journeyCompleted ? new Date().toISOString() : null,
    })
    .eq("id", journeyId);

  let xpGained = XP_RULES.day;
  if (reflection.trim()) xpGained += XP_RULES.reflection;
  if (completedCount === 7 || completedCount === 14) xpGained += XP_RULES.week;
  if (journeyCompleted) xpGained += XP_RULES.journey;

  const { data: stats } = await supabase
    .from("user_stats")
    .select("xp, streak, longest_streak, last_completed_date")
    .eq("user_id", userId)
    .maybeSingle();

  const today = todayISO();
  const previous = stats?.last_completed_date ?? null;
  let streak = stats?.streak ?? 0;
  if (previous === today) {
    streak = Math.max(streak, 1);
  } else if (previous && daysBetween(previous, today) === 1) {
    streak = streak + 1;
  } else {
    streak = 1;
  }
  const longest = Math.max(stats?.longest_streak ?? 0, streak);
  const xp = (stats?.xp ?? 0) + xpGained;

  await supabase.from("user_stats").upsert({
    user_id: userId,
    xp,
    level: levelFromXp(xp).level,
    streak,
    longest_streak: longest,
    last_completed_date: today,
  });

  const badgeTypes: string[] = ["first_mission"];
  if (streak >= 3) badgeTypes.push("streak_3");
  if (streak >= 7) badgeTypes.push("streak_7", "perfect_week");
  if (streak >= 14) badgeTypes.push("streak_14", "consistency_master");
  if (streak >= 21) badgeTypes.push("streak_21");
  if (journeyCompleted) {
    badgeTypes.push("first_book");
    const { count } = await supabase
      .from("journeys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");
    if ((count ?? 0) >= 3) badgeTypes.push("books_3");
    if ((count ?? 0) >= 5) badgeTypes.push("books_5");
  }

  const newBadges = await awardBadges(userId, badgeTypes);

  return { xpGained, xp, streak, journeyCompleted, newBadges, completedCount, total, progress };
}

export async function streakStatus(userId: string) {
  const { data } = await supabase
    .from("user_stats")
    .select("streak, last_completed_date")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.last_completed_date) return { broken: false, streak: data?.streak ?? 0 };
  const gap = daysBetween(data.last_completed_date, todayISO());
  return { broken: gap > 1 && (data.streak ?? 0) > 1, streak: data.streak ?? 0 };
}
