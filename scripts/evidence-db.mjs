// ============================================================================
// Career Evidence Database — takaoumehara.com
// "One Takao. One evidence base. Different lenses."
// ============================================================================

export const CAPABILITY_TAXONOMY = Object.freeze({
  creative: [
    'Creative Direction',
    'Brand Systems',
    'Visual Storytelling',
    'Film & Production Direction',
    'Interactive Experience',
  ],
  product: [
    'Product Strategy',
    'UX & CX Architecture',
    'Service Design',
    '0→1 Product Development',
  ],
  business: [
    'Business Transformation',
    'Growth & Revenue Strategy',
    'Venture Building',
    'Operations & Logistics',
  ],
  technology: [
    'Enterprise AI Systems',
    'Agentic UX',
    'Creative Technology',
    'Live Prototyping',
    'Multimodal AI',
  ],
  leadership: [
    'Cross-functional Leadership',
    'Executive Partnership',
    'External Partner Direction',
    'Enterprise',
    'Global / US ↔ Japan',
  ],
});

export const ALL_CAPABILITIES = Object.freeze(
  Object.values(CAPABILITY_TAXONOMY).flat()
);

export const THESES = Object.freeze([
  {
    id: 'beginning-of-things',
    statement: 'I like the beginning of things.',
    elaboration: 'New ideas. New technologies. New behaviors. New possibilities. I am strongest when the answer is not obvious yet.',
  },
  {
    id: 'make-to-think',
    statement: 'I make things to think.',
    elaboration: 'Prototypes, experiments, and interactive artifacts are not merely outputs of thought; they are how thought happens in ambiguous territory.',
  },
  {
    id: 'different-medium',
    statement: 'Different medium. Same instinct.',
    elaboration: 'Whether directing a 35mm brand documentary, orchestrating 40+ designers with enterprise AI agents, or building an interactive physics engine, the core discipline is finding the human heartbeat inside complex constraints.',
  },
  {
    id: 'constrained-engine',
    statement: 'Severe constraints are generative engines.',
    elaboration: 'When standard paths close, creative and operational redesign can out-earn and out-perform incumbent models.',
  }
]);

export const CAREER_CHAPTERS = Object.freeze([
  {
    id: 'brand-culture',
    title: 'Brand Systems & Global Culture',
    period: 'Agency & Global Brands (Ogilvy)',
    summary: 'Directing global campaign worlds, identity systems, and visual narratives across diverse international markets (Coca-Cola, American Express).',
    capabilities: ['Brand Systems', 'Creative Direction', 'Visual Storytelling', 'Global / US ↔ Japan']
  },
  {
    id: 'interactive-technology',
    title: 'Interactive Experience & Sensory Craft',
    period: 'Creative Technology & Spatial Work',
    summary: 'Pioneering physical-digital convergence, pseudo-haptic physics, real-time installations, and multi-device interaction protocols.',
    capabilities: ['Interactive Experience', 'Creative Technology', 'Live Prototyping']
  },
  {
    id: 'product-edtech',
    title: 'Product Systems & Learning Experiences',
    period: 'Amplify, CLI Studios, Education Platforms',
    summary: 'Architecting gamified digital learning curriculum, multi-platform mobile apps, and scalable design token systems for K-12 and consumer arts.',
    capabilities: ['Product Strategy', 'UX & CX Architecture', '0→1 Product Development']
  },
  {
    id: 'enterprise-ai',
    title: 'Enterprise AI Transformation & Agentic UX',
    period: 'Verizon Design Systems Org',
    summary: 'Designing multi-agent workflows, centralized organizational knowledge graphs (Master Brain), and decision-support agents for 40+ designers and 80+ cross-functional leads.',
    capabilities: ['Enterprise AI Systems', 'Agentic UX', 'Cross-functional Leadership', 'Enterprise']
  },
  {
    id: 'ventures-advisory',
    title: 'Venture Building & Executive Advisory',
    period: 'Current · New York & Global',
    summary: 'Founding 0→1 products (Moime.app, AgentReady), open-source agent tooling (Superforge, FailForward), and advising leadership on AI adoption and business transformation.',
    capabilities: ['Venture Building', 'Executive Partnership', 'Business Transformation']
  }
]);

export const PROJECTS = Object.freeze([
  // ── 01. INTERACTIVE & EXPERIMENTAL (Sensory & Playable) ──
  {
    id: 'resona',
    slug: 'resona',
    type: 'experiment',
    title: 'Resona 響',
    tagline: 'Pseudo-haptic sensory physics for flat glass',
    organization: 'Independent Research / Studio',
    period: 'Live · 2026',
    location: 'New York',
    engagementType: 'founder',
    role: 'Motion Design & Sensory Physics Engineer',

    summary: 'Animation that makes you feel mass, resistance, and friction through a screen that has neither physical weight nor mechanical haptics.',
    thesis: 'Tactile sensation on flat screens is an illusion created by micro-timing, velocity curves, and sensory anticipation.',

    myContribution: [
      'Researched and codified pseudo-haptic velocity curve algorithms',
      'Engineered real-time Canvas 2D physics loop with sub-pixel collision response',
      'Designed visual aesthetic of magnetic tension and gravity wells',
      'Wrote pure Web Animation API implementation without heavy third-party physics engines'
    ],
    teamContribution: [
      'Self-directed research and solo implementation'
    ],
    whatWasBuilt: [
      'Interactive sensory physics playground web app',
      'Modular pseudo-haptic curve engine for Web Animation API',
      'Realtime frame-rate monitor and friction parameter control panel'
    ],
    businessImpact: [
      'Applied sensory principles to consumer checkout and enterprise micro-interactions'
    ],
    userImpact: [
      'Demonstrated physical weight perception on standard consumer mobile devices with 0 latency'
    ],
    metrics: [
      { value: '60fps', label: 'Consistent Physics Loop', context: 'Pure Web Animation & Canvas' },
      { value: '0kb', label: 'Zero Dependency Engine', context: 'Custom pseudo-haptic formulas' }
    ],
    constraints: [
      'No native haptic motor API access on desktop browsers',
      'Performance budget under 30KB initial payload'
    ],
    capabilities: [
      'Interactive Experience',
      'Creative Technology',
      'Live Prototyping',
      'UX & CX Architecture'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://resona-motion.vercel.app'
    },
    assets: {
      previewType: 'canvas',
      art: 'resona',
      caption: 'Mass · Friction · Pseudo-Haptics'
    },
    featuredDefault: true,
    featuredOrder: 1
  },

  // ── 02. ENTERPRISE AI & PRODUCT LEADERSHIP ──
  {
    id: 'verizon-ai-workflow',
    slug: 'verizon-ai-agents',
    type: 'project',
    title: 'Verizon AI Workflow',
    subtitle: 'Reimagining How Product Teams Make Decisions with AI',
    tagline: 'Enterprise multi-agent UX system for 42 designers and 80+ stakeholders',
    organization: 'Verizon Design Systems Org',
    period: '2025–Present',
    location: 'New York / Enterprise',
    engagementType: 'consulting',
    role: 'Lead Product Designer · Agentic UX & AI Systems',

    summary: 'Orchestrated an enterprise AI system integrating centralized project knowledge (Master Brain) and specialized validation agents to reduce fragmented design knowledge and late-stage engineering rework across six brands.',
    thesis: 'Enterprise AI for product teams succeeds when it augments existing decision rituals rather than forcing a separate chat destination.',

    myContribution: [
      'Architected the multi-agent UX system and operational decision-support framework',
      'Designed the "Master Brain" knowledge aggregation schema across design tokens, specs, and Jira',
      'Prototyped lightweight validation agents for early edge-case and accessibility detection',
      'Conducted AI-assisted heuristic evaluations across 6 brand design systems',
      'Established governance and trust boundaries for AI-suggested UI pattern modifications'
    ],
    teamContribution: [
      'Design systems engineering team integrated APIs with Figma plugins and enterprise GitHub',
      '42 staff product designers piloted workflows and provided feedback',
      'Enterprise security & legal team evaluated compliance within air-gapped constraints'
    ],
    whatWasBuilt: [
      'Fleet of 10 purpose-built AI agents for edge-case detection, token audits, and spec writing',
      'Centralized Master Brain query architecture connecting design system guidelines with live repos',
      'Executive dashboard measuring adoption velocity and defect prevention'
    ],
    businessImpact: [
      'Significantly reduced late-stage UX and engineering rework across 6 portfolio brands',
      'Standardized design decision documentation across 80+ cross-functional stakeholders',
      'Accelerated onboarding time for new designers onto complex telecom design systems'
    ],
    organizationalImpact: [
      'Shifted design team culture from reactive specification to proactive AI-augmented evaluation'
    ],
    metrics: [
      { value: '42', label: 'Designers Supported', context: 'Across 6 distinct enterprise brands' },
      { value: '80+', label: 'Cross-Functional Stakeholders', context: 'Product, Engineering, QA, Design' },
      { value: '10', label: 'Specialized Agents', context: 'Orchestrated for design workflow support' }
    ],
    constraints: [
      'Strict corporate data privacy policy prohibiting public LLM API transmission',
      'Highly fragmented legacy documentation across multiple disconnected corporate wikis'
    ],
    capabilities: [
      'Enterprise AI Systems',
      'Agentic UX',
      'Product Strategy',
      'Cross-functional Leadership',
      'Enterprise',
      'UX & CX Architecture'
    ],
    evidenceStrength: 'strong',
    links: {},
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/verizon-ai-agents.jpg',
      caption: 'Enterprise AI Workflow Architecture'
    },
    featuredDefault: true,
    featuredOrder: 2
  },

  // ── 03. BUSINESS TRANSFORMATION & 0→1 REINVENTION ──
  {
    id: 'festival-reinvention',
    slug: 'festival-design',
    type: 'venture',
    title: 'Reinventing a Festival After COVID',
    subtitle: 'Experience · Brand · Operations · Revenue',
    tagline: 'Transforming a disrupted community festival into a 3x revenue game engine',
    organization: 'Japanese Community Cultural Festival',
    period: '2022–2024 (3 Annual Cycles)',
    location: 'New York',
    engagementType: 'volunteer',
    role: 'Experience Director & Systems Lead (Volunteer)',

    summary: 'When COVID shuttered the festival for 2 years and eliminated traditional food revenue, spearheaded a complete operational and creative reinvention, transforming interactive carnival games into the primary financial engine.',
    thesis: 'Under severe operational constraints, compelling interactive experiences can out-earn traditional retail operations.',

    myContribution: [
      'Conceived, designed, and prototyped 11+ original physical game concepts',
      'Reinvented the entire festival visual identity, environmental signage, and map flow',
      'Engineered the operational customer journey to eliminate queue bottlenecks',
      'Modeled ticket pricing, token economy, and booth revenue structures',
      'Led iterative improvements across 3 consecutive post-pandemic festival cycles'
    ],
    teamContribution: [
      'Over 100 volunteer parents built physical booths and staffed game lines',
      'School administration managed city permits and grounds safety compliance',
      'Food committee coordinated surviving packaged food concessions'
    ],
    whatWasBuilt: [
      '11 physical, repeatable game attractions with standardized rules and custom props',
      'Complete festival brand identity system (posters, tickets, banners, stamps)',
      'Queue layout and high-throughput pedestrian circulation plan',
      'Annual operations handbook and volunteer training curriculum'
    ],
    businessImpact: [
      'Game-related gross revenue grew >3x compared to pre-COVID peak records',
      'Replaced vulnerable perishables with a high-margin, weather-resilient revenue model',
      'Established an institutional operational playbook reused annually'
    ],
    userImpact: [
      'Reduced average child wait times from 25 minutes to under 8 minutes',
      'Over 1,200 participating families per festival day with near-zero queue congestion'
    ],
    metrics: [
      { value: '>3x', label: 'Game Revenue Growth', context: 'Compared to pre-COVID peak record' },
      { value: '11+', label: 'Original Games Designed', context: 'Repeatable physical interaction mechanics' },
      { value: '<8m', label: 'Average Queue Time', context: 'Down from 25+ min via engineered flow' },
      { value: '1,200+', label: 'Participating Families', context: 'Annual attendance capacity' }
    ],
    constraints: [
      'Zero cooked meat/food prep allowed due to post-COVID health guidelines',
      'Zero after-school prep hours inside the building',
      'Strict volunteer budget ($0 agency fees) with all labor donated'
    ],
    capabilities: [
      'Business Transformation',
      'Experience Design',
      'Creative Direction',
      'Brand Systems',
      'Operations & Logistics',
      '0→1 Product Development'
    ],
    evidenceStrength: 'strong',
    links: {},
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/festival-design.jpg',
      caption: 'Akimatsuri Festival Identity & Game System'
    },
    featuredDefault: true,
    featuredOrder: 3
  },

  // ── 04. VENTURE BUILDER: CURRENT AI VENTURE ──
  {
    id: 'moime-app',
    slug: 'moime-app',
    type: 'venture',
    title: 'Moime.app',
    subtitle: 'Multimodal AI Link-in-Bio for Physical-Digital Events',
    tagline: 'Point your camera at any flyer to instantly extract dates, codes, and venue metadata',
    organization: 'Moime Inc.',
    period: 'In Production · 2026',
    location: 'New York',
    engagementType: 'founder',
    role: 'Founder & Full-Stack Product Architect',

    summary: 'A link-in-bio platform bridging physical event collateral and digital calendars. Point it at a paper flyer or poster and multimodal AI parses event schedules, ticket discounts, and venue details in one step.',
    thesis: 'Physical flyers are high-intent engagement surfaces trapped in analog silos; multimodal vision bridges them directly into action.',

    myContribution: [
      'Conceived product strategy, business model, and viral distribution loop',
      'Architected end-to-end multimodal AI extraction pipeline with Gemini API',
      'Designed responsive mobile-first UI with React 19 and instant camera scanning',
      'Engineered serverless backend, real-time analytics, and dynamic QR generation'
    ],
    teamContribution: [
      'Solo venture architecture with early feedback from New York event organizer community'
    ],
    whatWasBuilt: [
      'Production-ready React 19 web application with camera-first UX',
      'Structured multimodal extraction engine parsing messy typography and multi-lingual dates',
      'Organizer analytics portal showing scan-to-calendar conversion rates'
    ],
    businessImpact: [
      'Validating monetization via tiered organizer subscriptions and featured event placement',
      'Achieved 92% accurate extraction rate on hand-designed event flyers'
    ],
    metrics: [
      { value: '92%', label: 'Extraction Accuracy', context: 'Across non-standard flyer layouts' },
      { value: '<3s', label: 'Scan-to-Calendar Latency', context: 'From camera snap to ICS export' }
    ],
    constraints: [
      'Unstructured graphic layouts, cursive fonts, and varied lighting conditions',
      'Zero user onboarding tolerance (must work on first scan without app download)'
    ],
    capabilities: [
      '0→1 Product Development',
      'Multimodal AI',
      'Product Strategy',
      'Venture Building',
      'UX & CX Architecture'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://moime.app'
    },
    assets: {
      previewType: 'canvas',
      art: 'moime',
      caption: 'Multimodal Flyer Scanning Engine'
    },
    featuredDefault: true,
    featuredOrder: 4
  },

  // ── 05. BRAND DOCUMENTARY & CREATIVE PRODUCTION (KOJI FIZZ) ──
  {
    id: 'koji-fizz',
    slug: 'koji-fizz',
    type: 'project',
    title: 'KOJI FIZZ',
    subtitle: 'Brand Documentary Short Films & Creative Partnership',
    tagline: 'Documentary film series featuring New York creatives as the core of brand promotion',
    organization: 'KOJI FIZZ (Beverage Brand)',
    period: '2023–2024',
    location: 'New York',
    engagementType: 'consulting',
    role: 'Producer & Creative Partner · Brand Direction',

    summary: 'Served as producer and creative partner for a promotional brand film series, selecting documentary subjects, shaping the narrative concept, and collaborating closely with the director and production crew.',
    thesis: 'Consumer beverage brands earn cultural relevance by documenting authentic creators in their natural creative environments rather than running traditional product commercials.',

    myContribution: [
      'Managed client relationship and articulated brand core values into film brief',
      'Helped shape the overarching documentary concept and narrative angle',
      'Scouted, interviewed, and selected the film director and production collaborators',
      'Decided who the story should focus on among New York creative communities',
      'Shaped the narrative storyboards and guided creative intention during pre-production',
      'Directed client feedback rounds to protect artistic integrity while meeting commercial goals'
    ],
    teamContribution: [
      'Film director and cinematographer handled on-set camera direction, lighting, and sound',
      'Dedicated post-production editor and colorist executed the film cut and grade',
      'Sound designer mastered original audio and musical score'
    ],
    whatWasBuilt: [
      'Multi-part documentary short film series released across digital channels',
      'Brand narrative playbook articulating KOJI FIZZ’s cultural positioning in NYC',
      'Short-form social cuts and campaign still photography assets'
    ],
    businessImpact: [
      'Anchored the brand’s US market launch campaign with authentic cultural alignment',
      'Earned organic distribution among featured artists’ collective follower networks'
    ],
    metrics: [
      { value: '3', label: 'Documentary Films Produced', context: 'Spotlighting NYC artists' },
      { value: 'US Launch', label: 'Commercial Market Entry', context: 'Core brand storytelling asset' }
    ],
    constraints: [
      'Startup production budget requiring agile, small-footprint documentary crews',
      'Strict beverage regulatory compliance guidelines in promotional video'
    ],
    capabilities: [
      'Creative Direction',
      'Film & Production Direction',
      'Visual Storytelling',
      'Brand Systems',
      'External Partner Direction'
    ],
    evidenceStrength: 'strong',
    links: {},
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/koji-fizz.jpg',
      caption: 'KOJI FIZZ Documentary Film Series'
    },
    featuredDefault: false
  },

  // ── 06. PRODUCT & EDTECH: AMPLIFY ELA QUESTS ──
  {
    id: 'amplify-ela-quests',
    slug: 'ela-quests',
    type: 'project',
    title: 'ELA Quests',
    subtitle: 'Gamified Digital Learning Curriculum for K-12',
    tagline: 'Transforming literacy lessons into interactive narrative student adventures',
    organization: 'Amplify Education',
    period: '2023',
    location: 'Brooklyn, NY',
    engagementType: 'consulting',
    role: 'Senior Product Designer',

    summary: 'Designed an engaging quest-based digital curriculum interface transforming rigorous middle school reading and writing pedagogy into interactive narrative exploration.',
    thesis: 'Literacy curriculum succeeds when structured pedagogical rigor adopts game-feel feedback loops without descending into superficial gimmicks.',

    myContribution: [
      'Designed end-to-end quest progression maps and challenge-node interactions',
      'Built responsive web components adhering to WCAG 2.1 AAA accessibility standards',
      'Collaborated with curriculum authors to translate pedagogy into interactive micro-tasks',
      'Created interactive prototypes for classroom user testing with teachers and students'
    ],
    teamContribution: [
      'Curriculum research team authored pedagogical texts and state alignment criteria',
      'Frontend engineering team implemented React components and classroom sync engine'
    ],
    whatWasBuilt: [
      'Interactive student-facing Quest Map UI with responsive layout',
      'Teacher review overlay for real-time student assignment progress tracking',
      'Accessibility-certified design component system for diverse learning needs'
    ],
    businessImpact: [
      'Adopted by major US school districts across nationwide literacy curriculum rollouts',
      'Significantly increased assignment completion rates during pilot classroom studies'
    ],
    metrics: [
      { value: 'K-12', label: 'Curriculum Grade Reach', context: 'Middle school nationwide rollout' },
      { value: 'AAA', label: 'WCAG Accessibility Rating', context: 'High-contrast and screen-reader certified' }
    ],
    constraints: [
      'Diverse low-cost school district devices (Chromebooks, older tablets, varied screens)',
      'Strict FERPA student privacy regulations and district security compliance'
    ],
    capabilities: [
      'UX & CX Architecture',
      'Product Strategy',
      'Service Design',
      '0→1 Product Development'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://amplify.com'
    },
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/ela-quests.jpg',
      caption: 'Amplify ELA Quests Digital Learning Interface'
    },
    featuredDefault: true,
    featuredOrder: 5
  },

  // ── 07. GLOBAL BRAND CAMPAIGN: COCA-COLA ──
  {
    id: 'coca-cola',
    slug: 'coca-cola',
    type: 'project',
    title: 'Coca-Cola',
    subtitle: 'Global Campaign Visual Worlds & Design Systems',
    tagline: 'Two global visual campaign worlds designed to flex across international markets',
    organization: 'The Coca-Cola Company (via Ogilvy BIG)',
    period: 'Global Markets',
    location: 'New York / Tokyo / Global',
    engagementType: 'full-time',
    role: 'Senior Designer · Ogilvy BIG (Brand Innovation Group)',

    summary: 'Directed and designed two global visual campaign worlds engineered to adapt seamlessly across international markets, varied cultural contexts, outdoor spectacles, and packaging systems.',
    thesis: 'A global visual identity succeeds not by enforcing rigid uniformity, but by creating elastic design principles that preserve core emotional recognition across cultures.',

    myContribution: [
      'Developed primary key visual architecture and spatial composition guidelines',
      'Authored global brand flex guidelines for regional agency execution worldwide',
      'Designed iconic OOH (Out-Of-Home) visual assets and multi-format display applications',
      'Bridged Western and Asian market aesthetic nuances within global creative briefs'
    ],
    teamContribution: [
      'Ogilvy worldwide executive creative directors led overarching global client pitch',
      '3D artists and retouching studios produced final high-resolution render assets',
      'Regional Ogilvy teams in EMEA and APAC executed local market rollouts'
    ],
    whatWasBuilt: [
      'Complete global visual campaign guideline system with asset toolkit',
      'Master key visuals for stadium billboards, point-of-sale, and motion packaging'
    ],
    businessImpact: [
      'Deployed across dozens of national markets worldwide with zero brand fragmentation',
      'Reduced regional asset recreation costs through modular visual toolkits'
    ],
    metrics: [
      { value: 'Global', label: 'Worldwide Deployment', context: 'Across EMEA, Americas, and APAC' },
      { value: '2', label: 'Distinct Visual Worlds', context: 'Engineered for international flexibility' }
    ],
    constraints: [
      'Extreme fidelity requirements for global print OOH and high-resolution billboards',
      'Preserving iconic Coca-Cola visual equity while introducing modern visual language'
    ],
    capabilities: [
      'Brand Systems',
      'Creative Direction',
      'Visual Storytelling',
      'Global / US ↔ Japan'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://www.coca-colacompany.com'
    },
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/coca-cola.jpg',
      caption: 'Coca-Cola Global Visual Campaign Worlds'
    },
    featuredDefault: false
  },

  // ── 08. INTERACTIVE & REALTIME COLLABORATION: RAKUGAKI JAM ──
  {
    id: 'rakugaki-jam',
    slug: 'rakugaki-jam',
    type: 'experiment',
    title: 'Rakugaki Jam',
    subtitle: 'Multi-Device Realtime Collaborative Canvas',
    tagline: 'Doodle on your phone, fling it onto the shared wall. Crowd-drawn visual VJ jam.',
    organization: 'Independent Experience',
    period: 'Live · 2026',
    location: 'New York',
    engagementType: 'founder',
    role: 'Creative Technologist & Lead Architect',

    summary: 'A multi-touchpoint crowd art installation. Participants scan a QR code on a large projection screen, doodle on their smartphone screen, and fling their drawing in real time onto a massive shared visual canvas.',
    thesis: 'Removing friction (zero app download, zero account creation) turns passive crowds into active co-creators within 5 seconds.',

    myContribution: [
      'Invented the "Snap Pair" instant multi-device synchronization architecture',
      'Engineered Canvas 2D particle physics and interactive fling inertia',
      'Built real-time state synchronization over Firebase Realtime Database and WebSockets',
      'Designed playful retro-modern aesthetic that rewards repeated participation'
    ],
    teamContribution: [
      'Self-directed research and creative technology build'
    ],
    whatWasBuilt: [
      'Dual-surface interactive system (mobile controller + projector wall receiver)',
      'Sub-50ms latency realtime sync layer supporting 50+ concurrent mobile drawing streams'
    ],
    businessImpact: [
      'Pioneered the interaction foundation deployed in live retail and public festival events'
    ],
    metrics: [
      { value: '<50ms', label: 'Realtime Sync Latency', context: 'Phone touch to wall render' },
      { value: '0', label: 'App Installs Required', context: 'Pure web QR code onboarding' }
    ],
    constraints: [
      'Unpredictable cellular / public Wi-Fi network latency in crowded rooms',
      'Varied smartphone touch sampling rates and screen dimensions'
    ],
    capabilities: [
      'Interactive Experience',
      'Creative Technology',
      'Live Prototyping',
      '0→1 Product Development'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://rakugaki-jam.vercel.app'
    },
    assets: {
      previewType: 'canvas',
      art: 'rakugaki',
      caption: 'Rakugaki Jam Multi-Device Shared Wall'
    },
    featuredDefault: false
  },

  // ── 09. AI TOOLING & AGENT ORCHESTRATION: SUPERFORGE ──
  {
    id: 'superforge',
    slug: 'superforge',
    type: 'tool',
    title: 'superforge',
    subtitle: 'Autonomous Multi-Model Software Development Suite',
    tagline: '14 specialist AI skills orchestrating product builds from intent to ship verification',
    organization: 'Open Source (MIT)',
    period: '2026–ongoing',
    location: 'New York / Open Source',
    engagementType: 'founder',
    role: 'Lead Developer & Architect',

    summary: 'An autonomous multi-model concierge and orchestration framework for Claude Code, Codex, and Gemini CLI, assigning appropriate model tiers per subtask and enforcing empirical runtime verification.',
    thesis: 'Autonomous AI coding systems fail when treating every task uniformly; efficiency requires explicit model-effort tiering and strict empirical proof gates.',

    myContribution: [
      'Designed overall multi-agent choreography and role-specialized skill topology',
      'Engineered model-effort tiering router (Tier A Judgment vs Tier B Volume vs Tier D Bulk)',
      'Created FailForward integration preventing regression through automated failure memory',
      'Authored 14 specialized engineering, UX review, and accessibility audit skills'
    ],
    teamContribution: [
      'Open-source community contributors testing across diverse software stacks'
    ],
    whatWasBuilt: [
      '14 CLI-executable skill packages with deterministic markdown ledger outputs',
      'Cross-model handoff protocol preserving complete state between different AI environments'
    ],
    businessImpact: [
      'Powers rapid 0→1 prototyping and production verification across personal and client ventures'
    ],
    metrics: [
      { value: '14', label: 'Specialist Skills', context: 'From ideation to launch verification' },
      { value: '3', label: 'AI Model Tiers Orchestrated', context: 'Claude, Codex, Gemini Flash' }
    ],
    capabilities: [
      'Enterprise AI Systems',
      'Agentic UX',
      'Creative Technology',
      'Product Strategy'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://github.com/takaoumehara/superforge',
      github: 'https://github.com/takaoumehara/superforge'
    },
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/superforge.jpg',
      caption: 'Superforge Agent Orchestration Suite'
    },
    featuredDefault: false
  },

  // ── 10. AI TOOL: SNAP PAIR ──
  {
    id: 'snap-pair',
    slug: 'snap-pair',
    type: 'tool',
    title: 'Snap Pair',
    subtitle: 'Zero-Config Instant Multi-Device Sync Layer',
    tagline: 'Pairing layer letting every phone in the room join an interactive app in one scan',
    organization: 'Open Source (MIT)',
    period: 'Open Source',
    location: 'New York / Open Source',
    engagementType: 'founder',
    role: 'Library Author & Lead Maintainer',

    summary: 'A pairing layer that lets every phone in the room join an interactive app in one scan. Powers Amazon Fire TV shopping, Rakugaki Jam, and Typespace without requiring app installs or account sign-ups.',
    thesis: 'Realtime multi-device interaction succeeds when connection friction is reduced to a single camera scan.',

    myContribution: [
      'Designed zero-config pairing protocol exchanging dynamic 6-character room tokens',
      'Engineered Firebase Realtime Database sync client with optimistic offline state',
      'Built developer-friendly React and Vanilla JS SDK for fast installation integration'
    ],
    teamContribution: [
      'Open-source developers building party games and interactive marketing installations'
    ],
    whatWasBuilt: [
      'Zero-config client SDK and pairing UI components',
      'QR code generator and dynamic pairing handshake engine'
    ],
    businessImpact: [
      'Powers commercial installations and prototypes across retail, TV, and public art'
    ],
    metrics: [
      { value: '1-scan', label: 'Pairing Speed', context: 'Instant camera connection' },
      { value: '0-install', label: 'App Requirement', context: 'Pure web-socket handshake' }
    ],
    capabilities: [
      'Creative Technology',
      'Interactive Experience',
      '0→1 Product Development'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://snap-pair.web.app'
    },
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/snap-pair.jpg',
      caption: 'Snap Pair Instant Multi-Device Pairing'
    },
    featuredDefault: false
  },

  // ── 10. PRODUCT DESIGN: CLI STUDIOS ──
  {
    id: 'cli-studios',
    slug: 'cli-studios',
    type: 'project',
    title: 'CLI Studios',
    subtitle: 'Mobile Learning Overhaul & Design System',
    tagline: 'Transforming dance arts education into an intuitive cross-platform mobile experience',
    organization: 'CLI Studios Inc.',
    period: '2024',
    location: 'New York / Los Angeles',
    engagementType: 'consulting',
    role: 'Lead Product Designer',

    summary: 'Led the complete UX and design system overhaul for the flagship CLI Studios mobile apps, reimagining information architecture and class progression for over 50,000 dancers worldwide.',
    thesis: 'Arts education apps fail when treated as generic video catalogues; dancers need movement-centered playback ergonomics and tactile progress milestones.',

    myContribution: [
      'Restructured core mobile information architecture and navigation hierarchy',
      'Designed custom video player ergonomics with scrub loops and tempo adjustment',
      'Built multi-platform design token system for iOS and Android engineering teams',
      'Conducted iterative usability testing with professional dancers and dance studio owners'
    ],
    teamContribution: [
      'Executive team aligned commercial priorities and subscription tier pricing',
      'Mobile native engineering team implemented SwiftUI and Jetpack Compose views'
    ],
    whatWasBuilt: [
      'Complete iOS and Android mobile app Figma design system with 200+ components',
      'Class discovery, playlist management, and custom video training player UX'
    ],
    businessImpact: [
      'Significantly improved day-30 user retention and class completion metrics post-launch'
    ],
    metrics: [
      { value: '50K+', label: 'Active Dancers Reached', context: 'Global mobile subscriber base' },
      { value: '200+', label: 'Design Tokens & Components', context: 'Cross-platform iOS/Android library' }
    ],
    capabilities: [
      'UX & CX Architecture',
      'Product Strategy',
      'Service Design'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://clistudios.com'
    },
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/cli-studios.jpg',
      caption: 'CLI Studios Mobile App Overhaul'
    },
    featuredDefault: false
  },

  // ── 11. BRAND & SPACE DESIGN: KITADOKO ──
  {
    id: 'kitadoko',
    slug: 'kitadoko',
    type: 'project',
    title: 'Kitadoko',
    subtitle: '150-Year-Old Barbershop Transformation & Space Design',
    tagline: 'CX redesign and space architecture taking customer repeat rate from 0% to 90%',
    organization: 'Kitadoko Hair Salon',
    period: '2023',
    location: 'Tokyo, Japan',
    engagementType: 'consulting',
    role: 'Creative Director & Space Designer',

    summary: 'Full customer experience, brand identity, and interior space redesign of a historic 150-year-old Tokyo barbershop, repositioning it into an exclusive private styling sanctuary.',
    thesis: 'Heritage businesses do not need cosmetic preservation; they need a rigorous customer experience thesis that unlocks modern willingness-to-pay.',

    myContribution: [
      'Formulated new service model shifting from walk-in haircut to private membership styling',
      'Designed complete visual brand identity, exterior signage, and physical appointment collaterals',
      'Conceived interior spatial plan optimizing privacy, acoustic comfort, and natural lighting',
      'Priced service tiers and engineered the rebooking ritual at completion of service'
    ],
    teamContribution: [
      'Local master carpenters and architectural contractors executed interior build-out',
      'Master barber-owner delivered core craft and customer service'
    ],
    whatWasBuilt: [
      'Physical salon interior environment and exterior facade design',
      'Brand guidelines, typographic identity, custom mirrors, and packaging'
    ],
    businessImpact: [
      'Customer rebooking repeat rate skyrocketed from near 0% to over 90%',
      'Average revenue per customer increased by more than 2.5x immediately after reopening'
    ],
    metrics: [
      { value: '0% → 90%', label: 'Repeat Rebooking Rate', context: 'Transformed customer retention' },
      { value: '>2.5x', label: 'Average Revenue per Customer', context: 'Value-based price repositioning' },
      { value: '150yr', label: 'Heritage Brand Modernized', context: 'Fifth-generation Tokyo institution' }
    ],
    capabilities: [
      'Service Design',
      'Brand Systems',
      'Creative Direction',
      'Business Transformation',
      'Global / US ↔ Japan'
    ],
    evidenceStrength: 'strong',
    links: {
      live: 'https://kitadoko.com'
    },
    assets: {
      previewType: 'image',
      thumbnail: 'assets/thumbs/kitadoko.jpg',
      caption: 'Kitadoko 150-Year Barbershop Rebrand & Space Design'
    },
    featuredDefault: false
  },

  // ── 12. VISION ML & INTERACTION: KAO GAME ──
  {
    id: 'kao-game',
    slug: 'kao-game',
    type: 'experiment',
    title: 'Kao Game 顔ゲーム',
    subtitle: 'Your Face is the Game Controller',
    tagline: 'Facial muscle exercise made genuinely fun to repeat through Computer Vision',
    organization: 'Independent Experience',
    period: 'In Progress · 2026',
    location: 'New York',
    engagementType: 'founder',
    role: 'Interaction Designer & Vision Engineer',

    summary: 'A camera-based game you play with your face. Pull the expressions the game asks for — facial muscle exercise made genuinely addictive and joyful through real-time computer vision tracking.',
    thesis: 'Health and wellness routines become habits only when transformed into joyful, low-stakes play.',

    myContribution: [
      'Engineered facial landmark detection pipeline in browser using lightweight vision ML',
      'Designed playful graphic facial expressions and feedback sound loops',
      'Tuned gameplay difficulty curves to accommodate varying facial mobility and ages'
    ],
    teamContribution: [
      'Independent research and development'
    ],
    whatWasBuilt: [
      'Zero-install browser vision game with realtime landmark tracking and score mechanics'
    ],
    businessImpact: [
      'Exploring wellness and physical rehabilitation partnership prototypes'
    ],
    metrics: [
      { value: '60fps', label: 'On-Device Face Tracking', context: 'Zero cloud latency or privacy risk' }
    ],
    capabilities: [
      'Interactive Experience',
      'Creative Technology',
      'Live Prototyping'
    ],
    evidenceStrength: 'strong',
    links: {},
    assets: {
      previewType: 'canvas',
      art: 'kao',
      caption: 'Kao Game Vision Interaction'
    },
    featuredDefault: false
  }
]);

export const PROJECTS_BY_ID = Object.freeze(
  new Map(PROJECTS.map((p) => [p.id, p]))
);

export const PROJECTS_BY_SLUG = Object.freeze(
  new Map(PROJECTS.map((p) => [p.slug, p]))
);

export function getProjectById(id) {
  return PROJECTS_BY_ID.get(id) ?? null;
}

export function getProjectBySlug(slug) {
  return PROJECTS_BY_SLUG.get(slug) ?? null;
}
