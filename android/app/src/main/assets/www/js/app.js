// ============================================
// INTELLI-CREDIT — Application Controller
// Part 1: Navigation, Dashboard, State
// ============================================

let currentPage = 'dashboard';
let currentStep = 1;
let assessmentData = {};
let currentCompanyId = null;
let scoreResult = null;
let auditLog = [];

// Detect if we're served by Flask (http:) or opened as file
const isBackendAvailable = window.location.protocol.startsWith('http');

// ---- Navigation ----
function navigateTo(page, companyId) {
  currentPage = page;
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  const titles = { dashboard: 'Dashboard', assessment: 'New Credit Assessment', audit: 'Audit Trail' };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
  document.getElementById('breadcrumb').textContent = 'Home / ' + (titles[page] || 'Dashboard');

  if (page === 'dashboard') renderDashboard();
  else if (page === 'assessment') { if (companyId) loadCompanyForAssessment(companyId); renderWizard(); }
  else if (page === 'audit') renderAuditTrail();
  window.scrollTo(0, 0);
}

async function handleSearch(query) {
  if (isBackendAvailable) {
    const results = await API.searchCompanies(query);
    renderCasesTableFromAPI(results);
  } else {
    if (!query) { renderCasesTable(DEMO_COMPANIES); return; }
    const q = query.toLowerCase();
    const results = DEMO_COMPANIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.gstin.toLowerCase().includes(q) || c.cin.toLowerCase().includes(q)
    );
    renderCasesTable(results);
  }
}

async function filterCases(filter) {
  if (isBackendAvailable) {
    const results = await API.searchCompanies('', filter);
    renderCasesTableFromAPI(results);
  } else {
    if (filter === 'all') renderCasesTable(DEMO_COMPANIES);
    else renderCasesTable(DEMO_COMPANIES.filter(c => c.decision === filter));
  }
}

// ---- Dashboard ----
async function renderDashboard() {
  let stats;
  if (isBackendAvailable) {
    stats = await API.getStats();
  } else {
    stats = getDashboardStats();
  }
  document.getElementById('kpiGrid').innerHTML = `
    <div class="card kpi-card blue">
      <div class="card-header"><div class="card-icon blue">📊</div></div>
      <div class="card-value">${stats.total}</div>
      <p class="card-subtitle">Total Assessments</p>
      <span class="kpi-trend up">↑ Active portfolio</span>
    </div>
    <div class="card kpi-card green">
      <div class="card-header"><div class="card-icon green">✓</div></div>
      <div class="card-value">${stats.approved}/${stats.rejected}</div>
      <p class="card-subtitle">Approved / Rejected</p>
      <span class="kpi-trend up">${((stats.approved / stats.total) * 100).toFixed(0)}% approval rate</span>
    </div>
    <div class="card kpi-card teal">
      <div class="card-header"><div class="card-icon teal">⊘</div></div>
      <div class="card-value">${stats.avgScore}</div>
      <p class="card-subtitle">Avg Risk Score</p>
      <span class="kpi-trend ${stats.avgScore >= 50 ? 'up' : 'down'}">${stats.avgScore >= 50 ? 'Moderate' : 'High'} risk</span>
    </div>
    <div class="card kpi-card red">
      <div class="card-header"><div class="card-icon red">⚠</div></div>
      <div class="card-value">${stats.fraudAlerts}</div>
      <p class="card-subtitle">Fraud Alerts</p>
      <span class="kpi-trend down">${stats.fraudAlerts} flags detected</span>
    </div>`;

  if (isBackendAvailable) {
    const companies = await API.getCompanies();
    renderCasesTableFromAPI(companies);
  } else {
    renderCasesTable(DEMO_COMPANIES);
  }
}

function renderCasesTable(companies) {
  const tbody = document.getElementById('casesBody');
  tbody.innerHTML = companies.map(c => {
    const sc = getScoreClass(c.score);
    const dc = getDecisionClass(c.decision);
    const colors = { low: '#00d09c', medium: '#f5a623', high: '#eb5757', critical: '#c0392b' };
    const fraudCount = c.gstData.mismatchFlags.length;
    const updated = new Date(c.lastUpdated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `<tr onclick="navigateTo('assessment','${c.id}')">
      <td><div class="company-cell">
        <div class="company-avatar" style="background:${colors[sc]}22;color:${colors[sc]}">${c.name.charAt(0)}</div>
        <div><div class="company-name">${c.name}</div><div class="company-sector">${c.sector}</div></div>
      </div></td>
      <td><span class="score-badge ${sc}">${c.score}</span></td>
      <td><span class="badge ${dc}">${c.decision === 'Approve' ? '✓ ' : '✕ '}${c.decision}</span></td>
      <td>${formatCurrency(c.requestedAmount)}</td>
      <td style="color:${c.recommendedLimit > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${formatCurrency(c.recommendedLimit)}</td>
      <td>${fraudCount > 0 ? `<span class="badge ${fraudCount > 3 ? 'critical' : 'medium'}">${fraudCount} flags</span>` : '<span style="color:var(--text-light)">None</span>'}</td>
      <td style="color:var(--text-muted);font-size:var(--font-xs)">${updated}</td>
      <td><button class="btn btn-ghost btn-sm">View →</button></td>
    </tr>`;
  }).join('');
}

function renderCasesTableFromAPI(companies) {
  const tbody = document.getElementById('casesBody');
  tbody.innerHTML = companies.map(c => {
    const sc = getScoreClass(c.score);
    const dc = getDecisionClass(c.decision);
    const colors = { low: '#00d09c', medium: '#f5a623', high: '#eb5757', critical: '#c0392b' };
    const fraudCount = c.fraudAlertCount || 0;
    const updated = new Date(c.lastUpdated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `<tr onclick="navigateTo('assessment','${c.id}')">
      <td><div class="company-cell">
        <div class="company-avatar" style="background:${colors[sc]}22;color:${colors[sc]}">${c.name.charAt(0)}</div>
        <div><div class="company-name">${c.name}</div><div class="company-sector">${c.sector}</div></div>
      </div></td>
      <td><span class="score-badge ${sc}">${c.score}</span></td>
      <td><span class="badge ${dc}">${c.decision === 'Approve' ? '✓ ' : '✕ '}${c.decision}</span></td>
      <td>${formatCurrency(c.requestedAmount)}</td>
      <td style="color:${c.recommendedLimit > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${formatCurrency(c.recommendedLimit)}</td>
      <td>${fraudCount > 0 ? `<span class="badge ${fraudCount > 3 ? 'critical' : 'medium'}">${fraudCount} flags</span>` : '<span style="color:var(--text-light)">None</span>'}</td>
      <td style="color:var(--text-muted);font-size:var(--font-xs)">${updated}</td>
      <td><button class="btn btn-ghost btn-sm">View →</button></td>
    </tr>`;
  }).join('');
}

// ---- Load company into assessment ----
async function loadCompanyForAssessment(id) {
  let company;
  if (isBackendAvailable) {
    company = await API.getCompany(id);
  } else {
    company = getCompanyById(id);
  }
  if (!company) return;
  currentCompanyId = id;
  // Cache full company data for local access in other steps
  window._currentCompany = company;
  assessmentData = {
    companyName: company.name, cin: company.cin, gstin: company.gstin,
    sector: company.sector, promoters: Array.isArray(company.promoters) ? company.promoters.join(', ') : company.promoters,
    loanAmount: company.requestedAmount
  };
  currentStep = 3; // Jump to extracted data review
  addAuditEntry('Data Ingestor Agent', 'Company data loaded', `Loaded financials for ${company.name}`);
}

// ---- Wizard ----
const WIZARD_STEPS = [
  { num: 1, label: 'Company Details' },
  { num: 2, label: 'Upload Docs' },
  { num: 3, label: 'Review Data' },
  { num: 4, label: 'Risk Analysis' },
  { num: 5, label: 'Officer Input' },
  { num: 6, label: 'Decision' }
];

function renderWizard() {
  // Step indicators
  document.getElementById('wizardSteps').innerHTML = WIZARD_STEPS.map((s, i) => {
    const cls = s.num < currentStep ? 'completed' : s.num === currentStep ? 'active' : '';
    const conn = i < WIZARD_STEPS.length - 1 ? `<div class="wizard-step-connector ${s.num < currentStep ? 'completed' : ''}"></div>` : '';
    return `<div class="wizard-step ${cls}" onclick="goToStep(${s.num})">
      <div class="wizard-step-number">${s.num < currentStep ? '✓' : s.num}</div>
      <span class="wizard-step-label">${s.label}</span>
    </div>${conn}`;
  }).join('');

  // Step content
  const body = document.getElementById('wizardBody');
  switch (currentStep) {
    case 1: renderStep1(body); break;
    case 2: renderStep2(body); break;
    case 3: renderStep3(body); break;
    case 4: renderStep4(body); break;
    case 5: renderStep5(body); break;
    case 6: renderStep6(body); break;
  }
}

function goToStep(step) {
  if (step <= currentStep) { currentStep = step; renderWizard(); }
}

function nextStep() {
  if (currentStep === 1) {
    assessmentData.companyName = document.getElementById('companyName')?.value || 'ABC Pvt Ltd';
    assessmentData.cin = document.getElementById('cinInput')?.value || 'U27100MH2020PTC345678';
    assessmentData.gstin = document.getElementById('gstinInput')?.value || '27AABCB1234A1Z5';
    assessmentData.sector = document.getElementById('sectorInput')?.value || 'Manufacturing';
    assessmentData.promoters = document.getElementById('promoterInput')?.value || 'Mr. X';
    assessmentData.loanAmount = parseFloat(document.getElementById('loanAmount')?.value || 100000000);
    if (!currentCompanyId) currentCompanyId = 'bharat-steel';
    addAuditEntry('System', 'Company details submitted', `${assessmentData.companyName}`);
  }
  if (currentStep < 6) { currentStep++; renderWizard(); }
}

function prevStep() {
  if (currentStep > 1) { currentStep--; renderWizard(); }
}

// ---- Step 1: Company Details ----
function renderStep1(container) {
  container.innerHTML = `
    <div class="card">
      <h2 style="color:var(--text-primary);margin-bottom:var(--space-6)">Company Information</h2>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Company Name *</label>
          <input class="form-input" id="companyName" placeholder="e.g., Bharat Steel Industries Pvt Ltd" value="${assessmentData.companyName || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">CIN</label>
          <input class="form-input" id="cinInput" placeholder="U27100MH2012PTC234567" value="${assessmentData.cin || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">GSTIN *</label>
          <input class="form-input" id="gstinInput" placeholder="27AABCB1234A1Z5" value="${assessmentData.gstin || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Sector</label>
          <select class="form-select" id="sectorInput">
            <option value="Manufacturing">Manufacturing</option>
            <option value="IT Services">IT Services</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Textiles">Textiles</option>
            <option value="NBFC">NBFC</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Promoter Name(s)</label>
          <input class="form-input" id="promoterInput" placeholder="Comma-separated" value="${assessmentData.promoters || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Requested Loan Amount (₹)</label>
          <input class="form-input" id="loanAmount" type="number" placeholder="250000000" value="${assessmentData.loanAmount || ''}">
        </div>
      </div>
    </div>
    <div class="wizard-actions">
      <div></div>
      <button class="btn btn-primary" onclick="nextStep()">Proceed to Upload Documents →</button>
    </div>`;
}

// ---- Step 2: Document Upload ----
function renderStep2(container) {
  container.innerHTML = `
    <div class="card">
      <h2 style="color:var(--text-primary);margin-bottom:var(--space-6)">Document Upload Center</h2>
      <div class="upload-zone" id="uploadZone" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="handleDrop(event)">
        <div class="upload-icon">📄</div>
        <h3>Drag & drop documents here</h3>
        <p>Annual Reports, Bank Statements, GST Returns, Sanction Letters, Rating Reports</p>
        <p style="margin-top:var(--space-4)"><button class="btn btn-secondary" onclick="simulateUpload()">Or click to simulate upload</button></p>
      </div>
      <div class="upload-file-list" id="uploadFileList"></div>
    </div>
    <div class="wizard-actions">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-primary" onclick="simulateUpload();setTimeout(()=>nextStep(),1500)">Upload & Extract Data →</button>
    </div>`;
}

function handleDrop(e) { e.preventDefault(); e.target.classList.remove('dragover'); simulateUpload(); }

function simulateUpload() {
  const files = [
    { name: 'Annual_Report_FY2026.pdf', size: '4.2 MB', type: 'Annual Report' },
    { name: 'Bank_Statement_SBI.pdf', size: '1.8 MB', type: 'Bank Statement' },
    { name: 'GSTR_3B_FY2026.csv', size: '245 KB', type: 'GST Returns' },
    { name: 'Sanction_Letter.pdf', size: '890 KB', type: 'Sanction Letter' },
    { name: 'CRISIL_Rating_Report.pdf', size: '1.1 MB', type: 'Credit Rating' }
  ];
  const list = document.getElementById('uploadFileList');
  list.innerHTML = '';
  files.forEach((f, i) => {
    setTimeout(() => {
      list.innerHTML += `<div class="upload-file-item">
        <span class="file-icon">📎</span>
        <div class="file-info"><div class="file-name">${f.name}</div><div class="file-size">${f.size} · ${f.type}</div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:100%"></div></div>
        </div>
        <span class="file-status success">✓ OCR Complete</span>
      </div>`;
      addAuditEntry('Data Ingestor Agent', `Processed: ${f.name}`, `OCR extraction completed — ${f.type}`);
    }, i * 300);
  });
}

// ---- Step 3: Extracted Data Review ----
async function renderStep3(container) {
  let company;
  if (isBackendAvailable) {
    company = window._currentCompany || await API.getCompany(currentCompanyId || 'bharat-steel');
    window._currentCompany = company;
  } else {
    company = getCompanyById(currentCompanyId || 'bharat-steel');
  }
  const f = company.financials;
  const r = company.ratios;

  let tableRows = '';
  const items = [
    ['Revenue', f.revenue], ['EBITDA', f.ebitda], ['PAT', f.pat],
    ['Net Worth', f.netWorth], ['Total Debt', f.totalDebt],
    ['Current Assets', f.currentAssets], ['Current Liabilities', f.currentLiabilities]
  ];
  items.forEach(([label, data]) => {
    tableRows += `<tr><td>${label}</td>${data.map(v => `<td class="editable">${v.toLocaleString('en-IN')}</td>`).join('')}</tr>`;
  });

  let ratioRows = '';
  const ratioItems = [
    ['Current Ratio', r.currentRatio], ['Debt/Equity', r.debtEquity],
    ['DSCR', r.dscr], ['Interest Coverage', r.interestCoverage],
    ['ROE (%)', r.roe]
  ];
  ratioItems.forEach(([label, data]) => {
    ratioRows += `<tr><td>${label}</td>${data.map(v => `<td>${v.toFixed(2)}</td>`).join('')}</tr>`;
  });

  const confItems = [
    ['Financial Statements', 94], ['Entity Recognition', 91], ['Litigation Clauses', 87],
    ['Loan Covenants', 89], ['Contingent Liabilities', 82]
  ];

  const promoters = Array.isArray(company.promoters) ? company.promoters.join(', ') : company.promoters;
  const sanctions = Array.isArray(company.sanctions) ? company.sanctions.join('; ') : (company.sanctions || 'N/A');
  const litigation = company.litigation || [];

  container.innerHTML = `
    <div class="split-screen">
      <div class="split-panel">
        <div class="split-panel-header"><h3>Extracted Financial Data (₹ Lakhs)</h3><span class="badge low">Editable</span></div>
        <div class="split-panel-body">
          <table class="financial-table"><thead><tr><th>Metric</th>${f.years.map(y => `<th>${y}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
          <h4 style="color:var(--text-primary);margin:var(--space-5) 0 var(--space-3)">Key Ratios</h4>
          <table class="financial-table"><thead><tr><th>Ratio</th>${f.years.map(y => `<th>${y}</th>`).join('')}</tr></thead><tbody>${ratioRows}</tbody></table>
        </div>
      </div>
      <div class="split-panel">
        <div class="split-panel-header"><h3>Extraction Confidence</h3></div>
        <div class="split-panel-body">
          ${confItems.map(([label, conf]) => {
    const color = conf >= 90 ? 'var(--risk-low)' : conf >= 80 ? 'var(--risk-medium)' : 'var(--risk-high)';
    return `<div style="margin-bottom:var(--space-4)">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:var(--font-sm);color:var(--text-secondary)">${label}</span><span class="confidence-value" style="color:${color}">${conf}%</span></div>
              <div class="confidence-level" style="width:100%"><div class="confidence-level-fill" style="width:${conf}%;background:${color}"></div></div>
            </div>`;
  }).join('')}
          <div style="margin-top:var(--space-6);padding:var(--space-4);background:var(--bg-body);border:1px solid var(--border-light);border-radius:var(--radius-md)">
            <h4 style="color:var(--text-primary);margin-bottom:var(--space-3);font-size:var(--font-sm)">Detected Entities</h4>
            <div style="font-size:var(--font-xs);color:var(--text-muted)">
              <p>• <strong>GSTIN:</strong> ${company.gstin}</p>
              <p>• <strong>CIN:</strong> ${company.cin}</p>
              <p>• <strong>Promoters:</strong> ${promoters}</p>
              <p>• <strong>Rating:</strong> ${company.creditRating} (${company.ratingAgency})</p>
              <p>• <strong>Covenants:</strong> ${sanctions}</p>
            </div>
          </div>
          ${litigation.length > 0 ? `<div style="margin-top:var(--space-4);padding:var(--space-4);background:var(--risk-high-bg);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md)">
            <h4 style="color:var(--risk-high);font-size:var(--font-sm);margin-bottom:var(--space-2)">⚠ Litigation Clauses Detected</h4>
            ${litigation.slice(0, 2).map(l => `<p style="font-size:var(--font-xs);color:var(--text-muted)">${l.type} — ${l.court} (${l.status})</p>`).join('')}
          </div>` : ''}
        </div>
      </div>
    </div>
    <div class="wizard-actions">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-primary" onclick="runAnalysis()">Run Reconciliation & Research →</button>
    </div>`;
  addAuditEntry('Data Ingestor Agent', 'Extraction complete', `Financial data parsed with avg 89% confidence`);
}

function runAnalysis() {
  addAuditEntry('GST Reconciliation Agent', 'Reconciliation started', 'Comparing GSTR-2A vs 3B vs bank inflows');
  addAuditEntry('Research Agent', 'Research crawl initiated', 'Scanning MCA, eCourts, RBI, news sources');
  nextStep();
}

// Continue in app.js Part 2 below...
