// ============================================
// INTELLI-CREDIT — Credit Utilities (Java)
// Shared helpers for scoring & reconciliation
// ============================================
import java.util.*;
import java.text.DecimalFormat;

public class CreditUtils {

    // ---- Currency Formatting (Indian) ----
    public static String formatCurrency(double amount) {
        if (amount >= 10_000_000) {
            return String.format("₹%.2f Cr", amount / 10_000_000);
        }
        if (amount >= 100_000) {
            return String.format("₹%.2f L", amount / 100_000);
        }
        return String.format("₹%,.0f", amount);
    }

    public static String formatLakhs(double val) {
        return String.format("₹%,.0f L", val);
    }

    // ---- Score Clamping ----
    public static int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }

    public static double clamp(double score) {
        return Math.max(0.0, Math.min(100.0, score));
    }

    // ---- Risk Classification ----
    public static String getScoreClass(int score) {
        if (score >= 70) return "low";
        if (score >= 50) return "medium";
        if (score >= 30) return "high";
        return "critical";
    }

    // ---- Credit Rating Score Map ----
    public static int getRatingScore(String rating) {
        return switch (rating) {
            case "AAA"  -> 15;
            case "AA+"  -> 13;
            case "AA"   -> 12;
            case "A+"   -> 10;
            case "A"    -> 9;
            case "A-"   -> 8;
            case "BBB+" -> 5;
            case "BBB"  -> 3;
            case "BB+"  -> 0;
            case "BB"   -> -3;
            case "B"    -> -8;
            case "C"    -> -15;
            case "D"    -> -25;
            default     -> 0;
        };
    }

    // ---- Severity Impact Map ----
    public static int getSeverityImpact(String severity) {
        return switch (severity) {
            case "critical" -> -20;
            case "high"     -> -12;
            case "medium"   -> -6;
            case "low"      -> -2;
            default         -> 0;
        };
    }

    public static int getLitigationRiskImpact(String risk) {
        return switch (risk) {
            case "critical" -> -22;
            case "high"     -> -12;
            case "medium"   -> -5;
            case "low"      -> -2;
            default         -> 0;
        };
    }

    // ---- JSON Helpers (minimal, no external libs) ----
    public static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public static int parseIntSafe(String val) {
        if (val == null || val.isEmpty()) return 0;
        try {
            return Integer.parseInt(val.replace("+", "").replace("—", "0").trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    // ---- Evidence Entry JSON Builder ----
    public static String evidenceToJson(String factor, String value, String impact, String detail) {
        return evidenceToJson(factor, value, impact, detail, "");
    }

    public static String evidenceToJson(String factor, String value, String impact, String detail, String url) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"factor\":\"").append(escapeJson(factor)).append("\",");
        sb.append("\"value\":\"").append(escapeJson(value)).append("\",");
        sb.append("\"impact\":\"").append(escapeJson(impact)).append("\",");
        sb.append("\"detail\":\"").append(escapeJson(detail)).append("\"");
        if (url != null && !url.isEmpty()) {
            sb.append(",\"url\":\"").append(escapeJson(url)).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }
}
