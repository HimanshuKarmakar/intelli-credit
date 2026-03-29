# ============================================
# INTELLI-CREDIT — Scoring Engine
# Transparent weighted scoring (ported from JS)
# ============================================
import re
from models import format_currency, format_lakhs, get_score_class

SCORING_WEIGHTS = {
    "financialHealth": {"weight": 0.30, "label": "Financial Health", "icon": "📊"},
    "gstFraud": {"weight": 0.20, "label": "GST & Fraud Risk", "icon": "🔍"},
    "litigation": {"weight": 0.15, "label": "Litigation & Regulatory", "icon": "⚖️"},
    "sector": {"weight": 0.10, "label": "Sector Outlook", "icon": "🏭"},
    "qualitative": {"weight": 0.15, "label": "Qualitative Assessment", "icon": "📝"},
    "collateral": {"weight": 0.10, "label": "Collateral Coverage", "icon": "🏦"},
}


def _clamp(score):
    return max(0, min(100, score))


def calculate_financial_health(company):
    f = company["financials"]
    r = company["ratios"]
    idx = len(f["years"]) - 1
    score = 50
    evidence = []

    # DSCR
    dscr = r["dscr"][idx]
    if dscr >= 2.0:
        score += 20
        evidence.append({"factor": "DSCR", "value": f"{dscr:.2f}", "impact": "+20", "detail": "Strong debt service capability"})
    elif dscr >= 1.5:
        score += 12
        evidence.append({"factor": "DSCR", "value": f"{dscr:.2f}", "impact": "+12", "detail": "Adequate debt service"})
    elif dscr >= 1.2:
        score += 5
        evidence.append({"factor": "DSCR", "value": f"{dscr:.2f}", "impact": "+5", "detail": "Marginal debt service"})
    elif dscr >= 0.8:
        score -= 10
        evidence.append({"factor": "DSCR", "value": f"{dscr:.2f}", "impact": "-10", "detail": "Weak debt service — default risk"})
    else:
        score -= 25
        evidence.append({"factor": "DSCR", "value": f"{dscr:.2f}", "impact": "-25", "detail": "Critical — unable to service debt"})

    # Revenue trend
    rev_growth = (f["revenue"][idx] - f["revenue"][idx - 1]) / f["revenue"][idx - 1] * 100
    if rev_growth > 15:
        score += 10
        evidence.append({"factor": "Revenue Growth", "value": f"{rev_growth:.1f}%", "impact": "+10", "detail": "Strong revenue growth"})
    elif rev_growth > 5:
        score += 5
        evidence.append({"factor": "Revenue Growth", "value": f"{rev_growth:.1f}%", "impact": "+5", "detail": "Moderate growth"})
    elif rev_growth < -10:
        score -= 15
        evidence.append({"factor": "Revenue Growth", "value": f"{rev_growth:.1f}%", "impact": "-15", "detail": "Significant revenue decline"})
    elif rev_growth < 0:
        score -= 5
        evidence.append({"factor": "Revenue Growth", "value": f"{rev_growth:.1f}%", "impact": "-5", "detail": "Revenue declining"})

    # Current Ratio
    cr = r["currentRatio"][idx]
    if cr >= 2.0:
        score += 8
        evidence.append({"factor": "Current Ratio", "value": f"{cr:.2f}", "impact": "+8", "detail": "Strong liquidity"})
    elif cr >= 1.5:
        score += 4
        evidence.append({"factor": "Current Ratio", "value": f"{cr:.2f}", "impact": "+4", "detail": "Adequate liquidity"})
    elif cr < 1.0:
        score -= 12
        evidence.append({"factor": "Current Ratio", "value": f"{cr:.2f}", "impact": "-12", "detail": "Liquidity crisis — liabilities exceed current assets"})
    elif cr < 1.3:
        score -= 5
        evidence.append({"factor": "Current Ratio", "value": f"{cr:.2f}", "impact": "-5", "detail": "Tight liquidity"})

    # Debt-to-Equity
    de = r["debtEquity"][idx]
    if de < 0.5:
        score += 8
        evidence.append({"factor": "Debt-to-Equity", "value": f"{de:.2f}", "impact": "+8", "detail": "Very low leverage"})
    elif de < 1.0:
        score += 4
        evidence.append({"factor": "Debt-to-Equity", "value": f"{de:.2f}", "impact": "+4", "detail": "Conservative leverage"})
    elif de > 3.0:
        score -= 15
        evidence.append({"factor": "Debt-to-Equity", "value": f"{de:.2f}", "impact": "-15", "detail": "Extremely high leverage — distressed"})
    elif de > 2.0:
        score -= 8
        evidence.append({"factor": "Debt-to-Equity", "value": f"{de:.2f}", "impact": "-8", "detail": "High leverage"})

    # Net Profit
    pat = f["pat"][idx]
    if pat < 0:
        score -= 15
        evidence.append({"factor": "Net Profit", "value": format_lakhs(pat), "impact": "-15", "detail": "Loss-making entity"})
    else:
        score += 5
        evidence.append({"factor": "Net Profit", "value": format_lakhs(pat), "impact": "+5", "detail": "Profitable operations"})

    return {"score": _clamp(score), "evidence": evidence, "confidence": 92}


def calculate_gst_fraud(company):
    gst = company["gstData"]
    score = 80
    evidence = []
    flags = gst["mismatchFlags"]

    if not flags:
        evidence.append({"factor": "GST Compliance", "value": "Clean", "impact": "+0", "detail": "No mismatch flags detected"})
        return {"score": 85, "evidence": evidence, "confidence": 88}

    severity_map = {"critical": -20, "high": -12, "medium": -6, "low": -2}
    for flag in flags:
        delta = severity_map.get(flag["severity"], 0)
        score += delta
        evidence.append({
            "factor": flag["type"].replace("_", " "),
            "value": flag["month"],
            "impact": str(delta),
            "detail": flag["detail"],
        })

    total_gst = sum(gst["gstr3b"])
    total_bank = sum(gst["bankInflows"])
    if total_bank > 0:
        discrepancy = (total_gst - total_bank) / total_bank * 100
        if discrepancy > 30:
            score -= 15
            evidence.append({"factor": "GST-Bank Gap", "value": f"{discrepancy:.1f}%", "impact": "-15", "detail": f"GST turnover exceeds bank inflows by {discrepancy:.1f}%"})
        elif discrepancy > 15:
            score -= 8
            evidence.append({"factor": "GST-Bank Gap", "value": f"{discrepancy:.1f}%", "impact": "-8", "detail": "Moderate gap between GST and bank records"})

    return {"score": _clamp(score), "evidence": evidence, "confidence": 85}


def calculate_litigation(company):
    score = 85
    evidence = []

    if not company["litigation"]:
        evidence.append({"factor": "Litigation Status", "value": "Clean", "impact": "+0", "detail": "No active litigation"})
        return {"score": 90, "evidence": evidence, "confidence": 90}

    risk_map = {"critical": -22, "high": -12, "medium": -5, "low": -2}
    for lit in company["litigation"]:
        delta = risk_map.get(lit["risk"], 0)
        score += delta
        evidence.append({
            "factor": lit["type"],
            "value": format_currency(lit["amount"]),
            "impact": str(delta),
            "detail": f"{lit['court']} — {lit['status']}",
            "url": lit.get("url", ""),
        })

    for r in company["research"]:
        if r["riskType"] == "negative" and abs(r["impact"]) >= 10:
            score -= 5
            evidence.append({"factor": "Research Signal", "value": r["source"], "impact": "-5", "detail": r["title"], "url": r.get("url", "")})

    return {"score": _clamp(score), "evidence": evidence, "confidence": 82}


def calculate_sector(company):
    score = 60
    evidence = []

    for r in company["research"]:
        if r["riskType"] == "positive":
            imp = min(r["impact"], 10)
            score += imp
            evidence.append({"factor": r["source"], "value": "Positive", "impact": f"+{imp}", "detail": r["title"], "url": r.get("url", "")})
        elif r["riskType"] == "negative":
            score += r["impact"]
            evidence.append({"factor": r["source"], "value": "Negative", "impact": str(r["impact"]), "detail": r["title"], "url": r.get("url", "")})

    rating_scores = {"AAA": 15, "AA+": 13, "AA": 12, "A+": 10, "A": 9, "A-": 8, "BBB+": 5, "BBB": 3, "BB+": 0, "BB": -3, "B": -8, "C": -15, "D": -25}
    rating_impact = rating_scores.get(company["creditRating"], 0)
    score += rating_impact
    evidence.append({
        "factor": "Credit Rating",
        "value": f"{company['creditRating']} ({company['ratingAgency']})",
        "impact": f"{'+' if rating_impact >= 0 else ''}{rating_impact}",
        "detail": f"Rated by {company['ratingAgency']}",
    })

    return {"score": _clamp(score), "evidence": evidence, "confidence": 75}


def calculate_qualitative(company):
    score = 65
    evidence = []
    notes = company.get("qualitativeNotes", "") or ""

    if not notes.strip():
        evidence.append({"factor": "Officer Notes", "value": "None", "impact": "0", "detail": "No qualitative input provided"})
        return {"score": score, "evidence": evidence, "confidence": 50}

    lower_notes = notes.lower()

    negative_signals = [
        (r"capacity.*(40|30|20|10|50)%", -15, "Low capacity utilization", 0.8),
        (r"delay|delayed|overdue", -10, "Payment delays reported", 0.9),
        (r"vendor.*payment|payment.*vendor", -8, "Vendor payment issues", 0.92),
        (r"dispute|conflict", -6, "Management disputes", 0.94),
        (r"labour.*issue|strike|unrest", -8, "Labour issues", 0.92),
        (r"succession.*plan|no.*successor", -5, "No succession planning", 0.95),
        (r"fraud|embezzl|misappropriat", -20, "Fraud suspicion", 0.7),
    ]

    positive_signals = [
        (r"new.*order|order.*book|strong.*pipeline", 10, "Strong order pipeline", 1.1),
        (r"expand|expansion|growth", 8, "Expansion plans", 1.08),
        (r"modern|upgrad|technology", 6, "Technology upgrade", 1.06),
        (r"reputable|strong.*management", 5, "Strong management", 1.05),
        (r"government.*contract|psu.*order", 8, "Government contract", 1.08),
    ]

    for pattern, impact, label, multiplier in negative_signals:
        if re.search(pattern, lower_notes, re.IGNORECASE):
            score += impact
            evidence.append({"factor": label, "value": f"Multiplier: {multiplier}", "impact": str(impact), "detail": "Source: Credit Officer Input"})

    for pattern, impact, label, multiplier in positive_signals:
        if re.search(pattern, lower_notes, re.IGNORECASE):
            score += impact
            evidence.append({"factor": label, "value": f"Multiplier: {multiplier}", "impact": f"+{impact}", "detail": "Source: Credit Officer Input"})

    if not evidence:
        evidence.append({"factor": "Officer Assessment", "value": "Neutral", "impact": "0", "detail": "No quantifiable signals detected in notes"})

    return {"score": _clamp(score), "evidence": evidence, "confidence": 70}


def calculate_collateral(company):
    col = company["collateral"]
    evidence = []

    if col["coverage"] >= 2.0:
        score = 90
        evidence.append({"factor": "Collateral Coverage", "value": f"{col['coverage']:.2f}x", "impact": "+40", "detail": "Excellent security coverage"})
    elif col["coverage"] >= 1.5:
        score = 75
        evidence.append({"factor": "Collateral Coverage", "value": f"{col['coverage']:.2f}x", "impact": "+25", "detail": "Good security coverage"})
    elif col["coverage"] >= 1.2:
        score = 60
        evidence.append({"factor": "Collateral Coverage", "value": f"{col['coverage']:.2f}x", "impact": "+10", "detail": "Adequate coverage"})
    elif col["coverage"] >= 1.0:
        score = 45
        evidence.append({"factor": "Collateral Coverage", "value": f"{col['coverage']:.2f}x", "impact": "-5", "detail": "Thin coverage — marginal"})
    else:
        score = 15
        evidence.append({"factor": "Collateral Coverage", "value": f"{col['coverage']:.2f}x", "impact": "-35", "detail": "Insufficient collateral — high exposure"})

    evidence.append({"factor": "Collateral Type", "value": col["type"], "impact": "—", "detail": f"Valued at {format_currency(col['value'])}"})

    return {"score": score, "evidence": evidence, "confidence": 80}


def calculate_full_score(company):
    components = {
        "financialHealth": calculate_financial_health(company),
        "gstFraud": calculate_gst_fraud(company),
        "litigation": calculate_litigation(company),
        "sector": calculate_sector(company),
        "qualitative": calculate_qualitative(company),
        "collateral": calculate_collateral(company),
    }

    final_score = 0
    breakdown = []

    for key, config in SCORING_WEIGHTS.items():
        comp = components[key]
        weighted = comp["score"] * config["weight"]
        final_score += weighted
        breakdown.append({
            "key": key,
            "label": config["label"],
            "icon": config["icon"],
            "weight": config["weight"],
            "rawScore": comp["score"],
            "weightedScore": round(weighted, 1),
            "evidence": comp["evidence"],
            "confidence": comp["confidence"],
        })

    final_score = round(final_score)

    # Decision logic
    base_rate = 8.50
    risk_premium = None
    recommended_limit = 0
    interest_rate = None

    idx = len(company["financials"]["years"]) - 1
    cash_flow = company["financials"]["cashFlow"][idx]

    if final_score >= 70:
        decision = "Approve"
        risk_premium = 1.5
        dscr_limit = cash_flow * 100000 * 4
        collateral_limit = company["collateral"]["value"] * 0.7
        exposure_cap = company["requestedAmount"]
        recommended_limit = min(dscr_limit, collateral_limit, exposure_cap)
    elif final_score >= 50:
        decision = "Approve"
        risk_premium = 2.5 + (70 - final_score) * 0.1
        dscr_limit = cash_flow * 100000 * 3
        collateral_limit = company["collateral"]["value"] * 0.6
        exposure_cap = company["requestedAmount"] * 0.8
        recommended_limit = max(0, min(dscr_limit, collateral_limit, exposure_cap))
    else:
        decision = "Reject"

    if risk_premium is not None:
        interest_rate = base_rate + risk_premium

    # Top reasons
    all_evidence = []
    for b in breakdown:
        for e in b["evidence"]:
            all_evidence.append({**e, "component": b["label"]})

    negative_reasons = sorted(
        [e for e in all_evidence if e.get("impact") and _parse_int(e["impact"]) < 0],
        key=lambda e: _parse_int(e["impact"]),
    )[:5]

    positive_reasons = sorted(
        [e for e in all_evidence if e.get("impact") and _parse_int(e["impact"]) > 0],
        key=lambda e: -_parse_int(e["impact"]),
    )[:3]

    return {
        "finalScore": final_score,
        "decision": decision,
        "recommendedLimit": recommended_limit,
        "interestRate": interest_rate,
        "riskPremium": risk_premium,
        "baseRate": base_rate,
        "breakdown": breakdown,
        "topNegativeReasons": negative_reasons,
        "topPositiveReasons": positive_reasons,
        "riskLevel": get_score_class(final_score),
    }


def _parse_int(val):
    try:
        return int(str(val).replace("+", ""))
    except (ValueError, TypeError):
        return 0
