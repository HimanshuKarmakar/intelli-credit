// ============================================
// INTELLI-CREDIT — API Client Layer
// Connects frontend to Flask backend
// ============================================

const API_BASE = '';  // Same origin when served by Flask

const API = {
    // --- Companies ---
    async getCompanies() {
        const res = await fetch(`${API_BASE}/api/companies`);
        return res.json();
    },

    async getCompany(id) {
        const res = await fetch(`${API_BASE}/api/companies/${id}`);
        return res.json();
    },

    async getStats() {
        const res = await fetch(`${API_BASE}/api/stats`);
        return res.json();
    },

    async searchCompanies(query = '', filter = 'all') {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (filter && filter !== 'all') params.set('filter', filter);
        const res = await fetch(`${API_BASE}/api/companies/search?${params}`);
        return res.json();
    },

    // --- Scoring ---
    async getScore(companyId, qualitativeNotes = null) {
        if (qualitativeNotes !== null) {
            const res = await fetch(`${API_BASE}/api/score/${companyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qualitativeNotes })
            });
            return res.json();
        }
        const res = await fetch(`${API_BASE}/api/score/${companyId}`);
        return res.json();
    },

    // --- Reconciliation ---
    async getReconciliation(companyId) {
        const res = await fetch(`${API_BASE}/api/reconciliation/${companyId}`);
        return res.json();
    },

    // --- CAM ---
    async generateCAM(companyId) {
        const res = await fetch(`${API_BASE}/api/cam/${companyId}`);
        return res.json();
    },

    // --- Audit ---
    async getAuditLog() {
        const res = await fetch(`${API_BASE}/api/audit`);
        return res.json();
    },

    async addAuditEntry(agent, title, description, before, after) {
        const res = await fetch(`${API_BASE}/api/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent, title, description, before, after })
        });
        return res.json();
    }
};
