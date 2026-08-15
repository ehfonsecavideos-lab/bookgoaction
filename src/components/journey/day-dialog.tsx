import { useState } from "react";
import confetti from "canvas-confetti";
import { Clock, Loader2, Lock, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTY_OPTIONS } from "@/lib/gamification";
import { completeDay } from "@/lib/progress";

export type JourneyDay = {
  id: string;
  day_number: number;
  phase: string;
  title: string;
  objective: string | null;
  concept: string | null;
  action: string | null;
  activity_type: string | null;
  reflection: string | null;
  estimated_time: string | null;
  status: string;
  xp: number;
};

export function DayDialog({
  day,
  open,
  onOpenChange,
  journeyId,
  userId,
  onCompleted,
}: {
  day: JourneyDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string;
  userId: string;
  onCompleted: () => void;
}) {
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!day) return null;
  const locked = day.status === "locked";
  const completed = day.status === "completed";

  async function submit() {
    if (!day) return;
    setSaving(true);
    try {
      const result = await completeDay({
        userId,
        journeyId,
        dayId: day.id,
        dayNumber: day.day_number,
        difficulty,
        reflection,
        note,
      });
      void confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
      toast.success(`Missão concluída! +${result.xpGained} XP`, {
        description: result.journeyCompleted
          ? "Você completou os 21 dias. Seu relatório final está disponível."
          : `Sequência de ${result.streak} dia(s).`,
      });
      result.newBadges.forEach((badge) =>
        toast(`${badge.icon} ${badge.title}`, { description: badge.description }),
      );
      setDifficulty(null);
      setReflection("");
      setNote("");
      onOpenChange(false);
      onCompleted();
    } catch {
      toast.error("Não foi possível salvar seu check-in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Dia {day.day_number} — {day.title}
          </DialogTitle>
          <DialogDescription>
            {day.phase} · {day.estimated_time ?? "15 minutos"} · {day.xp} XP
          </DialogDescription>
        </DialogHeader>

        {locked ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Lock className="mx-auto mb-3 size-5" />
            Conclua o dia anterior para desbloquear esta missão.
          </div>
        ) : (
          <div className="space-y-5">
            {day.concept ? (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conceito do dia
                </h3>
                <p className="mt-1 text-sm">{day.concept}</p>
              </section>
            ) : null}

            {day.objective ? (
              <section className="rounded-xl bg-secondary p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Target className="size-3.5" /> Objetivo
                </h3>
                <p className="mt-1 text-sm">{day.objective}</p>
              </section>
            ) : null}

            {day.action ? (
              <section>
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3.5" /> Missão prática
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm">{day.action}</p>
              </section>
            ) : null}

            {day.reflection ? (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pergunta de reflexão
                </h3>
                <p className="mt-1 text-sm italic">{day.reflection}</p>
              </section>
            ) : null}

            {completed ? (
              <p className="rounded-xl bg-secondary p-4 text-center text-sm text-muted-foreground">
                Missão concluída. Volte aqui sempre que quiser revisar.
              </p>
            ) : (
              <div className="space-y-4 border-t border-border pt-5">
                <div>
                  <Label>Como foi essa missão?</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDifficulty(option.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          difficulty === option.value
                            ? "border-primary bg-secondary font-medium text-foreground"
                            : "border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reflexao">Sua reflexão (+20 XP)</Label>
                  <Textarea
                    id="reflexao"
                    rows={4}
                    placeholder={day.reflection ?? "O que você percebeu hoje?"}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nota">Anotação rápida (opcional)</Label>
                  <Textarea
                    id="nota"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <Button variant="hero" size="lg" className="w-full" onClick={submit} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" /> : <Sparkles />} Concluir missão
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
