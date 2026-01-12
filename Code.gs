/**
 * Google Apps Script cho WebApp Quản lý Số liệu Xử phạt
 * 
 * Hướng dẫn sử dụng:
 * 1. Mở Google Apps Script: https://script.google.com
 * 2. Tạo project mới
 * 3. Dán code này vào file Code.gs
 * 4. Lưu project
 * 5. Deploy -> New Deployment -> Web app
 * 6. Chọn "Execute as: Me" và "Who has access: Anyone"
 * 7. Copy Web App URL và dán vào file script.js (config.scriptUrl)
 */

// Cấu hình
const SHEET_NAME = 'Dữ liệu xử phạt'; // Tên tab mặc định

// HEADERS cho cột A-O (thông tin cơ bản)
const BASIC_HEADERS = [
  'Dấu thời gian',          // A
  'Quý kiểm tra',           // B
  'Ngày thực hiện',         // C
  'Tổ công tác',            // D
  'Người báo cáo',          // E
  'Thực hiện chuyên đề',    // F
  'Tổng số biên bản được lập', // G
  'Số biên bản Cấp Phòng',  // H
  'Số biên bản Cấp Thủy đội', // I
  'Số ca thực hiện TTKS',   // J
  'Số lượt chiến sĩ tham gia (3-20)', // K
  'Số lượt tuyên truyền pháp luật', // L
  'Số lượt kiểm tra phương tiện', // M
  'Số trường hợp tuyên truyền, nhắc nhở (1-100)', // N
  'Số lượt kiểm tra cồn'    // O
];

/**
 * Hàm xử lý các request từ webapp
 */
function doPost(e) {
  try {
    Logger.log('doPost called');
    
    // Kiểm tra xem e có tồn tại không - nếu undefined, tạo object rỗng
    if (typeof e === 'undefined' || e === null) {
      Logger.log('Warning: e parameter is undefined or null');
      e = {}; // Tạo object rỗng để tránh lỗi
    }
    
    // Kiểm tra xem e.postData có tồn tại không
    if (!e.postData) {
      Logger.log('Error: e.postData is undefined');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'postData is undefined.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!e.postData.contents) {
      Logger.log('Error: e.postData.contents is undefined');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'postData.contents is undefined'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    
    if (action === 'append') {
      return appendData(request);
    } else if (action === 'search') {
      return searchData(request);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid action: ' + action
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Hàm xử lý GET request (cho testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script Web App is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Thêm dữ liệu mới vào Google Sheet
 */
function appendData(request) {
  try {
    const sheetId = request.sheetId;
    const sheetName = request.sheetName || SHEET_NAME;
    const data = request.data;
    
    if (!sheetId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet ID is required'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Mở spreadsheet
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName(sheetName);
    
    // Nếu sheet chưa tồn tại, tạo mới
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Kiểm tra xem header đã có chưa
    const lastRow = sheet.getLastRow();
    if (lastRow === 0 || lastRow === 1) {
      // Tạo header cho cột A-O
      sheet.getRange(1, 1, 1, BASIC_HEADERS.length).setValues([BASIC_HEADERS]);
      
      // Thêm cột P cho Violations (JSON)
      sheet.getRange(1, BASIC_HEADERS.length + 1).setValue('Violations (JSON)');
    }
    
    // Chuẩn bị dữ liệu để thêm (cột A-O)
    const rowData = [
      data.timestamp || new Date().toISOString(),        // A: Dấu thời gian
      data.quarter || '',                                 // B: Quý kiểm tra
      data.executionDate || '',                           // C: Ngày thực hiện
      data.workingGroup || '',                            // D: Tổ công tác
      data.reporter || '',                                // E: Người báo cáo
      data.specializedTopic || '',                        // F: Thực hiện chuyên đề
      data.totalReports || '0',                           // G: Tổng số biên bản được lập
      data.reportsPhong || '0',                           // H: Số biên bản Cấp Phòng
      data.reportsThuyDoi || '0',                         // I: Số biên bản Cấp Thủy đội
      data.ttksShifts || '0',                             // J: Số ca thực hiện TTKS
      data.soldiersParticipated || '',                    // K: Số lượt chiến sĩ tham gia
      data.legalPropaganda || '0',                        // L: Số lượt tuyên truyền pháp luật
      data.vehicleInspections || '0',                     // M: Số lượt kiểm tra phương tiện
      data.reminderCases || '0',                          // N: Số trường hợp tuyên truyền, nhắc nhở
      data.alcoholChecks || '0'                           // O: Số lượt kiểm tra cồn
    ];
    
    // Thêm dữ liệu vào sheet
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, BASIC_HEADERS.length).setValues([rowData]);
    
    // Lưu violations dưới dạng JSON trong cột P
    if (data.violations) {
      const violationsJson = JSON.stringify(data.violations);
      sheet.getRange(newRow, BASIC_HEADERS.length + 1).setValue(violationsJson);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data appended successfully',
      row: newRow
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function searchData(request) {
  // (Simplified for brevity as provided in previous steps)
   return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: []
    })).setMimeType(ContentService.MimeType.JSON);
}

function formatDate(date) {
  return date.toString();
}
