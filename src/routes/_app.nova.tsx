import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  ACCEPTED,
  MAX_FILE_MB,
  detectType,
  extractBook,
  formatSize,
  type ExtractedBook,
} from "@/lib/book-extract";
import { buildJourney } from "@/lib/journey.functions";

export const Route = createFileRoute("/_app/nova")({
  head: () => ({
    meta: [
      { title: "Nova jornada — Livro em Ação" },
      {
        name: "description",
        content: "Envie um livro em PDF, EPUB ou MOBI e gere uma jornada prática de 21 dias.",
      },
      { property: "og:title", content: "Nova jornada — Livro em Ação" },
      { property: "og:description", content: "Do upload à jornada de 21 dias em poucos minutos." },
    ],
  }),
  component: NovaJornada,
});

type Stage = "idle" | "reading" | "uploading" | "analyzing" | "done";

const STAGE_STEPS = [
  "Lendo o arquivo",
  "Guardando com segurança",
  "Analisando conteúdo e montando os 21 dias",
];

function NovaJornada() {
  const navigate = useNavigate();
  const { user } = useSession();
  const build = useServerFn(buildJourney);
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedBook | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<{
    journeyId: string;
    conceptCount: number;
    mainTheme: string;
    category: string;
    summary: string;
    concepts: { name: string; teaching: string }[];
  } | null>(null);

  const busy = stage === "reading" || stage === "uploading" || stage === "analyzing";

  async function pickFile(next: File | null) {
    if (!next) return;
    if (!detectType(next)) {
      toast.error("Formato não suportado. Use PDF, EPUB ou MOBI.");
      return;
    }
    if (next.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Limite de ${MAX_FILE_MB} MB.`);
      return;
    }
    setFile(next);
    setStage("reading");
    try {
      const data = await extractBook(next);
      setExtracted(data);
      setTitle(data.title);
      setAuthor(data.author ?? "");
      setStage("idle");
    } catch {
      setStage("idle");
      setFile(null);
      toast.error("Não foi possível ler o conteúdo deste arquivo.");
    }
  }

  async function start() {
    if (!file || !extracted || !user) return;
    if (!title.trim()) {
      toast.error("Informe o título do livro.");
      return;
    }

    try {
      setStage("uploading");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("books").upload(path, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data: book, error: bookError } = await supabase
        .from("books")
        .insert({
          user_id: user.id,
          title: title.trim(),
          author: author.trim() || null,
          file_path: path,
          file_type: ext,
          file_size: file.size,
          page_count: extracted.pageCount,
          chapter_count: extracted.chapterCount,
          status: "processing",
        })
        .select("id")
        .single();
      if (bookError || !book) throw new Error("Não foi possível registrar o livro.");

      setStage("analyzing");
      const built = await build({ data: { bookId: book.id, excerpt: extracted.text } });
      setResult(built);
      setStage("done");
      toast.success("Sua jornada de 21 dias está pronta!");
    } catch (error) {
      setStage("idle");
      toast.error(error instanceof Error ? error.message : "Algo deu errado. Tente novamente.");
    }
  }

  if (stage === "done" && result) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card-surface p-8 text-center">
          <CheckCircle2 className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold">Análise concluída</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.conceptCount} conceitos-chave identificados · {result.category}
          </p>

          <div className="mt-6 space-y-4 text-left">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Tema central</p>
              <p className="mt-1 font-medium">{result.mainTheme}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Síntese</p>
              <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>
            </div>
            {result.concepts.length ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Conceitos que viram prática
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {result.concepts.map((c) => (
                    <li key={c.name} className="rounded-lg bg-secondary px-3 py-2">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <Button
            variant="hero"
            size="xl"
            className="mt-8 w-full"
            onClick={() => navigate({ to: "/jornada/$id", params: { id: result.journeyId } })}
          >
            <Sparkles /> Começar jornada de 21 dias
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">Nova jornada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Envie um livro que você quer realmente aplicar. Aceitamos PDF, EPUB e MOBI (até {MAX_FILE_MB}{" "}
        MB).
      </p>

      {busy ? (
        <div className="card-surface mt-6 p-8">
          <Loader2 className="mx-auto size-7 animate-spin text-primary" />
          <p className="mt-4 text-center font-medium">
            {stage === "reading"
              ? STAGE_STEPS[0]
              : stage === "uploading"
                ? STAGE_STEPS[1]
                : STAGE_STEPS[2]}
          </p>
          <div className="mx-auto mt-5 max-w-sm">
            <Progress value={stage === "reading" ? 25 : stage === "uploading" ? 55 : 85} />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            A análise completa pode levar até um minuto. Não feche esta página.
          </p>
        </div>
      ) : (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
              dragging ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary/60"
            }`}
          >
            <UploadCloud className="mx-auto size-8 text-primary" />
            <p className="mt-4 font-medium">Arraste seu livro até aqui</p>
            <p className="mt-1 text-sm text-muted-foreground">ou clique para escolher um arquivo</p>
            <p className="mt-4 text-xs text-muted-foreground">{ACCEPTED.join("  ·  ")}</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => void pickFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {file && extracted ? (
            <div className="card-surface mt-6 p-6">
              <div className="flex items-start gap-3">
                <FileUp className="mt-1 size-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)}
                    {extracted.pageCount ? ` · ${extracted.pageCount} páginas` : ""} ·{" "}
                    {extracted.text.length.toLocaleString("pt-BR")} caracteres lidos
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover arquivo"
                  onClick={() => {
                    setFile(null);
                    setExtracted(null);
                  }}
                >
                  <X />
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input id="titulo" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autor">Autor (opcional)</Label>
                  <Input id="autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
                </div>
              </div>

              <Button variant="hero" size="lg" className="mt-6 w-full" onClick={start}>
                <Sparkles /> Analisar e criar jornada
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Seu arquivo fica privado. Geramos apenas sínteses e missões próprias.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
