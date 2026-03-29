# ============================================
# INTELLI-CREDIT — Java Bridge
# Calls Java engines via subprocess (JSON I/O)
# Falls back to Python if Java unavailable
# ============================================
import os
import json
import subprocess
import time

# Locate JDK relative to this file
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_JDK_HOME = os.path.join(_BASE_DIR, "jdk", "jdk-21.0.2.jdk", "Contents", "Home")
_JAVA_BIN = os.path.join(_JDK_HOME, "bin", "java")
_JAVA_CP = os.path.join(_BASE_DIR, "java")

# Check if Java is available
JAVA_AVAILABLE = os.path.isfile(_JAVA_BIN) and os.access(_JAVA_BIN, os.X_OK)


def run_java_engine(class_name: str, input_data: dict) -> dict:
    """
    Run a Java engine class with JSON input via stdin.
    Returns parsed JSON output from stdout.
    Raises RuntimeError if Java fails.
    """
    if not JAVA_AVAILABLE:
        raise RuntimeError("Java runtime not available")

    input_json = json.dumps(input_data)

    start = time.time()
    proc = subprocess.run(
        [_JAVA_BIN, "-cp", _JAVA_CP, class_name],
        input=input_json,
        capture_output=True,
        text=True,
        timeout=15,
    )
    elapsed = time.time() - start

    if proc.returncode != 0:
        raise RuntimeError(f"Java {class_name} failed (exit {proc.returncode}): {proc.stderr[:500]}")

    result = json.loads(proc.stdout)
    result["_javaTime"] = round(elapsed * 1000, 1)  # ms
    return result


def java_score(company: dict) -> dict:
    """Score a company using the Java ScoringEngine."""
    return run_java_engine("ScoringEngine", company)


def java_reconcile(company: dict) -> dict:
    """Reconcile GST data using the Java ReconciliationEngine."""
    return run_java_engine("ReconciliationEngine", company)


# ---- Fallback-aware wrappers ----
# These try Java first, fall back to Python

from scoring import calculate_full_score
from reconciliation import perform_reconciliation


def score_company(company: dict) -> dict:
    """Score using Java engine, fallback to Python."""
    try:
        if JAVA_AVAILABLE:
            result = java_score(company)
            print(f"  ⚡ Java ScoringEngine: {result.get('_javaTime', '?')}ms")
            return result
    except Exception as e:
        print(f"  ⚠ Java scoring failed, using Python fallback: {e}")

    return calculate_full_score(company)


def reconcile_company(company: dict) -> dict:
    """Reconcile using Java engine, fallback to Python."""
    try:
        if JAVA_AVAILABLE:
            result = java_reconcile(company)
            print(f"  ⚡ Java ReconciliationEngine: {result.get('_javaTime', '?')}ms")
            return result
    except Exception as e:
        print(f"  ⚠ Java reconciliation failed, using Python fallback: {e}")

    return perform_reconciliation(company)
