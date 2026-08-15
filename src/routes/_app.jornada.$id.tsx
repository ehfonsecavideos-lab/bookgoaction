import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Clock, Loader2, Lock, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DayDialog, type JourneyDay } from "@/components/journey/day-dialog";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { PHASES } from "@/lib/gamification";
import { coachReply, generateFinalReport } from "@/lib/journey.functions";

export const Route = createFileRoute("/_app/jornada/$id")({
  head: () => ({
    meta: [
      { title: "Jornada de 21 dias — Livro em Ação" },
      { name: "description", content: "Sua jornada prática de 21 dias: missões diárias, reflexões e coach." },
      { property: "og:title", content: "Jornada de 21 dias — Livro em Ação" },
      { property: "og:description", content: "Missões diárias, reflexões e acompanhamento de progresso." },
    ],
  }),
  component: JourneyPage,
});

function JourneyPage() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const ask = useServerFn(coachReply);
  const report = useServerFn(generateFinalReport);

  const [selected, setSelected] = useState<JourneyDay | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "coach"; text: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const [finalReport, setFinalReport] = useState<Awaited<ReturnType<typeof generateFinalReport>> | null>(
    null,
  );
  const [loadingReport, setLoadingReport] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["journey", id],
    queryFn: async () => {
      const [journey, days, checkIns] = await Promise.all([
        supabase
          .from("journeys")
          .select("id, title, description, status, progress, books(title, author)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("journey_days")
          .select(
            "id, day_number, phase, title, objective, concept, action, activity_type, reflection, estimated_time, status, xp",
          )
          .eq("journey_id", id)
          .order("day_number"),
        supabase
          .from("check_ins")
          .select("id, reflection, note, difficulty, completed_at, journey_days!inner(day_number, title, journey_id)")
          .eq("journey_days.journey_id", id)
          .order("completed_at", { ascending: false }),
      ]);
      return {
        journey: journey.data,
        days: (days.data ?? []) as JourneyDay[],
        checkIns: checkIns.data ?? [],
      };
    },
  });

  const journey = data?.journey;
  const days = data?.days ?? [];
  const current = days.find((d) => d.status === "available") ?? days.find((d) => d.status !== "completed");
  const book = journey?.books as { title?: string; author?: string } | null;

  async function sendQuestion() {
    if (!question.trim()) return;
    const text = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setThinking(true);
    try {
      const res = await ask({
        data: current
          ? { journeyId: id, dayNumber: current.day_number, question: text }
          : { journeyId: id, question: text },
      });
      setMessages((prev) => [...prev, { role: "coach", text: res.answer }]);
    } catch {
      toast.error("O coach não conseguiu responder agora.");
    } finally {
      setThinking(false);
    }
  }

  async function buildReport() {
    setLoadingReport(true);
    try {
      setFinalReport(await report({ data: { journeyId: id } }));
    } catch {
      toast.error("Não foi possível gerar o relatório.");
    } finally {
      setLoadingReport(false);
    }
  }

  if (!journey) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="card-surface p-7">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {book?.title}
          {book?.author ? ` · ${book.author}` : ""}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{journey.title}</h1>
        {journey.description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{journey.description}</p>
        ) : null}
        <div className="mt-5 max-w-md">
          <Progress value={journey.progress} />
          <p className="mt-1 text-xs text-muted-foreground">
            {days.filter((d) => d.status === "completed").length} de {days.length} missões concluídas
          </p>
        </div>
      </section>

      <Tabs defaultValue="hoje">
        <TabsList>
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="plano">21 dias</TabsTrigger>
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="coach">Coach</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="hoje" className="mt-6">
          {current ? (
            <div className="card-surface p-7">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Dia {current.day_number} · {current.phase}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{current.title}</h2>
              {current.objective ? (
                <p className="mt-2 text-sm text-muted-foreground">{current.objective}</p>
              ) : null}
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {current.estimated_time ?? "15 minutos"} · {current.xp} XP
              </p>
              <Button variant="hero" size="lg" className="mt-6" onClick={() => setSelected(current)}>
                <Sparkles /> Abrir missão de hoje
              </Button>
            </div>
          ) : (
            <div className="card-surface p-10 text-center">
              <CheckCircle2 className="mx-auto size-7 text-primary" />
              <h2 className="mt-3 text-xl font-semibold">Jornada completa!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Você concluiu as 21 missões. Veja seu relatório final.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="plano" className="mt-6 space-y-8">
          {PHASES.map((phase) => {
            const phaseDays = days.filter((d) => d.phase === phase.key);
            if (!phaseDays.length) return null;
            return (
              <div key={phase.key}>
                <h2 className="text-lg font-semibold">
                  {phase.label}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{phase.range}</span>
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {phaseDays.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setSelected(day)}
                      className={`card-surface p-5 text-left transition-transform hover:-translate-y-0.5 ${
                        day.status === "locked" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Dia {day.day_number}</span>
                        {day.status === "completed" ? (
                          <CheckCircle2 className="size-4 text-primary" />
                        ) : day.status === "locked" ? (
                          <Lock className="size-4" />
                        ) : (
                          <Sparkles className="size-4 text-accent" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 font-medium">{day.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {day.estimated_time ?? "15 minutos"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="diario" className="mt-6">
          {data?.checkIns.length ? (
            <div className="space-y-3">
              {data.checkIns.map((entry) => {
                const day = entry.journey_days as { day_number?: number; title?: string } | null;
                return (
                  <div key={entry.id} className="card-surface p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Dia {day?.day_number} · {day?.title}
                    </p>
                    {entry.reflection ? <p className="mt-2 text-sm">{entry.reflection}</p> : null}
                    {entry.note ? (
                      <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="card-surface p-10 text-center text-sm text-muted-foreground">
              Suas reflexões diárias aparecerão aqui.
            </p>
          )}
        </TabsContent>

        <TabsContent value="coach" className="mt-6">
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold">Coach da jornada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pergunte como aplicar um conceito, o que fazer se travou ou como adaptar a missão.
            </p>

            <div className="mt-5 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 text-sm ${
                    message.role === "user"
                      ? "ml-auto max-w-[85%] bg-secondary"
                      : "max-w-[90%] bg-card ring-1 ring-border"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {thinking ? <Loader2 className="size-4 animate-spin text-primary" /> : null}
            </div>

            <div className="mt-5 flex gap-2">
              <Textarea
                rows={2}
                placeholder="Como aplico isso no meu dia a dia?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <Button variant="hero" size="icon" aria-label="Enviar" onClick={sendQuestion} disabled={thinking}>
                <Send />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relatorio" className="mt-6">
          <div className="card-surface p-7">
            <h2 className="text-lg font-semibold">Relatório final</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Um resumo do que você aprendeu, praticou e do seu plano dos próximos 30 dias.
            </p>
            <Button
              variant="hero"
              className="mt-5"
              onClick={buildReport}
              disabled={loadingReport || journey.progress < 100}
            >
              {loadingReport ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {journey.progress < 100 ? "Disponível ao concluir os 21 dias" : "Gerar relatório"}
            </Button>

            {finalReport ? (
              <div className="mt-7 space-y-6 text-sm">
                {(
                  [
                    ["O que você aprendeu", finalReport.learned],
                    ["O que você praticou", finalReport.practiced],
                    ["Seus insights", finalReport.insights],
                    ["Forças desenvolvidas", finalReport.strengths],
                    ["Continue praticando", finalReport.keep_practicing],
                  ] as const
                ).map(([label, items]) => (
                  <div key={label}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {(items ?? []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Plano de 30 dias
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(finalReport.plan_30_days ?? []).map((week) => (
                      <div key={week.week} className="rounded-xl bg-secondary p-4">
                        <p className="font-medium">
                          {week.week} · {week.focus}
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {(week.actions ?? []).map((action) => (
                            <li key={action}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <DayDialog
        day={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        journeyId={id}
        userId={user?.id ?? ""}
        onCompleted={() => {
          void refetch();
          void queryClient.invalidateQueries({ queryKey: ["user-stats"] });
          void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }}
      />
    </div>
  );
}
