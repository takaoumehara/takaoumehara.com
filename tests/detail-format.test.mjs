// The locked project detail format (docs/project-page-format.md §0), checked on
// the built pages that have moved to it: teaser → name + one-liner + Play →
// Challenge | Solution → beats → Role / Year, stack in the footer.
import test from "node:test";
import assert from "node:assert/strict";
import { loadLibrary } from "../src/lib/load.mjs";
import { detailFields } from "../src/lib/detail.mjs";
import { read, text } from "./_dist.mjs";

const lib = loadLibrary();
const INTERACTIVE_8 = ["resona", "typespace", "kao-game", "rakugaki-jam", "koe-baku", "emoji-blast", "marubatsu", "werewolf"];

const articleOf = (html) => html.match(/<article class="project-detail"[\s\S]*?<\/article>/)?.[0] ?? "";

for (const slug of INTERACTIVE_8) {
  test(`${slug}: detail page follows the locked format`, () => {
    const item = lib.evidence.get(slug);
    const d = detailFields(item);
    const html = read(`projects/${slug}.html`);
    const article = articleOf(html);
    assert.ok(article, "rendered through the shared detail template");

    const h1s = html.match(/<h1[\s>][\s\S]*?<\/h1>/g) ?? [];
    assert.equal(h1s.length, 1, "exactly one h1");
    assert.ok(h1s[0].includes(d.name.en), "h1 is the project name");
    assert.ok(!/[:：]/.test(h1s[0].replace(/<[^>]+>/g, "")), "no colon tagline in the h1");

    const teaser = article.match(/<div class="project-teaser"[\s\S]*?<header/)?.[0] ?? "";
    assert.ok(/<video|<img|hero-fallback/.test(teaser), "teaser is real media or the name/logo fallback");
    assert.ok(!/gradient/i.test(teaser), "no gradient teaser");

    const beforeTitle = article.slice(0, article.indexOf("<h1"));
    assert.ok(!/pill|chip|project-hero-tag/.test(beforeTitle), "no tags above the title");

    assert.ok(article.includes("project-cs"), "Challenge | Solution present");
    assert.ok(item.challenge?.jp && item.solution?.jp, "Challenge | Solution carry Japanese");

    const external = [...article.matchAll(/<a [^>]*href="(https?:[^"]+)"/g)].map((m) => m[1]);
    if (d.play) assert.deepEqual(external, [item.links.live], "the Play link is the only external link");
    else assert.deepEqual(external, [], "no external link when there is nothing to play");

    const body = text(html);
    assert.ok(!/All Interactive/i.test(body), "no All Interactive chrome");
    assert.ok(!/placeholder|coming soon|lorem/i.test(text(article)), "no placeholder copy");
  });
}
