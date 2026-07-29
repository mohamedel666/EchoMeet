with open("frontend/src/pages/Meeting.jsx", "r", encoding="utf-8", errors="ignore") as f:
    for idx, line in enumerate(f):
        if "8002" in line:
            print(f"Meeting.jsx Line {idx+1}: {line.strip()}")

with open("frontend/src/pages/SummaryResults.jsx", "r", encoding="utf-8", errors="ignore") as f:
    for idx, line in enumerate(f):
        if "8002" in line:
            print(f"SummaryResults.jsx Line {idx+1}: {line.strip()}")
