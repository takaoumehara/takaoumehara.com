// ============================================================================
// Lens Studio Controller — takaoumehara.com
// Interactive JD Analysis, Drag & Drop Curation, and Instant Publishing
// "One Takao. One evidence base. Different lenses."
// ============================================================================

import {
  PROJECTS,
  PROJECTS_BY_ID,
  getProjectById,
} from './evidence-db.mjs';

import {
  analyzeJobDescription,
  analyzeJobDescriptionWithGemini,
  encodeLensToUrlParam,
  decodeLensFromUrlParam
} from './lens-engine.mjs';

// ── SAMPLE JDs FOR 1-CLICK TESTING ──
const SAMPLE_JDS = {
  ai_executive: {
    company: 'Anthropic',
    role: 'Head of Enterprise AI & Agentic UX',
    text: `We are looking for a Head of Enterprise AI & Agentic UX to lead frontier multi-agent workflow architecture. 
You will orchestrate autonomous agent networks, define organizational knowledge systems, bridge technical model behaviors with human instinct, and mobilize cross-functional teams across product, design, and executive leadership. Experience turning ambiguous 0→1 research into high-velocity enterprise platforms is essential.`
  },
  creative_director: {
    company: 'Wieden+Kennedy / Apple',
    role: 'Executive Creative Director',
    text: `Looking for an Executive Creative Director to lead global cultural brand worlds and visual storytelling.
You will direct international campaign architectures, 35mm film and sensory productions, and physical-digital installations. Must balance rigorous corporate brand governance across international markets with raw artistic craftsmanship and poetic instinct.`
  },
  venture_turnaround: {
    company: 'Frontier Ventures',
    role: 'Founding Venture Partner & 0→1 Operator',
    text: `Seeking a Founding Partner / Venture Operator who thrives in severe constraints.
You will architect 0→1 products from concept to revenue, lead business turnarounds, pioneer generative growth loops, and prototype experiential consumer applications without bloated teams. Proven track record turning legacy operations into high-margin digital business models.`
  },
  edtech_product: {
    company: 'Amplify Education',
    role: 'VP of Product Architecture & Experience',
    text: `Seeking a VP of Product Architecture to lead large-scale digital learning systems and gamified curriculum platforms.
You will architect complex state systems, cross-platform design tokens, interactive learning quests for millions of students, and align executive stakeholders across pedagogy and engineering.`
  }
};

// ── APPLICATION STATE ──
let currentLens = null;
let geminiApiKey = '';

try {
  geminiApiKey = localStorage.getItem('takao_gemini_api_key') || '';
} catch {
  // Ignore local storage error
}

// ── DOM ELEMENTS ──
const companyInput = document.querySelector('#studio-company');
const roleInput = document.querySelector('#studio-role');
const jdTextarea = document.querySelector('#studio-jd');
const analyzeBtn = document.querySelector('#studio-analyze-btn');
const statusLive = document.querySelector('[data-studio-status]');

const resultsContainer = document.querySelector('#studio-results');
const analysisDirectList = document.querySelector('#analysis-direct-list');
const analysisTransferList = document.querySelector('#analysis-transfer-list');
const analysisGapsList = document.querySelector('#analysis-gaps-list');

const heroEyebrowInput = document.querySelector('#hero-eyebrow-input');
const heroTitleInput = document.querySelector('#hero-title-input');
const heroLeadInput = document.querySelector('#hero-lead-input');

const projectsList = document.querySelector('#curated-projects-list');
const addProjectSelect = document.querySelector('#add-project-select');
const addProjectBtn = document.querySelector('#add-project-btn');

const publishBtn = document.querySelector('#publish-instant-btn');
const publishUrlDisplay = document.querySelector('#publish-url-display');
const publishUrlInput = document.querySelector('#publish-url-input');
const copyUrlBtn = document.querySelector('#copy-url-btn');
const openPreviewLink = document.querySelector('#open-preview-link');

const exportCodeBtn = document.querySelector('#export-code-btn');
const exportDialog = document.querySelector('#export-dialog');
const exportCodeBlock = document.querySelector('#export-code-block');
const copyCodeBtn = document.querySelector('#copy-code-btn');
const closeExportBtn = document.querySelector('#close-export-btn');

const apiKeyInput = document.querySelector('#api-key-input');
const saveApiKeyBtn = document.querySelector('#save-api-key-btn');
const apiKeyNotice = document.querySelector('#api-key-notice');

const toast = document.querySelector('#studio-toast');

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3200);
}

function setLiveStatus(msg) {
  if (statusLive) statusLive.textContent = msg;
}

// ── POPULATE AVAILABLE PROJECTS IN DROPDOWN ──
function populateAddProjectDropdown() {
  if (!addProjectSelect) return;
  addProjectSelect.innerHTML = '<option value="">-- Select a project to add --</option>';

  const currentIds = new Set((currentLens?.featuredProjects || []).map((p) => p.projectId));

  PROJECTS.forEach((p) => {
    if (!currentIds.has(p.id)) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.title} (${p.type}) — ${p.tagline}`;
      addProjectSelect.appendChild(opt);
    }
  });
}

// ── RENDER CURATED PROJECTS IN DRAG & DROP LIST ──
function renderCuratedProjects() {
  if (!projectsList || !currentLens) return;
  projectsList.innerHTML = '';

  const projects = currentLens.featuredProjects || [];

  if (projects.length === 0) {
    projectsList.innerHTML = '<p class="studio-empty-notice">No projects in this lens yet. Use the dropdown below to add one.</p>';
    populateAddProjectDropdown();
    return;
  }

  projects.forEach((item, index) => {
    const project = getProjectById(item.projectId);
    if (!project) return;

    const card = document.createElement('li');
    card.className = 'curated-card';
    card.draggable = true;
    card.setAttribute('data-index', String(index));
    card.setAttribute('data-project-id', item.projectId);

    card.innerHTML = `
      <div class="curated-card__header">
        <div class="curated-card__drag-handle" title="Drag to reorder" aria-hidden="true">
          <span class="drag-grip">⋮⋮</span>
          <span class="curated-card__number">${String(index + 1).padStart(2, '0')}</span>
        </div>
        
        <div class="curated-card__meta">
          <strong class="curated-card__title">${project.title}</strong>
          <span class="curated-card__type">${project.type} · ${project.period}</span>
        </div>

        <div class="curated-card__order-actions" aria-label="Reorder project">
          <button type="button" class="icon-btn" data-action="move-up" title="Move Up" ${index === 0 ? 'disabled' : ''} aria-label="Move ${project.title} up">↑</button>
          <button type="button" class="icon-btn" data-action="move-down" title="Move Down" ${index === projects.length - 1 ? 'disabled' : ''} aria-label="Move ${project.title} down">↓</button>
          <button type="button" class="icon-btn icon-btn--danger" data-action="remove" title="Remove project" aria-label="Remove ${project.title} from lens">×</button>
        </div>
      </div>

      <div class="curated-card__fields">
        <label class="studio-field">
          <span class="studio-field__label">Lens Emphasis (Contextual Angle)</span>
          <input type="text" class="studio-input" data-field="emphasis" value="${escapeAttr(item.emphasis || project.title)}">
        </label>

        <label class="studio-field">
          <span class="studio-field__label">Custom Tagline (1-Sentence Pitch)</span>
          <input type="text" class="studio-input" data-field="customTagline" value="${escapeAttr(item.customTagline || project.tagline)}">
        </label>

        <label class="studio-field">
          <span class="studio-field__label">Custom Summary (Framing)</span>
          <textarea class="studio-textarea studio-textarea--sm" data-field="customSummary" rows="2">${escapeText(item.customSummary || project.summary)}</textarea>
        </label>

        <label class="studio-field">
          <span class="studio-field__label">Highlight Metrics (Comma-separated)</span>
          <input type="text" class="studio-input" data-field="metrics" value="${escapeAttr((item.highlightMetrics || []).join(', '))}">
        </label>
      </div>
    `;

    // Bind Move Up / Move Down / Remove
    card.querySelector('[data-action="move-up"]')?.addEventListener('click', () => {
      moveProject(index, index - 1);
    });
    card.querySelector('[data-action="move-down"]')?.addEventListener('click', () => {
      moveProject(index, index + 1);
    });
    card.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      removeProject(index);
    });

    // Bind field updates
    card.querySelectorAll('[data-field]').forEach((input) => {
      input.addEventListener('input', (e) => {
        const field = e.target.getAttribute('data-field');
        if (field === 'metrics') {
          item.highlightMetrics = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          item[field] = e.target.value;
        }
        updatePublishPreview();
      });
    });

    // Native Drag and Drop
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('dragleave', handleDragLeave);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);

    projectsList.appendChild(card);
  });

  populateAddProjectDropdown();
}

function escapeAttr(str = '') {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeText(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── DRAG AND DROP REORDERING ──
let draggedIndex = null;

function handleDragStart(e) {
  draggedIndex = Number(this.getAttribute('data-index'));
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(draggedIndex));
  this.classList.add('is-dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drop-target');
}

function handleDragLeave() {
  this.classList.remove('drop-target');
}

function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove('drop-target');
  const targetIndex = Number(this.getAttribute('data-index'));
  if (draggedIndex !== null && draggedIndex !== targetIndex) {
    moveProject(draggedIndex, targetIndex);
  }
}

function handleDragEnd() {
  this.classList.remove('is-dragging');
  document.querySelectorAll('.curated-card').forEach((c) => c.classList.remove('drop-target'));
}

function moveProject(fromIndex, toIndex) {
  if (!currentLens?.featuredProjects) return;
  const list = currentLens.featuredProjects;
  if (toIndex < 0 || toIndex >= list.length) return;

  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  renderCuratedProjects();
  updatePublishPreview();
  showToast(`Moved ${getProjectById(moved.projectId)?.title} to position ${toIndex + 1}`);
}

function removeProject(index) {
  if (!currentLens?.featuredProjects) return;
  const list = currentLens.featuredProjects;
  const [removed] = list.splice(index, 1);
  renderCuratedProjects();
  updatePublishPreview();
  showToast(`Removed ${getProjectById(removed.projectId)?.title}`);
}

// ── ADD PROJECT HANDLER ──
addProjectBtn?.addEventListener('click', () => {
  const selectedId = addProjectSelect?.value;
  if (!selectedId) return;

  const project = getProjectById(selectedId);
  if (!project) return;

  currentLens.featuredProjects.push({
    projectId: project.id,
    emphasis: project.title,
    customTagline: project.tagline,
    customSummary: project.summary,
    highlightMetrics: (project.metrics || []).slice(0, 2).map((m) => `${m.value} ${m.label}`)
  });

  renderCuratedProjects();
  updatePublishPreview();
  showToast(`Added ${project.title} to lens`);
});

// ── RENDER ANALYSIS REPORT ──
function renderAnalysisReport(analysis) {
  if (!analysis) return;

  if (analysisDirectList) {
    analysisDirectList.innerHTML = (analysis.directMatches || []).map((m) => `
      <li class="match-item match-item--direct">
        <span class="match-badge">Direct Match</span>
        <strong>${escapeText(m)}</strong>
      </li>
    `).join('');
  }

  if (analysisTransferList) {
    analysisTransferList.innerHTML = (analysis.transferable || []).map((t) => `
      <li class="match-item match-item--transferable">
        <span class="match-badge">Transferable</span>
        <strong>${escapeText(t)}</strong>
      </li>
    `).join('');
  }

  if (analysisGapsList) {
    analysisGapsList.innerHTML = (analysis.gaps || []).map((g) => {
      const title = typeof g === 'string' ? g : g.title;
      const detail = typeof g === 'object' ? g.detail : 'Managed via specialist partnership.';
      return `
        <li class="match-item match-item--gap">
          <span class="match-badge">Honest Boundary</span>
          <div>
            <strong>${escapeText(title)}</strong>
            <p class="match-detail">${escapeText(detail)}</p>
          </div>
        </li>
      `;
    }).join('');
  }
}

// ── HERO INPUT BINDINGS ──
heroEyebrowInput?.addEventListener('input', (e) => {
  if (currentLens) {
    currentLens.hero.eyebrow = e.target.value;
    currentLens.name = e.target.value;
    updatePublishPreview();
  }
});

heroTitleInput?.addEventListener('input', (e) => {
  if (currentLens) {
    currentLens.hero.title = e.target.value;
    updatePublishPreview();
  }
});

heroLeadInput?.addEventListener('input', (e) => {
  if (currentLens) {
    currentLens.hero.lead = e.target.value;
    updatePublishPreview();
  }
});

// ── PUBLISH & URL GENERATION ──
async function updatePublishPreview() {
  if (!currentLens) return;

  const urlParam = await encodeLensToUrlParam(currentLens);
  const origin = window.location.origin;
  // Cleanly strip /studio, /studio.html, or /studio/ to point to the canonical portfolio root
  const rootPath = window.location.pathname
    .replace(/\/studio(\.html)?\/?$/, '')
    .replace(/\/+$/, '') + '/';
  const fullUrl = `${origin}${rootPath}?c=${urlParam}`;

  if (publishUrlInput) publishUrlInput.value = fullUrl;
  if (openPreviewLink) openPreviewLink.href = fullUrl;
}

publishBtn?.addEventListener('click', async () => {
  if (!currentLens) return;
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publishing...';

  try {
    await updatePublishPreview();
    const url = publishUrlInput?.value;
    if (url && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast('✓ Shareable Lens URL published and copied to clipboard!');
    } else {
      showToast('✓ Shareable Lens URL generated!');
    }
    publishUrlDisplay?.classList.remove('sr-only');
  } catch (err) {
    console.error('Publish error:', err);
    showToast('Failed to copy automatically. Please copy the URL below.');
    publishUrlDisplay?.classList.remove('sr-only');
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publish Shareable Link';
  }
});

copyUrlBtn?.addEventListener('click', async () => {
  const url = publishUrlInput?.value;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    showToast('✓ URL copied to clipboard!');
  } catch {
    publishUrlInput?.select();
    showToast('Press Cmd+C to copy URL');
  }
});

// ── EXPORT CODE FOR STATIC LENSES.MJS ──
exportCodeBtn?.addEventListener('click', () => {
  if (!currentLens) return;

  const exportObject = {
    id: currentLens.slug === 'custom' ? `lens-${(currentLens.analysis?.targetCompany || 'custom').toLowerCase().replace(/\W+/g, '-')}` : currentLens.id,
    slug: (currentLens.analysis?.targetCompany || 'custom').toLowerCase().replace(/\W+/g, '-'),
    name: currentLens.hero.eyebrow,
    isCanonical: false,
    meta: {
      title: `Takao Umehara — ${currentLens.hero.eyebrow}`,
      description: currentLens.hero.lead,
      noindex: true
    },
    hero: currentLens.hero,
    capabilityPriority: currentLens.capabilityPriority,
    featuredProjects: currentLens.featuredProjects,
    sections: currentLens.sections,
    cta: currentLens.cta
  };

  const codeString = `// Paste into scripts/lenses.mjs:\nexport const ${exportObject.slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Lens = createLens(${JSON.stringify(exportObject, null, 2)});\n`;

  if (exportCodeBlock) exportCodeBlock.textContent = codeString;
  exportDialog?.showModal();
});

closeExportBtn?.addEventListener('click', () => {
  exportDialog?.close();
});

copyCodeBtn?.addEventListener('click', async () => {
  const code = exportCodeBlock?.textContent;
  if (code && navigator.clipboard) {
    await navigator.clipboard.writeText(code);
    showToast('✓ Code snippet copied to clipboard!');
  }
});

// ── SAMPLE JD BUTTON CLICKS ──
document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-sample');
    const sample = SAMPLE_JDS[key];
    if (!sample) return;

    if (companyInput) companyInput.value = sample.company;
    if (roleInput) roleInput.value = sample.role;
    if (jdTextarea) jdTextarea.value = sample.text;

    showToast(`Loaded sample JD: ${sample.role} (${sample.company})`);
  });
});

// ── API KEY MANAGEMENT ──
if (apiKeyInput) apiKeyInput.value = geminiApiKey;

saveApiKeyBtn?.addEventListener('click', () => {
  const key = apiKeyInput?.value.trim() || '';
  geminiApiKey = key;
  try {
    if (key) {
      localStorage.setItem('takao_gemini_api_key', key);
      showToast('✓ Gemini API Key saved locally!');
      if (apiKeyNotice) apiKeyNotice.textContent = 'Active: Using Gemini 2.5 Flash for deep synthesis.';
    } else {
      localStorage.removeItem('takao_gemini_api_key');
      showToast('Gemini API Key removed. Using offline deterministic engine.');
      if (apiKeyNotice) apiKeyNotice.textContent = 'Mode: Offline deterministic semantic matcher.';
    }
  } catch (err) {
    console.error('Storage error:', err);
  }
});

// ── MAIN ANALYZE ACTION ──
analyzeBtn?.addEventListener('click', async () => {
  const jdText = jdTextarea?.value.trim() || '';
  const targetCompany = companyInput?.value.trim() || '';
  const targetRole = roleInput?.value.trim() || '';

  if (!jdText) {
    showToast('Please paste a Job Description or role brief first.');
    jdTextarea?.focus();
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing & Framing...';
  setLiveStatus('Analyzing job description against career evidence library...');

  try {
    let resultLens = null;
    if (geminiApiKey) {
      resultLens = await analyzeJobDescriptionWithGemini({
        jdText,
        targetRole,
        targetCompany,
        apiKey: geminiApiKey
      });
    } else {
      resultLens = analyzeJobDescription({
        jdText,
        targetRole,
        targetCompany
      });
    }

    currentLens = resultLens;

    // Populate Hero Inputs
    if (heroEyebrowInput) heroEyebrowInput.value = currentLens.hero.eyebrow;
    if (heroTitleInput) heroTitleInput.value = currentLens.hero.title;
    if (heroLeadInput) heroLeadInput.value = currentLens.hero.lead;

    // Render Analysis & Projects
    renderAnalysisReport(currentLens.analysis);
    renderCuratedProjects();

    // Show results section
    resultsContainer?.classList.remove('sr-only');
    resultsContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    await updatePublishPreview();
    setLiveStatus('Analysis complete. Lens created with tailored evidence.');
    showToast('✓ Analysis complete! Review and adjust framing below.');
  } catch (err) {
    console.error('Analysis failed:', err);
    showToast('Analysis error occurred. Falling back to default.');
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze & Form Lens';
  }
});

// Initialize empty or restore from URL if present
async function initStudio() {
  const params = new URLSearchParams(window.location.search);
  const customParam = params.get('c') || params.get('lens_data');
  if (customParam) {
    const restored = await decodeLensFromUrlParam(customParam);
    if (restored) {
      currentLens = restored;
      if (companyInput) companyInput.value = currentLens.analysis?.targetCompany || '';
      if (roleInput) roleInput.value = currentLens.analysis?.targetRole || '';
      if (heroEyebrowInput) heroEyebrowInput.value = currentLens.hero.eyebrow;
      if (heroTitleInput) heroTitleInput.value = currentLens.hero.title;
      if (heroLeadInput) heroLeadInput.value = currentLens.hero.lead;

      renderAnalysisReport(currentLens.analysis);
      renderCuratedProjects();
      resultsContainer?.classList.remove('sr-only');
      await updatePublishPreview();
      showToast('✓ Restored existing Lens configuration from URL');
    }
  }
}

initStudio();
