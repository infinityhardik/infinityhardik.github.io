import pandas as pd
import json
import os

# ============================================================
# 🛠️ SETTINGS (Only change values here)
# ============================================================

# 👉 Use FULL PATH instead of just file name
EXCEL_FILE = r"C:\Users\Narmada Sales\Desktop\ProductLedger.xls"

# 👉 Output path (where JSON will be saved)
OUTPUT_JSON = r"C:\Users\Narmada Sales\Desktop\products.json"

# 👉 Excel sheet name (must match exactly)
EXCEL_SHEET_NAME = "Sheet1"

# 👉 JSON main key (you can name this anything)
JSON_ROOT_KEY = "productDirectory"

# 👉 JSON format
# True  = compressed (small size)
# False = readable (formatted)
MINIFY_JSON = True


# ============================================================
# 📂 STEP 1: Check if file exists
# ============================================================

if not os.path.exists(EXCEL_FILE):
    print("❌ Excel file not found. Please check the path.")
    exit()


# ============================================================
# 📖 STEP 2: Read Excel file
# ============================================================

# Load Excel data into a table format
df = pd.read_excel(EXCEL_FILE, sheet_name=EXCEL_SHEET_NAME)


# ============================================================
# 🧹 STEP 3: Clean the data (VERY IMPORTANT)
# ============================================================

# 👉 Replace empty Excel cells with empty string ""
# (instead of null, so JSON will show "" instead of null)
df = df.where(pd.notnull(df), "")

# 👉 Convert date columns into text (JSON does not support Excel date format)
for column in df.columns:
    if pd.api.types.is_datetime64_any_dtype(df[column]):
        df[column] = df[column].astype(str)


# 👉 Optional: Remove completely empty rows (like online tools do)
df = df.dropna(how="all")


# ============================================================
# 🔄 STEP 4: Convert Excel → JSON structure
# ============================================================

# Convert each row into a JSON object
data = df.to_dict(orient="records")

# Add custom root key (final structure)
# Example:
# {
#   "productDirectory": [ ...data... ]
# }
final_data = {
    JSON_ROOT_KEY: data
}


# ============================================================
# 💾 STEP 5: Save JSON file
# ============================================================

with open(OUTPUT_JSON, "w", encoding="utf-8") as file:

    if MINIFY_JSON:
        # 👉 Compressed JSON (no spaces, smaller file)
        json.dump(final_data, file, separators=(",", ":"), ensure_ascii=False)
    else:
        # 👉 Readable JSON (with indentation)
        json.dump(final_data, file, indent=4, ensure_ascii=False)


# ============================================================
# ✅ DONE
# ============================================================

print("✅ Excel converted to JSON successfully!")
print(f"📁 File saved at: {OUTPUT_JSON}")
print(f"🧾 JSON root key: {JSON_ROOT_KEY}")

if MINIFY_JSON:
    print("📦 JSON is compressed (minified)")
else:
    print("📄 JSON is readable (formatted)")


# ============================================================
# 📌 PREREQUISITES (Do this only once)
# ============================================================

# 1. Install Python:
#    https://www.python.org/

# 2. Install required libraries:
#    pip install pandas openpyxl


# ============================================================
# 📌 HOW TO USE (Simple Steps)
# ============================================================

# 1. Put your Excel file anywhere on your computer

# 2. Copy full file path and update EXCEL_FILE
#    Example:
#    r"C:\Users\YourName\Desktop\data.xlsx"

# 3. Set EXCEL_SHEET_NAME (must match Excel exactly)

# 4. Set JSON_ROOT_KEY (your desired output structure)

# 5. Set OUTPUT_JSON path

# 6. Run the script:
#    python script.py

# 7. JSON file will be created at the given location


# ============================================================
# 💡 IMPORTANT NOTES
# ============================================================

# ✔ Empty Excel cells → null in JSON (correct behavior)
# ✔ Dates → converted to readable text
# ✔ Fully empty rows → automatically removed

# ✔ Example Output:
# {
#   "productDirectory": [
#       {"Product": "Item1", "Price": 100},
#       {"Product": "Item2", "Price": null}
#   ]
# }

# ✔ Use r"..." for Windows paths to avoid errors
# ✔ Sheet name is case-sensitive
# ✔ Output folder must already exist
# ============================================================