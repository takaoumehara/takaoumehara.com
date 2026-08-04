import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../projects/verizon-ai-agents.html', import.meta.url), 'utf8');
const intake = readFileSync(new URL('../docs/portfolio-content-intake-prompt.md', import.meta.url), 'utf8');

test('Master Brain diagram names both inputs and their destination', () => {
  assert.match(html, /Input 01 &middot; Brand knowledge/);
  assert.match(html, /Input 02 &middot; Research knowledge/);
  assert.match(html, /Both knowledge sources feed the Project Master Brain/);
  assert.match(html, /\.mb-source::after/);
  assert.match(html, /\.mb-source::before/);
});

test('Justin Case explains the product directly', () => {
  assert.match(html, /Justin reviews product flows for edge cases before development\./);
  assert.match(html, /Justin is a Gemini Gem connected to a NotebookLM knowledge base/);
  assert.doesNotMatch(html, /Break the logic <em>before a line of code exists\.<\/em>/);
});

test('project intake collects structure, craft, impact, and retrospective evidence', () => {
  assert.match(intake, /## 6\.5 Structure/);
  assert.match(intake, /## 7\. Craft/);
  assert.match(intake, /## 10\. Proof/);
  assert.match(intake, /## 11\. Retrospective/);
  assert.match(intake, /見出しは格好よさより明確さを優先する/);
});
