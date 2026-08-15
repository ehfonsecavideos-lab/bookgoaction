const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const MODEL = "google/gemini-3.5-flash";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: Msg[], opts?: { json?: boolean; model?: string }) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("A IA não está configurada neste projeto.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts?.model ?? MODEL,
      messages,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[ai] gateway error", res.status, detail.slice(0, 500));
    if (res.status === 429) throw new Error("Muitas requisições agora. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Os créditos de IA do workspace acabaram.");
    throw new Error("A IA não conseguiu responder agora. Tente novamente.");
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}

export const COPYRIGHT_RULE = `Regras obrigatórias:
- Nunca reproduza trechos longos do livro. Use sempre síntese, paráfrase e interpretação própria.
- Nunca cite mais de 15 palavras seguidas do texto original.
- Crie exercícios originais inspirados nas ideias, não copiados.
- Escreva sempre em português do Brasil, tom adulto, direto e premium (nada infantil).`;

export type AnalysisShape = {
  main_theme: string;
  category: string;
  objective: string;
  summary: string;
  concepts: { name: string; teaching: string; principle: string; application: string }[];
  principles: string[];
  frameworks: { name: string; description: string }[];
  applications: string[];
  behaviors: string[];
  questions: string[];
};

export function analysisPrompt(title: string, author: string | null, excerpt: string) {
  return [
    {
      role: "system" as const,
      content: `Você é um analista de livros especializado em aprendizagem aplicada. ${COPYRIGHT_RULE}
Responda SOMENTE com JSON válido no formato:
{
 "main_theme": string,
 "category": string (ex: Produtividade, Finanças, Liderança, Hábitos, Comunicação, Psicologia, Carreira, Negócios, Espiritualidade, Saúde, Filosofia, Relacionamentos, Educação, Desenvolvimento pessoal),
 "objective": string,
 "summary": string (2 parágrafos curtos),
 "concepts": [{"name":string,"teaching":string,"principle":string,"application":string}] (8 a 12 itens),
 "principles": [string] (5 a 8),
 "frameworks": [{"name":string,"description":string}] (2 a 5),
 "applications": [string] (6 a 10),
 "behaviors": [string] (5 a 8),
 "questions": [string] (4 a 6)
}`,
    },
    {
      role: "user" as const,
      content: `Livro: "${title}"${author ? ` — autor: ${author}` : ""}.
Trecho extraído do arquivo enviado pelo próprio leitor (pode conter ruído de formatação):
"""
${excerpt}
"""`,
    },
  ];
}

export type DayShape = {
  day_number: number;
  phase: string;
  title: string;
  objective: string;
  concept: string;
  action: string;
  activity_type: string;
  reflection: string;
  estimated_time: string;
};

export function planPrompt(title: string, analysis: AnalysisShape) {
  return [
    {
      role: "system" as const,
      content: `Você é um designer instrucional que transforma livros em jornadas práticas de 21 dias. ${COPYRIGHT_RULE}
A jornada tem lógica pedagógica progressiva (não dividir o livro em 21 partes):
- Dias 1 a 7: fase COMPREENDER (conhecer e experimentar os conceitos fundamentais)
- Dias 8 a 14: fase APLICAR (aplicar em situações reais do dia a dia)
- Dias 15 a 20: fase CONSOLIDAR (praticar, ajustar e incorporar)
- Dia 21: fase TRANSFORMAR (revisão da jornada e plano de continuidade)
Varie os tipos de atividade entre: reflexão, escrita, exercício prático, desafio, observação, mudança de comportamento, experimento, conversa, planejamento, diário, checklist, hábito, decisão, comunicação, produtividade, análise pessoal.
As missões devem ser executáveis no mundo real em 10 a 30 minutos e coerentes com a temática do livro.
Responda SOMENTE com JSON válido:
{"journey_title": string, "journey_description": string, "days": [{"day_number":1..21,"phase":string,"title":string,"objective":string,"concept":string,"action":string,"activity_type":string,"reflection":string,"estimated_time":string}]}
"title" no formato "Título curto da missão" (sem prefixo "Dia X"). "concept" = síntese de 2 a 4 frases do que o livro ensina sobre isso. "action" = missão prática e objetiva. "reflection" = 1 ou 2 perguntas. "estimated_time" ex: "15 minutos". Devem existir exatamente 21 dias.`,
    },
    {
      role: "user" as const,
      content: `Livro: "${title}"
Análise estruturada:
${JSON.stringify(analysis).slice(0, 20000)}`,
    },
  ];
}
