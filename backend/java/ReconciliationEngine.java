// ============================================
// INTELLI-CREDIT — Java Reconciliation Engine
// GST Reconciliation + Fraud Detection (stdin/stdout JSON)
// ============================================
import java.io.*;
import java.util.*;

public class ReconciliationEngine {

    static final String[] MONTHS = {
        "Apr", "May", "Jun", "Jul", "Aug", "Sep",
        "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
    };

    // ============ MAIN ============
    public static void main(String[] args) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }

        ScoringEngine.JsonObj company = new ScoringEngine.JsonObj(sb.toString());

        // Extract GST data arrays
        ScoringEngine.JsonArr gstr3b  = company.getArray("gstData.gstr3b");
        ScoringEngine.JsonArr gstr2a  = company.getArray("gstData.gstr2a");
        ScoringEngine.JsonArr bank    = company.getArray("gstData.bankInflows");
        ScoringEngine.JsonArr flags   = company.getArray("gstData.mismatchFlags");

        int months = gstr3b != null ? gstr3b.size() : 0;

        // ---- Build monthly comparison table ----
        List<String> tableRows = new ArrayList<>();
        double totalMismatch = 0;
        double totalGst3b = 0;
        int mismatchCount = 0;

        for (int i = 0; i < months; i++) {
            double g3b = gstr3b.getDouble(i);
            double g2a = gstr2a.getDouble(i);
            double bnk = bank.getDouble(i);
            double diff = Math.abs(g3b - g2a);
            double pctDiff = g2a > 0 ? diff / g2a * 100 : 0;
            boolean isMismatch = pctDiff > 10;

            totalGst3b += g3b;
            if (isMismatch) { totalMismatch += diff; mismatchCount++; }

            String status = isMismatch ? "Mismatch" : "OK";
            String month = i < MONTHS.length ? MONTHS[i] : "M" + (i + 1);

            StringBuilder row = new StringBuilder("{");
            row.append("\"month\":\"").append(month).append("\",");
            row.append("\"gstr3b\":").append(g3b).append(",");
            row.append("\"gstr2a\":").append(g2a).append(",");
            row.append("\"bankInflow\":").append(bnk).append(",");
            row.append("\"difference\":").append(String.format("%.2f", diff)).append(",");
            row.append("\"pctDiff\":").append(String.format("%.1f", pctDiff)).append(",");
            row.append("\"status\":\"").append(status).append("\"");
            row.append("}");
            tableRows.add(row.toString());
        }

        // ---- Detect fraud patterns ----
        List<String> anomalies = new ArrayList<>();
        int fraudScore = 0;

        // Pattern 1: Circular trading (consecutive months with exact same values)
        for (int i = 1; i < months; i++) {
            double prev = gstr3b.getDouble(i - 1);
            double curr = gstr3b.getDouble(i);
            if (Math.abs(prev - curr) < 0.01 && prev > 100) {
                fraudScore += 15;
                String m1 = i - 1 < MONTHS.length ? MONTHS[i - 1] : "M" + i;
                String m2 = i < MONTHS.length ? MONTHS[i] : "M" + (i + 1);
                anomalies.add(anomalyJson("Circular Trading Pattern",
                    "Identical GSTR-3B values in " + m1 + " and " + m2 + " (₹" + CreditUtils.formatLakhs(prev) + ")",
                    "high", m1 + "-" + m2));
            }
        }

        // Pattern 2: Round-tripping (bank inflow >> GST turnover in any month)
        for (int i = 0; i < months; i++) {
            double g3b = gstr3b.getDouble(i);
            double bnk = bank.getDouble(i);
            if (g3b > 0 && bnk / g3b > 1.5) {
                fraudScore += 10;
                String month = i < MONTHS.length ? MONTHS[i] : "M" + (i + 1);
                anomalies.add(anomalyJson("Round-Tripping Indicator",
                    "Bank inflow exceeds GST turnover by " + String.format("%.0f%%", (bnk / g3b - 1) * 100) + " in " + month,
                    "medium", month));
            }
        }

        // Pattern 3: Large discrepancy months (>25% difference between 3B and 2A)
        for (int i = 0; i < months; i++) {
            double g3b = gstr3b.getDouble(i);
            double g2a = gstr2a.getDouble(i);
            if (g2a > 0) {
                double pct = Math.abs(g3b - g2a) / g2a * 100;
                if (pct > 25) {
                    fraudScore += 8;
                    String month = i < MONTHS.length ? MONTHS[i] : "M" + (i + 1);
                    anomalies.add(anomalyJson("ITC Mismatch",
                        String.format("%.0f%%", pct) + " gap between GSTR-3B and GSTR-2A in " + month,
                        pct > 40 ? "high" : "medium", month));
                }
            }
        }

        // Pattern 4: Duplicate GSTIN flag check
        if (flags != null) {
            for (int i = 0; i < flags.size(); i++) {
                ScoringEngine.JsonObj flag = flags.getObj(i);
                if ("duplicate_gstin".equals(flag.getString("type"))) {
                    fraudScore += 20;
                    anomalies.add(anomalyJson("Duplicate GSTIN",
                        flag.getString("detail"), "critical", flag.getString("month")));
                }
            }
        }

        fraudScore = Math.min(100, fraudScore);

        // ---- Summary metrics ----
        double avgDiscrepancy = totalGst3b > 0 ? (totalMismatch / totalGst3b * 100) : 0;

        // ---- Build output JSON ----
        StringBuilder out = new StringBuilder("{");
        out.append("\"table\":[").append(String.join(",", tableRows)).append("],");
        out.append("\"anomalies\":[").append(String.join(",", anomalies)).append("],");
        out.append("\"fraudScore\":").append(fraudScore).append(",");
        out.append("\"mismatchCount\":").append(mismatchCount).append(",");
        out.append("\"totalMismatch\":").append(String.format("%.2f", totalMismatch)).append(",");
        out.append("\"avgDiscrepancy\":").append(String.format("%.1f", avgDiscrepancy)).append(",");
        out.append("\"totalMonths\":").append(months).append(",");
        out.append("\"engine\":\"java\"");
        out.append("}");

        System.out.println(out);
    }

    // ---- Anomaly JSON builder ----
    static String anomalyJson(String type, String detail, String severity, String month) {
        return "{\"type\":\"" + CreditUtils.escapeJson(type) + "\"," +
               "\"detail\":\"" + CreditUtils.escapeJson(detail) + "\"," +
               "\"severity\":\"" + severity + "\"," +
               "\"month\":\"" + month + "\"}";
    }
}
