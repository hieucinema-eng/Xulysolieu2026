import pandas as pd
import json
import re
import os

file_path = "Theo dõi Số liệu xử phạt 2026 (Câu trả lời).xlsx"
sheet_name = "DỮ LIỆU GỐC"
output_file = "violations_structure.json"

def parse_penalty(header):
    # Match patterns like "2.000K", "200k", "1.500K" inside the string
    # Patterns to look for: "2.000K", "(2.000K)", "Mức phạt 2.000K"
    match = re.search(r'([\d\.,]+)[kK]', header)
    if match:
        amount_str = match.group(1).replace('.', '').replace(',', '')
        try:
            return int(amount_str) * 1000
        except ValueError:
            return 0
    return 0

import sys
import io

# Fix for Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    try:
        print(f"Reading file: {file_path}...")
        # Read Excel file
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=0)
        
        print(f"Total columns found: {len(df.columns)}")
        
        # Columns from P (index 15) onwards
        if len(df.columns) <= 15:
            print("Error: Not enough columns in the Excel file.")
            return
            
        violation_columns = df.columns[15:]
        
        thuy_doan_violations = []
        thuy_doi_violations = []
        
        for idx, col_name in enumerate(violation_columns):
            original_idx = 15 + idx
            col_str = str(col_name).strip()
            
            penalty = parse_penalty(col_str)
            
            item = {
                "index": original_idx,
                "name": col_str,
                "penalty": penalty
            }
            
            # Categorize based on keywords
            # Case insensitive check
            col_lower = col_str.lower()
            
            if "thủy đoàn" in col_lower:
                thuy_doan_violations.append(item)
            elif "thủy đội" in col_lower:
                thuy_doi_violations.append(item)
            else:
                # If neither, log it
                # print(f"Skipping uncategorized column: {col_str}")
                pass

        structure = {
            "thuy_doan_violations": thuy_doan_violations,
            "thuy_doi_violations": thuy_doi_violations
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(structure, f, ensure_ascii=False, indent=4)
            
        print(f"Successfully generated {output_file}")
        print(f"Thủy Đoàn: {len(thuy_doan_violations)} items")
        print(f"Thủy Đội: {len(thuy_doi_violations)} items")
        
    except Exception as e:
        print(f"Error parsing Excel: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
