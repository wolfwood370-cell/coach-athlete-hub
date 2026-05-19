/**
 * src/lib/pdf.ts
 * ---------------------------------------------------------------------------
 * Client-side PDF text extraction utility.
 *
 * Uses `pdfjs-dist` (Mozilla's official JS PDF parser) running entirely
 * in the browser. No upload to backend required — the file stays on
 * the user's machine until they explicitly trigger AI training.
 *
 * Worker setup: pdfjs needs a separate Web Worker for parsing. Vite
 * resolves the `?url` import to a hashed asset URL at build time;
 * GlobalWorkerOptions.workerSrc is set once at module load.
 *
 * Closes audit finding B1 (PDF extraction in KnowledgeBase).
 */

import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
// `?url` makes Vite emit the worker as a bundled asset and return its URL.
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// One-time worker registration. Idempotent — subsequent re-imports are no-op.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extract plain text from a PDF file.
 *
 * - Iterates page-by-page in order.
 * - Concatenates text items per page with spaces; pages are joined
 *   with double newlines so downstream chunkers (LLM ingestion) see
 *   logical page boundaries.
 * - Skips marked-content items that have no `str` property — these
 *   are usually structural annotations, not visible text.
 *
 * The result is suitable for embedding/chunking. It is NOT a
 * lossless representation: layout, fonts, images, and form fields
 * are discarded by design.
 *
 * @throws if the PDF is encrypted, malformed, or has zero pages.
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  if (pdf.numPages === 0) {
    throw new Error("Il PDF non contiene pagine.");
  }

  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? (item as TextItem).str : ""))
      .filter(Boolean)
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}
