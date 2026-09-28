// The site search reads /search-index.json (src/lib/search-index.mjs), so a
// work is found by its client, role or page text — not only by the words its
// card shows. "Amplify" once returned nothing although ELA Quests is Amplify's.
import test from "node:test";
import assert from "node:assert/strict";
import Fuse from "fuse.js";
import { SEARCH_KEYS } from "../src/lib/search-index.mjs";
import { read } from "./_dist.mjs";

const docs = JSON.parse(read("search-index.json"));
const fold = (s) => String(s).normalize("NFKC").toLowerCase();
const has = (q) => docs.filter((d) => fold(Object.values(d).join(" ")).includes(fold(q))).map((d) => d.slug);

test("the index covers every work, with body text", () => {
  assert.ok(docs.length >= 40, `index has ${docs.length} works`);
  for (const d of docs) assert.ok(d.slug && d.title, "slug and title");
  assert.ok(docs.filter((d) => d.body.length > 200).length >= 30, "page text is indexed");
});

test("a client name finds the work (Amplify → ELA Quests)", () => {
  assert.ok(has("amplify").includes("ela-quests"));
  assert.ok(has("Morinaga").includes("koji-fizz"));
});

test("Japanese titles are searchable", () => {
  assert.ok(has("クエスト").includes("ela-quests"));
});

test("a typo still finds the work through Fuse", () => {
  const fuse = new Fuse(docs, { keys: SEARCH_KEYS, threshold: 0.3, ignoreLocation: true, minMatchCharLength: 2 });
  assert.ok(fuse.search("amplfy").some((r) => r.item.slug === "ela-quests"));
});
