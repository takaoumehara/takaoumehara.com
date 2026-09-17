// /lens/preview renders a lens that is not in the repository — a draft from the
// Studio, a posting a visitor pasted into /try — with the same components that
// build the site. These checks post lenses the pitch engine drafts and read the
// HTML that comes back, so the guarantees that used to be checked against the
// old string renderer are checked against the real one.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, ROOT } from "../src/lib/load.mjs";
import { analyzeJob, slugify } from "../src/analyze/jd.mjs";
import { loadLexicon } from "../src/analyze/intake.node.mjs";
import { scoreEvidence, selectProof } from "../src/analyze/match.mjs";
import { draftLens } from "../src/analyze/draft.mjs";

const lib = loadLibrary();
const lexicon = loadLexicon();
const stripe = readFileSync(join(ROOT, "src", "analyze", "samples", "stripe-senior-product-designer.txt"), "utf8");

function pitch(text, company = "Acme") {
  const analysis = analyzeJob(text, { lexicon, capabilities: lib.capabilities.capabilities, company });
  const scored = scoreEvidence(analysis, lib);
  const picks = selectProof(scored, analysis);
  return draftLens({ company, slug: slugify(company), analysis, picks, lib, lexicon, source: "test", scored });
}

const preview = async (request, lens) => {
  const response = await request.post("/lens/preview", { data: { lens: { ...lens, status: "published" } } });
  expect(response.status(), await response.text()).toBe(200);
  return response.text();
};

test.describe("/lens/preview", () => {
  test("the lens note names the company and its focus", async ({ request }) => {
    const lens = pitch(stripe, "Stripe");
    lens.slug = "zz-test";
    const html = await preview(request, lens);
    expect(html).toMatch(/Stripe&#39;s focus on/);
    expect(html).toMatch(/data-lens="zz-test"/);
  });

  test("the ledger renders: a row per requirement, the quote, the level bar, an empty row stays visible, and cards get anchors", async ({ request }) => {
    const lens = pitch(`${stripe}\n\nMinimum requirements\n- Experience producing short films with a crew.`, "Stripe");
    lens.slug = "zz-fit";
    lens.fit.source.seenAt = "2026-09-16";
    const html = await preview(request, lens);
    expect(html).toMatch(/<section class="band fit" id="fit">/);
    expect((html.match(/<li class="fit-row is-/g) ?? []).length).toBe(lens.fit.rows.length);
    expect(html).toMatch(/class="fit-row is-direct"/);
    expect(html).toMatch(/<q>Built the design system in three layers/);
    expect(html).toMatch(/href="#card-credit-card-portal"/); // a quoted record on the page is linked to its card
    expect(html).toMatch(/<article class="proof-card[^>]*id="card-verizon-ai-workflow"/);
    expect(html).toMatch(/screening line/); // the footer says where the years line went
    expect(html).toMatch(/Posting seen 2026-09-16/);
  });

  test("a lens the guards reject is not rendered", async ({ request }) => {
    const lens = pitch(stripe, "Stripe");
    lens.hero.body = { en: "I have led 400 designers.", jp: "400 人のデザイナーを率いた。" };
    const response = await request.post("/lens/preview", { data: { lens } });
    expect(response.status()).toBe(422);
    const { errors } = await response.json();
    expect(errors.join("\n")).toMatch(/Claim Guard/);
  });

  test("GET is not a page", async ({ request }) => {
    const response = await request.get("/lens/preview");
    expect(response.status()).toBe(405);
  });
});
