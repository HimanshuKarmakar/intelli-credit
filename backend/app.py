# ============================================
# INTELLI-CREDIT — Flask Backend
# REST API + Static File Server
# ============================================
import os
import copy
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from models import DEMO_COMPANIES, get_company_by_id, get_dashboard_stats, format_currency, format_lakhs
from java_bridge import score_company as run_scoring, reconcile_company as run_reconciliation, JAVA_AVAILABLE
from scoring import calculate_full_score  # fallback for CAM
from reconciliation import perform_reconciliation  # fallback

# Flask app
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), ".."))
CORS(app)

# In-memory state (per-session)
company_notes = {}  # companyId -> qualitative notes
audit_log = []


# ---------- Static Files ----------
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/css/<path:filename>")
def css(filename):
    return send_from_directory(os.path.join(app.static_folder, "css"), filename)


@app.route("/js/<path:filename>")
def js(filename):
    return send_from_directory(os.path.join(app.static_folder, "js"), filename)


@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(os.path.join(app.static_folder, "assets"), filename)


# ---------- API: Companies ----------
@app.route("/api/companies")
def list_companies():
    """List all companies with summary data."""
    result = []
    for c in DEMO_COMPANIES:
        result.append({
            "id": c["id"],
            "name": c["name"],
            "cin": c["cin"],
            "gstin": c["gstin"],
            "sector": c["sector"],
            "promoters": c["promoters"],
            "riskLevel": c["riskLevel"],
            "decision": c["decision"],
            "requestedAmount": c["requestedAmount"],
            "recommendedLimit": c["recommendedLimit"],
            "score": c["score"],
            "lastUpdated": c["lastUpdated"],
            "fraudAlertCount": len(c["gstData"]["mismatchFlags"]),
        })
    return jsonify(result)


@app.route("/api/companies/<company_id>")
def get_company(company_id):
    """Full company details."""
    company = get_company_by_id(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    # Apply any saved qualitative notes
    result = copy.deepcopy(company)
    if company_id in company_notes:
        result["qualitativeNotes"] = company_notes[company_id]
    return jsonify(result)


@app.route("/api/companies/search")
def search_companies():
    """Search/filter companies."""
    q = request.args.get("q", "").lower()
    decision_filter = request.args.get("filter", "all").lower()

    results = DEMO_COMPANIES
    if q:
        results = [c for c in results if q in c["name"].lower() or q in c["gstin"].lower() or q in c["cin"].lower()]
    if decision_filter != "all":
        cap = decision_filter.capitalize()
        results = [c for c in results if c["decision"] == cap]

    out = []
    for c in results:
        out.append({
            "id": c["id"], "name": c["name"], "cin": c["cin"], "gstin": c["gstin"],
            "sector": c["sector"], "promoters": c["promoters"], "riskLevel": c["riskLevel"],
            "decision": c["decision"], "requestedAmount": c["requestedAmount"],
            "recommendedLimit": c["recommendedLimit"], "score": c["score"],
            "lastUpdated": c["lastUpdated"],
            "fraudAlertCount": len(c["gstData"]["mismatchFlags"]),
        })
    return jsonify(out)


@app.route("/api/stats")
def dashboard_stats():
    """Dashboard KPI stats."""
    return jsonify(get_dashboard_stats())


# ---------- API: Scoring ----------
@app.route("/api/score/<company_id>", methods=["GET", "POST"])
def score_company(company_id):
    """Calculate score. POST body can include qualitativeNotes."""
    company = get_company_by_id(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    # Deep copy so we don't mutate demo data
    company_copy = copy.deepcopy(company)

    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        notes = data.get("qualitativeNotes", "")
        company_copy["qualitativeNotes"] = notes
        company_notes[company_id] = notes
    elif company_id in company_notes:
        company_copy["qualitativeNotes"] = company_notes[company_id]

    result = run_scoring(company_copy)
    return jsonify(result)


# ---------- API: Reconciliation ----------
@app.route("/api/reconciliation/<company_id>")
def reconciliation(company_id):
    """Run GST reconciliation for a company."""
    company = get_company_by_id(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    result = run_reconciliation(company)
    return jsonify(result)


# ---------- API: CAM ----------
@app.route("/api/cam/<company_id>")
def generate_cam(company_id):
    """Generate Credit Appraisal Memorandum text."""
    company = get_company_by_id(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    company_copy = copy.deepcopy(company)
    if company_id in company_notes:
        company_copy["qualitativeNotes"] = company_notes[company_id]

    s = run_scoring(company_copy)
    f = company["financials"]
    r = company["ratios"]

    cam = f"CREDIT APPRAISAL MEMORANDUM (CAM)\n{'=' * 50}\n"
    cam += f"\nCompany: {company['name']}\nCIN: {company['cin']}  |  GSTIN: {company['gstin']}\n"
    cam += f"Sector: {company['sector']}\nPromoters: {', '.join(company['promoters'])}\n"
    cam += f"Date: {datetime.now().strftime('%d/%m/%Y')}\n"

    cam += f"\n{'─' * 50}\nEXECUTIVE SUMMARY\n{'─' * 50}\n"
    cam += f"\nRisk Score: {s['finalScore']}/100  |  Decision: {s['decision']}\n"
    cam += f"Recommended Limit: {format_currency(s['recommendedLimit'])}\n"
    if s["interestRate"]:
        cam += f"Interest Rate: {s['interestRate']:.2f}% (Base {s['baseRate']}% + Premium {s['riskPremium']:.2f}%)\n"

    cam += f"\n{'─' * 50}\n1. CHARACTER (Promoter Assessment)\n{'─' * 50}\n"
    cam += f"Promoters: {', '.join(company['promoters'])}\nCredit Rating: {company['creditRating']} ({company['ratingAgency']})\n"
    cam += f"Litigation: {len(company['litigation'])} active case(s)\n"
    for lit in company["litigation"]:
        cam += f"  - {lit['type']} at {lit['court']}: {format_currency(lit['amount'])} ({lit['status']})\n"

    idx = len(f["years"]) - 1
    cam += f"\n{'─' * 50}\n2. CAPACITY (Repayment Ability)\n{'─' * 50}\n"
    cam += f"Revenue ({f['years'][idx]}): {format_lakhs(f['revenue'][idx])}\n"
    cam += f"DSCR: {r['dscr'][idx]:.2f}x\nInterest Coverage: {r['interestCoverage'][idx]:.2f}x\n"

    cam += f"\n{'─' * 50}\n3. CAPITAL (Net Worth & Leverage)\n{'─' * 50}\n"
    cam += f"Net Worth: {format_lakhs(f['netWorth'][idx])}\nDebt/Equity: {r['debtEquity'][idx]:.2f}x\n"

    cam += f"\n{'─' * 50}\n4. COLLATERAL\n{'─' * 50}\n"
    cam += f"Type: {company['collateral']['type']}\nValue: {format_currency(company['collateral']['value'])}\n"
    cam += f"Coverage: {company['collateral']['coverage']:.2f}x\n"

    cam += f"\n{'─' * 50}\n5. CONDITIONS (Market & Regulatory)\n{'─' * 50}\n"
    for res in company["research"]:
        cam += f"  [{res['riskType'].upper()}] {res['title']} ({res['source']})\n"

    cam += f"\n{'─' * 50}\nSCORING BREAKDOWN\n{'─' * 50}\n"
    for b in s["breakdown"]:
        cam += f"{b['label']}: {b['rawScore']}/100 (Weight: {int(b['weight'] * 100)}%, Contribution: {b['weightedScore']})\n"

    cam += f"\n{'─' * 50}\nFINAL RECOMMENDATION: {s['decision'].upper()}\n{'─' * 50}\n"

    return jsonify({"content": cam, "filename": f"CAM_{company['name'].replace(' ', '_')}.txt"})


# ---------- API: Audit ----------
@app.route("/api/audit", methods=["GET", "POST"])
def audit():
    """Get or add audit entries."""
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": data.get("agent", "System"),
            "title": data.get("title", ""),
            "description": data.get("description", ""),
            "before": data.get("before"),
            "after": data.get("after"),
        }
        audit_log.append(entry)
        return jsonify(entry), 201

    return jsonify(audit_log)


# ---------- Run ----------
if __name__ == "__main__":
    print("═" * 50)
    print("  INTELLI-CREDIT Backend Server")
    print(f"  Java Engine: {'✓ Available' if JAVA_AVAILABLE else '✗ Not found (using Python fallback)'}")
    print("  http://localhost:5000")
    print("═" * 50)
    app.run(debug=True, port=5000)
