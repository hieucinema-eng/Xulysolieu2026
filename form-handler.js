// Xử lý form động cho vi phạm Thủy Đoàn và Thủy Đội

let violationsStructure = null;
let thuyDoanViolationCount = 0;
let thuyDoiViolationCount = 0;

// Load cấu trúc vi phạm
async function loadViolationsStructure() {
    try {
        // Sử dụng dữ liệu từ violations-data.js (nếu có)
        if (typeof window !== 'undefined' && window.VIOLATIONS_DATA) {
            violationsStructure = window.VIOLATIONS_DATA;
            console.log('Đã load dữ liệu vi phạm từ violations-data.js:', {
                thuyDoan: violationsStructure.thuy_doan_violations?.length || 0,
                thuyDoi: violationsStructure.thuy_doi_violations?.length || 0
            });
            return true;
        }
        
        // Thử load từ JSON file
        try {
            const response = await fetch('violations_structure.json');
            if (response.ok) {
                violationsStructure = await response.json();
                console.log('Đã load dữ liệu vi phạm từ violations_structure.json:', {
                    thuyDoan: violationsStructure.thuy_doan_violations?.length || 0,
                    thuyDoi: violationsStructure.thuy_doi_violations?.length || 0
                });
                return true;
            }
        } catch (fetchError) {
            console.warn('Không thể load violations_structure.json:', fetchError);
        }
        
        // Fallback: khởi tạo empty structure
        violationsStructure = {
            thuy_doan_violations: [],
            thuy_doi_violations: []
        };
        console.warn('Không có dữ liệu vi phạm. Chỉ có thể sử dụng chức năng "Nhập tùy chỉnh"');
        return true;
    } catch (error) {
        console.error('Lỗi khi load dữ liệu vi phạm:', error);
        violationsStructure = {
            thuy_doan_violations: [],
            thuy_doi_violations: []
        };
        return true;
    }
}

// Tạo UI cho một vi phạm Thủy Đoàn
function createThuyDoanViolationItem() {
    thuyDoanViolationCount++;
    const itemId = `thuy-doan-${thuyDoanViolationCount}`;
    const container = document.getElementById('thuy-doan-violations-list');
    
    const item = document.createElement('div');
    item.className = 'violation-item';
    item.id = itemId;
    
    const violations = violationsStructure?.thuy_doan_violations || violationsStructure?.thuyDoanViolations || [];
    
    let html = `
        <div class="violation-item-header">
            <span class="violation-item-title">Vi phạm Thủy Đoàn #${thuyDoanViolationCount}</span>
            <button type="button" class="remove-violation-btn" onclick="removeViolationItem('${itemId}')">
                <i class="fas fa-trash-alt"></i> Xóa
            </button>
        </div>
        <div class="violation-fields">
            <div class="form-group" style="grid-column: 1 / -1;">
                <label>Chọn loại vi phạm</label>
                <select class="violation-type-select" data-item="${itemId}" style="width: 100%;">
                    <option value="">-- Chọn vi phạm --</option>
                    <option value="custom">Nhập tùy chỉnh (Ghi chú khác)</option>
    `;
    
    violations.forEach((violation, index) => {
        if (violation.name && !violation.name.includes('Ghi chú - Trường hợp khác')) {
            const shortName = violation.name.replace('Cấp Thủy Đoàn: ', '');
            const penalty = extractPenaltyFromName(violation.name);
            html += `<option value="${index}" data-penalty="${penalty}">${shortName}</option>`;
        }
    });
    
    html += `
                </select>
            </div>
            <div class="standard-violation-fields" id="${itemId}-standard">
                <div class="form-group">
                    <label>Số lượt vi phạm</label>
                    <input type="number" class="violation-count" min="0" value="0" data-item="${itemId}">
                </div>
                <div class="form-group">
                    <label>Mức phạt dự kiến (VND)</label>
                    <input type="number" class="violation-penalty-expected" min="0" placeholder="Tự động từ loại vi phạm" data-item="${itemId}" readonly>
                </div>
            </div>
            <div class="form-group custom-violation-fields" id="${itemId}-custom" style="display: none; grid-column: 1 / -1;">
                <label>Tên lỗi vi phạm (Ghi chú khác)</label>
                <input type="text" class="custom-violation-name" placeholder="Ví dụ: Điều 35 - Vi phạm quy định về xếp, dỡ hàng hóa [Các khoản khác...]" data-item="${itemId}">
                <div class="form-group" style="margin-top: 10px;">
                    <label>Số lượt vi phạm</label>
                    <input type="number" class="custom-violation-count" min="0" value="0" data-item="${itemId}">
                </div>
                <div class="form-group">
                    <label>Mức phạt (VND)</label>
                    <input type="number" class="custom-violation-penalty" min="0" placeholder="Ví dụ: 12500000" data-item="${itemId}">
                </div>
            </div>
        </div>
    `;
    
    item.innerHTML = html;
    container.appendChild(item);
    
    // Event listener cho select
    const select = item.querySelector('.violation-type-select');
    const standardFields = document.getElementById(`${itemId}-standard`);
    const customFields = document.getElementById(`${itemId}-custom`);
    const penaltyExpected = item.querySelector('.violation-penalty-expected');
    
    select.addEventListener('change', function() {
        if (this.value === 'custom') {
            // Ẩn phần standard, hiện phần custom
            standardFields.style.display = 'none';
            customFields.style.display = 'block';
        } else if (this.value !== '') {
            // Hiện phần standard, ẩn phần custom
            standardFields.style.display = 'grid';
            customFields.style.display = 'none';
            
            // Tự động điền mức phạt
            const selectedOption = this.options[this.selectedIndex];
            const penaltyK = selectedOption.getAttribute('data-penalty');
            if (penaltyK && penaltyK !== '') {
                const penaltyValue = convertPenaltyKtoVND(penaltyK);
                penaltyExpected.value = penaltyValue;
                penaltyExpected.readOnly = false;
            } else {
                penaltyExpected.value = '';
                penaltyExpected.readOnly = false;
            }
        } else {
            // Chưa chọn gì
            standardFields.style.display = 'grid';
            customFields.style.display = 'none';
            penaltyExpected.value = '';
            penaltyExpected.readOnly = true;
        }
    });
}

// Tạo UI cho một vi phạm Thủy Đội
function createThuyDoiViolationItem() {
    thuyDoiViolationCount++;
    const itemId = `thuy-doi-${thuyDoiViolationCount}`;
    const container = document.getElementById('thuy-doi-violations-list');
    
    const item = document.createElement('div');
    item.className = 'violation-item';
    item.id = itemId;
    
    const violations = violationsStructure?.thuy_doi_violations || [];
    
    let html = `
        <div class="violation-item-header">
            <span class="violation-item-title">Vi phạm Thủy Đội #${thuyDoiViolationCount}</span>
            <button type="button" class="remove-violation-btn" onclick="removeViolationItem('${itemId}')">
                <i class="fas fa-trash-alt"></i> Xóa
            </button>
        </div>
        <div class="violation-fields">
            <div class="form-group" style="grid-column: 1 / -1;">
                <label>Chọn loại vi phạm</label>
                <select class="violation-type-select" data-item="${itemId}" style="width: 100%;">
                    <option value="">-- Chọn vi phạm --</option>
                    <option value="custom">Nhập tùy chỉnh (Ghi chú khác)</option>
    `;
    
    violations.forEach((violation, index) => {
        if (violation.name && !violation.name.includes('Ghi chú - Trường hợp khác')) {
            const shortName = violation.name.replace('Cấp Thủy Đội: ', '');
            const penalty = extractPenaltyFromName(violation.name);
            html += `<option value="${index}" data-penalty="${penalty}">${shortName}</option>`;
        }
    });
    
    html += `
                </select>
            </div>
            <div class="standard-violation-fields" id="${itemId}-standard">
                <div class="form-group">
                    <label>Số lượt vi phạm</label>
                    <input type="number" class="violation-count" min="0" value="0" data-item="${itemId}">
                </div>
                <div class="form-group">
                    <label>Mức phạt dự kiến (VND)</label>
                    <input type="number" class="violation-penalty-expected" min="0" placeholder="Tự động từ loại vi phạm" data-item="${itemId}" readonly>
                </div>
            </div>
            <div class="form-group custom-violation-fields" id="${itemId}-custom" style="display: none; grid-column: 1 / -1;">
                <label>Tên lỗi vi phạm (Ghi chú khác)</label>
                <input type="text" class="custom-violation-name" placeholder="Ví dụ: Điều 35 - Vi phạm quy định về xếp, dỡ hàng hóa [Các khoản khác...]" data-item="${itemId}">
                <div class="form-group" style="margin-top: 10px;">
                    <label>Số lượt vi phạm</label>
                    <input type="number" class="custom-violation-count" min="0" value="0" data-item="${itemId}">
                </div>
                <div class="form-group">
                    <label>Mức phạt (VND)</label>
                    <input type="number" class="custom-violation-penalty" min="0" placeholder="Ví dụ: 12500000" data-item="${itemId}">
                </div>
            </div>
        </div>
    `;
    
    item.innerHTML = html;
    container.appendChild(item);
    
    // Event listener cho select
    const select = item.querySelector('.violation-type-select');
    const standardFields = document.getElementById(`${itemId}-standard`);
    const customFields = document.getElementById(`${itemId}-custom`);
    const penaltyExpected = item.querySelector('.violation-penalty-expected');
    
    select.addEventListener('change', function() {
        if (this.value === 'custom') {
            // Ẩn phần standard, hiện phần custom
            standardFields.style.display = 'none';
            customFields.style.display = 'block';
        } else if (this.value !== '') {
            // Hiện phần standard, ẩn phần custom
            standardFields.style.display = 'grid';
            customFields.style.display = 'none';
            
            // Tự động điền mức phạt
            const selectedOption = this.options[this.selectedIndex];
            const penaltyK = selectedOption.getAttribute('data-penalty');
            if (penaltyK && penaltyK !== '') {
                const penaltyValue = convertPenaltyKtoVND(penaltyK);
                penaltyExpected.value = penaltyValue;
                penaltyExpected.readOnly = false;
            } else {
                penaltyExpected.value = '';
                penaltyExpected.readOnly = false;
            }
        } else {
            // Chưa chọn gì
            standardFields.style.display = 'grid';
            customFields.style.display = 'none';
            penaltyExpected.value = '';
            penaltyExpected.readOnly = true;
        }
    });
}

// Xóa item vi phạm
function removeViolationItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
        item.remove();
    }
}

// Extract mức phạt từ tên (trả về số K, ví dụ: "4000" cho "4.000K")
function extractPenaltyFromName(name) {
    if (!name) return '';
    
    // Tìm pattern: Mức phạt: 4.000K hoặc Mức phạt 4.000K hoặc (4.000K)
    const patterns = [
        /Mức phạt[:\s]*([0-9.,]+)K/,
        /\(([0-9.,]+)K\)/
    ];
    
    for (const pattern of patterns) {
        const match = name.match(pattern);
        if (match) {
            // Lấy số, xóa dấu phẩy và dấu chấm (ví dụ: 4.000 -> 4000)
            const penaltyStr = match[1].replace(/,/g, '').replace(/\./g, '');
            return penaltyStr;
        }
    }
    
    return '';
}

// Convert penalty từ K sang VND (nhân 1000)
function convertPenaltyKtoVND(penaltyK) {
    if (!penaltyK || penaltyK === '') return 0;
    const penaltyNum = parseFloat(penaltyK);
    if (isNaN(penaltyNum)) return 0;
    return penaltyNum * 1000;
}

// Thu thập dữ liệu vi phạm từ form
function collectViolationsData() {
    const data = {
        thuyDoan: [],
        thuyDoi: []
    };
    
    // Thu thập vi phạm Thủy Đoàn
    const thuyDoanItems = document.querySelectorAll('#thuy-doan-violations-list .violation-item');
    thuyDoanItems.forEach(item => {
        const select = item.querySelector('.violation-type-select');
        const count = item.querySelector('.violation-count');
        const penaltyExpected = item.querySelector('.violation-penalty-expected');
        const customName = item.querySelector('.custom-violation-name');
        const customPenalty = item.querySelector('.custom-violation-penalty');
        const customCount = item.querySelector('.custom-violation-count');
        
        if (select && select.value !== '') {
            if (select.value === 'custom') {
                // Vi phạm tùy chỉnh
                const violationCount = parseInt(customCount?.value || 0);
                if (violationCount > 0) {
                    data.thuyDoan.push({
                        type: 'custom',
                        name: customName?.value || '',
                        penalty: customPenalty?.value || '',
                        penaltyExpected: customPenalty?.value || '',
                        count: violationCount
                    });
                }
            } else {
                // Vi phạm từ danh sách
                const violationCount = parseInt(count?.value || 0);
                if (violationCount > 0) {
                    const violationIndex = parseInt(select.value);
                    const violation = (violationsStructure?.thuy_doan_violations || violationsStructure?.thuyDoanViolations || [])[violationIndex];
                    if (violation) {
                        data.thuyDoan.push({
                            type: 'standard',
                            index: violation.index,
                            letter: violation.letter,
                            name: violation.name,
                            penalty: extractPenaltyFromName(violation.name),
                            penaltyExpected: penaltyExpected?.value || '',
                            count: violationCount
                        });
                    }
                }
            }
        }
    });
    
    // Thu thập vi phạm Thủy Đội
    const thuyDoiItems = document.querySelectorAll('#thuy-doi-violations-list .violation-item');
    thuyDoiItems.forEach(item => {
        const select = item.querySelector('.violation-type-select');
        const count = item.querySelector('.violation-count');
        const penaltyExpected = item.querySelector('.violation-penalty-expected');
        const customName = item.querySelector('.custom-violation-name');
        const customPenalty = item.querySelector('.custom-violation-penalty');
        
        if (select && count && parseInt(count.value) > 0) {
            if (select.value === 'custom') {
                data.thuyDoi.push({
                    type: 'custom',
                    name: customName?.value || '',
                    penalty: customPenalty?.value || '',
                    penaltyExpected: customPenalty?.value || '',
                    count: parseInt(count.value) || 0
                });
            } else {
                const violationIndex = parseInt(select.value);
                const violation = (violationsStructure?.thuy_doi_violations || violationsStructure?.thuyDoiViolations || [])[violationIndex];
                if (violation) {
                    data.thuyDoi.push({
                        type: 'standard',
                        index: violation.index,
                        letter: violation.letter,
                        name: violation.name,
                        penalty: extractPenaltyFromName(violation.name),
                        penaltyExpected: penaltyExpected?.value || '',
                        count: parseInt(count.value) || 0
                    });
                }
            }
        }
    });
    
    return data;
}

// Khởi tạo form handler
async function initializeFormHandler() {
    await loadViolationsStructure();
    
    // Event listeners cho nút thêm vi phạm
    document.getElementById('add-thuy-doan-btn')?.addEventListener('click', createThuyDoanViolationItem);
    document.getElementById('add-thuy-doi-btn')?.addEventListener('click', createThuyDoiViolationItem);
}

// Export functions to window
window.createThuyDoanViolationItem = createThuyDoanViolationItem;
window.createThuyDoiViolationItem = createThuyDoiViolationItem;
window.removeViolationItem = removeViolationItem;
window.collectViolationsData = collectViolationsData;
window.initializeFormHandler = initializeFormHandler;
window.loadViolationsStructure = loadViolationsStructure;
