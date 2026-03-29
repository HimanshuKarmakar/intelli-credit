// ============================================
// INTELLI-CREDIT — GST Reconciliation Engine
// ============================================

function performReconciliation(company) {
    const gst = company.gstData;
    const months = gst.months;
    const reconciliation = [];
    let totalFraudScore = 0;
    const anomalies = [];

    for (let i = 0; i < 12; i++) {
        const gstr3b = gst.gstr3b[i];
        const gstr2a = gst.gstr2a[i];
        const bank = gst.bankInflows[i];

        const itcMismatch = gstr3b - gstr2a;
        const itcMismatchPct = ((itcMismatch / gstr2a) * 100);
        const bankGstGap = gstr3b - bank;
        const bankGapPct = ((bankGstGap / bank) * 100);

        let rowFraudScore = 0;
        let flags = [];

        // ITC Mismatch Check
        if (Math.abs(itcMismatchPct) > 20) {
            rowFraudScore += 25;
            flags.push({ type: 'ITC Mismatch', severity: itcMismatchPct > 30 ? 'critical' : 'high', detail: `GSTR-3B exceeds 2A by ${itcMismatchPct.toFixed(1)}%` });
        } else if (Math.abs(itcMismatchPct) > 10) {
            rowFraudScore += 10;
            flags.push({ type: 'ITC Variance', severity: 'medium', detail: `${itcMismatchPct.toFixed(1)}% variance in ITC claims` });
        }

        // Bank vs GST Check
        if (bankGapPct > 30) {
            rowFraudScore += 30;
            flags.push({ type: 'Revenue Inflation', severity: 'critical', detail: `GST turnover exceeds bank inflows by ${bankGapPct.toFixed(1)}%` });
        } else if (bankGapPct > 15) {
            rowFraudScore += 15;
            flags.push({ type: 'Turnover Gap', severity: 'high', detail: `GST exceeds bank by ${bankGapPct.toFixed(1)}%` });
        }

        totalFraudScore += rowFraudScore;

        reconciliation.push({
            month: months[i],
            gstr3b, gstr2a, bankInflows: bank,
            itcMismatch,
            itcMismatchPct: itcMismatchPct.toFixed(1),
            bankGstGap: bankGstGap,
            bankGapPct: bankGapPct.toFixed(1),
            fraudScore: rowFraudScore,
            flags
        });

        if (flags.length > 0) {
            anomalies.push(...flags.map(f => ({ ...f, month: months[i] })));
        }
    }

    // Normalize fraud score to 0-100
    const normalizedFraudScore = Math.min(100, Math.round(totalFraudScore / 12 * 2.5));

    // Check for pattern-based fraud
    const patternFlags = [];

    // Circular Trading: Consistent pattern of high 3B vs low bank inflows
    const highGapMonths = reconciliation.filter(r => parseFloat(r.bankGapPct) > 20).length;
    if (highGapMonths >= 6) {
        patternFlags.push({
            type: 'Circular Trading Pattern',
            severity: 'critical',
            detail: `${highGapMonths}/12 months show >20% gap between GST and bank — systematic circular trading suspected`,
            evidence: 'Pattern analysis across 12 months'
        });
    }

    // Round-Tripping: Declining bank inflows with stable/increasing GST
    const lastThreeBank = gst.bankInflows.slice(-3).reduce((a, b) => a + b, 0);
    const firstThreeBank = gst.bankInflows.slice(0, 3).reduce((a, b) => a + b, 0);
    const lastThreeGST = gst.gstr3b.slice(-3).reduce((a, b) => a + b, 0);
    const firstThreeGST = gst.gstr3b.slice(0, 3).reduce((a, b) => a + b, 0);

    if (lastThreeBank < firstThreeBank * 0.8 && lastThreeGST >= firstThreeGST * 0.9) {
        patternFlags.push({
            type: 'Round-Tripping Suspected',
            severity: 'high',
            detail: 'Bank inflows declining 20%+ while GST turnover stable — funds may be cycling through related entities',
            evidence: 'Trend analysis: Q1 vs Q4 comparison'
        });
    }

    // DuplicateGSTIN
    const existingDupFlag = gst.mismatchFlags.find(f => f.type === 'duplicate_gstin');
    if (existingDupFlag) {
        patternFlags.push({
            type: 'Duplicate GSTIN Exposure',
            severity: existingDupFlag.severity,
            detail: existingDupFlag.detail,
            evidence: 'GSTIN cross-reference check'
        });
    }

    return {
        table: reconciliation,
        fraudScore: normalizedFraudScore,
        anomalies,
        patternFlags,
        summary: {
            totalGSTR3B: gst.gstr3b.reduce((a, b) => a + b, 0),
            totalGSTR2A: gst.gstr2a.reduce((a, b) => a + b, 0),
            totalBankInflows: gst.bankInflows.reduce((a, b) => a + b, 0),
            avgItcGap: (reconciliation.reduce((s, r) => s + parseFloat(r.itcMismatchPct), 0) / 12).toFixed(1),
            avgBankGap: (reconciliation.reduce((s, r) => s + parseFloat(r.bankGapPct), 0) / 12).toFixed(1),
            flagCount: anomalies.length,
            criticalFlags: anomalies.filter(a => a.severity === 'critical').length
        }
    };
}
