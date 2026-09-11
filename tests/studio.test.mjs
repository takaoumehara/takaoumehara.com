import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeJobDescription,
  encodeLensToUrlParam,
  decodeLensFromUrlParam
} from '../scripts/lens-engine.mjs';
import { getProjectById } from '../scripts/evidence-db.mjs';

describe('Lens Studio Engine', () => {
  it('analyzes an Enterprise AI Job Description and selects appropriate evidence', () => {
    const aiJd = `
      We are looking for a Head of AI Design & Multi-Agent Systems.
      You will lead enterprise workflow automation, coordinate autonomous agent orchestration,
      and bridge cross-functional teams and knowledge graphs for scalable enterprise systems.
    `;

    const lens = analyzeJobDescription({
      jdText: aiJd,
      targetRole: 'Head of AI Design',
      targetCompany: 'Anthropic'
    });

    assert.equal(lens.isCustom, true);
    assert.equal(lens.analysis.targetCompany, 'Anthropic');
    assert.equal(lens.analysis.targetRole, 'Head of AI Design');
    assert.match(lens.hero.eyebrow, /Anthropic · Head of AI Design/);

    // Verify projects exist in evidence db
    assert.ok(lens.featuredProjects.length >= 3);
    for (const p of lens.featuredProjects) {
      const dbProject = getProjectById(p.projectId);
      assert.ok(dbProject, `Project ${p.projectId} must exist in Evidence DB`);
    }

    // Verizon AI should be prominent for this JD
    const projectIds = lens.featuredProjects.map((p) => p.projectId);
    assert.ok(projectIds.includes('verizon-ai-workflow'));

    // Gaps and matches populated
    assert.ok(lens.analysis.directMatches.length > 0);
    assert.ok(lens.analysis.gaps.length > 0);
  });

  it('analyzes a Creative Director Job Description and highlights brand & craft', () => {
    const creativeJd = `
      Executive Creative Director needed for global brand campaigns, visual storytelling,
      cinematography, and culture-shaping film direction.
    `;

    const lens = analyzeJobDescription({
      jdText: creativeJd,
      targetRole: 'Executive Creative Director',
      targetCompany: 'Wieden+Kennedy'
    });

    const projectIds = lens.featuredProjects.map((p) => p.projectId);
    assert.ok(
      projectIds.includes('koji-fizz') || projectIds.includes('coca-cola'),
      'Should include brand or film direction projects'
    );
  });

  it('compresses and decompresses a custom lens through URL-safe serialization without loss', async () => {
    const sourceLens = analyzeJobDescription({
      jdText: 'Looking for a Founding Venture Operator to build 0 to 1 products and turnarounds',
      targetRole: 'Founding Partner',
      targetCompany: 'HyperVenture'
    });

    const urlParam = await encodeLensToUrlParam(sourceLens);
    assert.ok(typeof urlParam === 'string');
    assert.ok(urlParam.length > 50, 'Compressed URL parameter should have content');
    // Ensure URL safety (no +, /, or =)
    assert.ok(!/[+/=]/.test(urlParam), 'URL parameter must be base64url safe');

    const decodedLens = await decodeLensFromUrlParam(urlParam);
    assert.ok(decodedLens, 'Decoded lens should not be null');
    assert.equal(decodedLens.isCustom, true);
    assert.equal(decodedLens.analysis.targetCompany, 'HyperVenture');
    assert.equal(decodedLens.analysis.targetRole, 'Founding Partner');
    assert.equal(decodedLens.featuredProjects.length, sourceLens.featuredProjects.length);

    // Verify all decoded projects exist in Evidence DB
    for (const p of decodedLens.featuredProjects) {
      assert.ok(getProjectById(p.projectId), `Decoded project ${p.projectId} must exist in Evidence DB`);
    }
  });

  it('handles invalid or corrupted URL parameters gracefully without crashing', async () => {
    const resultInvalid = await decodeLensFromUrlParam('not-a-valid-base64-string!!!');
    assert.equal(resultInvalid, null);

    const resultEmpty = await decodeLensFromUrlParam('');
    assert.equal(resultEmpty, null);
  });

  it('exposes all expected LLM providers including Chinese and Free tier options', async () => {
    const { LLM_PROVIDERS, testLLMConnection, analyzeJobDescriptionWithLLM } = await import('../scripts/lens-engine.mjs');
    
    // Check required providers exist
    const expected = ['offline', 'groq', 'openrouter', 'siliconflow', 'gemini', 'kimi', 'deepseek', 'openai', 'anthropic', 'custom'];
    for (const key of expected) {
      assert.ok(LLM_PROVIDERS[key], `Provider ${key} must exist in LLM_PROVIDERS`);
      assert.ok(LLM_PROVIDERS[key].name, `Provider ${key} must have a name`);
    }

    // Check free tier metadata
    assert.equal(LLM_PROVIDERS.offline.isFree, true);
    assert.equal(LLM_PROVIDERS.groq.isFree, true);
    assert.equal(LLM_PROVIDERS.openrouter.isFree, true);
    assert.equal(LLM_PROVIDERS.siliconflow.isFree, true);

    // Test offline connection test
    const testResult = await testLLMConnection({ provider: 'offline' });
    assert.equal(testResult.success, true);

    // Test missing key error for paid/key-requiring provider
    const missingKeyResult = await testLLMConnection({ provider: 'openai', apiKey: '' });
    assert.equal(missingKeyResult.success, false);

    // Test analyzeJobDescriptionWithLLM fallback when offline or error
    const lens = await analyzeJobDescriptionWithLLM({
      jdText: 'Lead AI product architecture for enterprise customers',
      targetRole: 'VP Product',
      targetCompany: 'Acme',
      provider: 'offline'
    });
    assert.ok(lens);
    assert.equal(lens.isCustom, true);
    assert.equal(lens.analysis.targetCompany, 'Acme');
  });
});

