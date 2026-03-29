# ============================================
# INTELLI-CREDIT — GST Reconciliation Engine
# (ported from JS)
# ============================================


def perform_reconciliation(company):
    gst = company["gstData"]
    months = gst["months"]
    reconciliation = []
    total_fraud_score = 0
    anomalies = []

    for i in range(12):
        gstr3b = gst["gstr3b"][i]
        gstr2a = gst["gstr2a"][i]
        bank = gst["bankInflows"][i]

        itc_mismatch = gstr3b - gstr2a
        itc_mismatch_pct = (itc_mismatch / gstr2a * 100) if gstr2a else 0
        bank_gst_gap = gstr3b - bank
        bank_gap_pct = (bank_gst_gap / bank * 100) if bank else 0

        row_fraud_score = 0
        flags = []

        # ITC Mismatch Check
        if abs(itc_mismatch_pct) > 20:
            row_fraud_score += 25
            sev = "critical" if itc_mismatch_pct > 30 else "high"
            flags.append({"type": "ITC Mismatch", "severity": sev, "detail": f"GSTR-3B exceeds 2A by {itc_mismatch_pct:.1f}%"})
        elif abs(itc_mismatch_pct) > 10:
            row_fraud_score += 10
            flags.append({"type": "ITC Variance", "severity": "medium", "detail": f"{itc_mismatch_pct:.1f}% variance in ITC claims"})

        # Bank vs GST Check
        if bank_gap_pct > 30:
            row_fraud_score += 30
            flags.append({"type": "Revenue Inflation", "severity": "critical", "detail": f"GST turnover exceeds bank inflows by {bank_gap_pct:.1f}%"})
        elif bank_gap_pct > 15:
            row_fraud_score += 15
            flags.append({"type": "Turnover Gap", "severity": "high", "detail": f"GST exceeds bank by {bank_gap_pct:.1f}%"})

        total_fraud_score += row_fraud_score

        reconciliation.append({
            "month": months[i],
            "gstr3b": gstr3b,
            "gstr2a": gstr2a,
            "bankInflows": bank,
            "itcMismatch": itc_mismatch,
            "itcMismatchPct": f"{itc_mismatch_pct:.1f}",
            "bankGstGap": bank_gst_gap,
            "bankGapPct": f"{bank_gap_pct:.1f}",
            "fraudScore": row_fraud_score,
            "flags": flags,
        })

        if flags:
            anomalies.extend([{**f, "month": months[i]} for f in flags])

    # Normalize fraud score
    normalized = min(100, round(total_fraud_score / 12 * 2.5))

    # Pattern-based fraud detection
    pattern_flags = []

    # Circular Trading
    high_gap_months = sum(1 for r in reconciliation if float(r["bankGapPct"]) > 20)
    if high_gap_months >= 6:
        pattern_flags.append({
            "type": "Circular Trading Pattern",
            "severity": "critical",
            "detail": f"{high_gap_months}/12 months show >20% gap between GST and bank — systematic circular trading suspected",
            "evidence": "Pattern analysis across 12 months",
        })

    # Round-Tripping
    last3_bank = sum(gst["bankInflows"][-3:])
    first3_bank = sum(gst["bankInflows"][:3])
    last3_gst = sum(gst["gstr3b"][-3:])
    first3_gst = sum(gst["gstr3b"][:3])

    if first3_bank > 0 and first3_gst > 0:
        if last3_bank < first3_bank * 0.8 and last3_gst >= first3_gst * 0.9:
            pattern_flags.append({
                "type": "Round-Tripping Suspected",
                "severity": "high",
                "detail": "Bank inflows declining 20%+ while GST turnover stable — funds may be cycling through related entities",
                "evidence": "Trend analysis: Q1 vs Q4 comparison",
            })

    # Duplicate GSTIN
    dup_flag = next((f for f in gst["mismatchFlags"] if f["type"] == "duplicate_gstin"), None)
    if dup_flag:
        pattern_flags.append({
            "type": "Duplicate GSTIN Exposure",
            "severity": dup_flag["severity"],
            "detail": dup_flag["detail"],
            "evidence": "GSTIN cross-reference check",
        })

    return {
        "table": reconciliation,
        "fraudScore": normalized,
        "anomalies": anomalies,
        "patternFlags": pattern_flags,
        "summary": {
            "totalGSTR3B": sum(gst["gstr3b"]),
            "totalGSTR2A": sum(gst["gstr2a"]),
            "totalBankInflows": sum(gst["bankInflows"]),
            "avgItcGap": f"{sum(float(r['itcMismatchPct']) for r in reconciliation) / 12:.1f}",
            "avgBankGap": f"{sum(float(r['bankGapPct']) for r in reconciliation) / 12:.1f}",
            "flagCount": len(anomalies),
            "criticalFlags": sum(1 for a in anomalies if a["severity"] == "critical"),
        },
    }
