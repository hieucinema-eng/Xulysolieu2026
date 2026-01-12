import streamlit as st
import json
import os
import requests
import datetime
from pathlib import Path

# --- Configuration & Constants ---
PAGE_TITLE = "Hệ thống Quản lý Số liệu Xử phạt"
CONFIG_FILE = "config.json"
VIOLATIONS_FILE = "violations_structure.json"

# --- Helper Functions ---

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "sheetId": "",
        "sheetName": "Dữ liệu xử phạt",
        "scriptUrl": ""
    }

def save_config(config):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=4)

def load_violations_structure():
    if os.path.exists(VIOLATIONS_FILE):
        with open(VIOLATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"thuy_doan_violations": [], "thuy_doi_violations": []}

def format_currency(value):
    try:
        if not value: return "0"
        val = float(value)
        return "{:,.0f}".format(val).replace(",", ".")
    except:
        return str(value)

def extract_penalty(violation_name):
    # Extracts penalty amount from string like "Name (Mức phạt: 4.000K)"
    import re
    if not violation_name: return 0
    
    patterns = [
        r"Mức phạt[:\s]*([0-9.,]+)K",
        r"\(([0-9.,]+)K\)"
    ]
    
    for p in patterns:
        match = re.search(p, violation_name)
        if match:
            s = match.group(1).replace(",", "").replace(".", "")
            try:
                return float(s) * 1000
            except:
                pass
    return 0

# --- App Logic ---

def main():
    st.set_page_config(page_title=PAGE_TITLE, page_icon="🛡️", layout="wide")
    
    # Custom CSS
    st.markdown("""
        <style>
        .main-header { font-size: 24px; font-weight: bold; color: #0d6efd; margin-bottom: 20px; }
        .section-header { font-size: 18px; font-weight: bold; color: #495057; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .violation-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 10px; border-left: 5px solid #0d6efd; }
        .stButton button { width: 100%; border-radius: 5px; height: 45px; }
        .btn-primary { background-color: #0d6efd; color: white; }
        .btn-delete { background-color: #dc3545; color: white; }
        </style>
    """, unsafe_allow_html=True)

    st.markdown(f'<div class="main-header"><i class="fas fa-shield-alt"></i> {PAGE_TITLE}</div>', unsafe_allow_html=True)

    # Initialize Session State
    if 'config' not in st.session_state:
        st.session_state.config = load_config()
    if 'violations_thuy_doan' not in st.session_state:
        st.session_state.violations_thuy_doan = []
    if 'violations_thuy_doi' not in st.session_state:
        st.session_state.violations_thuy_doi = []
    
    # Load Violations Data
    violations_struct = load_violations_structure()
    
    # Tabs
    tab1, tab2, tab3 = st.tabs(["📝 NHẬP SỐ LIỆU", "🔍 TRA CỨU", "⚙️ CẤU HÌNH"])

    # --- TAB 1: INPUT ---
    with tab1:
        st.markdown('<div class="section-header">THÔNG TIN CƠ BẢN</div>', unsafe_allow_html=True)
        
        with st.form("input_form", clear_on_submit=False):
            col1, col2 = st.columns(2)
            
            with col1:
                quarter = st.selectbox("Quý kiểm tra *", ["", "Quý I-26", "Quý II-26", "Quý III-26", "Quý IV-26"])
                working_group = st.selectbox("Tổ công tác *", ["", "Tổ 01", "Tổ 02"])
                specialized_topic = st.selectbox("Thực hiện chuyên đề *", [
                    "",
                    "Chuyên đề vi phạm cồn",
                    "Chuyên đề vi phạm về Giấy ĐK, Đăng kiểm phương tiện",
                    "Chuyên đề vi phạm về quá vạch dấu mớn nước",
                    "Chuyên đề Vi phạm quy định về sử dụng giấy CNKNCM, CCCM"
                ])
                total_reports = st.number_input("Tổng số biên bản được lập *", min_value=0, value=0)
                reports_thuy_doi = st.number_input("Số biên bản Cấp Thủy đội", min_value=0, value=0)
                soldiers_participated = st.number_input("Số lượt chiến sĩ tham gia", min_value=0, value=0)
                vehicle_inspections = st.number_input("Số lượt kiểm tra phương tiện", min_value=0, value=0)
                alcohol_checks = st.number_input("Số lượt kiểm tra cồn", min_value=0, value=0)

            with col2:
                execution_date = st.date_input("Ngày thực hiện *", datetime.date.today())
                reporter = st.selectbox("Người báo cáo *", ["", "Hùng", "Quý", "Khác"])
                if reporter == "Khác":
                    reporter_other = st.text_input("Tên người báo cáo Khác *")
                else:
                    reporter_other = ""
                
                # Spacer
                st.write("") 
                st.write("")
                
                reports_phong = st.number_input("Số biên bản Cấp Phòng", min_value=0, value=0)
                ttks_shifts = st.number_input("Số ca thực hiện TTKS", min_value=0, value=0)
                legal_propaganda = st.number_input("Số lượt tuyên truyền pháp luật", min_value=0, value=0)
                reminder_cases = st.number_input("Số trường hợp tuyên truyền, nhắc nhở", min_value=0, value=0)

            st.write("---")
            
            # --- Violations Thủy Đoàn Section ---
            st.markdown('<div class="section-header">VI PHẠM CẤP THỦY ĐOÀN</div>', unsafe_allow_html=True)
            
            # Helper to manage dynamic list
            def add_thuy_doan():
                st.session_state.violations_thuy_doan.append({"type_index": 0, "count": 0, "custom_name": "", "custom_penalty": 0})
            
            def remove_thuy_doan(index):
                st.session_state.violations_thuy_doan.pop(index)

            # Button is outside form to work with session state
            
            # Render existing violations in form (but we need interactive state, so we might need to handle this carefully)
            # Streamlit forms don't allow button callbacks inside easily. 
            # We will use st.session_state to store the data and just render inputs here.
            
            # Since standard Streamlit forms don't support dynamic adding/removing items WELL inside the form context 
            # (it triggers rerun which might reset form state), we'll do the violation list logic OUTSIDE the main submit form 
            # OR use a workaround. The best way for data entry apps is NOT to use `with st.form` for the dynamic parts,
            # but to use autosave + a final "Submit" button that reads session state.
            
        # Refactoring: We will NOT use `with st.form` for the whole page because it freezes dynamic adding of rows.
        # We will use regular widgets.
        
    # --- REDOING TAB 1 WITH INTERACTIVE WIDGETS ---
    with tab1:
        # Clear previous elements to avoid duplication if I wrote any
        pass

    # Re-layout Tab 1 without `with st.form` for better dynamic handling
    with tab1:
        st.markdown('<div class="section-header">THÔNG TIN CƠ BẢN</div>', unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        with col1:
            quarter = st.selectbox("Quý kiểm tra *", ["", "Quý I-26", "Quý II-26", "Quý III-26", "Quý IV-26"], key="quarter")
            working_group = st.selectbox("Tổ công tác *", ["", "Tổ 01", "Tổ 02"], key="working_group")
            specialized_topic = st.selectbox("Thực hiện chuyên đề *", ["", "Chuyên đề vi phạm cồn", "Chuyên đề vi phạm về Giấy ĐK, Đăng kiểm phương tiện", "Chuyên đề vi phạm về quá vạch dấu mớn nước", "Chuyên đề Vi phạm quy định về sử dụng giấy CNKNCM, CCCM"], key="specialized_topic")
            total_reports = st.number_input("Tổng số biên bản được lập *", min_value=0, value=0, key="total_reports")
            reports_thuy_doi = st.number_input("Số biên bản Cấp Thủy đội", min_value=0, value=0, key="reports_thuy_doi")
            soldiers_participated = st.number_input("Số lượt chiến sĩ tham gia", min_value=0, value=0, key="soldiers_participated")
            vehicle_inspections = st.number_input("Số lượt kiểm tra phương tiện", min_value=0, value=0, key="vehicle_inspections")
            alcohol_checks = st.number_input("Số lượt kiểm tra cồn", min_value=0, value=0, key="alcohol_checks")

        with col2:
            execution_date = st.date_input("Ngày thực hiện *", datetime.date.today(), key="execution_date")
            reporter = st.selectbox("Người báo cáo *", ["", "Hùng", "Quý", "Khác"], key="reporter")
            if reporter == "Khác":
                reporter_other = st.text_input("Tên người báo cáo Khác *", key="reporter_other")
            else:
                reporter_other = ""
            
            st.write("") 
            st.write("")
            reports_phong = st.number_input("Số biên bản Cấp Phòng", min_value=0, value=0, key="reports_phong")
            ttks_shifts = st.number_input("Số ca thực hiện TTKS", min_value=0, value=0, key="ttks_shifts")
            legal_propaganda = st.number_input("Số lượt tuyên truyền pháp luật", min_value=0, value=0, key="legal_propaganda")
            reminder_cases = st.number_input("Số trường hợp tuyên truyền, nhắc nhở", min_value=0, value=0, key="reminder_cases")

        st.write("---")

        # --- VIOLATIONS THUY DOAN ---
        st.markdown('<div class="section-header">VI PHẠM CẤP THỦY ĐOÀN</div>', unsafe_allow_html=True)
        
        # Prepare options for dropdown
        thuy_doan_opts = ["-- Chọn vi phạm --"] + [v["name"] for v in violations_struct.get("thuy_doan_violations", [])] + ["Nhập tùy chỉnh (Ghi chú khác)"]
        
        # Add button
        if st.button("➕ THÊM VI PHẠM THỦY ĐOÀN", key="add_td"):
            st.session_state.violations_thuy_doan.append({"name": "", "count": 1, "penalty": 0.0, "is_custom": False})
        
        # List items
        # We iterate by index to allow modification
        indices_to_remove_td = []
        for i, violation in enumerate(st.session_state.violations_thuy_doan):
            with st.container():
                st.markdown(f'<div class="violation-box"><strong>Vi phạm #{i+1}</strong>', unsafe_allow_html=True)
                c1, c2, c3 = st.columns([3, 1, 0.5])
                
                with c1:
                    # Select box
                    current_idx = 0
                    if violation.get("name") in thuy_doan_opts:
                        current_idx = thuy_doan_opts.index(violation["name"])
                    
                    selected_opt = st.selectbox(f"Loại vi phạm", thuy_doan_opts, index=current_idx, key=f"td_sel_{i}")
                    
                    # Update state
                    if selected_opt != violation["name"]:
                        violation["name"] = selected_opt
                        if selected_opt == "Nhập tùy chỉnh (Ghi chú khác)":
                            violation["is_custom"] = True
                            violation["penalty"] = 0.0
                        elif selected_opt != "-- Chọn vi phạm --":
                            violation["is_custom"] = False
                            violation["penalty"] = extract_penalty(selected_opt)
                        else:
                            violation["is_custom"] = False
                            violation["penalty"] = 0.0

                    if violation["is_custom"]:
                        custom_name = st.text_input("Tên lỗi vi phạm", value=violation.get("custom_name", ""), key=f"td_custom_name_{i}")
                        violation["custom_name"] = custom_name
                        custom_penalty = st.number_input("Mức phạt (VND)", min_value=0.0, step=1000.0, value=float(violation.get("penalty", 0)), key=f"td_custom_penalty_{i}")
                        violation["penalty"] = custom_penalty
                
                with c2:
                    count = st.number_input("Số lượt", min_value=1, value=int(violation.get("count", 1)), key=f"td_count_{i}")
                    violation["count"] = count
                    
                    st.text_input("Mức phạt", value=format_currency(violation.get("penalty", 0)), disabled=True, key=f"td_pen_disp_{i}")
                
                with c3:
                    st.write("")
                    st.write("")
                    if st.button("🗑️", key=f"del_td_{i}"):
                        indices_to_remove_td.append(i)
                st.markdown('</div>', unsafe_allow_html=True)

        # Remove deleted items
        if indices_to_remove_td:
            for i in sorted(indices_to_remove_td, reverse=True):
                del st.session_state.violations_thuy_doan[i]
            st.rerun()

        # --- VIOLATIONS THUY DOI ---
        st.markdown('<div class="section-header">VI PHẠM CẤP THỦY ĐỘI</div>', unsafe_allow_html=True)
        
        thuy_doi_opts = ["-- Chọn vi phạm --"] + [v["name"] for v in violations_struct.get("thuy_doi_violations", [])] + ["Nhập tùy chỉnh (Ghi chú khác)"]
        
        if st.button("➕ THÊM VI PHẠM THỦY ĐỘI", key="add_doi"):
            st.session_state.violations_thuy_doi.append({"name": "", "count": 1, "penalty": 0.0, "is_custom": False})
            
        indices_to_remove_doi = []
        for i, violation in enumerate(st.session_state.violations_thuy_doi):
            with st.container():
                st.markdown(f'<div class="violation-box"><strong>Vi phạm #{i+1}</strong>', unsafe_allow_html=True)
                c1, c2, c3 = st.columns([3, 1, 0.5])
                
                with c1:
                    current_idx = 0
                    if violation.get("name") in thuy_doi_opts:
                        current_idx = thuy_doi_opts.index(violation["name"])
                    
                    selected_opt = st.selectbox(f"Loại vi phạm", thuy_doi_opts, index=current_idx, key=f"doi_sel_{i}")
                    
                    if selected_opt != violation["name"]:
                        violation["name"] = selected_opt
                        if selected_opt == "Nhập tùy chỉnh (Ghi chú khác)":
                            violation["is_custom"] = True
                            violation["penalty"] = 0.0
                        elif selected_opt != "-- Chọn vi phạm --":
                            violation["is_custom"] = False
                            violation["penalty"] = extract_penalty(selected_opt)
                        else:
                            violation["is_custom"] = False
                            violation["penalty"] = 0.0

                    if violation["is_custom"]:
                        custom_name = st.text_input("Tên lỗi vi phạm", value=violation.get("custom_name", ""), key=f"doi_custom_name_{i}")
                        violation["custom_name"] = custom_name
                        custom_penalty = st.number_input("Mức phạt (VND)", min_value=0.0, step=1000.0, value=float(violation.get("penalty", 0)), key=f"doi_custom_penalty_{i}")
                        violation["penalty"] = custom_penalty
                
                with c2:
                    count = st.number_input("Số lượt", min_value=1, value=int(violation.get("count", 1)), key=f"doi_count_{i}")
                    violation["count"] = count
                    st.text_input("Mức phạt", value=format_currency(violation.get("penalty", 0)), disabled=True, key=f"doi_pen_disp_{i}")

                with c3:
                    st.write("")
                    st.write("")
                    if st.button("🗑️", key=f"del_doi_{i}"):
                        indices_to_remove_doi.append(i)
                st.markdown('</div>', unsafe_allow_html=True)

        if indices_to_remove_doi:
            for i in sorted(indices_to_remove_doi, reverse=True):
                del st.session_state.violations_thuy_doi[i]
            st.rerun()

        # --- SUBMIT ---
        st.write("---")
        if st.button("💾 LƯU SỐ LIỆU", type="primary", use_container_width=True):
            # 1. Validation
            errors = []
            if not quarter: errors.append("Vui lòng chọn Quý kiểm tra")
            if not working_group: errors.append("Vui lòng chọn Tổ công tác")
            if not execution_date: errors.append("Vui lòng chọn Ngày thực hiện")
            if not reporter: errors.append("Vui lòng chọn Người báo cáo")
            if reporter == "Khác" and not reporter_other: errors.append("Vui lòng nhập tên người báo cáo khác")
            
            if errors:
                for e in errors: st.error(e)
            else:
                # 2. Prepare Data
                # Convert violations to format expected by Apps Script
                viol_td_list = []
                for v in st.session_state.violations_thuy_doan:
                    name = v.get("custom_name") if v.get("is_custom") else v.get("name")
                    if name and name != "-- Chọn vi phạm --":
                        viol_td_list.append({
                            "type": "custom" if v.get("is_custom") else "standard",
                            "name": name,
                            "penalty": v.get("penalty", 0),
                            "penaltyExpected": v.get("penalty", 0),
                            "count": v.get("count", 1)
                        })

                viol_doi_list = []
                for v in st.session_state.violations_thuy_doi:
                    name = v.get("custom_name") if v.get("is_custom") else v.get("name")
                    if name and name != "-- Chọn vi phạm --":
                        viol_doi_list.append({
                            "type": "custom" if v.get("is_custom") else "standard",
                            "name": name,
                            "penalty": v.get("penalty", 0),
                            "penaltyExpected": v.get("penalty", 0),
                            "count": v.get("count", 1)
                        })
                
                payload = {
                    "timestamp": datetime.datetime.now().isoformat(),
                    "quarter": quarter,
                    "executionDate": execution_date.strftime("%Y-%m-%d"),
                    "workingGroup": working_group,
                    "reporter": reporter_other if reporter == "Khác" else reporter,
                    "specializedTopic": specialized_topic,
                    "totalReports": str(total_reports),
                    "reportsPhong": str(reports_phong),
                    "reportsThuyDoi": str(reports_thuy_doi),
                    "ttksShifts": str(ttks_shifts),
                    "soldiersParticipated": str(soldiers_participated),
                    "legalPropaganda": str(legal_propaganda),
                    "vehicleInspections": str(vehicle_inspections),
                    "reminderCases": str(reminder_cases),
                    "alcoholChecks": str(alcohol_checks),
                    "violations": {
                        "thuyDoan": viol_td_list,
                        "thuyDoi": viol_doi_list
                    }
                }
                
                # 3. Send to Server
                script_url = st.session_state.config.get("scriptUrl", "")
                if not script_url:
                    st.error("Chưa cấu hình Web App URL! Vui lòng vào tab Cấu hình.")
                else:
                    with st.spinner("Đang gửi dữ liệu lên Google Sheet..."):
                        try:
                            request_body = {
                                "action": "append",
                                "sheetId": st.session_state.config.get("sheetId"),
                                "sheetName": st.session_state.config.get("sheetName"),
                                "data": payload
                            }
                            # Send POST request
                            # Note: Apps Script redirect handling is tricky in pure requests sometimes.
                            # But usually requests.post(url, json=data, allow_redirects=True) works fine for deployed web apps.
                            response = requests.post(
                                script_url,
                                json=request_body,
                                headers={"Content-Type": "application/json"}
                            )
                            
                            if response.status_code == 200:
                                res_json = response.json()
                                if res_json.get("success"):
                                    st.success("✅ " + (res_json.get("message") or "Đã lưu thành công!"))
                                    # Reset violations lists
                                    st.session_state.violations_thuy_doan = []
                                    st.session_state.violations_thuy_doi = []
                                    st.rerun()
                                else:
                                    st.error("Lỗi từ Server: " + str(res_json.get("error")))
                            else:
                                st.error(f"Lỗi kết nối: HTTP {response.status_code}")
                                st.text(response.text)
                        
                        except Exception as e:
                            st.error(f"Đã xảy ra lỗi: {e}")

    # --- TAB 2: SEARCH ---
    with tab2:
        st.markdown('<div class="section-header">TRA CỨU SỐ LIỆU</div>', unsafe_allow_html=True)
        
        c1, c2, c3 = st.columns(3)
        with c1:
            search_start = st.date_input("Từ ngày", datetime.date.today().replace(day=1))
        with c2:
            search_end = st.date_input("Đến ngày", datetime.date.today())
        with c3:
            search_group = st.selectbox("Tổ công tác", ["", "Tổ 01", "Tổ 02"], key="search_grp")
            
        if st.button("🔍 TÌM KIẾM", key="btn_search"):
            script_url = st.session_state.config.get("scriptUrl", "")
            if not script_url:
                st.error("Chưa cấu hình URL!")
            else:
                with st.spinner("Đang tìm kiếm..."):
                    try:
                        req_body = {
                            "action": "search",
                            "sheetId": st.session_state.config.get("sheetId"),
                            "sheetName": st.session_state.config.get("sheetName"),
                            "filters": {
                                "startDate": search_start.strftime("%Y-%m-%d"),
                                "endDate": search_end.strftime("%Y-%m-%d"),
                                "workingGroup": search_group
                            }
                        }
                        response = requests.post(script_url, json=req_body)
                        data = response.json()
                        
                        if data.get("success"):
                            records = data.get("data", [])
                            st.success(f"Tìm thấy {len(records)} bản ghi")
                            
                            if records:
                                # Process for DataFrame
                                import pandas as pd
                                
                                # Simplified display
                                simple_data = []
                                for r in records:
                                    simple_data.append({
                                        "Ngày": r.get('executionDate', '')[:10],
                                        "Tổ": r.get('workingGroup'),
                                        "Người báo cáo": r.get('reporter'),
                                        "Tổng BB": r.get('totalReports'),
                                        "BB Thủy Đội": r.get('reportsThuyDoi'),
                                        "Phạt dự kiến": 0 # TODO: Calculate from violations
                                    })
                                
                                st.dataframe(pd.DataFrame(simple_data), use_container_width=True)
                                
                                # Detailed JSON view for debug
                                with st.expander("Xem dữ liệu chi tiết (JSON)"):
                                    st.json(records)
                        else:
                            st.warning("Không tìm thấy kết quả hoặc lỗi server.")
                            
                    except Exception as e:
                        st.error(f"Lỗi: {e}")

    # --- TAB 3: CONFIG ---
    with tab3:
        st.markdown('<div class="section-header">CẤU HÌNH HỆ THỐNG</div>', unsafe_allow_html=True)
        
        new_sheet_id = st.text_input("Google Sheet ID", value=st.session_state.config.get("sheetId", ""))
        new_sheet_name = st.text_input("Tên Sheet (Tab Name)", value=st.session_state.config.get("sheetName", "Dữ liệu xử phạt"))
        new_script_url = st.text_input("Web App URL (Apps Script)", value=st.session_state.config.get("scriptUrl", ""))
        
        if st.button("Lưu Cấu Hình"):
            new_config = {
                "sheetId": new_sheet_id,
                "sheetName": new_sheet_name,
                "scriptUrl": new_script_url
            }
            save_config(new_config)
            st.session_state.config = new_config
            st.success("Đã lưu cấu hình!")

if __name__ == "__main__":
    main()
