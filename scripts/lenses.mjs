// ============================================================================
// Role Lens Configurations — takaoumehara.com
// "One Takao. One evidence base. Different lenses."
// ============================================================================

import { getProjectById } from './evidence-db.mjs';

/**
 * Validates that all project IDs referenced in a lens exist in the Evidence DB
 */
function createLens(lensConfig) {
  for (const item of lensConfig.featuredProjects) {
    if (!getProjectById(item.projectId)) {
      console.warn(`[Lens Warning] Project ID "${item.projectId}" not found in Evidence DB for lens "${lensConfig.id}"`);
    }
  }
  return Object.freeze(lensConfig);
}

// ── 01. CANONICAL DEFAULT LENS ──
export const defaultLens = createLens({
  id: 'default',
  slug: '',
  name: 'Design & AI Executive · Venture Builder',
  isCanonical: true,

  meta: {
    title: 'Takao Umehara — Design & AI Executive · Venture Builder',
    description: 'I like the beginning of things. Design & AI Executive and Venture Builder exploring opportunities before the answers are obvious.',
    noindex: false,
  },

  hero: {
    eyebrow: 'New York · Design & AI Executive · Venture Builder',
    title: 'I like the beginning of things.',
    lead: 'New ideas. New technologies. New behaviors. New possibilities. I explore opportunities before the answers are obvious — turning ideas into concepts, prototypes, products, ventures, and experiences that people can actually react to.',
    ctaPrimary: {
      text: 'Explore Featured Work',
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
    '0→1 Product Development',
    'Enterprise AI Systems',
    'Creative Direction',
    'Business Transformation',
    'Agentic UX',
    'Global / US ↔ Japan'
  ],

  featuredProjects: [
    {
      projectId: 'resona',
      emphasis: 'Sensory Physics & Creative Technology',
      customTagline: 'Pseudo-haptic sensory physics for flat glass',
      customSummary: 'Animation that makes you feel mass, resistance, and friction through a screen that has neither physical weight nor mechanical haptics.',
      highlightMetrics: ['60fps', '0kb']
    },
    {
      projectId: 'verizon-ai-workflow',
      emphasis: 'Enterprise AI Architecture & CX',
      customTagline: 'Reimagining how product teams make decisions with AI',
      customSummary: 'A multi-agent UX system integrating centralized project knowledge (Master Brain) and specialized evaluation agents for 42 designers and 80+ cross-functional leads.',
      highlightMetrics: ['42', '80+', '10']
    },
    {
      projectId: 'festival-reinvention',
      emphasis: 'Business Transformation & 0→1 Venture',
      customTagline: 'Transforming a disrupted community festival into a 3x revenue game engine',
      customSummary: 'When COVID eliminated traditional food revenue, spearheaded a complete operational and creative reinvention, transforming interactive carnival games into the primary financial engine.',
      highlightMetrics: ['>3x', '11+', '<8m']
    },
    {
      projectId: 'moime-app',
      emphasis: 'Multimodal AI & 0→1 Product',
      customTagline: 'Multimodal AI link-in-bio reading physical flyers',
      customSummary: 'Point your phone at any paper flyer or poster and multimodal AI parses event dates, promo codes, and venue metadata directly into digital calendars.',
      highlightMetrics: ['92%', '<3s']
    },
    {
      projectId: 'amplify-ela-quests',
      emphasis: 'Gamified Product Systems & EdTech',
      customTagline: 'Gamified digital learning curriculum for K-12',
      customSummary: 'An engaging quest narrative interface transforming middle school reading and writing pedagogy into interactive student adventures.',
      highlightMetrics: ['K-12', 'AAA']
    }
  ],

  sections: {
    showProofShowcase: true,
    showExplorations: true,
    showInteractiveLab: true,
    showVentures: true,
    showCareerArc: true,
    showAdvisory: true,
    showStudioLink: true
  },

  cta: {
    heading: 'If what you’re trying to build doesn’t have a name yet...',
    subheading: '...that’s probably a good place to start. Available for venture building, executive advisory, and fractional leadership.',
    primaryAction: { text: 'Start a Conversation', href: 'mailto:takaoumehara@gmail.com' },
    secondaryAction: { text: 'Connect on LinkedIn', href: 'https://linkedin.com/in/takaoumehara' }
  }
});

// ── 02. CREATIVE EXECUTIVE LENS ──
export const creativeExecutiveLens = createLens({
  id: 'creative-executive',
  slug: 'creative',
  name: 'Creative Executive',
  isCanonical: false,

  meta: {
    title: 'Takao Umehara — Creative Executive & Director',
    description: 'Giving tangible form to emerging ideas before they have a name. Creative direction, brand systems, film storytelling, and interactive experiences.',
    noindex: false,
  },

  hero: {
    eyebrow: 'Creative Direction · Brand Systems · Interactive · Cultural Impact',
    title: 'Giving tangible form to emerging ideas before they have a name.',
    lead: 'I connect brand narrative, sensory craft, and emerging technology into unified experiences that move people, build cultural equity, and open new commercial territory.',
    ctaPrimary: {
      text: 'View Creative Proof',
      href: '#featured-showcase',
      icon: '↓'
    },
    ctaSecondary: {
      text: 'Creative Philosophy',
      href: '#career-arc',
      icon: '→'
    }
  },

  capabilityPriority: [
    'Creative Direction',
    'Brand Systems',
    'Visual Storytelling',
    'Film & Production Direction',
    'Interactive Experience',
    'Global / US ↔ Japan'
  ],

  featuredProjects: [
    {
      projectId: 'resona',
      emphasis: 'Sensory Craft & Interactive Physics',
      customTagline: 'Pseudo-haptic sensory physics for flat glass',
      customSummary: 'Crafting the invisible: an interactive study in how micro-timing, velocity curves, and sensory anticipation create tactile weight on frictionless glass.',
      highlightMetrics: ['60fps', '0kb']
    },
    {
      projectId: 'koji-fizz',
      emphasis: 'Brand Film Direction & Cultural Storytelling',
      customTagline: 'Documentary film series featuring New York artists as core brand narrative',
      customSummary: 'Producer and creative partner for a documentary brand film series spotlighting New York artists, establishing cultural relevance for a startup beverage market entry.',
      highlightMetrics: ['3 Films', 'US Launch']
    },
    {
      projectId: 'festival-reinvention',
      emphasis: 'Spatial Brand Identity & 11 Tactile Game Systems',
      customTagline: 'Experiential branding, environmental graphics, and 11 participatory games',
      customSummary: 'Authored complete festival identity system, playful environmental signage, and 11 tactile game installations experienced by over 1,200 families.',
      highlightMetrics: ['11+ Games', '1,200+ Families', '>3x Revenue']
    },
    {
      projectId: 'coca-cola',
      emphasis: 'Global Visual Worlds & Campaign Architecture',
      customTagline: 'Two global visual campaign worlds flexing across international markets',
      customSummary: 'Directed two visual campaign worlds at Ogilvy BIG, designing key visual guidelines and OOH spectacles that adapt fluidly across diverse global cultures.',
      highlightMetrics: ['Global', '2 Worlds']
    },
    {
      projectId: 'rakugaki-jam',
      emphasis: 'Crowd-Drawn Realtime Art Installation',
      customTagline: 'Fling smartphone doodles onto a shared projection wall in real time',
      customSummary: 'A zero-friction collaborative canvas transforming smartphone users into real-time visual VJ contributors on massive event projection screens.',
      highlightMetrics: ['<50ms', '0 Installs']
    }
  ],

  sections: {
    showProofShowcase: true,
    showExplorations: false,
    showInteractiveLab: true,
    showVentures: false,
    showCareerArc: true,
    showAdvisory: true,
    showStudioLink: true
  },

  cta: {
    heading: 'Have an ambitious creative challenge with no precedent?',
    subheading: 'Let’s explore how creative direction, experiential storytelling, and tangible making can establish cultural leadership for your brand.',
    primaryAction: { text: 'Inquire for Creative Leadership', href: 'mailto:takaoumehara@gmail.com' },
    secondaryAction: { text: 'View Studio Work', href: 'https://creativityiseverywhere.com' }
  }
});

// ── 03. AI / PRODUCT EXECUTIVE LENS ──
export const aiProductExecutiveLens = createLens({
  id: 'ai-product-executive',
  slug: 'ai-product',
  name: 'AI / Product Executive',
  isCanonical: false,

  meta: {
    title: 'Takao Umehara — AI & Product Executive',
    description: 'Reimagining how product organizations and autonomous agents make decisions together. Enterprise AI systems, Agentic UX, and product leadership.',
    noindex: false,
  },

  hero: {
    eyebrow: 'Enterprise AI · Agentic UX · Product Leadership · Systems Architecture',
    title: 'Reimagining how product teams and autonomous agents make decisions together.',
    lead: 'I design and deploy AI-augmented product workflows, centralized organizational knowledge architectures, and agentic UX that reduce rework and accelerate high-conviction decisions.',
    ctaPrimary: {
      text: 'View AI Systems Proof',
      href: '#featured-showcase',
      icon: '↓'
    },
    ctaSecondary: {
      text: 'Agentic UX Architecture',
      href: '#career-arc',
      icon: '→'
    }
  },

  capabilityPriority: [
    'Enterprise AI Systems',
    'Agentic UX',
    'Product Strategy',
    '0→1 Product Development',
    'Cross-functional Leadership',
    'Enterprise'
  ],

  featuredProjects: [
    {
      projectId: 'verizon-ai-workflow',
      emphasis: 'Multi-Agent Enterprise Architecture & Knowledge Graphs',
      customTagline: 'Enterprise multi-agent UX system for 42 designers and 80+ stakeholders',
      customSummary: 'Architected a centralized Master Brain and 10 specialized decision-support agents for Verizon Design Systems Org, proactively detecting edge cases and preventing rework.',
      highlightMetrics: ['42 Designers', '80+ Leads', '10 Agents']
    },
    {
      projectId: 'moime-app',
      emphasis: 'Multimodal Computer Vision & Consumer AI',
      customTagline: 'Multimodal vision link-in-bio extracting unstructured physical flyers',
      customSummary: 'Designed and deployed an end-to-end multimodal pipeline parsing complex event posters into structured calendar actions in under 3 seconds.',
      highlightMetrics: ['92% Accuracy', '<3s Latency']
    },
    {
      projectId: 'superforge',
      emphasis: 'Autonomous Multi-Model Software Engineering Suite',
      customTagline: '14 specialist AI skills orchestrating product builds from intent to ship verification',
      customSummary: 'Engineered an autonomous orchestration suite routing subtasks across Claude, Codex, and Gemini with automated failure memory and runtime proof gates.',
      highlightMetrics: ['14 Skills', '3 AI Tiers']
    },
    {
      projectId: 'resona',
      emphasis: 'Real-Time Physics Engine & Interface Ergonomics',
      customTagline: 'Pseudo-haptic sensory physics for flat glass',
      customSummary: 'Prototyping the sensory frontier: custom physics algorithms proving that micro-latency adjustments induce tangible weight perception on glass.',
      highlightMetrics: ['60fps Loop', '0kb Bundle']
    },
    {
      projectId: 'amplify-ela-quests',
      emphasis: 'Scalable Design Token Systems & EdTech Architecture',
      customTagline: 'Gamified digital learning curriculum for K-12',
      customSummary: 'Led product design for nationwide literacy curriculum, establishing accessible token architectures adopted by school districts across the country.',
      highlightMetrics: ['K-12 Scale', 'AAA A11y']
    }
  ],

  sections: {
    showProofShowcase: true,
    showExplorations: true,
    showInteractiveLab: true,
    showVentures: true,
    showCareerArc: true,
    showAdvisory: true,
    showStudioLink: false
  },

  cta: {
    heading: 'Deploying AI into complex product and organizational workflows?',
    subheading: 'I help executive teams move from novelty experiments to high-impact operational systems.',
    primaryAction: { text: 'Discuss Product / AI Leadership', href: 'mailto:takaoumehara@gmail.com' },
    secondaryAction: { text: 'Connect on LinkedIn', href: 'https://linkedin.com/in/takaoumehara' }
  }
});

// ── 04. VENTURE BUILDER LENS ──
export const ventureBuilderLens = createLens({
  id: 'venture-builder',
  slug: 'venture',
  name: 'Venture Builder',
  isCanonical: false,

  meta: {
    title: 'Takao Umehara — Venture Builder & 0→1 Operator',
    description: 'Turning ambiguous opportunities into resilient products, engines, and ventures. 0→1 product development, business transformation, and operational design.',
    noindex: false,
  },

  hero: {
    eyebrow: '0→1 Product Development · Business Transformation · Venture Building',
    title: 'Turning ambiguous opportunities into resilient products, engines, and ventures.',
    lead: 'My strongest contribution is moving from zero to one: seeing possibilities early, connecting things that don’t usually belong together, and building enough clarity and momentum for an idea to become durable.',
    ctaPrimary: {
      text: 'View Venture Proof',
      href: '#featured-showcase',
      icon: '↓'
    },
    ctaSecondary: {
      text: 'Operating Model',
      href: '#career-arc',
      icon: '→'
    }
  },

  capabilityPriority: [
    '0→1 Product Development',
    'Business Transformation',
    'Venture Building',
    'Growth & Revenue Strategy',
    'Operations & Logistics',
    'Creative Direction'
  ],

  featuredProjects: [
    {
      projectId: 'festival-reinvention',
      emphasis: 'Post-Pandemic Pivot & 3x Revenue Engine',
      customTagline: 'Rebuilding a zero-revenue post-COVID institution into a durable 3x margin engine',
      customSummary: 'Under severe operational constraints (zero food prep, zero indoor prep), transformed carnival games into the primary revenue driver, tripling historical gross revenue.',
      highlightMetrics: ['>3x Gross Growth', '11+ Game Products', '<8m Wait Time']
    },
    {
      projectId: 'moime-app',
      emphasis: 'Proprietary 0→1 Multimodal Consumer Platform',
      customTagline: 'Multimodal vision link-in-bio bridging analog event collateral to calendars',
      customSummary: 'Conceived, validated, and shipped a viral consumer product converting physical flyers into digital calendar appointments with zero user onboarding friction.',
      highlightMetrics: ['92% Extraction', '<3s Latency']
    },
    {
      projectId: 'superforge',
      emphasis: 'Developer Tooling & Autonomous AI Infrastructure',
      customTagline: 'Autonomous multi-model software development suite',
      customSummary: 'Built an open-source development suite that accelerates 0→1 feature delivery through automated model-tier routing and failure-memory verification.',
      highlightMetrics: ['14 Skills', 'Autonomous QA']
    },
    {
      projectId: 'kitadoko',
      emphasis: 'Heritage Business Model Transformation',
      customTagline: 'CX redesign and space architecture taking repeat rebooking from 0% to 90%',
      customSummary: 'Repositioned a 150-year-old Tokyo barbershop into a high-margin private styling lounge, multiplying average transaction value by 2.5x.',
      highlightMetrics: ['0% → 90% Repeat', '>2.5x Revenue/User']
    },
    {
      projectId: 'resona',
      emphasis: 'R&D to Tangible Commercial IP',
      customTagline: 'Pseudo-haptic sensory physics for flat glass',
      customSummary: 'Developed independent proprietary interaction research proving sensory friction on glass, unlocking new micro-interaction patents and commercial licensing.',
      highlightMetrics: ['Zero Dependency', '60fps Loop']
    }
  ],

  sections: {
    showProofShowcase: true,
    showExplorations: true,
    showInteractiveLab: true,
    showVentures: true,
    showCareerArc: true,
    showAdvisory: true,
    showStudioLink: true
  },

  cta: {
    heading: 'Launching a new venture or transforming an existing model?',
    subheading: 'I partner with founders and executives to validate 0→1 concepts, build live prototypes, and establish early commercial momentum.',
    primaryAction: { text: 'Discuss Venture Partnership', href: 'mailto:takaoumehara@gmail.com' },
    secondaryAction: { text: 'Connect on LinkedIn', href: 'https://linkedin.com/in/takaoumehara' }
  }
});

// ── 05. EXECUTIVE ADVISOR LENS ──
export const executiveAdvisorLens = createLens({
  id: 'executive-advisor',
  slug: 'advisor',
  name: 'Executive Advisor',
  isCanonical: false,

  meta: {
    title: 'Takao Umehara — Executive Advisor · Innovation & Transformation',
    description: 'Strategic advisory for leadership teams navigating AI adoption, product transformation, and US ↔ Japan market bridges.',
    noindex: false,
  },

  hero: {
    eyebrow: 'Executive Advisory · Innovation Strategy · US ↔ Japan Bridge',
    title: 'Strategic clarity and tangible momentum when the answer is not obvious yet.',
    lead: 'Advising CEOs, board directors, and product leaders on AI workflow integration, experience reinvention, and cross-border innovation between New York and Japan.',
    ctaPrimary: {
      text: 'View Transformation Evidence',
      href: '#featured-showcase',
      icon: '↓'
    },
    ctaSecondary: {
      text: 'Advisory Areas',
      href: '#advisory',
      icon: '→'
    }
  },

  capabilityPriority: [
    'Business Transformation',
    'Executive Partnership',
    'Enterprise AI Systems',
    'Product Strategy',
    'Global / US ↔ Japan',
    'Cross-functional Leadership'
  ],

  featuredProjects: [
    {
      projectId: 'verizon-ai-workflow',
      emphasis: 'Enterprise AI Governance & Org Alignment',
      customTagline: 'Orchestrating AI workflows across 42 designers and 80+ enterprise leads',
      customSummary: 'Advised enterprise design systems leadership on AI integration frameworks, establishing decision boundaries that reduced rework across six corporate brands.',
      highlightMetrics: ['42 Designers', '80+ Leads', '6 Brands']
    },
    {
      projectId: 'festival-reinvention',
      emphasis: 'Crisis-Driven Model Transformation & Governance',
      customTagline: 'Spearheading institutional turnaround under severe regulatory constraints',
      customSummary: 'Guided executive volunteer leadership through post-crisis operational restructuring, tripling revenue and authoring permanent operational playbooks.',
      highlightMetrics: ['>3x Growth', '1,200+ Families']
    },
    {
      projectId: 'kitadoko',
      emphasis: 'Heritage Business CX Repositioning',
      customTagline: 'Transforming a 150-year-old service institution into high-margin luxury CX',
      customSummary: 'Strategic business advisory restructuring customer journeys, pricing architecture, and physical environments to achieve a 90% customer rebooking rate.',
      highlightMetrics: ['90% Retention', '>2.5x Basket Size']
    },
    {
      projectId: 'coca-cola',
      emphasis: 'Global Brand Governance & Cultural Synthesis',
      customTagline: 'Cross-cultural campaign architecture across international markets',
      customSummary: 'Unified complex global brand requirements across US, European, and Asian markets, balancing corporate governance with regional market flexibility.',
      highlightMetrics: ['Worldwide Scale', '2 Core Worlds']
    },
    {
      projectId: 'moime-app',
      emphasis: '0→1 AI Venture Architecture',
      customTagline: 'Commercializing multimodal computer vision interfaces',
      customSummary: 'Hands-on architectural validation proving that emerging multimodal AI models can solve legacy offline-to-online conversion barriers.',
      highlightMetrics: ['92% Accuracy', 'Instant Latency']
    }
  ],

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
    heading: 'Navigating an uncharted transition in AI, product, or cross-border expansion?',
    subheading: 'Available for retainers, fractional executive roles, and intensive innovation sprints.',
    primaryAction: { text: 'Inquire for Advisory Partnership', href: 'mailto:takaoumehara@gmail.com' },
    secondaryAction: { text: 'Connect on LinkedIn', href: 'https://linkedin.com/in/takaoumehara' }
  }
});

// All Available Lenses Registry
export const LENSES = Object.freeze([
  defaultLens,
  creativeExecutiveLens,
  aiProductExecutiveLens,
  ventureBuilderLens,
  executiveAdvisorLens
]);

export const LENSES_BY_SLUG = Object.freeze(
  new Map(LENSES.map((l) => [l.slug, l]))
);

export const LENSES_BY_ID = Object.freeze(
  new Map(LENSES.map((l) => [l.id, l]))
);

export function getLensBySlug(slug) {
  const normalized = (slug || '').replace(/^\/+|\/+$/g, '');
  return LENSES_BY_SLUG.get(normalized) ?? defaultLens;
}

export function getLensById(id) {
  return LENSES_BY_ID.get(id) ?? defaultLens;
}
