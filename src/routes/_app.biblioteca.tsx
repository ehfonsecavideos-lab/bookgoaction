import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Livro em Ação" },
      { name: "description", content: "Todas as suas jornadas de 21 dias criadas a partir de livros." },
      { property: "og:title", content: "Biblioteca — Livro em Ação" },
      { property: "og:description", content: "Seus livros transformados em jornadas práticas." },
    ],
  }),
  component: Biblioteca,
});

const STATUS_LABEL: Record<string, string> = {
  in_progress: "Em andamento",
  completed: "Concluída",
  not_started: "Não iniciada",
};

function Biblioteca() {
  const { data: journeys } = useQuery({
    queryKey: ["journeys"],
    queryFn: async () => {
      const { data } = await supabase
        .from("journeys")
        .select("id, title, status, progress, created_at, books(title, author)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Biblioteca</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada livro aqui virou um plano prático de 21 dias.
          </p>
        </div>
        <Link to="/nova">
          <Button variant="hero">
            <Plus /> Nova jornada
          </Button>
        </Link>
      </div>

      {journeys?.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey) => {
            const book = journey.books as { title?: string; author?: string } | null;
            return (
              <Link
                key={journey.id}
                to="/jornada/$id"
                params={{ id: journey.id }}
                className="card-surface block p-6 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="size-5 text-primary" />
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                    {STATUS_LABEL[journey.status] ?? journey.status}
                  </span>
                </div>
                <h2 className="mt-4 line-clamp-2 text-lg font-semibold">{journey.title}</h2>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {book?.title}
                  {book?.author ? ` · ${book.author}` : ""}
                </p>
                <div className="mt-5">
                  <Progress value={journey.progress} />
                  <p className="mt-1 text-xs text-muted-foreground">{journey.progress}% concluído</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card-surface mt-8 p-10 text-center">
          <BookOpen className="mx-auto size-6 text-primary" />
          <h2 className="mt-3 text-xl font-semibold">Sua biblioteca está vazia</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Envie seu primeiro livro e comece uma jornada de 21 dias.
          </p>
          <Link to="/nova" className="mt-5 inline-block">
            <Button variant="hero">
              <Plus /> Criar nova jornada
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
