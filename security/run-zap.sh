#!/bin/bash
# Script to run OWASP ZAP Baseline Scan via Docker
TARGET_URL=${1:-"http://host.docker.internal:4000/api/docs"}
REPORT_DIR="./security/reports"

mkdir -p "$REPORT_DIR"

echo "=========================================================="
echo "Starting OWASP ZAP Baseline Security Scan on: $TARGET_URL"
echo "=========================================================="

docker run --rm -v "$(pwd)/security:/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
    -t "$TARGET_URL" \
    -c /zap/wrk/zap-baseline.conf \
    -r zap-report.html \
    -J zap-report.json

EXIT_CODE=$?
echo "ZAP scan finished with exit code: $EXIT_CODE"
echo "Reports generated at: $REPORT_DIR/zap-report.html"
exit $EXIT_CODE
