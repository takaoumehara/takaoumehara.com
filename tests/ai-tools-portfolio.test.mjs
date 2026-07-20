import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v3 = root;
const read = (name) => readFileSync(join(v3, name), 'utf8');
const mainPages = [
  'index.html', 'work.html', 'ai-tools.html', 'ai-products.html', 'about.html',
  'contact.html', 'breakbias.html', 'intentfirst.html', '404.html',
];

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const classSelector = (name) =>
  `(?=[^>]*\\bclass\\s*=\\s*(?:"[^"]*\\b${escape(name)}\\b[^"]*"|'[^']*\\b${escape(name)}\\b[^']*'))`;
const openWithClass = (tag, name) => new RegExp(`<${tag}\\b${classSelector(name)}[^>]*>`, 'gi');
const langSpan = (lang, text) =>
  `<span\\b${classSelector(lang)}[^>]*>\\s*${escape(text)}\\s*<\\/span>`;
const paired = (en, jp) => new RegExp(`${langSpan('t-en', en)}\\s*${langSpan('t-jp', jp)}`);
const attr = (tag, name) => tag.match(new RegExp(`\\b${escape(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))?.slice(1).find(Boolean);
const hasClass = (tag, name) => new RegExp(`\\bclass\\s*=\\s*(?:"[^"]*\\b${escape(name)}\\b[^"]*"|'[^']*\\b${escape(name)}\\b[^']*')`, 'i').test(tag);
const anchors = (html) => [...html.matchAll(/<a\b[^>]*>/gi)].map((match) => match[0]);

function assertPair(html, en, jp, label) {
  assert.ok(paired(en, jp).test(html), `${label} needs adjacent EN/JP spans`);
}

function assertNoUnsupportedClaims(html, label) {
  const unsupported = /\b(?:adoption|users|production usage|production-proven|proven at scale|performance(?: results| gains| improvements?)?|business outcomes?|revenue|ROI)\b/i;
  assert.equal(unsupported.test(html), false, `${label} must not claim unsupported adoption, production usage, performance, or business outcomes`);
}

function cssAtRuleBlocks(css, pattern) {
  const flags = [...new Set(`${pattern.flags}g`)].join('');
  const blocks = [];
  for (const match of css.matchAll(new RegExp(pattern.source, flags))) {
    const open = css.indexOf('{', match.index);
    let depth = 1;
    for (let index = open + 1; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') depth -= 1;
      if (depth === 0) {
        blocks.push(css.slice(open + 1, index));
        break;
      }
    }
  }
  return blocks;
}

function cssAtRuleBlock(css, pattern) {
  return cssAtRuleBlocks(css, pattern)[0] ?? '';
}

function cssRuleBody(css, selector) {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].split(',').map((value) => value.trim()).includes(selector)) return match[2];
  }
  return '';
}

function hasFinalClosedMobileNavOverride(html) {
  const baseFlexRules = [...html.matchAll(/\.nav-links\s*\{[^}]*\bdisplay\s*:\s*flex\b[^}]*\}/gi)];
  const lastBaseFlex = baseFlexRules.at(-1);
  if (!lastBaseFlex) return false;
  const cssAfterBaseFlex = html.slice(lastBaseFlex.index + lastBaseFlex[0].length);
  return /@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?\.nav-links\s*\{[^}]*\bdisplay\s*:\s*none\b[^}]*\}[\s\S]*?\.nav-links\.is-open\s*\{[^}]*\bdisplay\s*:\s*flex\b[^}]*\}/i.test(cssAfterBaseFlex);
}

function navDestinations(html, page) {
  const nav = html.match(/<ul\b[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-links\b[^"]*"|'[^']*\bnav-links\b[^']*')[^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  assert.ok(nav, `${page}: missing primary nav`);
  return [...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attr(match[0], 'href'), label: match[1].replace(/<[^>]+>/g, '').trim(), tag: match[0],
  }));
}

test('homepage presents two semantic AI Tools rows between Selected Work and AI Products', () => {
  const html = read('index.html');
  const selected = html.indexOf('id="selected-work"');
  const tools = html.indexOf('id="ai-tools"');
  const products = html.indexOf('id="ai-products"');

  assert.ok(selected >= 0, 'Selected Work needs id="selected-work"');
  assert.ok(tools > selected, 'AI Tools must follow Selected Work');
  assert.ok(products > tools, 'AI Products must follow AI Tools');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']ai-tools["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.match(section, /AI Tools &amp; Infrastructure/);
  assert.equal([...section.matchAll(openWithClass('article', 'tools-row'))].length, 2, 'AI Tools needs two project articles');
  assertPair(section, 'I design and build practical tools, skills, and systems for people working with AI agents.', 'AIエージェントと働く人のための、ツール・スキル・基盤を設計し、実装しています。', 'homepage positioning');
  assertPair(section, 'Carry AI coding work across tools without rebuilding context.', 'AI コーディングの文脈を作り直さず、ツールをまたいで作業を引き継ぐ。', 'cross-model-handoff outcome');
  assertPair(section, 'Turn many phones into one live, shared experience—without an app install.', 'アプリをインストールせず、何台ものスマートフォンをひとつのライブ体験につなぐ。', 'snap-pair-core outcome');
  assert.match(section, /Agent workflow · Plugin · Skill system/);
  assert.match(section, /AGENTS\.md · Claude Code hooks · Markdown/);
  assert.match(section, /Realtime infrastructure · React · Firebase · Agent skill/);
  assert.match(section, /Firebase Auth · Cloud Functions · Realtime Database/);
  assertPair(section, 'View project →', 'プロジェクトを見る →', 'homepage project CTAs');
  assertPair(section, 'Explore AI tools →', 'AI ツールを見る →', 'homepage section CTA');
  assert.match(section, /href\s*=\s*["']ai-tools\.html#cross-model-handoff["']/);
  assert.match(section, /href\s*=\s*["']ai-tools\.html#snap-pair-core["']/);
  assertNoUnsupportedClaims(section, 'homepage AI Tools section');
});

test('AI Products removes cross-model-handoff and shows eleven products', () => {
  const products = read('ai-products.html');
  assert.equal(products.includes('cross-model-handoff'), false, 'cross-model-handoff must be removed from AI Products');
  assert.match(products, /<div\b[^>]*\bclass\s*=\s*["'][^"']*\bpage-count\b[^"']*["'][^>]*>\s*11 products\s*<\/div>/i);
});

test('Task 2 review: homepage AI Tools title has adjacent English and Japanese variants', () => {
  const section = read('index.html').match(/<section\b[^>]*\bid\s*=\s*["']ai-tools["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assertPair(section, 'AI Tools &amp; Infrastructure', 'AIツールとインフラストラクチャ', 'homepage AI Tools title');
});

test('Task 2 review: dedicated-page eyebrow and title have adjacent English and Japanese variants', () => {
  const html = read('ai-tools.html');
  assertPair(html, 'Designed &amp; built by Takao', 'Takaoが設計・実装', 'dedicated-page eyebrow');
  assertPair(html, 'AI Tools &amp; Infrastructure', 'AIツールとインフラストラクチャ', 'dedicated-page title');
});

test('Task 2 review: dedicated-page reduced motion disables every control transition', () => {
  const reduced = cssAtRuleBlock(read('ai-tools.html'), /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
  assert.ok(reduced, 'ai-tools.html needs a reduced-motion media block');
  for (const selector of ['.nav-toggle span', '.nav-links a', '.lang-btn']) {
    assert.match(cssRuleBody(reduced, selector), /\btransition\s*:\s*none(?:\s*!important)?\s*;/i, `${selector} transition must be disabled for reduced motion`);
  }
});

test('Task 2 review: homepage mobile toggle exposes state, control, and a 44px target', () => {
  const html = read('index.html');
  const toggle = html.match(/<button\b(?=[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-toggle\b[^"]*"|'[^']*\bnav-toggle\b[^']*'))[^>]*>/i)?.[0];
  const nav = html.match(/<ul\b(?=[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-links\b[^"]*"|'[^']*\bnav-links\b[^']*'))[^>]*>/i)?.[0];
  assert.ok(toggle && nav, 'homepage needs a mobile toggle and controlled nav list');
  assert.equal(attr(toggle, 'type'), 'button', 'homepage nav toggle must be type=button');
  assert.equal(attr(toggle, 'aria-expanded'), 'false', 'homepage nav toggle must start collapsed');
  assert.ok(attr(nav, 'id'), 'homepage nav list needs an id');
  assert.equal(attr(toggle, 'aria-controls'), attr(nav, 'id'), 'homepage nav toggle must reference the nav list');
  assert.match(html, /toggle\.addEventListener\(\s*["']click["']\s*,[\s\S]*?toggle\.setAttribute\(\s*["']aria-expanded["']\s*,/, 'homepage toggle click must update aria-expanded');

  const buttonRule = cssRuleBody(html, '.nav-toggle');
  assert.match(buttonRule, /\b(?:min-)?width\s*:\s*44px\s*;/i, 'homepage nav toggle needs at least 44px width');
  assert.match(buttonRule, /\b(?:min-)?height\s*:\s*44px\s*;/i, 'homepage nav toggle needs at least 44px height');
  assert.match(cssRuleBody(html, '.nav-toggle span'), /\bwidth\s*:\s*28px\s*;/i, 'visible hamburger lines should retain their 28px width');
});

test('homepage mobile nav cascade keeps links closed until the toggle opens them', () => {
  const html = read('index.html');
  assert.ok(hasFinalClosedMobileNavOverride(html), 'a final max-width:768px override after the base nav rule must hide .nav-links by default and show only .nav-links.is-open');
});

test('final polish: repeated main-page mobile navs remain closed by default', () => {
  const pages = ['ai-products.html', 'work.html', '404.html'];
  const missingOverrides = pages.filter((page) => !hasFinalClosedMobileNavOverride(read(page)));
  assert.deepEqual(missingOverrides, [], `final mobile override must hide .nav-links until it is-open: ${missingOverrides.join(', ')}`);
});

test('final polish: homepage language handler updates the document language', () => {
  const handler = read('index.html').match(/const setLang\s*=\s*\(lang\)\s*=>\s*\{[\s\S]*?\n\s*\};/)?.[0] ?? '';
  assert.ok(handler, 'index.html needs a setLang handler');
  assert.match(handler, /html\.lang\s*=\s*lang\s*===\s*["']jp["']\s*\?\s*["']ja["']\s*:\s*["']en["']\s*;/, 'homepage setLang must expose ja/en through html.lang');
});

test('final polish: dedicated stories remain readable at exactly 768px', () => {
  const blocks = cssAtRuleBlocks(read('ai-tools.html'), /@media\s*\(max-width:\s*768px\)/i);
  const hasReadableStoryOverride = blocks.some((block) => (
    /\bgrid-template-columns\s*:\s*1fr\s*;/i.test(cssRuleBody(block, '.tool-story'))
    && /\bgrid-template-columns\s*:\s*1fr\s*;/i.test(cssRuleBody(block, '.story-section'))
  ));
  assert.ok(hasReadableStoryOverride, 'ai-tools.html must collapse stories and story sections to one column at 768px');
});

test('dedicated page tells two bilingual, evidence-based project stories', () => {
  assert.ok(existsSync(join(v3, 'ai-tools.html')), 'v3/ai-tools.html must exist');
  const html = read('ai-tools.html');

  assert.match(html, /<title>\s*AI Tools &amp; Infrastructure — Takao Umehara\s*<\/title>/);
  assert.match(html, /<h1\b[^>]*>[\s\S]*?AI Tools &amp; Infrastructure[\s\S]*?<\/h1>/);
  assert.equal([...html.matchAll(openWithClass('article', 'tool-story'))].length, 2, 'dedicated page needs two story articles');
  assert.match(html, /<article\b[^>]*\bid\s*=\s*["']cross-model-handoff["']/);
  assert.match(html, /<article\b[^>]*\bid\s*=\s*["']snap-pair-core["']/);
  assert.ok(html.indexOf('I design and build practical tools, skills, and systems for people working with AI agents.') < html.search(/<article\b[^>]*\bid\s*=\s*["']cross-model-handoff["']/i), 'supporting statement must precede project stories');
  assertPair(html, 'I design and build practical tools, skills, and systems for people working with AI agents.', 'AIエージェントと働く人のための、ツール・スキル・基盤を設計し、実装しています。', 'page positioning');
  assertPair(html, 'Carry AI coding work across tools without rebuilding context.', 'AI コーディングの文脈を作り直さず、ツールをまたいで作業を引き継ぐ。', 'cross-model-handoff outcome');
  assertPair(html, 'Turn many phones into one live, shared experience—without an app install.', 'アプリをインストールせず、何台ものスマートフォンをひとつのライブ体験につなぐ。', 'snap-pair-core outcome');

  const storyPairs = [
    ['Problem', '課題'], ['System', '仕組み'], ['Evidence', '実装実績'],
    ['Switching AI coding tools or clearing context forces people to explain the work again and loses running state that source control cannot capture.', 'AI コーディングツールを切り替えたり、コンテキストを消去したりするたびに、作業の背景を説明し直し、ソース管理では残せない実行中の状態まで失ってしまいます。'],
    ['A lightweight handoff protocol built from `.handoff/` notes, memorable passphrases, `AGENTS.md`, three reusable skills, and Claude Code hooks.', '`.handoff/` のメモ、覚えやすいパスフレーズ、`AGENTS.md`、3 つの再利用可能なスキル、Claude Code のフックで構成した軽量な引き継ぎプロトコルです。'],
    ['Works across Claude Code, Codex, Gemini CLI, Antigravity, Cursor, and other tools that read project instructions. Includes five-language documentation and an MIT license.', 'Claude Code、Codex、Gemini CLI、Antigravity、Cursor をはじめ、プロジェクト指示を読むツール間で利用できます。ドキュメントは 5 言語に対応し、MIT ライセンスで公開しています。'],
    ['Safe, temporary multi-device experiences repeatedly need the same difficult foundation: pairing, presence, shared state, room capacity, and authorization.', '安全で一時的なマルチデバイス体験をつくるたびに、ペアリング、プレゼンス、共有状態、定員管理、認可という同じ基盤を一から実装する必要があります。'],
    ['A React hook plus Firebase Auth, callable Cloud Functions, Realtime Database rules, cleanup, tests, a one-file Lite example, and an AI-agent skill that generates safe integrations.', 'React hook、Firebase Auth、callable Cloud Functions、Realtime Database のセキュリティルール、クリーンアップ、テスト、1 ファイルの Lite サンプル、安全な統合を生成する AI エージェント向けスキルをまとめています。'],
    ['Supports QR or six-character pairing, rooms up to 300 participants, server-assisted membership, emulator and production paths, multilingual documentation, and an MIT license.', 'QR コードまたは 6 文字コードでのペアリング、最大 300 人のルーム、サーバー側で管理するメンバーシップ、エミュレーターと本番環境の両方の導入経路に対応。多言語ドキュメントを備え、MIT ライセンスで公開しています。'],
    ['View cross-model-handoff on GitHub ↗', 'GitHub で cross-model-handoff を見る ↗'],
    ['View snap-pair-core on GitHub ↗', 'GitHub で snap-pair-core を見る ↗'],
  ];
  for (const [en, jp] of storyPairs) assertPair(html, en, jp, en);
  assert.match(html, /Agent workflow · Plugin · Skill system/);
  assert.match(html, /Realtime infrastructure · React · Firebase · Agent skill/);
  assertNoUnsupportedClaims(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '', 'dedicated AI Tools page');
});

test('story CTAs use the two exact GitHub URLs with safe, descriptive external-link attributes', () => {
  assert.ok(existsSync(join(v3, 'ai-tools.html')), 'v3/ai-tools.html must exist');
  const ctas = anchors(read('ai-tools.html')).filter((tag) => hasClass(tag, 'story-cta'));
  const expected = [
    ['https://github.com/takaoumehara/cross-model-handoff', 'cross-model-handoff'],
    ['https://github.com/takaoumehara/snap-pair-core', 'snap-pair-core'],
  ];
  assert.equal(ctas.length, 2, 'dedicated page needs two GitHub story CTAs');
  for (const [url, repository] of expected) {
    const tag = ctas.find((candidate) => attr(candidate, 'href') === url);
    assert.ok(tag, `missing ${url} CTA`);
    assert.equal(new URL(attr(tag, 'href')).href, `${url}`, `${repository}: invalid GitHub URL`);
    assert.equal(attr(tag, 'target'), '_blank', `${repository}: CTA must open a new tab`);
    assert.match(attr(tag, 'rel') ?? '', /\bnoopener\b/, `${repository}: CTA needs rel=noopener`);
    assert.match(attr(tag, 'aria-label') ?? '', new RegExp(`${escape(repository)}.*opens in a new tab`, 'i'), `${repository}: CTA needs descriptive accessible label`);
  }
});

test('all main-page navs order Work, AI Tools, AI Products, About, and Contact', () => {
  const expected = [
    ['work.html', 'Work'], ['ai-tools.html', 'AI Tools'], ['ai-products.html', 'AI Products'],
    ['about.html', 'About'], ['contact.html', 'Contact'],
  ];
  for (const page of mainPages) {
    const nav = navDestinations(read(page), page);
    assert.deepEqual(nav.slice(0, 5).map(({ href, label }) => [href, label]), expected, `${page}: primary-nav order`);
  }
  const active = navDestinations(read('ai-tools.html'), 'ai-tools.html').find(({ href }) => href === 'ai-tools.html')?.tag;
  assert.ok(active && hasClass(active, 'is-active') && attr(active, 'aria-current') === 'page', 'ai-tools.html: AI Tools must be active');
});

test('new tools and stories have scoped focus, mobile, and reduced-motion rules', () => {
  const home = read('index.html');
  assert.ok(/\.tools-link:focus-visible\s*,?[\s\S]*?\{[^}]*\boutline\s*:/.test(home), 'homepage tool links need visible focus');
  assert.ok(/\.section-link:focus-visible\s*,?[\s\S]*?\{[^}]*\boutline\s*:/.test(home), 'Explore AI tools link needs visible focus');
  assert.ok(/@media\s*\(max-width:\s*767px\)[\s\S]*?\.tools-row[\s\S]*?grid-template-columns\s*:\s*1fr/.test(home), 'homepage rows must become one column below 768px');
  assert.ok(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.tools-(?:row|link)[\s\S]*?transition\s*:\s*none/i.test(home), 'homepage tools need reduced-motion handling');

  assert.ok(existsSync(join(v3, 'ai-tools.html')), 'v3/ai-tools.html must exist');
  const tools = read('ai-tools.html');
  assert.ok(/\.story-cta:focus-visible\s*,?[\s\S]*?\{[^}]*\boutline\s*:/.test(tools), 'story CTAs need visible focus');
  assert.ok(/@media\s*\(max-width:\s*767px\)[\s\S]*?\.tool-story[\s\S]*?grid-template-columns\s*:\s*1fr/.test(tools), 'stories must become one column below 768px');
  assert.ok(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.story-(?:cta|details|summary)[\s\S]*?(?:transition|scroll-behavior)\s*:\s*(?:none|auto)/i.test(tools), 'stories need reduced-motion handling');
  assert.match(tools, /const saved = localStorage\.getItem\(["']tu-lang["']\) \|\| ["']en["']/);
  const toggle = tools.match(/<button\b(?=[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-toggle\b[^"]*"|'[^']*\bnav-toggle\b[^']*'))[^>]*>/i)?.[0];
  assert.ok(toggle, 'ai-tools.html needs the mobile nav-toggle button');
  assert.equal(attr(toggle, 'aria-expanded'), 'false', 'mobile nav-toggle must start collapsed');
  assert.match(tools, /<ul\b[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-links\b[^"]*"|'[^']*\bnav-links\b[^']*')[^>]*>/i, 'mobile toggle must control the primary nav list');
  assert.match(tools, /toggle\.setAttribute\(\s*["']aria-expanded["']\s*,/, 'mobile-nav script must update aria-expanded');
  assert.match(tools, /toggle\.addEventListener\(\s*["']click["']\s*,[\s\S]*?links\.classList\.toggle\(\s*["']is-open["']\s*,\s*open\s*\)/, 'mobile-nav click handler must toggle the nav-links open state');
  assert.match(tools, /links\.querySelectorAll\(\s*["']a["']\s*\)\.forEach[\s\S]*?links\.classList\.remove\(\s*["']is-open["']\s*\)/, 'mobile-nav links must close the open menu');
});

test('internal HTML links on every main page resolve to files and fragments', () => {
  for (const page of mainPages) {
    assert.ok(existsSync(join(v3, page)), `v3/${page} must exist`);
    const html = read(page);
    for (const tag of anchors(html)) {
      const href = attr(tag, 'href');
      if (!href || /^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const [target = '', fragment] = href.split('#');
      if (target && !target.endsWith('.html')) continue;
      const targetPage = target || page;
      const targetPath = join(v3, targetPage);
      assert.ok(existsSync(targetPath), `${page}: missing ${targetPage}`);
      if (fragment) assert.match(read(targetPage), new RegExp(`\\bid\\s*=\\s*["']${escape(fragment)}["']`), `${page}: missing ${href}`);
    }
  }
});
