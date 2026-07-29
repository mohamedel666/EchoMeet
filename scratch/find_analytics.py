with open("frontend/src/pages/SummaryResults.jsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print("Occurrences of 'analytics' or similar:")
for idx, line in enumerate(lines):
    if "analytics" in line.lower():
        clean_line = line.strip().encode('ascii', 'ignore').decode('ascii')
        print(f"Line {idx+1}: {clean_line}")
