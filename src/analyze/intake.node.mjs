// Node-only intake: the lexicon from disk, and a posting from a file. Everything
// else in src/analyze runs in the browser too, so it stays out of this file.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readJobText } from "./jd.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const LEXICON_PATH = join(HERE, "lexicon.json");
export const loadLexicon = () => JSON.parse(readFileSync(LEXICON_PATH, "utf8"));

/** readJobText, plus a file on disk as a source. */
export async function readJobInput({ url, file, text, fetchImpl } = {}) {
  if (file) return { text: readFileSync(file, "utf8").trim(), source: file };
  return readJobText({ url, text, fetchImpl });
}
