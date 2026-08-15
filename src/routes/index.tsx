import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarCheck, Flame, Sparkles, Target, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Livro em Ação — Transforme livros em jornadas de 21 dias" },
      {
        name: "description",
        content:
          "Envie um livro em PDF, EPUB ou MOBI e transforme seus principais ensinamentos em uma jornada prática de 21 dias, com missões diárias, reflexões e progresso.",
      },
      { property: "og:title", content: "Livro em Ação — Transforme livros em ação" },
      {
        property: "og:description",
        content:
          "Do livro ao hábito: análise inteligente, plano de 21 dias, missões diárias e acompanhamento de progresso.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  { icon: BookOpen, title: "Envie o livro", text: "PDF, EPUB ou MOBI. O arquivo fica privado, só seu." },
  { icon: Sparkles, title: "Análise inteligente", text: "Conceitos, princípios, frameworks e aplicações práticas." },
  { icon: CalendarCheck, title: "Jornada de 21 dias", text: "Compreender, aplicar, consolidar e transformar." },
  { icon: Trophy, title: "Hábito formado", text: "Missões diárias, XP, sequência e relatório final." },
];

function Landing() {
  const { user, loading } = useSession();

  return (
    <div className="min-h-screen bg-gradient-paper">
      <header className="mx-auto flex h-20 max-w-6xl items-center px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-ember text-primary-foreground shadow-ember">
            <BookOpen className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold">Livro em Ação</span>
        </div>
        <div className="ml-auto">
          {loading ? null : user ? (
            <Link to="/dashboard">
              <Button variant="soft" size="sm">
                Meu painel
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="soft" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
          <Flame className="size-3.5 text-primary" /> Do livro ao hábito em 21 dias
        </span>
        <h1 className="mt-7 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl">
          Transforme livros em <span className="text-gradient-ember">ação</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Envie um livro e transforme seus principais ensinamentos em uma jornada prática de 21
          dias.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to={user ? "/nova" : "/auth"}>
            <Button variant="hero" size="xl">
              <Sparkles /> Criar nova jornada
            </Button>
          </Link>
          <Link to={user ? "/biblioteca" : "/auth"}>
            <Button variant="soft" size="xl">
              Minhas jornadas <ArrowRight />
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          “Você não precisa apenas terminar um livro. Precisa transformar o que aprendeu em algo que
          faça parte da sua vida.”
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="card-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Etapa {index + 1}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Target, title: "Missões executáveis", text: "Cada dia entrega uma ação real de 10 a 30 minutos, não um resumo." },
            { icon: Flame, title: "Consistência sem punição", text: "Sequência, XP e níveis para manter o ritmo — e um retorno gentil se você falhar." },
            { icon: Trophy, title: "Relatório e certificado", text: "No dia 21, seus aprendizados, insights e um plano de continuidade de 30 dias." },
          ].map((item) => (
            <div key={item.title} className="card-surface p-6">
              <item.icon className="size-5 text-accent" />
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/70 py-10 text-center text-xs text-muted-foreground">
        Conteúdo enviado por você, transformado em aprendizado pessoal. Nada é compartilhado
        publicamente.
      </footer>
    </div>
  );
}
