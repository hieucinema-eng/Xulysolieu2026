// Cấu hình và biến toàn cục
let config = {
    // Sheet ID: 1ptc_rMLpejpTsBgFxE6Glg4eF2oHdV75WqT_COh59zg
    sheetId: localStorage.getItem('sheetId') || '1ptc_rMLpejpTsBgFxE6Glg4eF2oHdV75WqT_COh59zg',
    sheetName: localStorage.getItem('sheetName') || 'Dữ liệu xử phạt',
    scriptUrl: localStorage.getItem('scriptUrl') || 'https://script.google.com/macros/s/AKfycbw6PPn9Jv5tFJ5Hf0zZ32KABkXNA1wUQ7P6thX3AfsqOVZ0dZrl2Zr60LJYEwPoPYqRDA/exec',
    apiKey: '', // Người dùng cần cấu hình API key
    clientId: '' // Người dùng cần cấu hình Client ID
};

// Tên các cột trong Google Sheet
const COLUMNS = [
    'STT',
    'Ngày vi phạm',
    'Giờ vi phạm',
    'Ngày giờ (đầy đủ)',
    'Cấp vi phạm',
    'Số biên bản',
    'Tên người vi phạm',
    'Tên cán bộ chiến sĩ',
    'Số lượng cán bộ',
    'Loại vi phạm',
    'Mức phạt',
    'Số tiền phạt (VND)',
    'Địa điểm',
    'Ghi chú'
];

// Khởi tạo khi trang tải
document.addEventListener('DOMContentLoaded', async function () {
    initializeTabs();
    await initializeFormHandler();
    initializeForm();
    initializeDatePicker();
    initializeSearch();
    initializeConfig();

    // Tự động lưu cấu hình vào localStorage nếu chưa có
    if (!localStorage.getItem('sheetId') && config.sheetId) {
        localStorage.setItem('sheetId', config.sheetId);
    }
    if (!localStorage.getItem('scriptUrl') && config.scriptUrl) {
        localStorage.setItem('scriptUrl', config.scriptUrl);
    }
    if (!localStorage.getItem('sheetName')) {
        localStorage.setItem('sheetName', config.sheetName);
    }

    loadConfig();
    setDefaultDates();
});

// Xử lý tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Xóa active class từ tất cả buttons và contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Thêm active class cho button và content được chọn
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Khởi tạo form nhập liệu
function initializeForm() {
    const form = document.getElementById('violation-form');
    form.addEventListener('submit', handleFormSubmit);
}

// Khởi tạo date picker
function initializeDatePicker() {
    // Flatpickr cho ngày thực hiện
    if (flatpickr) {
        try {
            flatpickr("#execution-date", {
                dateFormat: "d/m/Y",
                allowInput: true,
                placeholder: "dd/mm/yyyy"
            });
        } catch (e) {
            console.warn('Flatpickr error for execution-date:', e);
        }

        // Flatpickr cho search dates
        try {
            flatpickr("#search-start-date", {
                dateFormat: "d/m/Y",
                allowInput: true
            });
        } catch (e) {
            console.warn('Flatpickr error for search-start-date:', e);
        }

        try {
            flatpickr("#search-end-date", {
                dateFormat: "d/m/Y",
                allowInput: true
            });
        } catch (e) {
            console.warn('Flatpickr error for search-end-date:', e);
        }
    }
}

// Xử lý submit form
async function handleFormSubmit(e) {
    e.preventDefault();
    const messageEl = document.getElementById('input-message');

    // Kiểm tra cấu hình
    if (!config.sheetId) {
        showMessage(messageEl, 'error', 'Vui lòng cấu hình Google Sheet ID trước!');
        return;
    }

    // Lấy dữ liệu từ form mới
    const formData = new FormData(e.target);
    const violationsData = collectViolationsData();

    // Tạo timestamp
    const now = new Date();
    const timestamp = now.toISOString();

    const data = {
        // Cột A-O (thông tin cơ bản)
        timestamp: timestamp,
        quarter: formData.get('quarter') || '',
        executionDate: convertDateToISO(formData.get('execution-date')) || '',
        workingGroup: formData.get('working-group') || '',
        reporter: (formData.get('reporter') === 'Khác' ? formData.get('reporter-other') : formData.get('reporter')) || '',
        specializedTopic: formData.get('specialized-topic') || '',
        totalReports: formData.get('total-reports') || '0',
        reportsPhong: formData.get('reports-phong') || '0',
        reportsThuyDoi: formData.get('reports-thuy-doi') || '0',
        ttksShifts: formData.get('ttks-shifts') || '0',
        soldiersParticipated: formData.get('soldiers-participated') || '',
        legalPropaganda: formData.get('legal-propaganda') || '0',
        vehicleInspections: formData.get('vehicle-inspections') || '0',
        reminderCases: formData.get('reminder-cases') || '0',
        alcoholChecks: formData.get('alcohol-checks') || '0',

        // Vi phạm Thủy Đoàn và Thủy Đội
        violations: violationsData
    };

    console.log('=== PREPARING DATA TO SEND ===');
    console.log('Data object:', JSON.stringify(data, null, 2));

    try {
        messageEl.innerHTML = '<div class="loading">Đang lưu dữ liệu</div>';

        // Lưu vào Google Sheets thông qua Apps Script
        const result = await saveToGoogleSheets(data);

        if (result.success) {
            // Hiển thị thông báo cụ thể (Google Sheet hoặc Local Storage)
            const msg = result.message || 'Lưu số liệu thành công!';
            const type = msg.includes('Google Sheet') ? 'success' : 'info';
            showMessage(messageEl, type, msg);

            e.target.reset();

            // Auto-switch to search tab (DELAYED to allow reading message)
            // setTimeout(() => {
            //    document.querySelector('[data-tab="search"]').click();
            // }, 3000); // Increased delay

            // Add Open Sheet Button to message
            const sheetLink = `https://docs.google.com/spreadsheets/d/${config.sheetId}`;
            messageEl.innerHTML += `
                <div style="margin-top: 15px;">
                    <a href="${sheetLink}" target="_blank" class="btn btn-sm btn-outline-success">
                        <i class="fas fa-external-link-alt"></i> MỞ GOOGLE SHEET
                    </a>
                </div>
            `;
        } else {
            showMessage(messageEl, 'error', result.error || 'Có lỗi xảy ra khi lưu dữ liệu');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(messageEl, 'error', 'Lỗi: ' + error.message);
    }
}

// Lưu dữ liệu vào Google Sheets
// Lưu dữ liệu vào Google Sheets
async function saveToGoogleSheets(data) {
    // Sử dụng Google Apps Script Web App URL
    const scriptUrl = config.scriptUrl;

    if (!scriptUrl || scriptUrl === '') {
        // Nếu chưa có Apps Script, sử dụng localStorage như backup
        console.warn('No Script URL provided, using Local Storage.');
        return saveToLocalStorage(data, 'Đã lưu vào bộ nhớ trình duyệt (Chưa cấu hình Online)');
    }

    try {
        const requestBody = {
            action: 'append',
            sheetId: config.sheetId,
            sheetName: config.sheetName,
            data: data
        };

        console.log('=== SENDING DATA TO GOOGLE SHEETS ===');

        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Unknown error from Apps Script');
        }

        return { success: true, message: 'Đã lưu thành công vào Google Sheet!' };
    } catch (error) {
        // Fallback to localStorage
        console.error('Apps Script error, falling back to localStorage:', error);
        return saveToLocalStorage(data, `Lỗi kết nối Online (${error.message}). Đã lưu vào bộ nhớ trình duyệt.`);
    }
}

// Lưu vào localStorage (backup)
function saveToLocalStorage(data, successMessage = 'Lưu thành công (Local Storage)') {
    try {
        const records = JSON.parse(localStorage.getItem('violationRecords') || '[]');
        const newRecord = {
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };
        records.push(newRecord);
        localStorage.setItem('violationRecords', JSON.stringify(records));
        return { success: true, message: successMessage };
    } catch (error) {
        return { success: false, error: 'Không thể lưu vào localStorage: ' + error.message };
    }
}

// Khởi tạo chức năng tra cứu
function initializeSearch() {
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('reset-search-btn').addEventListener('click', resetSearch);
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

    // Sub-tabs cho tra cứu
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const subtab = this.dataset.subtab;
            switchSubtab(subtab);
        });
    });
}

// Chuyển đổi sub-tab
function switchSubtab(subtab) {
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.search-subcontent').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`[data-subtab="${subtab}"]`).classList.add('active');
    document.getElementById(`search-${subtab}`).classList.add('active');
}

// Xử lý tìm kiếm
async function handleSearch() {
    const messageEl = document.getElementById('search-message');
    const exportButtons = document.getElementById('export-buttons');

    const startDateInput = document.getElementById('search-start-date');
    const endDateInput = document.getElementById('search-end-date');

    // Lấy giá trị từ flatpickr nếu có, nếu không lấy từ value
    let startDate = '';
    let endDate = '';

    if (startDateInput._flatpickr) {
        const selectedDate = startDateInput._flatpickr.selectedDates[0];
        if (selectedDate) {
            startDate = formatDateInput(selectedDate);
        }
    } else {
        startDate = convertDateToISO(startDateInput.value);
    }

    if (endDateInput._flatpickr) {
        const selectedDate = endDateInput._flatpickr.selectedDates[0];
        if (selectedDate) {
            endDate = formatDateInput(selectedDate);
        }
    } else {
        endDate = convertDateToISO(endDateInput.value);
    }

    const filters = {
        startDate: startDate,
        endDate: endDate,
        workingGroup: document.getElementById('search-working-group').value
    };

    try {
        // Hiển thị loading cho cả 2 phần
        document.getElementById('general-table-container').innerHTML = '<div class="loading">Đang tìm kiếm</div>';
        document.getElementById('violations-table-container').innerHTML = '<div class="loading">Đang tìm kiếm</div>';

        const results = await searchRecords(filters);

        if (results.length === 0) {
            document.getElementById('general-table-container').innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Không tìm thấy kết quả nào.</p>';
            document.getElementById('violations-table-container').innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Không tìm thấy kết quả nào.</p>';
            document.getElementById('general-summary').innerHTML = '';
            document.getElementById('violations-summary').innerHTML = '';
            exportButtons.style.display = 'none';
            showMessage(messageEl, 'info', 'Không tìm thấy dữ liệu phù hợp');
            return;
        }

        // Hiển thị kết quả cho 2 phần
        displayGeneralResults(results);
        displayViolationsResults(results);

        // Hiển thị tổng kết
        displayGeneralSummary(results);
        displayViolationsSummary(results);

        // Hiển thị nút xuất
        exportButtons.style.display = 'block';
        window.searchResults = results; // Lưu để export

        showMessage(messageEl, 'success', `Tìm thấy ${results.length} bản ghi`);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('general-table-container').innerHTML = '';
        document.getElementById('violations-table-container').innerHTML = '';
        showMessage(messageEl, 'error', 'Lỗi: ' + error.message);
    }
}

// Tìm kiếm bản ghi
async function searchRecords(filters) {
    // Thử lấy từ Google Sheets
    if (config.sheetId && config.scriptUrl && config.scriptUrl !== '') {
        try {
            const response = await fetch(config.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight
                },
                body: JSON.stringify({
                    action: 'search',
                    sheetId: config.sheetId,
                    sheetName: config.sheetName,
                    filters: filters
                })
            });
            const result = await response.json();
            if (result.success) {
                return result.data || [];
            }
        } catch (error) {
            console.warn('Apps Script không khả dụng, sử dụng localStorage:', error);
        }
    }

    // Fallback: tìm trong localStorage
    const records = JSON.parse(localStorage.getItem('violationRecords') || '[]');
    return filterRecords(records, filters);
}

// Lọc bản ghi
function filterRecords(records, filters) {
    return records.filter(record => {
        if (filters.startDate && record.executionDate < filters.startDate) return false;
        if (filters.endDate && record.executionDate > filters.endDate) return false;
        if (filters.workingGroup && record.workingGroup !== filters.workingGroup) return false;
        return true;
    });
}

// Hiển thị kết quả thông tin chung
function displayGeneralResults(results) {
    const container = document.getElementById('general-table-container');

    const headers = [
        'STT', 'Quý thực hiện', 'Ngày thực hiện', 'Tổ công tác', 'Người báo cáo',
        'Thực hiện chuyên đề', 'Tổng số biên bản', 'Số biên bản Cấp Phòng',
        'Số biên bản Cấp Thủy đội', 'Số ca thực hiện TTKS',
        'Số lượt chiến sĩ tham gia', 'Số lượt tuyên truyền pháp luật',
        'Số lượt kiểm tra phương tiện', 'Số trường hợp tuyên truyền, nhắc nhở',
        'Số lượt kiểm tra cồn'
    ];

    let html = '<table><thead><tr>';
    headers.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    results.forEach((record, index) => {
        html += '<tr>';
        html += `<td>${index + 1}</td>`;
        html += `<td>${record.quarter || ''}</td>`;
        html += `<td>${formatDate(record.executionDate)}</td>`;
        html += `<td>${record.workingGroup || ''}</td>`;
        html += `<td>${record.reporter || ''}</td>`;
        html += `<td>${record.specializedTopic || ''}</td>`;
        html += `<td>${record.totalReports || '0'}</td>`;
        html += `<td>${record.reportsPhong || '0'}</td>`;
        html += `<td>${record.reportsThuyDoi || '0'}</td>`;
        html += `<td>${record.ttksShifts || '0'}</td>`;
        html += `<td>${record.soldiersParticipated || '0'}</td>`;
        html += `<td>${record.legalPropaganda || '0'}</td>`;
        html += `<td>${record.vehicleInspections || '0'}</td>`;
        html += `<td>${record.reminderCases || '0'}</td>`;
        html += `<td>${record.alcoholChecks || '0'}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Hiển thị tổng kết thông tin chung
function displayGeneralSummary(results) {
    const container = document.getElementById('general-summary');

    const totals = {
        totalRecords: results.length,
        totalReports: results.reduce((sum, r) => sum + (parseInt(r.totalReports) || 0), 0),
        reportsPhong: results.reduce((sum, r) => sum + (parseInt(r.reportsPhong) || 0), 0),
        reportsThuyDoi: results.reduce((sum, r) => sum + (parseInt(r.reportsThuyDoi) || 0), 0),
        ttksShifts: results.reduce((sum, r) => sum + (parseInt(r.ttksShifts) || 0), 0),
        soldiersParticipated: results.reduce((sum, r) => sum + (parseInt(r.soldiersParticipated) || 0), 0),
        legalPropaganda: results.reduce((sum, r) => sum + (parseInt(r.legalPropaganda) || 0), 0),
        vehicleInspections: results.reduce((sum, r) => sum + (parseInt(r.vehicleInspections) || 0), 0),
        reminderCases: results.reduce((sum, r) => sum + (parseInt(r.reminderCases) || 0), 0),
        alcoholChecks: results.reduce((sum, r) => sum + (parseInt(r.alcoholChecks) || 0), 0)
    };

    let html = '<div class="summary-box"><h3 class="summary-header">TỔNG HỢP THÔNG TIN CHUNG</h3>';
    html += `<p><strong>Tổng số bản ghi:</strong> ${totals.totalRecords}</p>`;
    html += `<p><strong>Tổng số biên bản:</strong> ${totals.totalReports}</p>`;
    html += `<p><strong>Biên bản Cấp Phòng:</strong> ${totals.reportsPhong}</p>`;
    html += `<p><strong>Biên bản Cấp Thủy đội:</strong> ${totals.reportsThuyDoi}</p>`;
    html += `<p><strong>Tổng số ca TTKS:</strong> ${totals.ttksShifts}</p>`;
    html += `<p><strong>Tổng lượt chiến sĩ tham gia:</strong> ${totals.soldiersParticipated}</p>`;
    html += `<p><strong>Tổng lượt tuyên truyền pháp luật:</strong> ${totals.legalPropaganda}</p>`;
    html += `<p><strong>Tổng lượt kiểm tra phương tiện:</strong> ${totals.vehicleInspections}</p>`;
    html += `<p><strong>Tổng trường hợp nhắc nhở:</strong> ${totals.reminderCases}</p>`;
    html += `<p><strong>Tổng lượt kiểm tra cồn:</strong> ${totals.alcoholChecks}</p>`;
    html += '</div>';

    container.innerHTML = html;
}

// Hiển thị kết quả chi tiết vi phạm
function displayViolationsResults(results) {
    const container = document.getElementById('violations-table-container');

    const headers = ['STT', 'Tên vi phạm', 'Số lỗi vi phạm', 'Mức phạt (VND)', 'Số biện pháp khắc phục'];

    let html = '<table><thead><tr>';
    headers.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    let stt = 1;
    results.forEach(record => {
        const violations = record.violations || {};
        const thuyDoan = violations.thuyDoan || [];
        const thuyDoi = violations.thuyDoi || [];

        // Hiển thị vi phạm Thủy Đoàn
        thuyDoan.forEach(violation => {
            html += '<tr>';
            html += `<td>${stt++}</td>`;
            html += `<td>${violation.name || ''}</td>`;
            html += `<td>${violation.count || 0}</td>`;
            html += `<td>${formatCurrency(violation.penaltyExpected || violation.penalty || 0)}</td>`;
            // Số biện pháp khắc phục (cột Y-AB) - cần lưu khi submit form
            html += `<td>${violation.remedialMeasures || 0}</td>`;
            html += '</tr>';
        });

        // Hiển thị vi phạm Thủy Đội
        thuyDoi.forEach(violation => {
            html += '<tr>';
            html += `<td>${stt++}</td>`;
            html += `<td>${violation.name || ''}</td>`;
            html += `<td>${violation.count || 0}</td>`;
            html += `<td>${formatCurrency(violation.penaltyExpected || violation.penalty || 0)}</td>`;
            html += `<td>${violation.remedialMeasures || 0}</td>`;
            html += '</tr>';
        });
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Hiển thị tổng kết chi tiết vi phạm
function displayViolationsSummary(results) {
    const container = document.getElementById('violations-summary');

    let totalViolations = 0;
    let totalPenalty = 0;
    let totalRemedialMeasures = 0;

    results.forEach(record => {
        const violations = record.violations || {};
        const thuyDoan = violations.thuyDoan || [];
        const thuyDoi = violations.thuyDoi || [];
        const allViolations = [...thuyDoan, ...thuyDoi];

        allViolations.forEach(violation => {
            totalViolations += parseInt(violation.count || 0);
            totalPenalty += parseFloat(violation.penaltyExpected || violation.penalty || 0);
            totalRemedialMeasures += parseInt(violation.remedialMeasures || 0);
        });
    });

    let html = '<div class="summary-box"><h3 class="summary-header">TỔNG HỢP CHI TIẾT VI PHẠM</h3>';
    html += `<p><strong>Tổng số lỗi vi phạm:</strong> ${totalViolations}</p>`;
    html += `<p><strong>Tổng mức phạt:</strong> ${formatCurrency(totalPenalty)} VND</p>`;
    html += `<p><strong>Tổng số biện pháp khắc phục:</strong> ${totalRemedialMeasures}</p>`;
    html += '</div>';

    container.innerHTML = html;
}

// Đặt lại tìm kiếm
function resetSearch() {
    document.getElementById('search-start-date').value = '';
    document.getElementById('search-end-date').value = '';
    document.getElementById('search-working-group').value = '';
    document.getElementById('general-table-container').innerHTML = '';
    document.getElementById('general-summary').innerHTML = '';
    document.getElementById('violations-table-container').innerHTML = '';
    document.getElementById('violations-summary').innerHTML = '';
    document.getElementById('export-buttons').style.display = 'none';
    switchSubtab('general');
}

// Xuất Excel
function exportToExcel() {
    if (!window.searchResults) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    exportToFile(window.searchResults, 'xlsx');
}

// Xuất CSV
function exportToCSV() {
    if (!window.searchResults) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    exportToFile(window.searchResults, 'csv');
}

// Xuất file
function exportToFile(data, format) {
    // Tạo CSV
    let csv = COLUMNS.join(',') + '\n';
    data.forEach((record, index) => {
        const row = [
            index + 1,
            record.date || '',
            record.time || '',
            record.datetime || '',
            record.violationLevel || '',
            record.reportNumber || '',
            record.violatorName || '',
            record.officerName || '',
            record.numberOfficers || '',
            record.violationType || '',
            record.penaltyLevel || '',
            record.penaltyAmount || '',
            record.location || '',
            (record.notes || '').replace(/,/g, ';') // Thay dấu phẩy trong ghi chú
        ];
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Tạo blob và download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Du_lieu_xu_phat_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Khởi tạo cấu hình
function initializeConfig() {
    document.getElementById('save-config-btn').addEventListener('click', saveConfig);
    document.getElementById('create-sheet-btn').addEventListener('click', createNewSheet);
    document.getElementById('test-connection-btn').addEventListener('click', testConnection);
}

// Lưu cấu hình
function saveConfig() {
    const sheetId = document.getElementById('sheet-id').value.trim();
    const sheetName = document.getElementById('sheet-name').value.trim();
    const scriptUrl = document.getElementById('script-url').value.trim();
    const messageEl = document.getElementById('config-message');

    if (!sheetId) {
        showMessage(messageEl, 'error', 'Vui lòng nhập Google Sheet ID!');
        return;
    }

    config.sheetId = sheetId;
    config.sheetName = sheetName || 'Dữ liệu xử phạt';
    config.scriptUrl = scriptUrl;

    localStorage.setItem('sheetId', sheetId);
    localStorage.setItem('sheetName', config.sheetName);
    localStorage.setItem('scriptUrl', scriptUrl);

    showMessage(messageEl, 'success', 'Đã lưu cấu hình thành công!');
}

// Load cấu hình
function loadConfig() {
    document.getElementById('sheet-id').value = config.sheetId;
    document.getElementById('sheet-name').value = config.sheetName;
    document.getElementById('script-url').value = config.scriptUrl || '';
}

// Tạo Sheet mới
async function createNewSheet() {
    const messageEl = document.getElementById('config-message');

    showMessage(messageEl, 'info', 'Đang tạo Google Sheet mới...');

    // Hướng dẫn người dùng tạo sheet thủ công
    const instructions = `
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h3>Hướng dẫn tạo Google Sheet mới:</h3>
            <ol style="text-align: left; margin-left: 20px;">
                <li>Truy cập <a href="https://sheets.google.com" target="_blank">Google Sheets</a></li>
                <li>Tạo một Sheet mới</li>
                <li>Đổi tên tab đầu tiên thành: "${config.sheetName}"</li>
                <li>Thêm các tiêu đề cột sau vào hàng đầu tiên:</li>
                <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 5px; font-family: monospace;">
                    ${COLUMNS.join(' | ')}
                </div>
                <li>Sao chép Sheet ID từ URL (phần giữa /d/ và /edit)</li>
                <li>Dán vào ô "Google Sheet ID" phía trên và nhấn "Lưu cấu hình"</li>
            </ol>
            <p><strong>Lưu ý:</strong> Để tự động tạo sheet, bạn cần cấu hình Google Apps Script (xem README.md)</p>
        </div>
    `;

    messageEl.innerHTML = instructions;
}

// Kiểm tra kết nối
async function testConnection() {
    const messageEl = document.getElementById('config-message');

    if (!config.sheetId) {
        showMessage(messageEl, 'error', 'Vui lòng nhập Google Sheet ID trước!');
        return;
    }

    if (!config.scriptUrl || config.scriptUrl === '') {
        showMessage(messageEl, 'error', 'Vui lòng nhập Apps Script URL trước!');
        return;
    }

    showMessage(messageEl, 'info', 'Đang kiểm tra kết nối...');

    try {
        // Bước 1: Test doGet (kiểm tra Web App có chạy không)
        console.log('Sending test request to:', scriptUrl);

        // Use no-cors mode first just to see if we can reach the server (avoid strict CORS blocks)
        // But to get actual data/success, we need normal cors.
        // Google Apps Script requires redirection handling.

        const payload = {
            action: 'search',
            sheetId: sheetId,
            sheetName: sheetName,
            filters: {}, // Empty filters to get some data or just check sheet access
            test: true
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Test result:', result);

        if (result.success) {
            showMessage(messageEl, 'success', `Kết nối thành công! Tên sheet: "${sheetName}".`);
            // Update config object in memory too
            config.sheetId = sheetId;
            config.scriptUrl = scriptUrl;
            config.sheetName = sheetName;
            localStorage.setItem('appConfig', JSON.stringify(config));
        } else {
            throw new Error(result.error || 'Server trả về lỗi không xác định');
        }

    } catch (error) {
        console.error('Test failed:', error);

        // Analyze specific Google Apps Script common errors
        let suggestions = '';
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            suggestions = 'Lỗi này thường do: 1) URL sai, 2) Chưa set "Who has access" là "Anyone", hoặc 3) Trình duyệt chặn (CORS).';
        }

        showMessage(messageEl, 'error', `Kết nối thất bại: ${error.message}. ${suggestions}`);
    }
}

// Đặt ngày mặc định
function setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    document.getElementById('search-start-date').value = formatDateInput(firstDay);
    document.getElementById('search-end-date').value = formatDateInput(today);
}

// Utility functions
function showMessage(element, type, message) {
    element.className = `message ${type}`;
    element.textContent = message;
    element.style.display = 'block';
}

function formatDate(dateStr) {
    if (!dateStr) return '';

    // Nếu là format ISO (yyyy-mm-dd), parse trực tiếp
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = dateStr.split('-');
        const year = parts[0];
        const month = parts[1];
        const day = parts[2].split('T')[0]; // Bỏ phần time nếu có
        return `${day}/${month}/${year}`;
    }

    // Nếu không phải ISO, dùng Date object
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Nếu không parse được, trả về nguyên bản

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('vi-VN');
}

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Chuyển đổi từ dd/mm/yyyy sang yyyy-mm-dd (ISO format)
function convertDateToISO(dateStr) {
    if (!dateStr) return '';
    // Nếu đã là format ISO (yyyy-mm-dd), trả về luôn
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateStr;
    }
    // Nếu là format dd/mm/yyyy
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const parts = dateStr.split('/');
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    // Nếu không match format nào, thử parse bằng Date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return formatDateInput(date);
    }
    return dateStr;
}

function formatCurrency(amount) {
    if (!amount) return '0';
    return parseFloat(amount).toLocaleString('vi-VN');
}

// Xử lý thay đổi người báo cáo
function handleReporterChange() {
    const reporterSelect = document.getElementById('reporter');
    const reporterOtherGroup = document.getElementById('reporter-other-group');
    const reporterOtherInput = document.getElementById('reporter-other');

    if (reporterSelect.value === 'Khác') {
        reporterOtherGroup.style.display = 'block';
        reporterOtherInput.required = true;
    } else {
        reporterOtherGroup.style.display = 'none';
        reporterOtherInput.required = false;
        reporterOtherInput.value = '';
    }
}

// Export function to window
window.handleReporterChange = handleReporterChange;
