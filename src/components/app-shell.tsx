import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Flame, LibraryBig, LogOut, Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp } from "@/lib/gamification";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("xp, streak, level")
        .maybeSingle();
      return data ?? { xp: 0, streak: 0, level: 1 };
    },
  });

  const level = levelFromXp(stats?.xp ?? 0);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-paper">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/dashboard" className="mr-2 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-ember text-primary-foreground shadow-ember">
              <BookOpen className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold">Livro em Ação</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <Sparkles /> Painel
              </Button>
            </Link>
            <Link to="/biblioteca">
              <Button variant="ghost" size="sm">
                <LibraryBig /> Biblioteca
              </Button>
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft md:flex">
              <span className="flex items-center gap-1 text-primary">
                <Flame className="size-3.5" /> {stats?.streak ?? 0}
              </span>
              <span className="text-muted-foreground">⭐ {stats?.xp ?? 0} XP</span>
              <span className="text-accent">{level.name}</span>
            </div>
            <Link to="/nova">
              <Button variant="hero" size="sm">
                <Plus /> Nova jornada
              </Button>
            </Link>
            <Button variant="ghost" size="icon" aria-label="Sair" onClick={signOut}>
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="border-t border-border/70 py-8 text-center text-xs text-muted-foreground">
        Seus arquivos são privados. Usamos síntese e paráfrase — nunca redistribuímos o livro.
      </footer>
    </div>
  );
}
