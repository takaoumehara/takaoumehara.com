// ============================================================================
// Lens Engine — takaoumehara.com
// Semantic JD Analysis, Framing Synthesizer & Zero-Backend URL State
// "One Takao. One evidence base. Different lenses."
// ============================================================================

import {
  PROJECTS,
  PROJECTS_BY_ID,
  CAPABILITY_TAXONOMY,
  ALL_CAPABILITIES,
  getProjectById,
} from './evidence-db.mjs';

// ── 01. URL COMPRESSION & ZERO-BACKEND SERIALIZATION ──

export function uint8ArrayToBase64Url(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToUint8Array(base64url) {
  let base64 = (base64url || '').replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Compresses a string using deflate-raw stream, returning a Base64URL string
 */
export async function compressString(str) {
  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(new TextEncoder().encode(str));
      writer.close();
      const reader = cs.readable.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      let totalLen = 0;
      for (const c of chunks) totalLen += c.length;
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return uint8ArrayToBase64Url(merged);
    } catch {
      // Fallback if CompressionStream fails
    }
  }
  // Fallback: UTF-8 safe base64url directly
  return uint8ArrayToBase64Url(new TextEncoder().encode(str));
}

/**
 * Decompresses a Base64URL string
 */
export async function decompressString(b64) {
  const bytes = base64UrlToUint8Array(b64);
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const reader = ds.readable.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      let totalLen = 0;
      for (const c of chunks) totalLen += c.length;
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return new TextDecoder().decode(merged);
    } catch {
      // Fallback: raw UTF-8 decode
    }
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Encodes a Lens configuration into a compact URL-safe string
 */
export async function encodeLensToUrlParam(lensConfig) {
  const compact = {
    r: lensConfig.analysis?.targetRole || lensConfig.name || '',
    c: lensConfig.analysis?.targetCompany || '',
    h: {
      e: lensConfig.hero?.eyebrow || '',
      t: lensConfig.hero?.title || '',
      l: lensConfig.hero?.lead || ''
    },
    fp: (lensConfig.featuredProjects || []).map((p) => ({
      id: p.projectId,
      em: p.emphasis || '',
      tg: p.customTagline || '',
      sm: p.customSummary || '',
      m: p.highlightMetrics || []
    })),
    an: {
      dm: lensConfig.analysis?.directMatches || [],
      tr: lensConfig.analysis?.transferable || [],
      gp: lensConfig.analysis?.gaps || [],
      rs: lensConfig.analysis?.reasoning || ''
    }
  };

  const json = JSON.stringify(compact);
  return compressString(json);
}

/**
 * Decodes a compact URL param into a full LensConfig object
 */
export async function decodeLensFromUrlParam(paramStr) {
  if (!paramStr) return null;
  try {
    const jsonStr = await decompressString(paramStr);
    const compact = JSON.parse(jsonStr);

    const targetCompany = compact.c || '';
    const targetRole = compact.r || 'Role Perspective';
    const lensName = targetCompany ? `${targetCompany} · ${targetRole}` : targetRole;

    const featuredProjects = (compact.fp || [])
      .map((item) => {
        const project = getProjectById(item.id);
        if (!project) return null;
        return {
          projectId: item.id,
          emphasis: item.em || project.title,
          customTagline: item.tg || project.tagline,
          customSummary: item.sm || project.summary,
          highlightMetrics: (item.m && item.m.length > 0)
            ? item.m
            : project.metrics.slice(0, 2).map((m) => `${m.value} ${m.label}`)
        };
      })
      .filter(Boolean);

    // If no valid projects survived, fallback to standard highlights
    if (featuredProjects.length === 0) {
      featuredProjects.push(
        { projectId: 'resona', emphasis: 'Sensory Craft & Latency', customTagline: 'Pseudo-haptic physics on glass', customSummary: 'Zero-latency tactile feedback.', highlightMetrics: ['60fps', '0kb Dependency'] },
        { projectId: 'verizon-ai-workflow', emphasis: 'Enterprise AI Systems', customTagline: 'Multi-agent orchestration', customSummary: 'Autonomous organizational knowledge.', highlightMetrics: ['42 Designers', 'Master Brain'] }
      );
    }

    return {
      id: `custom-${Date.now().toString(36)}`,
      slug: 'custom',
      name: lensName,
      isCanonical: false,
      isCustom: true,

      meta: {
        title: `Takao Umehara — ${lensName}`,
        description: compact.h?.l || 'Tailored executive career narrative.',
        noindex: true
      },

      hero: {
        eyebrow: compact.h?.e || `${targetCompany || 'Career'} · ${targetRole}`,
        title: compact.h?.t || 'I like the beginning of things.',
        lead: compact.h?.l || 'I explore opportunities before the answers are obvious — turning ideas into concepts, prototypes, products, ventures, and experiences that people can actually react to.',
        ctaPrimary: {
          text: 'Explore Tailored Work',
          href: '#featured-showcase',
          icon: '↓'
        },
        ctaSecondary: {
          text: 'Browse Career Archive',
          href: '#selected-proof',
          icon: '→'
        }
      },

      capabilityPriority: [
        ...(compact.an?.dm || []),
        ...(compact.an?.tr || []),
        '0→1 Product Development',
        'Enterprise AI Systems'
      ].slice(0, 6),

      featuredProjects,

      sections: {
        showProofShowcase: true,
        showExplorations: true,
        showInteractiveLab: false,
        showVentures: true,
        showCareerArc: true,
        showAdvisory: true,
        showStudioLink: true
      },

      cta: {
        heading: targetCompany
          ? `Ready to discuss high-leverage initiatives at ${targetCompany}?`
          : 'Ready to build what comes next?',
        subheading: 'Available for strategic leadership, executive advisory, and high-velocity innovation sprints.',
        primaryAction: {
          text: 'Inquire for Discussion',
          href: `mailto:takaoumehara@gmail.com?subject=Discussion:%20${encodeURIComponent(lensName)}`
        },
        secondaryAction: {
          text: 'Connect on LinkedIn',
          href: 'https://linkedin.com/in/takaoumehara'
        }
      },

      analysis: {
        targetCompany,
        targetRole,
        directMatches: compact.an?.dm || [],
        transferable: compact.an?.tr || [],
        gaps: compact.an?.gp || [],
        reasoning: compact.an?.rs || ''
      }
    };
  } catch {
    // Malformed or invalid parameter
    return null;
  }
}

// ── 02. SEMANTIC JD MATCHER (DETERMINISTIC + OFFLINE) ──

const CLUSTERS = {
  ai_systems: {
    name: 'Enterprise AI & Agentic Systems',
    keywords: [
      'ai', 'agent', 'agents', 'agentic', 'multi-agent', 'orchestration', 'llm', 'llms',
      'enterprise', 'workflow', 'workflows', 'automation', 'intelligence', 'master brain',
      'knowledge graph', 'prompt', 'rag', 'frontier models', 'synthetic'
    ],
    primaryProjects: ['verizon-ai-workflow', 'superforge', 'moime-app'],
    theses: 'AI systems succeed when autonomous agents serve human instinct rather than replacing discernment.',
    defaultRole: 'AI Systems & Product Executive'
  },
  creative_direction: {
    name: 'Creative Direction & Global Brand',
    keywords: [
      'creative director', 'creative direction', 'brand', 'campaign', 'film', 'commercial',
      'storytelling', 'narrative', 'visual', 'art direction', 'aesthetic', 'craft',
      'coca-cola', 'video', 'cinematography', 'culture', 'global'
    ],
    primaryProjects: ['koji-fizz', 'coca-cola', 'resona'],
    theses: 'Cultural resonance happens when disciplined brand governance leaves room for organic serendipity.',
    defaultRole: 'Executive Creative Director'
  },
  sensory_interactive: {
    name: 'Sensory Craft & Interactive Physics',
    keywords: [
      'interaction', 'sensory', 'haptic', 'physics', 'motion', 'interactive', 'canvas',
      'webgl', 'prototype', 'prototyping', 'animation', 'micro-interaction', 'frontend',
      'tangible', 'experiential', 'spatial'
    ],
    primaryProjects: ['resona', 'rakugaki-jam', 'snap-pair', 'kao-game'],
    theses: 'Tactile delight on glass is an engineered illusion born from micro-timing, friction, and zero latency.',
    defaultRole: 'Interaction Craft & Prototyping Lead'
  },
  venture_turnaround: {
    name: '0→1 Venture Building & Transformation',
    keywords: [
      '0 to 1', '0→1', 'venture', 'founding', 'founder', 'startup', 'turnaround', 'covid',
      'revenue', 'monetization', 'business model', 'growth', 'festival', 'entrepreneur',
      'bootstrapping', 'p&l', 'restructuring'
    ],
    primaryProjects: ['festival-reinvention', 'moime-app', 'kitadoko'],
    theses: 'Severe constraints are generative engines; redesigning operations and CX out-performs incumbent models.',
    defaultRole: 'Venture Builder & 0→1 Operator'
  },
  product_edtech: {
    name: 'Product Architecture & Learning Platforms',
    keywords: [
      'product strategy', 'product lead', 'edtech', 'curriculum', 'gamification', 'learning',
      'k-12', 'amplify', 'cli studios', 'scale', 'platform', 'design system', 'tokens',
      'user experience', 'cx architecture'
    ],
    primaryProjects: ['amplify-ela-quests', 'cli-studios', 'verizon-ai-workflow'],
    theses: 'Great product architectures turn complex curriculum and multi-platform states into effortless clarity.',
    defaultRole: 'VP of Product & Experience Design'
  },
  executive_advisory: {
    name: 'Cross-border Advisory & Leadership',
    keywords: [
      'advisory', 'transformation', 'executive', 'leadership', 'japan', 'us', 'cross-border',
      'bilingual', 'retainer', 'fractional', 'strategy', 'restructuring', 'c-suite',
      'board', 'governance'
    ],
    primaryProjects: ['kitadoko', 'festival-reinvention', 'verizon-ai-workflow'],
    theses: 'Bridging US innovation velocity with Japanese institutional craft requires deep cultural translation.',
    defaultRole: 'Executive Strategic Advisor'
  }
};

const COMMON_GAPS = [
  {
    topic: 'Low-Level Infrastructure',
    keywords: ['cuda', 'c++', 'distributed systems', 'low-level', 'kernel', 'kubernetes', 'firmware', 'hardware'],
    label: 'Low-level CUDA / Infrastructure Engineering',
    stance: 'Takao orchestrates architecture and UX; backend infrastructure is partnered with technical co-founders or core infrastructure engineers.'
  },
  {
    topic: 'Financial Accounting',
    keywords: ['gaap', 'tax', 'sox', 'cpa', 'auditing', 'controller'],
    label: 'Corporate Accounting & Regulatory Audit (SOX / GAAP)',
    stance: 'Takao leads business model architecture and growth loops; regulatory accounting is managed by corporate finance partners.'
  },
  {
    topic: 'Native Mobile Hardware Integration',
    keywords: ['ble', 'bluetooth low energy', 'embedded', 'pcb', 'hardware manufacturing', 'rfid'],
    label: 'Embedded Hardware & PCB Manufacturing',
    stance: 'Takao pioneers software sensory physics and computer vision; physical circuit fabrication is delegated to specialized electrical engineering partners.'
  }
];

/**
 * Analyzes raw JD text and synthesizes a tailored Lens configuration
 */
export function analyzeJobDescription({ jdText, targetRole = '', targetCompany = '' }) {
  const normalizedText = (jdText || '').toLowerCase();

  // 1. Calculate cluster scores
  const clusterScores = Object.entries(CLUSTERS).map(([key, cluster]) => {
    let score = 0;
    for (const kw of cluster.keywords) {
      if (normalizedText.includes(kw)) {
        score += kw.length > 5 ? 2 : 1;
      }
    }
    return { key, cluster, score };
  }).sort((a, b) => b.score - a.score);

  const dominantCluster = clusterScores[0].score > 0 ? clusterScores[0].cluster : CLUSTERS.ai_systems;
  const secondaryCluster = clusterScores[1].score > 0 ? clusterScores[1].cluster : CLUSTERS.product_edtech;

  // 2. Score individual projects in Evidence DB
  const scoredProjects = PROJECTS.map((project) => {
    let score = 0;
    const projectBlob = [
      project.title,
      project.tagline,
      project.summary,
      project.thesis,
      ...(project.capabilities || []),
      ...(project.myContribution || []),
      ...(project.businessImpact || []),
      ...(project.whatWasBuilt || [])
    ].join(' ').toLowerCase();

    // Check occurrences of JD keywords
    for (const kw of dominantCluster.keywords) {
      if (projectBlob.includes(kw)) score += 3;
    }
    for (const kw of secondaryCluster.keywords) {
      if (projectBlob.includes(kw)) score += 1.5;
    }

    // Additional direct text hits from JD
    const words = normalizedText.split(/\W+/).filter((w) => w.length > 4);
    const uniqueWords = [...new Set(words)];
    for (const w of uniqueWords.slice(0, 30)) {
      if (projectBlob.includes(w)) score += 0.5;
    }

    return { project, score };
  }).sort((a, b) => b.score - a.score);

  // Take top 4-5 distinct projects
  const topProjects = scoredProjects.slice(0, 4).map(({ project }) => project);

  // 3. Classify Capabilities (Direct / Transferable / Gaps)
  const directMatches = [];
  const transferable = [];
  const gaps = [];

  for (const cap of ALL_CAPABILITIES) {
    const capLower = cap.toLowerCase();
    const isMentionedInJd = normalizedText.includes(capLower) ||
      dominantCluster.keywords.some((k) => capLower.includes(k));

    if (isMentionedInJd) {
      if (topProjects.some((p) => p.capabilities?.includes(cap))) {
        directMatches.push(cap);
      } else {
        transferable.push(cap);
      }
    }
  }

  // Ensure healthy defaults if JD is short
  if (directMatches.length === 0) {
    directMatches.push(
      ...(topProjects[0]?.capabilities?.slice(0, 3) || ['0→1 Product Development', 'Enterprise AI Systems'])
    );
  }
  if (transferable.length === 0) {
    transferable.push('Cross-functional Leadership', 'Visual Storytelling', 'Live Prototyping');
  }

  // Detect Gaps
  for (const gapDef of COMMON_GAPS) {
    if (gapDef.keywords.some((k) => normalizedText.includes(k))) {
      gaps.push(gapDef);
    }
  }
  if (gaps.length === 0) {
    // Standard honest gap statement
    gaps.push(COMMON_GAPS[0]);
  }

  // 4. Synthesize Hero Framing
  const detectedRole = targetRole.trim() || dominantCluster.defaultRole;
  const companyName = targetCompany.trim();
  const eyebrow = companyName
    ? `${companyName} · ${detectedRole} Perspective`
    : `Tailored Lens · ${detectedRole}`;

  const heroTitle = companyName
    ? `Turning ambiguous frontier challenges into tangible products at ${companyName}.`
    : dominantCluster.theses;

  const heroLead = companyName
    ? `An intentional curation of career evidence addressing ${companyName}'s current mandate in ${dominantCluster.name.toLowerCase()}. Grounded in factual 0→1 execution, multi-agent systems, and cross-functional momentum.`
    : `Curated for opportunities at the intersection of ${dominantCluster.name} and human-centered design. Exploring opportunities before the answers are obvious.`;

  // 5. Build Tailored Featured Projects
  const featuredProjects = topProjects.map((p) => {
    let emphasis = p.title;
    let customTagline = p.tagline;
    let customSummary = p.summary;

    if (p.id === 'verizon-ai-workflow') {
      emphasis = 'Enterprise Multi-Agent Orchestration & Knowledge Systems';
      customTagline = 'Master Brain architecture coordinating 42 designers and 80+ stakeholders';
      customSummary = 'Designed centralized organizational multi-agent workflows transforming enterprise design decision velocity.';
    } else if (p.id === 'resona') {
      emphasis = 'Sensory Micro-Interactions & Pure Physics Engine';
      customTagline = 'Zero-latency tactile feedback on flat glass';
      customSummary = 'Proof of exceptional craft: engineered sub-pixel pseudo-haptic formulas without external physics libraries.';
    } else if (p.id === 'festival-reinvention') {
      emphasis = '0→1 Operational Turnaround Under Severe Constraints';
      customTagline = 'Pivoting an outdoor heritage festival during COVID into a >3x revenue milestone';
      customSummary = 'Invented 11+ contactless interactive games, demonstrating resilience and rapid venture execution.';
    } else if (p.id === 'moime-app') {
      emphasis = 'Multimodal Computer Vision Venture Architecture';
      customTagline = 'Bridging offline product discovery and real-time vision classification';
      customSummary = '0→1 commercial venture validating edge vision models for rapid consumer conversion.';
    } else if (p.id === 'superforge') {
      emphasis = 'Agentic Developer Tooling & Multi-Model Orchestration';
      customTagline = 'Autonomous coding agent pipelines with contextual guardrails';
      customSummary = 'Engineered developer orchestration tooling enforcing model-aware task routing and continuous learning memory.';
    }

    const highlightMetrics = (p.metrics || []).slice(0, 2).map((m) => `${m.value} ${m.label}`);

    return {
      projectId: p.id,
      emphasis,
      customTagline,
      customSummary,
      highlightMetrics: highlightMetrics.length > 0 ? highlightMetrics : ['0→1 Execution', 'Production Ready']
    };
  });

  return {
    id: `lens-${Date.now().toString(36)}`,
    slug: 'custom',
    name: eyebrow,
    isCanonical: false,
    isCustom: true,

    meta: {
      title: `Takao Umehara — ${eyebrow}`,
      description: heroLead,
      noindex: true
    },

    hero: {
      eyebrow,
      title: heroTitle,
      lead: heroLead,
      ctaPrimary: {
        text: 'Explore Tailored Work',
        href: '#featured-showcase',
        icon: '↓'
      },
      ctaSecondary: {
        text: 'Browse Career Archive',
        href: '#selected-proof',
        icon: '→'
      }
    },

    capabilityPriority: [...new Set([...directMatches, ...transferable])].slice(0, 6),
    featuredProjects,

    sections: {
      showProofShowcase: true,
      showExplorations: true,
      showInteractiveLab: false,
      showVentures: true,
      showCareerArc: true,
      showAdvisory: true,
      showStudioLink: true
    },

    cta: {
      heading: companyName
        ? `Let's discuss high-leverage outcomes for ${companyName}.`
        : 'Let’s explore uncharted opportunities together.',
      subheading: 'Available for strategic leadership, executive advisory, and high-velocity innovation sprints.',
      primaryAction: {
        text: 'Inquire for Discussion',
        href: `mailto:takaoumehara@gmail.com?subject=${encodeURIComponent(`Discussion: ${eyebrow}`)}`
      },
      secondaryAction: {
        text: 'Connect on LinkedIn',
        href: 'https://linkedin.com/in/takaoumehara'
      }
    },

    analysis: {
      targetCompany: companyName,
      targetRole: detectedRole,
      dominantCluster: dominantCluster.name,
      directMatches: [...new Set(directMatches)].slice(0, 5),
      transferable: [...new Set(transferable)].slice(0, 5),
      gaps: gaps.map((g) => ({ title: g.label, detail: g.stance })),
      reasoning: `Selected ${topProjects.length} evidence anchors matching ${dominantCluster.name}. Highlighted real operational impact and explicit fact boundaries.`
    }
  };
}

// ── 03. OPTIONAL GEMINI LLM REASONING HOOK ──

/**
 * Calls the Google Gemini API directly from the client if an API key is present.
 * Falls back transparently to analyzeJobDescription on any network error or missing key.
 */
export async function analyzeJobDescriptionWithGemini({
  jdText,
  targetRole = '',
  targetCompany = '',
  apiKey = ''
}) {
  if (!apiKey) {
    return analyzeJobDescription({ jdText, targetRole, targetCompany });
  }

  const systemPrompt = `You are the Career Narrative Architect for Takao Umehara.
Takao's core philosophy: "One Takao. One evidence base. Different lenses."
CRITICAL RULE: YOU MUST NEVER INVENT OR HALLUCINATE ANY NEW CREDENTIALS, METRICS, COMPANIES, OR PROJECTS.
Only choose from these real Project IDs in his Evidence DB:
- 'resona': Sensory physics, pseudo-haptic micro-interactions on flat glass, 60fps, 0 dependency.
- 'verizon-ai-workflow': Enterprise multi-agent orchestration, Master Brain for 42 designers and 80+ leads.
- 'festival-reinvention': 0→1 venture turnaround during COVID, 11+ contactless interactive games, >3x revenue.
- 'moime-app': Multimodal computer vision venture, 0→1 product discovery interface, 92% accuracy.
- 'koji-fizz': Film and production direction, creative direction, global cross-cultural craft (Producer/Partner).
- 'amplify-ela-quests': Edtech curriculum gamification, design systems, 0→1 digital learning.
- 'coca-cola': Global brand governance and cultural world-building across US/Europe/Asia.
- 'rakugaki-jam': Multi-user realtime creative canvas, interactive experience.
- 'superforge': Agentic developer tooling, multi-model orchestration, failforward memory.
- 'snap-pair': Zero-setup multi-device realtime pairing engine.
- 'kitadoko': 150-year heritage business advisory, service design, 90% rebooking rate.
- 'cli-studios': Arts education streaming platform, CX architecture.
- 'kao-game': On-device vision face tracking game, zero latency.

Analyze the user's Job Description and output a strictly valid JSON object matching this schema:
{
  "eyebrow": "string",
  "title": "string",
  "lead": "string",
  "directMatches": ["string"],
  "transferable": ["string"],
  "gaps": [
    { "title": "string", "detail": "string" }
  ],
  "featuredProjects": [
    {
      "projectId": "one of the IDs above",
      "emphasis": "contextual title",
      "customTagline": "1-sentence hook",
      "customSummary": "2-sentence framing",
      "highlightMetrics": ["Metric 1", "Metric 2"]
    }
  ]
}
Return raw JSON ONLY. No markdown fences.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              { text: `Target Company: ${targetCompany}\nTarget Role: ${targetRole}\n\nJob Description / Brief:\n${jdText}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn('Gemini API call failed, falling back to deterministic matcher:', response.status);
      return analyzeJobDescription({ jdText, targetRole, targetCompany });
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      return analyzeJobDescription({ jdText, targetRole, targetCompany });
    }

    const parsed = JSON.parse(rawJson);

    // Validate that project IDs exist in DB
    const validatedProjects = (parsed.featuredProjects || [])
      .filter((p) => getProjectById(p.projectId))
      .slice(0, 5);

    if (validatedProjects.length === 0) {
      return analyzeJobDescription({ jdText, targetRole, targetCompany });
    }

    const companyName = targetCompany.trim();
    const roleName = targetRole.trim() || 'Role Perspective';
    const eyebrow = parsed.eyebrow || (companyName ? `${companyName} · ${roleName}` : roleName);

    return {
      id: `lens-${Date.now().toString(36)}`,
      slug: 'custom',
      name: eyebrow,
      isCanonical: false,
      isCustom: true,

      meta: {
        title: `Takao Umehara — ${eyebrow}`,
        description: parsed.lead || 'Tailored executive career narrative.',
        noindex: true
      },

      hero: {
        eyebrow,
        title: parsed.title || 'I like the beginning of things.',
        lead: parsed.lead || 'Tailored executive career narrative.',
        ctaPrimary: {
          text: 'Explore Tailored Work',
          href: '#featured-showcase',
          icon: '↓'
        },
        ctaSecondary: {
          text: 'Browse Career Archive',
          href: '#selected-proof',
          icon: '→'
        }
      },

      capabilityPriority: [
        ...(parsed.directMatches || []),
        ...(parsed.transferable || [])
      ].slice(0, 6),

      featuredProjects: validatedProjects,

      sections: {
        showProofShowcase: true,
        showExplorations: true,
        showInteractiveLab: false,
        showVentures: true,
        showCareerArc: true,
        showAdvisory: true,
        showStudioLink: true
      },

      cta: {
        heading: companyName
          ? `Let's discuss high-leverage outcomes for ${companyName}.`
          : 'Let’s explore uncharted opportunities together.',
        subheading: 'Available for strategic leadership, executive advisory, and high-velocity innovation sprints.',
        primaryAction: {
          text: 'Inquire for Discussion',
          href: `mailto:takaoumehara@gmail.com?subject=${encodeURIComponent(`Discussion: ${eyebrow}`)}`
        },
        secondaryAction: {
          text: 'Connect on LinkedIn',
          href: 'https://linkedin.com/in/takaoumehara'
        }
      },

      analysis: {
        targetCompany: companyName,
        targetRole: roleName,
        directMatches: parsed.directMatches || [],
        transferable: parsed.transferable || [],
        gaps: parsed.gaps || [],
        reasoning: 'Synthesized via Gemini API with strict fact-boundary enforcement.'
      }
    };
  } catch (err) {
    console.warn('Error during Gemini API inference, falling back:', err);
    return analyzeJobDescription({ jdText, targetRole, targetCompany });
  }
}
