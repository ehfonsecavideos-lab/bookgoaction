import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Plus, Sparkles, Star, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BADGES, levelFromXp } from "@/lib/gamification";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Livro em Ação" },
      { name: "description", content: "Acompanhe suas jornadas, sequência, XP e conquistas." },
      { property: "og:title", content: "Painel — Livro em Ação" },
      { property: "og:description", content: "Suas jornadas de 21 dias, progresso e conquistas." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [journeys, stats, achievements] = await Promise.all([
        supabase
          .from("journeys")
          .select("id, title, status, progress, created_at, books(title, author)")
          .order("created_at", { ascending: false }),
        supabase.from("user_stats").select("xp, streak, longest_streak").maybeSingle(),
        supabase.from("achievements").select("type, title, earned_at"),
      ]);
      return {
        journeys: journeys.data ?? [],
        stats: stats.data ?? { xp: 0, streak: 0, longest_streak: 0 },
        achievements: achievements.data ?? [],
      };
    },
  });

  const journeys = data?.journeys ?? [];
  const active = journeys.find((j) => j.status === "in_progress");
  const level = levelFromXp(data?.stats.xp ?? 0);
  const earned = new Set((data?.achievements ?? []).map((a) => a.type));

  return (
    <div className="space-y-8">
      <section className="card-surface bg-gradient-ink p-8 text-ink-foreground">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Livro em Ação</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Transforme livros em ação.</h1>
        <p className="mt-3 max-w-xl text-sm opacity-80">
          Envie um livro e transforme seus principais ensinamentos em uma jornada prática de 21
          dias.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/nova">
            <Button variant="hero" size="lg">
              <Plus /> Criar nova jornada
            </Button>
          </Link>
          <Link to="/biblioteca">
            <Button variant="soft" size="lg">
              Minhas jornadas
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Sequência atual</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
            <Flame className="size-5 text-primary" /> {data?.stats.streak ?? 0} dias
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Maior sequência: {data?.stats.longest_streak ?? 0} dias
          </p>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pontos</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
            <Star className="size-5 text-primary" /> {data?.stats.xp ?? 0} XP
          </p>
          <div className="mt-3">
            <Progress value={level.progress} />
            <p className="mt-1 text-xs text-muted-foreground">
              Nível {level.level} · {level.name}
              {level.next ? ` → ${level.next.name} em ${level.next.min - (data?.stats.xp ?? 0)} XP` : ""}
            </p>
          </div>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Jornadas</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
            <Trophy className="size-5 text-primary" />
            {journeys.filter((j) => j.status === "completed").length}/{journeys.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">concluídas / total</p>
        </div>
      </section>

      {active ? (
        <section className="card-surface p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Continue de onde parou</p>
          <h2 className="mt-2 text-2xl font-semibold">{active.title}</h2>
          <p className="text-sm text-muted-foreground">
            {(active.books as { title?: string; author?: string } | null)?.title}
            {(active.books as { author?: string } | null)?.author
              ? ` · ${(active.books as { author?: string } | null)?.author}`
              : ""}
          </p>
          <div className="mt-4 max-w-md">
            <Progress value={active.progress} />
            <p className="mt-1 text-xs text-muted-foreground">{active.progress}% concluído</p>
          </div>
          <Link to="/jornada/$id" params={{ id: active.id }} className="mt-5 inline-block">
            <Button variant="hero">
              Continuar jornada <ArrowRight />
            </Button>
          </Link>
        </section>
      ) : (
        <section className="card-surface p-8 text-center">
          <Sparkles className="mx-auto size-6 text-primary" />
          <h2 className="mt-3 text-xl font-semibold">Nenhuma jornada em andamento</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Envie um livro e receba um plano prático de 21 dias em minutos.
          </p>
          <Link to="/nova" className="mt-5 inline-block">
            <Button variant="hero">
              <Plus /> Criar nova jornada
            </Button>
          </Link>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Conquistas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BADGES.map((badge) => {
            const has = earned.has(badge.type);
            return (
              <div
                key={badge.type}
                className={`card-surface p-4 text-center ${has ? "" : "opacity-45 grayscale"}`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <p className="mt-2 text-sm font-semibold">{badge.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
