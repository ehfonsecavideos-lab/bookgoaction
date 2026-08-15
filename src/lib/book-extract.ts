/**
 * Client-side book parsing. Files never leave the user's session except for the
 * private upload and the excerpt sent for analysis.
 */

export const MAX_FILE_MB = 40;
export const ACCEPTED = [".pdf", ".epub", ".mobi"] as const;
export const MAX_EXCERPT_CHARS = 90_000;

export type ExtractedBook = {
  title: string;
  author: string | null;
  fileType: "pdf" | "epub" | "mobi";
  fileSize: number;
  pageCount: number | null;
  chapterCount: number | null;
  coverPreview: string | null;
  text: string;
};

function cleanText(raw: string) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleFromFileName(name: string) {
  return name
    .replace(/\.(pdf|epub|mobi)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function detectType(file: File): "pdf" | "epub" | "mobi" | null {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".epub")) return "epub";
  if (n.endsWith(".mobi")) return "mobi";
  return null;
}

async function extractPdf(file: File): Promise<Partial<ExtractedBook>> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const meta = await doc.getMetadata().catch(() => null);
  const info = (meta?.info ?? {}) as { Title?: string; Author?: string };

  let text = "";
  const pages = doc.numPages;
  for (let i = 1; i <= pages && text.length < MAX_EXCERPT_CHARS; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .concat("\n\n") ?? "";
  }

  let coverPreview: string | null = null;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.7 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      coverPreview = canvas.toDataURL("image/jpeg", 0.7);
    }
  } catch {
    coverPreview = null;
  }

  return {
    title: info.Title?.trim() || titleFromFileName(file.name),
    author: info.Author?.trim() || null,
    pageCount: pages,
    chapterCount: null,
    coverPreview,
    text: cleanText(text),
  };
}

async function extractEpub(file: File): Promise<Partial<ExtractedBook>> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  let title: string | null = null;
  let author: string | null = null;
  const opfName = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith(".opf"));
  if (opfName) {
    const opf = await zip.files[opfName]!.async("string");
    title = /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i.exec(opf)?.[1]?.trim() ?? null;
    author = /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(opf)?.[1]?.trim() ?? null;
  }

  const docs = Object.keys(zip.files)
    .filter((n) => /\.(x?html|htm)$/i.test(n))
    .sort();
  let text = "";
  for (const name of docs) {
    if (text.length >= MAX_EXCERPT_CHARS) break;
    text += cleanText(await zip.files[name]!.async("string")) + "\n\n";
  }

  let coverPreview: string | null = null;
  const imgName = Object.keys(zip.files)
    .filter((n) => /\.(jpe?g|png)$/i.test(n))
    .sort((a, b) => (/cover/i.test(b) ? 1 : 0) - (/cover/i.test(a) ? 1 : 0))[0];
  if (imgName) {
    const blob = await zip.files[imgName]!.async("blob");
    coverPreview = URL.createObjectURL(blob);
  }

  return {
    title: title || titleFromFileName(file.name),
    author,
    pageCount: null,
    chapterCount: docs.length || null,
    coverPreview,
    text,
  };
}

async function extractMobi(file: File): Promise<Partial<ExtractedBook>> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const readable = decoded
    .replace(/[^\P{C}\n]+/gu, " ")
    .replace(/\uFFFD+/g, " ")
    .slice(0, MAX_EXCERPT_CHARS * 2);
  const text = cleanText(readable).slice(0, MAX_EXCERPT_CHARS);
  const title = /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i.exec(decoded)?.[1]?.trim();
  const author = /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(decoded)?.[1]?.trim();

  return {
    title: title || titleFromFileName(file.name),
    author: author || null,
    pageCount: null,
    chapterCount: null,
    coverPreview: null,
    text,
  };
}

export async function extractBook(file: File): Promise<ExtractedBook> {
  const fileType = detectType(file);
  if (!fileType) throw new Error("Formato não suportado. Envie PDF, EPUB ou MOBI.");
  if (file.size > MAX_FILE_MB * 1024 * 1024)
    throw new Error(`O arquivo excede o limite de ${MAX_FILE_MB} MB.`);

  const partial =
    fileType === "pdf"
      ? await extractPdf(file)
      : fileType === "epub"
        ? await extractEpub(file)
        : await extractMobi(file);

  const text = (partial.text ?? "").slice(0, MAX_EXCERPT_CHARS);
  if (text.replace(/\s/g, "").length < 400)
    throw new Error(
      "Não conseguimos ler texto suficiente deste arquivo. Ele pode ser digitalizado como imagem ou protegido por DRM.",
    );

  return {
    title: partial.title || titleFromFileName(file.name),
    author: partial.author ?? null,
    fileType,
    fileSize: file.size,
    pageCount: partial.pageCount ?? null,
    chapterCount: partial.chapterCount ?? null,
    coverPreview: partial.coverPreview ?? null,
    text,
  };
}

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
