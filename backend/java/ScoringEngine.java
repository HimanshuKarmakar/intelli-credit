// ============================================
// INTELLI-CREDIT — Java Scoring Engine
// 6-component weighted scoring (stdin/stdout JSON)
// ============================================
import java.io.*;
import java.util.*;
import java.util.regex.*;

public class ScoringEngine {

    // ---- Scoring Weights ----
    static final double W_FINANCIAL  = 0.30;
    static final double W_GST_FRAUD  = 0.20;
    static final double W_LITIGATION = 0.15;
    static final double W_SECTOR     = 0.10;
    static final double W_QUALITATIVE= 0.15;
    static final double W_COLLATERAL = 0.10;

    // ============ MAIN ============
    public static void main(String[] args) throws Exception {
        // Read JSON from stdin
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }
        String inputJson = sb.toString();

        // Parse minimal fields from JSON (no external lib)
        JsonObj company = new JsonObj(inputJson);

        // Calculate all 6 components
        ScoreComponent financial  = calcFinancialHealth(company);
        ScoreComponent gstFraud   = calcGstFraud(company);
        ScoreComponent litigation = calcLitigation(company);
        ScoreComponent sector     = calcSector(company);
        ScoreComponent qualitative= calcQualitative(company);
        ScoreComponent collateral = calcCollateral(company);

        ScoreComponent[] components = { financial, gstFraud, litigation, sector, qualitative, collateral };
        String[] keys   = { "financialHealth", "gstFraud", "litigation", "sector", "qualitative", "collateral" };
        String[] labels = { "Financial Health", "GST & Fraud Risk", "Litigation & Regulatory", "Sector Outlook", "Qualitative Assessment", "Collateral Coverage" };
        String[] icons  = { "📊", "🔍", "⚖️", "🏭", "📝", "🏦" };
        double[] weights= { W_FINANCIAL, W_GST_FRAUD, W_LITIGATION, W_SECTOR, W_QUALITATIVE, W_COLLATERAL };

        // Weighted aggregation
        double finalScore = 0;
        StringBuilder breakdownJson = new StringBuilder("[");
        List<String> allNeg = new ArrayList<>();
        List<String> allPos = new ArrayList<>();

        for (int i = 0; i < 6; i++) {
            double weighted = components[i].score * weights[i];
            finalScore += weighted;

            if (i > 0) breakdownJson.append(",");
            breakdownJson.append("{");
            breakdownJson.append("\"key\":\"").append(keys[i]).append("\",");
            breakdownJson.append("\"label\":\"").append(labels[i]).append("\",");
            breakdownJson.append("\"icon\":\"").append(icons[i]).append("\",");
            breakdownJson.append("\"weight\":").append(weights[i]).append(",");
            breakdownJson.append("\"rawScore\":").append(components[i].score).append(",");
            breakdownJson.append("\"weightedScore\":").append(String.format("%.1f", weighted)).append(",");
            breakdownJson.append("\"evidence\":").append(components[i].evidenceJson).append(",");
            breakdownJson.append("\"confidence\":").append(components[i].confidence);
            breakdownJson.append("}");

            // Collect evidence for top reasons
            for (String ev : components[i].evidenceItems) {
                int impact = CreditUtils.parseIntSafe(extractField(ev, "impact"));
                if (impact < 0) allNeg.add(ev.replace("}", ",\"component\":\"" + labels[i] + "\"}"));
                else if (impact > 0) allPos.add(ev.replace("}", ",\"component\":\"" + labels[i] + "\"}"));
            }
        }
        breakdownJson.append("]");

        int score = (int) Math.round(finalScore);
        String riskLevel = CreditUtils.getScoreClass(score);

        // Decision logic
        double baseRate = 8.50;
        String decision;
        double recommendedLimit = 0;
        double interestRate = 0;
        double riskPremium = 0;
        boolean hasRate = false;

        JsonArr cashFlowArr = company.getArray("financials.cashFlow");
        double cashFlow = cashFlowArr != null ? cashFlowArr.getDouble(cashFlowArr.size() - 1) : 0;
        double requestedAmount = company.getDouble("requestedAmount");
        double collateralValue = company.getDouble("collateral.value");

        if (score >= 70) {
            decision = "Approve";
            riskPremium = 1.5;
            hasRate = true;
            double dscrLimit = cashFlow * 100000 * 4;
            double colLimit = collateralValue * 0.7;
            recommendedLimit = Math.min(dscrLimit, Math.min(colLimit, requestedAmount));
        } else if (score >= 50) {
            decision = "Approve";
            riskPremium = 2.5 + (70 - score) * 0.1;
            hasRate = true;
            double dscrLimit = cashFlow * 100000 * 3;
            double colLimit = collateralValue * 0.6;
            double expCap = requestedAmount * 0.8;
            recommendedLimit = Math.max(0, Math.min(dscrLimit, Math.min(colLimit, expCap)));
        } else {
            decision = "Reject";
        }
        if (hasRate) interestRate = baseRate + riskPremium;

        // Sort negative (most negative first), positive (most positive first)
        allNeg.sort((a, b) -> CreditUtils.parseIntSafe(extractField(a, "impact")) - CreditUtils.parseIntSafe(extractField(b, "impact")));
        allPos.sort((a, b) -> CreditUtils.parseIntSafe(extractField(b, "impact")) - CreditUtils.parseIntSafe(extractField(a, "impact")));

        // Build output JSON
        StringBuilder out = new StringBuilder("{");
        out.append("\"finalScore\":").append(score).append(",");
        out.append("\"decision\":\"").append(decision).append("\",");
        out.append("\"recommendedLimit\":").append(recommendedLimit).append(",");
        out.append("\"interestRate\":").append(hasRate ? interestRate : "null").append(",");
        out.append("\"riskPremium\":").append(hasRate ? riskPremium : "null").append(",");
        out.append("\"baseRate\":").append(baseRate).append(",");
        out.append("\"breakdown\":").append(breakdownJson).append(",");
        out.append("\"topNegativeReasons\":[").append(String.join(",", allNeg.subList(0, Math.min(5, allNeg.size())))).append("],");
        out.append("\"topPositiveReasons\":[").append(String.join(",", allPos.subList(0, Math.min(3, allPos.size())))).append("],");
        out.append("\"riskLevel\":\"").append(riskLevel).append("\",");
        out.append("\"engine\":\"java\"");
        out.append("}");

        System.out.println(out);
    }

    // ============ COMPONENT 1: Financial Health ============
    static ScoreComponent calcFinancialHealth(JsonObj company) {
        List<String> evidence = new ArrayList<>();
        int score = 50;

        JsonArr dscrArr = company.getArray("ratios.dscr");
        JsonArr revArr  = company.getArray("financials.revenue");
        JsonArr crArr   = company.getArray("ratios.currentRatio");
        JsonArr deArr   = company.getArray("ratios.debtEquity");
        JsonArr patArr  = company.getArray("financials.pat");

        int idx = dscrArr != null ? dscrArr.size() - 1 : 0;

        // DSCR
        double dscr = dscrArr != null ? dscrArr.getDouble(idx) : 1.0;
        if (dscr >= 2.0) { score += 20; evidence.add(CreditUtils.evidenceToJson("DSCR", f(dscr), "+20", "Strong debt service capability")); }
        else if (dscr >= 1.5) { score += 12; evidence.add(CreditUtils.evidenceToJson("DSCR", f(dscr), "+12", "Adequate debt service")); }
        else if (dscr >= 1.2) { score += 5; evidence.add(CreditUtils.evidenceToJson("DSCR", f(dscr), "+5", "Marginal debt service")); }
        else if (dscr >= 0.8) { score -= 10; evidence.add(CreditUtils.evidenceToJson("DSCR", f(dscr), "-10", "Weak debt service — default risk")); }
        else { score -= 25; evidence.add(CreditUtils.evidenceToJson("DSCR", f(dscr), "-25", "Critical — unable to service debt")); }

        // Revenue growth
        if (revArr != null && revArr.size() >= 2) {
            double curr = revArr.getDouble(idx);
            double prev = revArr.getDouble(idx - 1);
            double growth = (curr - prev) / prev * 100;
            if (growth > 15) { score += 10; evidence.add(CreditUtils.evidenceToJson("Revenue Growth", f1(growth) + "%", "+10", "Strong revenue growth")); }
            else if (growth > 5) { score += 5; evidence.add(CreditUtils.evidenceToJson("Revenue Growth", f1(growth) + "%", "+5", "Moderate growth")); }
            else if (growth < -10) { score -= 15; evidence.add(CreditUtils.evidenceToJson("Revenue Growth", f1(growth) + "%", "-15", "Significant revenue decline")); }
            else if (growth < 0) { score -= 5; evidence.add(CreditUtils.evidenceToJson("Revenue Growth", f1(growth) + "%", "-5", "Revenue declining")); }
        }

        // Current Ratio
        double cr = crArr != null ? crArr.getDouble(idx) : 1.0;
        if (cr >= 2.0) { score += 8; evidence.add(CreditUtils.evidenceToJson("Current Ratio", f(cr), "+8", "Strong liquidity")); }
        else if (cr >= 1.5) { score += 4; evidence.add(CreditUtils.evidenceToJson("Current Ratio", f(cr), "+4", "Adequate liquidity")); }
        else if (cr < 1.0) { score -= 12; evidence.add(CreditUtils.evidenceToJson("Current Ratio", f(cr), "-12", "Liquidity crisis — liabilities exceed current assets")); }
        else if (cr < 1.3) { score -= 5; evidence.add(CreditUtils.evidenceToJson("Current Ratio", f(cr), "-5", "Tight liquidity")); }

        // Debt-to-Equity
        double de = deArr != null ? deArr.getDouble(idx) : 1.0;
        if (de < 0.5) { score += 8; evidence.add(CreditUtils.evidenceToJson("Debt-to-Equity", f(de), "+8", "Very low leverage")); }
        else if (de < 1.0) { score += 4; evidence.add(CreditUtils.evidenceToJson("Debt-to-Equity", f(de), "+4", "Conservative leverage")); }
        else if (de > 3.0) { score -= 15; evidence.add(CreditUtils.evidenceToJson("Debt-to-Equity", f(de), "-15", "Extremely high leverage — distressed")); }
        else if (de > 2.0) { score -= 8; evidence.add(CreditUtils.evidenceToJson("Debt-to-Equity", f(de), "-8", "High leverage")); }

        // PAT
        double pat = patArr != null ? patArr.getDouble(idx) : 0;
        if (pat < 0) { score -= 15; evidence.add(CreditUtils.evidenceToJson("Net Profit", CreditUtils.formatLakhs(pat), "-15", "Loss-making entity")); }
        else { score += 5; evidence.add(CreditUtils.evidenceToJson("Net Profit", CreditUtils.formatLakhs(pat), "+5", "Profitable operations")); }

        return new ScoreComponent(CreditUtils.clamp(score), evidence, 92);
    }

    // ============ COMPONENT 2: GST & Fraud ============
    static ScoreComponent calcGstFraud(JsonObj company) {
        List<String> evidence = new ArrayList<>();
        int score = 80;

        JsonArr flags = company.getArray("gstData.mismatchFlags");
        if (flags == null || flags.size() == 0) {
            evidence.add(CreditUtils.evidenceToJson("GST Compliance", "Clean", "+0", "No mismatch flags detected"));
            return new ScoreComponent(85, evidence, 88);
        }

        for (int i = 0; i < flags.size(); i++) {
            JsonObj flag = flags.getObj(i);
            String severity = flag.getString("severity");
            int delta = CreditUtils.getSeverityImpact(severity);
            score += delta;
            evidence.add(CreditUtils.evidenceToJson(
                flag.getString("type").replace("_", " "),
                flag.getString("month"),
                String.valueOf(delta),
                flag.getString("detail")
            ));
        }

        // GST-Bank gap
        JsonArr gstr3b = company.getArray("gstData.gstr3b");
        JsonArr bank = company.getArray("gstData.bankInflows");
        if (gstr3b != null && bank != null) {
            double totalGst = 0, totalBank = 0;
            for (int i = 0; i < gstr3b.size(); i++) { totalGst += gstr3b.getDouble(i); totalBank += bank.getDouble(i); }
            if (totalBank > 0) {
                double disc = (totalGst - totalBank) / totalBank * 100;
                if (disc > 30) { score -= 15; evidence.add(CreditUtils.evidenceToJson("GST-Bank Gap", f1(disc) + "%", "-15", "GST turnover exceeds bank inflows by " + f1(disc) + "%")); }
                else if (disc > 15) { score -= 8; evidence.add(CreditUtils.evidenceToJson("GST-Bank Gap", f1(disc) + "%", "-8", "Moderate gap between GST and bank records")); }
            }
        }

        return new ScoreComponent(CreditUtils.clamp(score), evidence, 85);
    }

    // ============ COMPONENT 3: Litigation ============
    static ScoreComponent calcLitigation(JsonObj company) {
        List<String> evidence = new ArrayList<>();
        int score = 85;

        JsonArr litigation = company.getArray("litigation");
        if (litigation == null || litigation.size() == 0) {
            evidence.add(CreditUtils.evidenceToJson("Litigation Status", "Clean", "+0", "No active litigation"));
            return new ScoreComponent(90, evidence, 90);
        }

        for (int i = 0; i < litigation.size(); i++) {
            JsonObj lit = litigation.getObj(i);
            String risk = lit.getString("risk");
            int delta = CreditUtils.getLitigationRiskImpact(risk);
            score += delta;
            evidence.add(CreditUtils.evidenceToJson(
                lit.getString("type"),
                CreditUtils.formatCurrency(lit.getDouble("amount")),
                String.valueOf(delta),
                lit.getString("court") + " — " + lit.getString("status"),
                lit.getString("url")
            ));
        }

        // Research negative signals
        JsonArr research = company.getArray("research");
        if (research != null) {
            for (int i = 0; i < research.size(); i++) {
                JsonObj r = research.getObj(i);
                if ("negative".equals(r.getString("riskType")) && Math.abs(r.getInt("impact")) >= 10) {
                    score -= 5;
                    evidence.add(CreditUtils.evidenceToJson("Research Signal", r.getString("source"), "-5", r.getString("title"), r.getString("url")));
                }
            }
        }

        return new ScoreComponent(CreditUtils.clamp(score), evidence, 82);
    }

    // ============ COMPONENT 4: Sector ============
    static ScoreComponent calcSector(JsonObj company) {
        List<String> evidence = new ArrayList<>();
        int score = 60;

        JsonArr research = company.getArray("research");
        if (research != null) {
            for (int i = 0; i < research.size(); i++) {
                JsonObj r = research.getObj(i);
                String riskType = r.getString("riskType");
                int impact = r.getInt("impact");
                if ("positive".equals(riskType)) {
                    int imp = Math.min(impact, 10);
                    score += imp;
                    evidence.add(CreditUtils.evidenceToJson(r.getString("source"), "Positive", "+" + imp, r.getString("title"), r.getString("url")));
                } else if ("negative".equals(riskType)) {
                    score += impact;
                    evidence.add(CreditUtils.evidenceToJson(r.getString("source"), "Negative", String.valueOf(impact), r.getString("title"), r.getString("url")));
                }
            }
        }

        String rating = company.getString("creditRating");
        String agency = company.getString("ratingAgency");
        int ratingImpact = CreditUtils.getRatingScore(rating);
        score += ratingImpact;
        evidence.add(CreditUtils.evidenceToJson("Credit Rating", rating + " (" + agency + ")",
            (ratingImpact >= 0 ? "+" : "") + ratingImpact, "Rated by " + agency));

        return new ScoreComponent(CreditUtils.clamp(score), evidence, 75);
    }

    // ============ COMPONENT 5: Qualitative ============
    static ScoreComponent calcQualitative(JsonObj company) {
        List<String> evidence = new ArrayList<>();
        int score = 65;

        String notes = company.getString("qualitativeNotes");
        if (notes == null || notes.trim().isEmpty()) {
            evidence.add(CreditUtils.evidenceToJson("Officer Notes", "None", "0", "No qualitative input provided"));
            return new ScoreComponent(score, evidence, 50);
        }

        String lower = notes.toLowerCase();

        // Negative signals
        String[][] negPatterns = {
            {"capacity.*(40|30|20|10|50)%", "-15", "Low capacity utilization", "0.8"},
            {"delay|delayed|overdue", "-10", "Payment delays reported", "0.9"},
            {"vendor.*payment|payment.*vendor", "-8", "Vendor payment issues", "0.92"},
            {"dispute|conflict", "-6", "Management disputes", "0.94"},
            {"labour.*issue|strike|unrest", "-8", "Labour issues", "0.92"},
            {"succession.*plan|no.*successor", "-5", "No succession planning", "0.95"},
            {"fraud|embezzl|misappropriat", "-20", "Fraud suspicion", "0.7"}
        };

        // Positive signals
        String[][] posPatterns = {
            {"new.*order|order.*book|strong.*pipeline", "+10", "Strong order pipeline", "1.1"},
            {"expand|expansion|growth", "+8", "Expansion plans", "1.08"},
            {"modern|upgrad|technology", "+6", "Technology upgrade", "1.06"},
            {"reputable|strong.*management", "+5", "Strong management", "1.05"},
            {"government.*contract|psu.*order", "+8", "Government contract", "1.08"}
        };

        for (String[] p : negPatterns) {
            if (Pattern.compile(p[0], Pattern.CASE_INSENSITIVE).matcher(lower).find()) {
                int impact = Integer.parseInt(p[1]);
                score += impact;
                evidence.add(CreditUtils.evidenceToJson(p[2], "Multiplier: " + p[3], p[1], "Source: Credit Officer Input"));
            }
        }

        for (String[] p : posPatterns) {
            if (Pattern.compile(p[0], Pattern.CASE_INSENSITIVE).matcher(lower).find()) {
                int impact = Integer.parseInt(p[1].replace("+", ""));
                score += impact;
                evidence.add(CreditUtils.evidenceToJson(p[2], "Multiplier: " + p[3], p[1], "Source: Credit Officer Input"));
            }
        }

        if (evidence.isEmpty()) {
            evidence.add(CreditUtils.evidenceToJson("Officer Assessment", "Neutral", "0", "No quantifiable signals detected in notes"));
        }

        return new ScoreComponent(CreditUtils.clamp(score), evidence, 70);
    }

    // ============ COMPONENT 6: Collateral ============
    static ScoreComponent calcCollateral(JsonObj company) {
        List<String> evidence = new ArrayList<>();
        double coverage = company.getDouble("collateral.coverage");
        String type = company.getString("collateral.type");
        double value = company.getDouble("collateral.value");
        int score;

        if (coverage >= 2.0) { score = 90; evidence.add(CreditUtils.evidenceToJson("Collateral Coverage", f(coverage) + "x", "+40", "Excellent security coverage")); }
        else if (coverage >= 1.5) { score = 75; evidence.add(CreditUtils.evidenceToJson("Collateral Coverage", f(coverage) + "x", "+25", "Good security coverage")); }
        else if (coverage >= 1.2) { score = 60; evidence.add(CreditUtils.evidenceToJson("Collateral Coverage", f(coverage) + "x", "+10", "Adequate coverage")); }
        else if (coverage >= 1.0) { score = 45; evidence.add(CreditUtils.evidenceToJson("Collateral Coverage", f(coverage) + "x", "-5", "Thin coverage — marginal")); }
        else { score = 15; evidence.add(CreditUtils.evidenceToJson("Collateral Coverage", f(coverage) + "x", "-35", "Insufficient collateral — high exposure")); }

        evidence.add(CreditUtils.evidenceToJson("Collateral Type", type, "—", "Valued at " + CreditUtils.formatCurrency(value)));

        return new ScoreComponent(score, evidence, 80);
    }

    // ---- Helpers ----
    static String f(double v) { return String.format("%.2f", v); }
    static String f1(double v) { return String.format("%.1f", v); }

    static String extractField(String json, String field) {
        int idx = json.indexOf("\"" + field + "\":\"");
        if (idx < 0) return "0";
        int start = idx + field.length() + 4;
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : "0";
    }

    // ---- Score Component holder ----
    static class ScoreComponent {
        int score;
        int confidence;
        String evidenceJson;
        List<String> evidenceItems;

        ScoreComponent(int score, List<String> evidence, int confidence) {
            this.score = score;
            this.confidence = confidence;
            this.evidenceItems = evidence;
            this.evidenceJson = "[" + String.join(",", evidence) + "]";
        }
    }

    // ==============================================================
    // Minimal JSON parser (no external dependencies)
    // Handles nested objects, arrays of objects/numbers/strings
    // ==============================================================
    static class JsonObj {
        private final String raw;

        JsonObj(String json) { this.raw = json != null ? json.trim() : "{}"; }

        String getString(String path) {
            String val = getValueAt(path);
            if (val == null) return "";
            if (val.startsWith("\"")) return val.substring(1, val.length() - 1).replace("\\\"", "\"").replace("\\n", "\n");
            return val;
        }

        double getDouble(String path) {
            String val = getValueAt(path);
            if (val == null || val.equals("null")) return 0;
            val = val.replace("\"", "");
            try { return Double.parseDouble(val); } catch (Exception e) { return 0; }
        }

        int getInt(String path) { return (int) getDouble(path); }

        JsonArr getArray(String path) {
            String val = getValueAt(path);
            if (val == null || !val.startsWith("[")) return null;
            return new JsonArr(val);
        }

        private String getValueAt(String path) {
            String[] parts = path.split("\\.");
            String context = raw;
            for (int i = 0; i < parts.length; i++) {
                int keyIdx = context.indexOf("\"" + parts[i] + "\"");
                if (keyIdx < 0) return null;
                int colonIdx = context.indexOf(":", keyIdx + parts[i].length() + 2);
                if (colonIdx < 0) return null;
                int valStart = colonIdx + 1;
                while (valStart < context.length() && context.charAt(valStart) == ' ') valStart++;
                if (valStart >= context.length()) return null;

                char c = context.charAt(valStart);
                if (c == '{') {
                    int end = findClosing(context, valStart, '{', '}');
                    context = context.substring(valStart, end + 1);
                } else if (c == '[') {
                    int end = findClosing(context, valStart, '[', ']');
                    if (i == parts.length - 1) return context.substring(valStart, end + 1);
                    context = context.substring(valStart, end + 1);
                } else if (c == '"') {
                    int end = valStart + 1;
                    while (end < context.length()) {
                        if (context.charAt(end) == '\\') { end += 2; continue; }
                        if (context.charAt(end) == '"') break;
                        end++;
                    }
                    return context.substring(valStart, end + 1);
                } else {
                    int end = valStart;
                    while (end < context.length() && context.charAt(end) != ',' && context.charAt(end) != '}' && context.charAt(end) != ']') end++;
                    return context.substring(valStart, end).trim();
                }
            }
            return context;
        }

        static int findClosing(String s, int start, char open, char close) {
            int depth = 0;
            boolean inStr = false;
            for (int i = start; i < s.length(); i++) {
                char c = s.charAt(i);
                if (c == '\\' && inStr) { i++; continue; }
                if (c == '"') { inStr = !inStr; continue; }
                if (inStr) continue;
                if (c == open) depth++;
                else if (c == close) { depth--; if (depth == 0) return i; }
            }
            return s.length() - 1;
        }
    }

    static class JsonArr {
        private final String raw;
        private final List<String> items;

        JsonArr(String json) {
            this.raw = json;
            this.items = new ArrayList<>();
            parseItems();
        }

        private void parseItems() {
            String inner = raw.substring(1, raw.length() - 1).trim();
            if (inner.isEmpty()) return;
            int depth = 0; boolean inStr = false; int start = 0;
            for (int i = 0; i < inner.length(); i++) {
                char c = inner.charAt(i);
                if (c == '\\' && inStr) { i++; continue; }
                if (c == '"') { inStr = !inStr; continue; }
                if (inStr) continue;
                if (c == '{' || c == '[') depth++;
                else if (c == '}' || c == ']') depth--;
                else if (c == ',' && depth == 0) {
                    items.add(inner.substring(start, i).trim());
                    start = i + 1;
                }
            }
            items.add(inner.substring(start).trim());
        }

        int size() { return items.size(); }

        double getDouble(int idx) {
            if (idx >= items.size()) return 0;
            String v = items.get(idx).replace("\"", "");
            try { return Double.parseDouble(v); } catch (Exception e) { return 0; }
        }

        JsonObj getObj(int idx) {
            if (idx >= items.size()) return new JsonObj("{}");
            return new JsonObj(items.get(idx));
        }
    }
}
