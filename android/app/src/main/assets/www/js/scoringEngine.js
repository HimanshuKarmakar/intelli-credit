// ============================================
// INTELLI-CREDIT — Scoring Engine
// Transparent weighted scoring with explainability
// ============================================

const SCORING_WEIGHTS = {
    financialHealth: { weight: 0.30, label: 'Financial Health', icon: '📊' },
    gstFraud: { weight: 0.20, label: 'GST & Fraud Risk', icon: '🔍' },
    litigation: { weight: 0.15, label: 'Litigation & Regulatory', icon: '⚖️' },
    sector: { weight: 0.10, label: 'Sector Outlook', icon: '🏭' },
    qualitative: { weight: 0.15, label: 'Qualitative Assessment', icon: '📝' },
    collateral: { weight: 0.10, label: 'Collateral Coverage', icon: '🏦' }
};

function calculateFinancialHealthScore(company) {
    const f = company.financials;
    const r = company.ratios;
    const latestIdx = f.years.length - 1;
    let score = 50; // Base
    const evidence = [];

    // DSCR
    const dscr = r.dscr[latestIdx];
    if (dscr >= 2.0) { score += 20; evidence.push({ factor: 'DSCR', value: dscr.toFixed(2), impact: '+20', detail: 'Strong debt service capability' }); }
    else if (dscr >= 1.5) { score += 12; evidence.push({ factor: 'DSCR', value: dscr.toFixed(2), impact: '+12', detail: 'Adequate debt service' }); }
    else if (dscr >= 1.2) { score += 5; evidence.push({ factor: 'DSCR', value: dscr.toFixed(2), impact: '+5', detail: 'Marginal debt service' }); }
    else if (dscr >= 0.8) { score -= 10; evidence.push({ factor: 'DSCR', value: dscr.toFixed(2), impact: '-10', detail: 'Weak debt service — default risk' }); }
    else { score -= 25; evidence.push({ factor: 'DSCR', value: dscr.toFixed(2), impact: '-25', detail: 'Critical — unable to service debt' }); }

    // Revenue trend
    const revenueGrowth = ((f.revenue[latestIdx] - f.revenue[latestIdx - 1]) / f.revenue[latestIdx - 1] * 100);
    if (revenueGrowth > 15) { score += 10; evidence.push({ factor: 'Revenue Growth', value: revenueGrowth.toFixed(1) + '%', impact: '+10', detail: 'Strong revenue growth' }); }
    else if (revenueGrowth > 5) { score += 5; evidence.push({ factor: 'Revenue Growth', value: revenueGrowth.toFixed(1) + '%', impact: '+5', detail: 'Moderate growth' }); }
    else if (revenueGrowth < -10) { score -= 15; evidence.push({ factor: 'Revenue Growth', value: revenueGrowth.toFixed(1) + '%', impact: '-15', detail: 'Significant revenue decline' }); }
    else if (revenueGrowth < 0) { score -= 5; evidence.push({ factor: 'Revenue Growth', value: revenueGrowth.toFixed(1) + '%', impact: '-5', detail: 'Revenue declining' }); }

    // Current Ratio
    const cr = r.currentRatio[latestIdx];
    if (cr >= 2.0) { score += 8; evidence.push({ factor: 'Current Ratio', value: cr.toFixed(2), impact: '+8', detail: 'Strong liquidity' }); }
    else if (cr >= 1.5) { score += 4; evidence.push({ factor: 'Current Ratio', value: cr.toFixed(2), impact: '+4', detail: 'Adequate liquidity' }); }
    else if (cr < 1.0) { score -= 12; evidence.push({ factor: 'Current Ratio', value: cr.toFixed(2), impact: '-12', detail: 'Liquidity crisis — liabilities exceed current assets' }); }
    else if (cr < 1.3) { score -= 5; evidence.push({ factor: 'Current Ratio', value: cr.toFixed(2), impact: '-5', detail: 'Tight liquidity' }); }

    // Debt-to-Equity
    const de = r.debtEquity[latestIdx];
    if (de < 0.5) { score += 8; evidence.push({ factor: 'Debt-to-Equity', value: de.toFixed(2), impact: '+8', detail: 'Very low leverage' }); }
    else if (de < 1.0) { score += 4; evidence.push({ factor: 'Debt-to-Equity', value: de.toFixed(2), impact: '+4', detail: 'Conservative leverage' }); }
    else if (de > 3.0) { score -= 15; evidence.push({ factor: 'Debt-to-Equity', value: de.toFixed(2), impact: '-15', detail: 'Extremely high leverage — distressed' }); }
    else if (de > 2.0) { score -= 8; evidence.push({ factor: 'Debt-to-Equity', value: de.toFixed(2), impact: '-8', detail: 'High leverage' }); }

    // Net Profit
    const pat = f.pat[latestIdx];
    if (pat < 0) { score -= 15; evidence.push({ factor: 'Net Profit', value: formatLakhs(pat), impact: '-15', detail: 'Loss-making entity' }); }
    else { score += 5; evidence.push({ factor: 'Net Profit', value: formatLakhs(pat), impact: '+5', detail: 'Profitable operations' }); }

    return { score: Math.max(0, Math.min(100, score)), evidence, confidence: 92 };
}

function calculateGSTFraudScore(company) {
    const gst = company.gstData;
    let score = 80; // Start high (no fraud)
    const evidence = [];

    // Check flags
    const flags = gst.mismatchFlags;
    if (flags.length === 0) {
        evidence.push({ factor: 'GST Compliance', value: 'Clean', impact: '+0', detail: 'No mismatch flags detected' });
        return { score: 85, evidence, confidence: 88 };
    }

    flags.forEach(flag => {
        switch (flag.severity) {
            case 'critical':
                score -= 20;
                evidence.push({ factor: flag.type.replace(/_/g, ' '), value: flag.month, impact: '-20', detail: flag.detail });
                break;
            case 'high':
                score -= 12;
                evidence.push({ factor: flag.type.replace(/_/g, ' '), value: flag.month, impact: '-12', detail: flag.detail });
                break;
            case 'medium':
                score -= 6;
                evidence.push({ factor: flag.type.replace(/_/g, ' '), value: flag.month, impact: '-6', detail: flag.detail });
                break;
            case 'low':
                score -= 2;
                evidence.push({ factor: flag.type.replace(/_/g, ' '), value: flag.month, impact: '-2', detail: flag.detail });
                break;
        }
    });

    // Overall GST vs Bank comparison
    const totalGST = gst.gstr3b.reduce((s, v) => s + v, 0);
    const totalBank = gst.bankInflows.reduce((s, v) => s + v, 0);
    const discrepancy = ((totalGST - totalBank) / totalBank * 100);
    if (discrepancy > 30) {
        score -= 15;
        evidence.push({ factor: 'GST-Bank Gap', value: discrepancy.toFixed(1) + '%', impact: '-15', detail: `GST turnover exceeds bank inflows by ${discrepancy.toFixed(1)}%` });
    } else if (discrepancy > 15) {
        score -= 8;
        evidence.push({ factor: 'GST-Bank Gap', value: discrepancy.toFixed(1) + '%', impact: '-8', detail: `Moderate gap between GST and bank records` });
    }

    return { score: Math.max(0, Math.min(100, score)), evidence, confidence: 85 };
}

function calculateLitigationScore(company) {
    let score = 85;
    const evidence = [];

    if (company.litigation.length === 0) {
        evidence.push({ factor: 'Litigation Status', value: 'Clean', impact: '+0', detail: 'No active litigation' });
        return { score: 90, evidence, confidence: 90 };
    }

    company.litigation.forEach(lit => {
        switch (lit.risk) {
            case 'critical':
                score -= 22;
                evidence.push({ factor: lit.type, value: formatCurrency(lit.amount), impact: '-22', detail: `${lit.court} — ${lit.status}`, url: lit.url });
                break;
            case 'high':
                score -= 12;
                evidence.push({ factor: lit.type, value: formatCurrency(lit.amount), impact: '-12', detail: `${lit.court} — ${lit.status}`, url: lit.url });
                break;
            case 'medium':
                score -= 5;
                evidence.push({ factor: lit.type, value: formatCurrency(lit.amount), impact: '-5', detail: `${lit.court} — ${lit.status}`, url: lit.url });
                break;
            case 'low':
                score -= 2;
                evidence.push({ factor: lit.type, value: formatCurrency(lit.amount), impact: '-2', detail: `${lit.court} — ${lit.status}`, url: lit.url });
                break;
        }
    });

    //  Research negative impacts
    company.research.forEach(r => {
        if (r.riskType === 'negative' && Math.abs(r.impact) >= 10) {
            score -= 5;
            evidence.push({ factor: 'Research Signal', value: r.source, impact: '-5', detail: r.title, url: r.url });
        }
    });

    return { score: Math.max(0, Math.min(100, score)), evidence, confidence: 82 };
}

function calculateSectorScore(company) {
    let score = 60;
    const evidence = [];

    company.research.forEach(r => {
        if (r.riskType === 'positive') {
            score += Math.min(r.impact, 10);
            evidence.push({ factor: r.source, value: 'Positive', impact: '+' + Math.min(r.impact, 10), detail: r.title, url: r.url });
        } else if (r.riskType === 'negative') {
            score += r.impact; // negative number
            evidence.push({ factor: r.source, value: 'Negative', impact: r.impact.toString(), detail: r.title, url: r.url });
        }
    });

    // Rating impact
    const ratingScores = { 'AAA': 15, 'AA+': 13, 'AA': 12, 'A+': 10, 'A': 9, 'A-': 8, 'BBB+': 5, 'BBB': 3, 'BB+': 0, 'BB': -3, 'B': -8, 'C': -15, 'D': -25 };
    const ratingImpact = ratingScores[company.creditRating] || 0;
    score += ratingImpact;
    evidence.push({ factor: 'Credit Rating', value: company.creditRating + ' (' + company.ratingAgency + ')', impact: (ratingImpact >= 0 ? '+' : '') + ratingImpact, detail: `Rated by ${company.ratingAgency}` });

    return { score: Math.max(0, Math.min(100, score)), evidence, confidence: 75 };
}

function calculateQualitativeScore(company) {
    let score = 65; // Neutral base
    const evidence = [];
    const notes = company.qualitativeNotes || '';

    if (!notes.trim()) {
        evidence.push({ factor: 'Officer Notes', value: 'None', impact: '0', detail: 'No qualitative input provided' });
        return { score, evidence, confidence: 50 };
    }

    // Parse qualitative notes for impact keywords
    const lowerNotes = notes.toLowerCase();
    const negativeSignals = [
        { pattern: /capacity.*(40|30|20|10|50)%/i, impact: -15, label: 'Low capacity utilization', multiplier: 0.8 },
        { pattern: /delay|delayed|overdue/i, impact: -10, label: 'Payment delays reported', multiplier: 0.9 },
        { pattern: /vendor.*payment|payment.*vendor/i, impact: -8, label: 'Vendor payment issues', multiplier: 0.92 },
        { pattern: /dispute|conflict/i, impact: -6, label: 'Management disputes', multiplier: 0.94 },
        { pattern: /labour.*issue|strike|unrest/i, impact: -8, label: 'Labour issues', multiplier: 0.92 },
        { pattern: /succession.*plan|no.*successor/i, impact: -5, label: 'No succession planning', multiplier: 0.95 },
        { pattern: /fraud|embezzl|misappropriat/i, impact: -20, label: 'Fraud suspicion', multiplier: 0.7 }
    ];

    const positiveSignals = [
        { pattern: /new.*order|order.*book|strong.*pipeline/i, impact: 10, label: 'Strong order pipeline', multiplier: 1.1 },
        { pattern: /expand|expansion|growth/i, impact: 8, label: 'Expansion plans', multiplier: 1.08 },
        { pattern: /modern|upgrad|technology/i, impact: 6, label: 'Technology upgrade', multiplier: 1.06 },
        { pattern: /reputable|strong.*management/i, impact: 5, label: 'Strong management', multiplier: 1.05 },
        { pattern: /government.*contract|psu.*order/i, impact: 8, label: 'Government contract', multiplier: 1.08 }
    ];

    negativeSignals.forEach(signal => {
        if (signal.pattern.test(lowerNotes)) {
            score += signal.impact;
            evidence.push({ factor: signal.label, value: `Multiplier: ${signal.multiplier}`, impact: signal.impact.toString(), detail: `Source: Credit Officer Input` });
        }
    });

    positiveSignals.forEach(signal => {
        if (signal.pattern.test(lowerNotes)) {
            score += signal.impact;
            evidence.push({ factor: signal.label, value: `Multiplier: ${signal.multiplier}`, impact: '+' + signal.impact, detail: `Source: Credit Officer Input` });
        }
    });

    if (evidence.length === 0) {
        evidence.push({ factor: 'Officer Assessment', value: 'Neutral', impact: '0', detail: 'No quantifiable signals detected in notes' });
    }

    return { score: Math.max(0, Math.min(100, score)), evidence, confidence: 70 };
}

function calculateCollateralScore(company) {
    const col = company.collateral;
    let score = 50;
    const evidence = [];

    if (col.coverage >= 2.0) {
        score = 90;
        evidence.push({ factor: 'Collateral Coverage', value: col.coverage.toFixed(2) + 'x', impact: '+40', detail: 'Excellent security coverage' });
    } else if (col.coverage >= 1.5) {
        score = 75;
        evidence.push({ factor: 'Collateral Coverage', value: col.coverage.toFixed(2) + 'x', impact: '+25', detail: 'Good security coverage' });
    } else if (col.coverage >= 1.2) {
        score = 60;
        evidence.push({ factor: 'Collateral Coverage', value: col.coverage.toFixed(2) + 'x', impact: '+10', detail: 'Adequate coverage' });
    } else if (col.coverage >= 1.0) {
        score = 45;
        evidence.push({ factor: 'Collateral Coverage', value: col.coverage.toFixed(2) + 'x', impact: '-5', detail: 'Thin coverage — marginal' });
    } else {
        score = 15;
        evidence.push({ factor: 'Collateral Coverage', value: col.coverage.toFixed(2) + 'x', impact: '-35', detail: 'Insufficient collateral — high exposure' });
    }

    evidence.push({ factor: 'Collateral Type', value: col.type, impact: '—', detail: `Valued at ${formatCurrency(col.value)}` });

    return { score, evidence, confidence: 80 };
}

function calculateFullScore(company) {
    const components = {
        financialHealth: calculateFinancialHealthScore(company),
        gstFraud: calculateGSTFraudScore(company),
        litigation: calculateLitigationScore(company),
        sector: calculateSectorScore(company),
        qualitative: calculateQualitativeScore(company),
        collateral: calculateCollateralScore(company)
    };

    let finalScore = 0;
    const breakdown = [];

    Object.entries(SCORING_WEIGHTS).forEach(([key, config]) => {
        const comp = components[key];
        const weighted = comp.score * config.weight;
        finalScore += weighted;
        breakdown.push({
            key,
            label: config.label,
            icon: config.icon,
            weight: config.weight,
            rawScore: comp.score,
            weightedScore: weighted,
            evidence: comp.evidence,
            confidence: comp.confidence
        });
    });

    finalScore = Math.round(finalScore);

    // Decision logic
    let decision, recommendedLimit, interestRate, riskPremium;
    const baseRate = 8.50; // Current base rate

    if (finalScore >= 70) {
        decision = 'Approve';
        riskPremium = 1.5;
        const dscrLimit = company.financials.cashFlow[company.financials.years.length - 1] * 100000 * 4;
        const collateralLimit = company.collateral.value * 0.7;
        const exposureCap = company.requestedAmount;
        recommendedLimit = Math.min(dscrLimit, collateralLimit, exposureCap);
    } else if (finalScore >= 50) {
        decision = 'Approve';
        riskPremium = 2.5 + (70 - finalScore) * 0.1;
        const dscrLimit = company.financials.cashFlow[company.financials.years.length - 1] * 100000 * 3;
        const collateralLimit = company.collateral.value * 0.6;
        const exposureCap = company.requestedAmount * 0.8;
        recommendedLimit = Math.max(0, Math.min(dscrLimit, collateralLimit, exposureCap));
    } else {
        decision = 'Reject';
        riskPremium = null;
        recommendedLimit = 0;
    }

    interestRate = riskPremium !== null ? baseRate + riskPremium : null;

    // Top reasons
    const allEvidence = breakdown.flatMap(b => b.evidence.map(e => ({ ...e, component: b.label })));
    const negativeReasons = allEvidence
        .filter(e => e.impact && parseInt(e.impact) < 0)
        .sort((a, b) => parseInt(a.impact) - parseInt(b.impact))
        .slice(0, 5);

    const positiveReasons = allEvidence
        .filter(e => e.impact && parseInt(e.impact) > 0)
        .sort((a, b) => parseInt(b.impact) - parseInt(a.impact))
        .slice(0, 3);

    return {
        finalScore,
        decision,
        recommendedLimit,
        interestRate,
        riskPremium,
        baseRate,
        breakdown,
        topNegativeReasons: negativeReasons,
        topPositiveReasons: positiveReasons,
        riskLevel: getScoreClass(finalScore),
        limitFormula: {
            dscrBased: 'Cash Flow × Multiplier',
            collateralBased: 'Collateral Value × 70%',
            exposureCap: 'Requested Amount cap'
        }
    };
}
