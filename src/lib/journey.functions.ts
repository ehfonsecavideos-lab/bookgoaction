import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  analysisPrompt,
  chat,
  parseJson,
  planPrompt,
  COPYRIGHT_RULE,
  type AnalysisShape,
  type DayShape,
} from "./ai.server";
import { phaseForDay } from "./gamification";

export const buildJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; excerpt: string }) =>
    z.object({ bookId: z.string().uuid(), excerpt: z.string().min(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, title, author")
      .eq("id", data.bookId)
      .single();
    if (bookError || !book) throw new Error("Livro não encontrado.");

    const analysisRaw = await chat(analysisPrompt(book.title, book.author, data.excerpt), {
      json: true,
    });
    const analysis = parseJson<AnalysisShape>(analysisRaw);

    await supabase.from("book_analyses").insert({
      book_id: book.id,
      user_id: userId,
      summary: analysis.summary,
      main_theme: analysis.main_theme,
      category: analysis.category,
      objective: analysis.objective,
      concepts: analysis.concepts ?? [],
      principles: analysis.principles ?? [],
      frameworks: analysis.frameworks ?? [],
      applications: analysis.applications ?? [],
    });

    const planRaw = await chat(planPrompt(book.title, analysis), { json: true });
    const plan = parseJson<{
      journey_title: string;
      journey_description: string;
      days: DayShape[];
    }>(planRaw);

    const days = (plan.days ?? []).slice(0, 21);
    if (days.length < 21) throw new Error("A jornada não pôde ser montada por completo. Tente novamente.");

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .insert({
        book_id: book.id,
        user_id: userId,
        title: plan.journey_title || `Jornada: ${book.title}`,
        description: plan.journey_description ?? null,
      })
      .select("id")
      .single();
    if (journeyError || !journey) throw new Error("Não foi possível criar a jornada.");

    const rows = days.map((d, index) => {
      const dayNumber = index + 1;
      return {
        journey_id: journey.id,
        user_id: userId,
        day_number: dayNumber,
        phase: phaseForDay(dayNumber),
        title: d.title?.replace(/^dia\s*\d+\s*[—-]\s*/i, "") || `Missão ${dayNumber}`,
        objective: d.objective ?? null,
        concept: d.concept ?? null,
        action: d.action ?? null,
        activity_type: d.activity_type ?? null,
        reflection: d.reflection ?? null,
        estimated_time: d.estimated_time ?? "15 minutos",
        status: dayNumber === 1 ? "available" : "locked",
        xp: dayNumber === 21 ? 100 : 50,
      };
    });

    const { error: daysError } = await supabase.from("journey_days").insert(rows);
    if (daysError) throw new Error("Não foi possível salvar os dias da jornada.");

    await supabase.from("books").update({ status: "analyzed" }).eq("id", book.id);

    return {
      journeyId: journey.id as string,
      conceptCount: analysis.concepts?.length ?? 0,
      mainTheme: analysis.main_theme,
      category: analysis.category,
      summary: analysis.summary,
      concepts: (analysis.concepts ?? []).slice(0, 6),
      frameworks: analysis.frameworks ?? [],
    };
  });

export const coachReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { journeyId: string; dayNumber?: number; question: string }) =>
    z
      .object({
        journeyId: z.string().uuid(),
        dayNumber: z.number().int().min(1).max(21).optional(),
        question: z.string().min(2).max(1200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: journey } = await supabase
      .from("journeys")
      .select("id, title, description, book_id, books(title, author)")
      .eq("id", data.journeyId)
      .single();
    if (!journey) throw new Error("Jornada não encontrada.");

    const { data: analysis } = await supabase
      .from("book_analyses")
      .select("main_theme, category, summary, concepts, principles, frameworks, applications")
      .eq("book_id", journey.book_id)
      .maybeSingle();

    const { data: day } = data.dayNumber
      ? await supabase
          .from("journey_days")
          .select("day_number, title, objective, concept, action, reflection, estimated_time")
          .eq("journey_id", journey.id)
          .eq("day_number", data.dayNumber)
          .maybeSingle()
      : { data: null };

    const answer = await chat([
      {
        role: "system",
        content: `Você é o "Coach da Jornada" do app Livro em Ação. Responda com base prioritariamente na análise do livro e na jornada abaixo. Seja prático, acolhedor e breve (máximo 180 palavras), sempre terminando com um próximo passo concreto. ${COPYRIGHT_RULE}

Jornada: ${journey.title}
Livro: ${(journey.books as { title?: string } | null)?.title ?? ""}
Análise: ${JSON.stringify(analysis ?? {}).slice(0, 12000)}
Missão atual: ${JSON.stringify(day ?? {}).slice(0, 3000)}`,
      },
      { role: "user", content: data.question },
    ]);

    return { answer };
  });

export const generateFinalReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { journeyId: string }) =>
    z.object({ journeyId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: journey } = await supabase
      .from("journeys")
      .select("id, title, book_id, books(title, author)")
      .eq("id", data.journeyId)
      .single();
    if (!journey) throw new Error("Jornada não encontrada.");

    const { data: days } = await supabase
      .from("journey_days")
      .select("day_number, title, action, status, check_ins(difficulty, reflection, note)")
      .eq("journey_id", journey.id)
      .order("day_number");

    const raw = await chat(
      [
        {
          role: "system",
          content: `Você monta o relatório final de uma jornada prática de 21 dias baseada em um livro. ${COPYRIGHT_RULE}
Responda SOMENTE com JSON:
{"learned":[string],"practiced":[string],"insights":[string],"strengths":[string],"keep_practicing":[string],"plan_30_days":[{"week":string,"focus":string,"actions":[string]}]}
Use as reflexões registradas pela pessoa como base dos insights. 3 a 5 itens por lista.`,
        },
        {
          role: "user",
          content: `Livro: ${(journey.books as { title?: string } | null)?.title ?? ""}
Jornada: ${journey.title}
Dias e registros: ${JSON.stringify(days ?? []).slice(0, 24000)}`,
        },
      ],
      { json: true },
    );

    return parseJson<{
      learned: string[];
      practiced: string[];
      insights: string[];
      strengths: string[];
      keep_practicing: string[];
      plan_30_days: { week: string; focus: string; actions: string[] }[];
    }>(raw);
  });

export const adaptJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { journeyId: string; mode: "easier" | "harder" }) =>
    z.object({ journeyId: z.string().uuid(), mode: z.enum(["easier", "harder"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: days } = await supabase
      .from("journey_days")
      .select("id, day_number, title, action, estimated_time")
      .eq("journey_id", data.journeyId)
      .neq("status", "completed")
      .order("day_number");

    if (!days?.length) return { updated: 0 };

    const raw = await chat(
      [
        {
          role: "system",
          content: `Ajuste missões diárias de uma jornada prática. ${COPYRIGHT_RULE}
${
  data.mode === "easier"
    ? "Torne cada missão mais leve e rápida (5 a 12 minutos), mantendo o mesmo aprendizado."
    : "Torne cada missão mais desafiadora e profunda (20 a 40 minutos), mantendo o mesmo aprendizado."
}
Responda SOMENTE com JSON: {"days":[{"id":string,"action":string,"estimated_time":string}]}`,
        },
        { role: "user", content: JSON.stringify(days).slice(0, 20000) },
      ],
      { json: true },
    );

    const parsed = parseJson<{ days: { id: string; action: string; estimated_time: string }[] }>(raw);
    let updated = 0;
    for (const d of parsed.days ?? []) {
      if (!days.some((existing) => existing.id === d.id)) continue;
      const { error } = await supabase
        .from("journey_days")
        .update({ action: d.action, estimated_time: d.estimated_time })
        .eq("id", d.id);
      if (!error) updated += 1;
    }
    return { updated };
  });
