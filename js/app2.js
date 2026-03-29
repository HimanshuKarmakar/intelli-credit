// ============================================
// INTELLI-CREDIT — App Part 2
// Steps 4-6, Audit, Explainability, Charts
// ============================================

// ---- Step 4: Risk Intelligence Dashboard ----
// ---- Step 4: Risk Intelligence Dashboard ----
async function renderStep4(container) {
  const company = getCompanyById(currentCompanyId || 'bharat-steel');
  if (typeof showLoading === 'function') showLoading('Running risk analysis...');

  if (isBackendAvailable) {
    scoreResult = await API.getScore(currentCompanyId || 'bharat-steel');
    var recon = await API.getReconciliation(currentCompanyId || 'bharat-steel');
  } else {
    scoreResult = calculateFullScore(company);
    var recon = performReconciliation(company);
  }
  if (typeof hideLoading === 'function') hideLoading();
  const bd = scoreResult.breakdown;

  const cardConfigs = [
    { idx: 0, color: '--accent-blue', barColor: '#2563eb' },
    { idx: 1, color: '--risk-high', barColor: '#ef4444' },
    { idx: 2, color: '--accent-purple', barColor: '#7c3aed' },
    { idx: 3, color: '--accent-teal', barColor: '#0d9488' }
  ];

  let cardsHtml = bd.slice(0, 4).map((b, i) => {
    const cfg = cardConfigs[i];
    const sc = getScoreClass(b.rawScore);
    const color = getRiskColor(sc);
    return `<div class="risk-card">
      <div class="risk-card-header">
        <div><span style="font-size:20px">${b.icon}</span><div class="risk-card-title">${b.label}</div></div>
        <span class="badge ${sc}">Weight: ${(b.weight * 100)}%</span>
      </div>
      <div class="risk-card-score" style="color:${color}">${b.rawScore}<span style="font-size:var(--font-sm);color:var(--text-muted)">/100</span></div>
      <div class="risk-card-body">
        <div class="risk-card-bar"><div class="risk-card-bar-fill" style="width:${b.rawScore}%;background:${color}"></div></div>
        ${b.evidence.slice(0, 3).map(e => `<div class="risk-evidence-item">
          <span class="evidence-tag">${e.factor}</span>
          <span>${e.detail}</span>
          <span style="color:${parseInt(e.impact) > 0 ? 'var(--risk-low)' : 'var(--risk-high)'};font-weight:700;margin-left:auto">${e.impact}</span>
        </div>`).join('')}
        <button class="btn btn-ghost btn-sm" style="margin-top:var(--space-2);width:100%" onclick="showComponentDetail('${b.key}')">Why this score? ↓</button>
      </div>
    </div>`;
  }).join('');

  // GST Heatmap
  let heatmapHtml = '';
  if (recon.table) {
    heatmapHtml = `<div style="margin-top:var(--space-6)"><div class="card">
      <h3 style="color:var(--text-primary);margin-bottom:var(--space-4)">GST Reconciliation Heatmap</h3>
      <p style="font-size:var(--font-xs);color:var(--text-muted);margin-bottom:var(--space-4)">Monthly GSTR-3B vs GSTR-2A vs Bank Inflows — Fraud Score: <strong style="color:${recon.fraudScore > 50 ? 'var(--risk-high)' : 'var(--risk-low)'}">${recon.fraudScore}/100</strong></p>
      <div class="table-container"><table class="financial-table"><thead><tr><th>Month</th><th>GSTR-3B</th><th>GSTR-2A</th><th>Bank</th><th>ITC Gap%</th><th>Bank Gap%</th><th>Flags</th></tr></thead><tbody>
      ${recon.table.map(r => {
      const rowColor = r.fraudScore > 20 ? 'var(--risk-high-bg)' : r.fraudScore > 10 ? 'var(--risk-medium-bg)' : '';
      return `<tr style="background:${rowColor}">
          <td>${r.month}</td><td>${r.gstr3b}</td><td>${r.gstr2a}</td><td>${r.bankInflows}</td>
          <td style="color:${Math.abs(parseFloat(r.itcMismatchPct)) > 10 ? 'var(--risk-high)' : 'var(--text-muted)'}">${r.itcMismatchPct}%</td>
          <td style="color:${parseFloat(r.bankGapPct) > 15 ? 'var(--risk-high)' : 'var(--text-muted)'}">${r.bankGapPct}%</td>
          <td>${r.flags.length > 0 ? r.flags.map(f => `<span class="badge ${f.severity}" style="margin:1px">${f.type}</span>`).join('') : '—'}</td>
        </tr>`;
    }).join('')}
      </tbody></table></div>
    </div></div>`;
  }

  // Score bar chart (SVG)
  const chartHtml = `<div class="card" style="margin-top:var(--space-6)">
    <h3 style="color:var(--text-primary);margin-bottom:var(--space-4)">Score Contribution Breakdown</h3>
    <svg width="100%" height="200" viewBox="0 0 600 200" class="bar-chart-svg">
      ${bd.map((b, i) => {
    const x = i * 100 + 10;
    const barH = b.rawScore * 1.5;
    const color = getRiskColor(getScoreClass(b.rawScore));
    return `<g>
          <rect x="${x}" y="${150 - barH}" width="60" height="${barH}" rx="4" fill="${color}" opacity="0.8"/>
          <text x="${x + 30}" y="${150 - barH - 8}" text-anchor="middle" fill="${color}" font-size="12" font-weight="700">${b.rawScore}</text>
          <text x="${x + 30}" y="170" text-anchor="middle" fill="#7c7e8c" font-size="9">${b.label.split(' ')[0]}</text>
          <text x="${x + 30}" y="185" text-anchor="middle" fill="#a1a3b0" font-size="8">${(b.weight * 100)}%</text>
        </g>`;
  }).join('')}
      <line x1="0" y1="150" x2="600" y2="150" stroke="#e8eaed" stroke-width="1"/>
    </svg>
  </div>`;

  container.innerHTML = `
    <div class="risk-cards-grid">${cardsHtml}</div>
    ${chartHtml}
    ${heatmapHtml}
    <div class="wizard-actions">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-primary" onclick="nextStep()">Add Qualitative Input →</button>
    </div>`;

  updateExplainabilityDrawer();
  addAuditEntry('Recommendation Engine', 'Risk analysis complete', `Preliminary score: ${scoreResult.finalScore}/100`);
  if (typeof showToast === 'function') showToast(`Risk analysis complete — Score: ${scoreResult.finalScore}/100`, scoreResult.finalScore >= 50 ? 'success' : 'warning');
}

function showComponentDetail(key) {
  toggleExplainabilityDrawer();
}

// ---- Step 5: Qualitative Input ----
async function renderStep5(container) {
  let company;
  if (isBackendAvailable) {
    company = window._currentCompany || await API.getCompany(currentCompanyId || 'bharat-steel');
    window._currentCompany = company;
  } else {
    company = getCompanyById(currentCompanyId || 'bharat-steel');
  }

  container.innerHTML = `
    <div class="card">
      <h2 style="color:var(--text-primary);margin-bottom:var(--space-2)">Credit Officer Observations</h2>
      <p style="color:var(--text-muted);margin-bottom:var(--space-6);font-size:var(--font-sm)">Enter qualitative notes — the system will convert them to quantified score adjustments in real time.</p>
      <div class="form-group">
        <label class="form-label">Officer Notes</label>
        <textarea class="form-textarea" id="qualNotes" rows="5" placeholder="e.g., Factory operating at 40% capacity; delayed vendor payments; strong order pipeline from government..."
          oninput="updateQualitativeImpact(this.value)">${company.qualitativeNotes || ''}</textarea>
        <p class="form-hint">Keywords detected: capacity, delay, vendor, dispute, fraud, expansion, order, technology</p>
      </div>
      <div id="impactPreview" class="impact-preview" style="display:none"></div>
      <div style="margin-top:var(--space-6);padding:var(--space-5);background:var(--bg-body);border-radius:var(--radius-md);border:1px solid var(--border-light)">
        <h4 style="color:var(--text-primary);font-size:var(--font-sm);margin-bottom:var(--space-3)">Current Score: <span id="currentScoreDisplay" style="color:${getRiskColor(scoreResult?.riskLevel || 'medium')}">${scoreResult?.finalScore || '—'}</span>/100</h4>
        <p style="font-size:var(--font-xs);color:var(--text-muted)">Score will update dynamically as you type observations.</p>
        <div id="scoreDelta" style="margin-top:var(--space-3)"></div>
      </div>
    </div>
    <div class="wizard-actions">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-primary" onclick="finalizeScore()">View Final Decision →</button>
    </div>`;
}

async function updateQualitativeImpact(text) {
  let company;
  if (isBackendAvailable) {
    company = window._currentCompany || await API.getCompany(currentCompanyId || 'bharat-steel');
  } else {
    company = getCompanyById(currentCompanyId || 'bharat-steel');
  }
  company.qualitativeNotes = text;
  const oldScore = scoreResult?.finalScore || 50;

  if (isBackendAvailable) {
    scoreResult = await API.getScore(currentCompanyId || 'bharat-steel', text);
  } else {
    scoreResult = calculateFullScore(company);
  }
  const newScore = scoreResult.finalScore;
  const delta = newScore - oldScore;
  const qualComp = scoreResult.breakdown.find(b => b.key === 'qualitative');

  const preview = document.getElementById('impactPreview');
  if (qualComp && qualComp.evidence.length > 0 && qualComp.evidence[0].factor !== 'Officer Notes') {
    preview.style.display = 'block';
    preview.innerHTML = `<h4 style="color:var(--text-primary);font-size:var(--font-sm);margin-bottom:var(--space-3)">Detected Adjustments</h4>
      ${qualComp.evidence.map(e => `<div class="impact-item">
        <span class="impact-text">${e.factor}</span>
        <span class="impact-delta ${parseInt(e.impact) < 0 ? 'negative' : 'positive'}">${e.impact} pts</span>
      </div>`).join('')}`;
  } else { preview.style.display = 'none'; }

  document.getElementById('currentScoreDisplay').textContent = newScore;
  document.getElementById('currentScoreDisplay').style.color = getRiskColor(scoreResult.riskLevel);

  const deltaEl = document.getElementById('scoreDelta');
  if (delta !== 0) {
    deltaEl.innerHTML = `<span style="font-size:var(--font-sm);font-weight:700;color:${delta > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
      ${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)} points from officer input</span>`;
  } else { deltaEl.innerHTML = ''; }

  updateExplainabilityDrawer();
}

async function finalizeScore() {
  if (typeof showLoading === 'function') showLoading('Calculating final score...');
  const company = getCompanyById(currentCompanyId || 'bharat-steel');
  if (isBackendAvailable) {
    scoreResult = await API.getScore(currentCompanyId || 'bharat-steel', company.qualitativeNotes || '');
  } else {
    scoreResult = calculateFullScore(company);
  }
  if (typeof hideLoading === 'function') hideLoading();
  addAuditEntry('Primary Insight Converter', 'Qualitative input processed', `Officer notes converted to score adjustments`);
  addAuditEntry('Recommendation Engine', 'Final score calculated', `Score: ${scoreResult.finalScore}/100 — Decision: ${scoreResult.decision}`);
  nextStep();
}

// ---- Step 6: Final Decision ----
async function renderStep6(container) {
  if (!scoreResult) {
    const company = getCompanyById(currentCompanyId || 'bharat-steel');
    if (isBackendAvailable) {
      scoreResult = await API.getScore(currentCompanyId || 'bharat-steel');
    } else {
      scoreResult = calculateFullScore(company);
    }
  }
  const s = scoreResult;
  const sc = s.riskLevel;
  const color = getRiskColor(sc);

  const reasons = s.decision === 'Reject' ? s.topNegativeReasons : [...s.topPositiveReasons, ...s.topNegativeReasons].slice(0, 5);

  container.innerHTML = `
    <div class="score-display">
      <div class="score-circle" style="background:${color}15;border:3px solid ${color}">
        <span class="score-number" style="color:${color}">${s.finalScore}</span>
        <span class="score-label">Risk Score</span>
      </div>
      <div class="decision-badge ${s.decision === 'Approve' ? 'approved' : 'rejected'}">
        ${s.decision === 'Approve' ? '✓' : '✕'} ${s.decision === 'Approve' ? 'APPROVED' : 'REJECTED'}
      </div>
    </div>

    <div class="decision-grid">
      <div class="decision-metric">
        <div class="metric-label">Recommended Limit</div>
        <div class="metric-value" style="color:${s.recommendedLimit > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${formatCurrency(s.recommendedLimit)}</div>
      </div>
      <div class="decision-metric">
        <div class="metric-label">Interest Rate</div>
        <div class="metric-value">${s.interestRate ? s.interestRate.toFixed(2) + '%' : 'N/A'}</div>
      </div>
      <div class="decision-metric">
        <div class="metric-label">Risk Premium</div>
        <div class="metric-value">${s.riskPremium ? s.riskPremium.toFixed(2) + '%' : 'N/A'}</div>
      </div>
    </div>

    ${s.interestRate ? `<div class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);font-size:var(--font-xs);color:var(--text-muted)">
      <strong style="color:var(--text-secondary)">Formula:</strong> Interest Rate (${s.interestRate.toFixed(2)}%) = Base Rate (${s.baseRate}%) + Risk Premium (${s.riskPremium.toFixed(2)}%) | 
      Limit = min(DSCR-based, Collateral 70%, Exposure Cap)
    </div>` : ''}

    <div class="card">
      <h3 style="color:var(--text-primary);margin-bottom:var(--space-4)">Top Reasons for Decision</h3>
      ${reasons.map((r, i) => `<div class="reason-card">
        <div class="reason-number">${i + 1}</div>
        <div class="reason-content">
          <div class="reason-text">${r.factor}: ${r.detail}</div>
          <div class="reason-meta">
            <span class="score-impact">${r.impact} pts</span>
            <span style="color:var(--text-muted)">Component: ${r.component}</span>
            ${r.url ? `<span class="evidence-link" onclick="window.open('${r.url}')">View Evidence ↗</span>` : ''}
          </div>
        </div>
      </div>`).join('')}
    </div>

    <div style="display:flex;gap:var(--space-4);margin-top:var(--space-6);flex-wrap:wrap">
      <button class="btn btn-primary btn-lg" onclick="generateCAM()">📄 Generate CAM (PDF)</button>
      <button class="btn btn-secondary btn-lg" onclick="toggleExplainabilityDrawer()">🔍 View Full Explainability</button>
      <button class="btn btn-ghost btn-lg" onclick="navigateTo('audit')">📋 Audit Trail</button>
    </div>

    <div class="wizard-actions">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-success" onclick="showToast('Assessment finalized', 'success'); navigateTo('dashboard')">✓ Finalize & Return to Dashboard</button>
    </div>`;

  // Confetti for approvals, shake for rejections
  if (s.decision === 'Approve' && typeof showConfetti === 'function') {
    setTimeout(() => showConfetti(), 500);
  } else if (s.decision === 'Reject') {
    const badge = container.querySelector('.decision-badge');
    if (badge) setTimeout(() => badge.classList.add('shake-animation'), 400);
  }
}

// ---- CAM Generator ----
async function generateCAM() {
  if (isBackendAvailable) {
    if (typeof showLoading === 'function') showLoading('Generating CAM document...');
    const data = await API.generateCAM(currentCompanyId || 'bharat-steel');
    if (typeof hideLoading === 'function') hideLoading();
    const blob = new Blob([data.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename;
    a.click();
    URL.revokeObjectURL(url);
    addAuditEntry('CAM Generator', 'CAM document generated', `Five Cs document downloaded from server`);
    if (typeof showToast === 'function') showToast('CAM document downloaded successfully!', 'success');
    return;
  }

  // Fallback: local generation
  const company = getCompanyById(currentCompanyId || 'bharat-steel');
  if (!scoreResult) scoreResult = calculateFullScore(company);
  const s = scoreResult;
  const f = company.financials;
  const r = company.ratios;

  let camContent = `CREDIT APPRAISAL MEMORANDUM (CAM)\n${'='.repeat(50)}\n`;
  camContent += `\nCompany: ${company.name}\nCIN: ${company.cin}  |  GSTIN: ${company.gstin}\nSector: ${company.sector}\nPromoters: ${company.promoters.join(', ')}\nDate: ${new Date().toLocaleDateString('en-IN')}\n`;
  camContent += `\n${'─'.repeat(50)}\nEXECUTIVE SUMMARY\n${'─'.repeat(50)}\n`;
  camContent += `\nRisk Score: ${s.finalScore}/100  |  Decision: ${s.decision}\nRecommended Limit: ${formatCurrency(s.recommendedLimit)}\n`;
  camContent += s.interestRate ? `Interest Rate: ${s.interestRate.toFixed(2)}% (Base ${s.baseRate}% + Premium ${s.riskPremium.toFixed(2)}%)\n` : '';

  camContent += `\n${'─'.repeat(50)}\n1. CHARACTER (Promoter Assessment)\n${'─'.repeat(50)}\n`;
  camContent += `Promoters: ${company.promoters.join(', ')}\nCredit Rating: ${company.creditRating} (${company.ratingAgency})\n`;
  camContent += `Litigation: ${company.litigation.length} active case(s)\n`;
  company.litigation.forEach(l => { camContent += `  - ${l.type} at ${l.court}: ${formatCurrency(l.amount)} (${l.status})\n`; });

  camContent += `\n${'─'.repeat(50)}\n2. CAPACITY (Repayment Ability)\n${'─'.repeat(50)}\n`;
  camContent += `Revenue (${f.years[f.years.length - 1]}): ${formatLakhs(f.revenue[f.revenue.length - 1])}\nDSCR: ${r.dscr[r.dscr.length - 1].toFixed(2)}x\nInterest Coverage: ${r.interestCoverage[r.interestCoverage.length - 1].toFixed(2)}x\n`;

  camContent += `\n${'─'.repeat(50)}\n3. CAPITAL (Net Worth & Leverage)\n${'─'.repeat(50)}\n`;
  camContent += `Net Worth: ${formatLakhs(f.netWorth[f.netWorth.length - 1])}\nDebt/Equity: ${r.debtEquity[r.debtEquity.length - 1].toFixed(2)}x\n`;

  camContent += `\n${'─'.repeat(50)}\n4. COLLATERAL\n${'─'.repeat(50)}\n`;
  camContent += `Type: ${company.collateral.type}\nValue: ${formatCurrency(company.collateral.value)}\nCoverage: ${company.collateral.coverage.toFixed(2)}x\n`;

  camContent += `\n${'─'.repeat(50)}\n5. CONDITIONS (Market & Regulatory)\n${'─'.repeat(50)}\n`;
  company.research.forEach(re => { camContent += `  [${re.riskType.toUpperCase()}] ${re.title} (${re.source})\n`; });

  camContent += `\n${'─'.repeat(50)}\nSCORING BREAKDOWN\n${'─'.repeat(50)}\n`;
  s.breakdown.forEach(b => { camContent += `${b.label}: ${b.rawScore}/100 (Weight: ${(b.weight * 100)}%, Contribution: ${b.weightedScore.toFixed(1)})\n`; });

  camContent += `\n${'─'.repeat(50)}\nFINAL RECOMMENDATION: ${s.decision.toUpperCase()}\n${'─'.repeat(50)}\n`;

  const blob = new Blob([camContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CAM_${company.name.replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  addAuditEntry('CAM Generator', 'CAM document generated', `Five Cs document for ${company.name}`);
  if (typeof showToast === 'function') showToast('CAM document downloaded successfully!', 'success');
}

// ---- Explainability Drawer ----
function toggleExplainabilityDrawer() {
  document.getElementById('explainabilityDrawer').classList.toggle('open');
  document.getElementById('drawerOverlay').classList.toggle('open');
}

function updateExplainabilityDrawer() {
  if (!scoreResult) return;
  const body = document.getElementById('drawerBody');
  body.innerHTML = `
    <div style="text-align:center;padding:var(--space-4);margin-bottom:var(--space-4);background:var(--bg-body);border:1px solid var(--border-light);border-radius:var(--radius-md)">
      <div style="font-size:var(--font-3xl);font-weight:800;color:${getRiskColor(scoreResult.riskLevel)}">${scoreResult.finalScore}</div>
      <div style="font-size:var(--font-sm);color:var(--text-muted)">Final Risk Score</div>
      <span class="badge ${scoreResult.decision === 'Approve' ? 'approved' : 'rejected'}" style="margin-top:var(--space-2)">${scoreResult.decision}</span>
    </div>
    ${scoreResult.breakdown.map(b => `
      <div class="explain-component">
        <div class="explain-component-header" onclick="this.parentElement.querySelector('.explain-component-body').style.display=this.parentElement.querySelector('.explain-component-body').style.display==='none'?'block':'none'">
          <span class="explain-component-name">${b.icon} ${b.label}</span>
          <span class="explain-component-score" style="color:${getRiskColor(getScoreClass(b.rawScore))}">${b.rawScore}/100</span>
        </div>
        <div class="explain-component-body">
          <div class="explain-row"><span class="label">Weight</span><span class="value">${(b.weight * 100)}%</span></div>
          <div class="explain-row"><span class="label">Weighted Score</span><span class="value">${b.weightedScore.toFixed(1)}</span></div>
          <div class="explain-row"><span class="label">Confidence</span><span class="value">${b.confidence}%</span></div>
          <div style="margin-top:var(--space-3);border-top:1px solid var(--border-light);padding-top:var(--space-3)">
            ${b.evidence.map(e => `<div class="explain-row" style="flex-direction:column;gap:2px">
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary);font-weight:500">${e.factor}</span>
              <span style="color:${parseInt(e.impact) > 0 ? 'var(--risk-low)' : parseInt(e.impact) < 0 ? 'var(--risk-high)' : 'var(--text-muted)'};font-weight:700">${e.impact}</span></div>
              <span style="color:var(--text-muted)">${e.detail}</span>
              ${e.url ? `<a href="${e.url}" target="_blank" style="color:var(--brand-primary);font-size:10px">View Source ↗</a>` : ''}
            </div>`).join('')}
          </div>
        </div>
      </div>`).join('')}`;
}

// ---- Audit Trail ----
function addAuditEntry(agent, title, description, before, after) {
  auditLog.push({
    timestamp: new Date().toISOString(),
    agent, title, description, before, after
  });
  const badge = document.getElementById('auditBadge');
  if (badge) badge.textContent = auditLog.length;

  // Also POST to backend if available
  if (isBackendAvailable) {
    API.addAuditEntry(agent, title, description, before, after).catch(() => { });
  }
}

async function renderAuditTrail() {
  let entries = auditLog;

  // Merge backend audit log if available
  if (isBackendAvailable) {
    try {
      const backendLog = await API.getAuditLog();
      // Use backend log if it has more entries (it persists across page loads)
      if (backendLog.length > entries.length) {
        entries = backendLog;
      }
    } catch (e) { /* fallback to local */ }
  }

  const timeline = document.getElementById('auditTimeline');
  if (entries.length === 0) {
    timeline.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No audit entries yet</h3><p>Start a credit assessment to generate an audit trail.</p></div>';
    return;
  }
  timeline.innerHTML = entries.map((entry, i) => {
    const time = new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `<div class="audit-entry ${i < entries.length - 1 ? 'complete' : ''} stagger-item">
      <div class="audit-entry-header">
        <span class="audit-entry-time">${time}</span>
        <span class="audit-entry-agent">${entry.agent}</span>
      </div>
      <div class="audit-entry-content">
        <div class="audit-entry-title">${entry.title}</div>
        <div class="audit-entry-desc">${entry.description}</div>
        ${entry.before ? `<div class="audit-change"><span class="before">${entry.before}</span><span>→</span><span class="after">${entry.after}</span></div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  addAuditEntry('System', 'Application initialized', 'Intelli-Credit v1.0 loaded with 5 demo cases');
});
