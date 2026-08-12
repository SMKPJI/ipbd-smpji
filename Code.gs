/**
 * CARIAN LAPORAN PBD — Google Apps Script
 * 
 * Fungsi:
 * 1. setupSheet() — auto-setup tab Tetapan & Murid
 * 2. autoLinkLaporan() — AUTO-MATCH fail PDF di Google Drive
 *    dengan murid guna No IC dalam nama fail (JANGAN buat manual!)
 * 3. REST API untuk website carian (cari guna No IC)
 * 
 * Cara guna:
 * 1. Buka sheets.new → buat Google Sheet kosong
 * 2. Extensions → Apps Script → paste code → simpan
 * 3. Run 'setupSheet()' sekali
 * 4. Letak semua PDF laporan dalam SATU folder Google Drive
 *    Nama fail: <Nama Murid>-<NoIC>.pdf
 *    Contoh: Ahmad Faiz-010203040506.pdf
 * 5. Set folder ID dalam tab Tetapan (folderLaporan)
 * 6. Run 'autoLinkLaporan()' — SEMUA link auto-isi! ⚡
 * 7. Deploy > Web app > Anyone > copy URL
 * 8. Paste URL dalam js/data.js (API_URL)
 */

const CONFIG = {
  SHEETS: {
    TETAPAN: 'Tetapan',
    MURID: 'Murid'
  }
};

// ============================================================
// SETUP SHEET
// ============================================================
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = ss.getSheets();
  for (let i = sheets.length - 1; i >= 0; i--) {
    if (i > 0) ss.deleteSheet(sheets[i]);
  }
  
  const sheetPertama = ss.getSheets()[0];
  sheetPertama.setName(CONFIG.SHEETS.TETAPAN);
  
  setupTab(ss, CONFIG.SHEETS.TETAPAN, ['Kunci', 'Nilai'], [200, 300]);
  setupTab(ss, CONFIG.SHEETS.MURID, ['ID', 'Nama', 'NoIC', 'Tingkatan', 'Kelas', 'LinkLaporan'], [80, 250, 130, 100, 120, 350]);
  
  seedData(ss);
  SpreadsheetApp.getUi().alert('✅ Setup siap! Set folderLaporan dalam tab Tetapan, lepas tu run autoLinkLaporan().');
}

function setupTab(ss, name, headers, widths) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
}

function seedData(ss) {
  const t = ss.getSheetByName(CONFIG.SHEETS.TETAPAN);
  const tetapan = [
    ['namaSistem', 'Carian Laporan PBD'],
    ['namaSekolah', 'SMK (P) Jalan Ipoh'],
    ['logoUrl', ''],
    ['warnaUtama', '#3b82f6'],
    ['tahun', '2026'],
    ['folderLaporan', 'PASTE_FOLDER_ID_DI_SINI'],
    ['kataLaluanAdmin', 'admin123']
  ];
  t.getRange(2, 1, tetapan.length, 2).setValues(tetapan);

  const m = ss.getSheetByName(CONFIG.SHEETS.MURID);
  const murid = [
    ['m01', 'Ahmad Faiz bin Razak', '010203040506', '1', 'Amanah', ''],
    ['m02', 'Siti Aminah binti Kamal', '020304050607', '1', 'Amanah', ''],
    ['m03', 'Muhammad Hakim bin Zainal', '030405060708', '1', 'Bestari', ''],
    ['m04', 'Nur Aisyah binti Omar', '040506070809', '1', 'Bestari', ''],
    ['m05', 'Lim Wei Jie', '050607080910', '1', 'Cemerlang', ''],
    ['m06', 'Tan Mei Ling', '060708091011', '1', 'Cemerlang', ''],
    ['m07', 'Kavinesh a/l Murugan', '070809101112', '2', 'Amanah', ''],
    ['m08', 'Nurul Izzah binti Hassan', '080910111213', '2', 'Amanah', ''],
    ['m09', 'Faris Daniel bin Azman', '091011121314', '2', 'Bestari', ''],
    ['m10', 'Aina Sofea binti Rahman', '101112131415', '2', 'Bestari', '']
  ];
  m.getRange(2, 1, murid.length, 6).setValues(murid);
}

// ============================================================
// ⭐ AUTO-LINK LAPORAN — TOLONG JANGAN BUAT MANUAL!
// ============================================================
// Padankan fail PDF dalam Google Drive dengan murid guna No IC
// dalam nama fail. Format nama fail: <Nama>-<NoIC>.pdf
// ============================================================
function autoLinkLaporan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tetapan = getTetapanObj_(ss);
  const folderId = tetapan.folderLaporan;
  
  if (!folderId || folderId.indexOf('PASTE_FOLDER_ID') !== -1) {
    SpreadsheetApp.getUi().alert('⚠️ Sila set folderLaporan dalam tab Tetapan dahulu.');
    return;
  }
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    
    // Kumpul semua fail + no IC dalam nama fail
    const failByIC = {};
    while (files.hasNext()) {
      const file = files.next();
      const nama = file.getName();
      // Cari 12 digit (No IC) dalam nama fail
      const match = nama.match(/(\d{12})/);
      if (match) {
        failByIC[match[1]] = file;
      }
    }
    
    // Padankan dengan murid dalam sheet
    const sheet = ss.getSheetByName(CONFIG.SHEETS.MURID);
    const data = sheet.getDataRange().getValues();
    let dijumpai = 0;
    let tiadaFail = 0;
    
    for (let i = 1; i < data.length; i++) {
      const ic = String(data[i][2] || '').trim();
      if (!ic) continue;
      
      if (failByIC[ic]) {
        const file = failByIC[ic];
        // Pastikan sharing "Anyone with link" supaya website boleh buka
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (e) { /* abaikan jika tak boleh */ }
        const url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
        sheet.getRange(i + 1, 6).setValue(url);
        dijumpai++;
      } else {
        tiadaFail++;
      }
    }
    
    SpreadsheetApp.getUi().alert(
      '✅ Selesai!\n\n' +
      'Link dijumpai & diisi: ' + dijumpai + ' murid\n' +
      'Tiada fail (perlu semak): ' + tiadaFail + ' murid'
    );
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ralat: ' + e.toString());
  }
}

// ============================================================
// REST API — GET (untuk website)
// ============================================================
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e?.parameter?.action || '';
  
  let result = { success: true };
  
  try {
    switch (action) {
      case 'cari':
        // Carian laporan guna No IC — PRIVASI: hanya murid itu sendiri
        const ic = String(e?.parameter?.ic || '').trim();
        if (!ic || ic.length !== 12 || !/^\d{12}$/.test(ic)) {
          result = { success: false, error: 'No IC tidak sah' };
        } else {
          const murid = cariMurid_(ss, ic);
          if (murid) {
            result = {
              success: true,
              data: {
                nama: murid.Nama,
                tingkatan: murid.Tingkatan,
                kelas: murid.Kelas,
                linkLaporan: murid.LinkLaporan || ''
              }
            };
          } else {
            result = { success: false, error: 'Tiada rekod' };
          }
        }
        break;
        
      case 'getSemua':
        // Untuk panel admin sahaja
        result = { success: true, data: getData_(ss, CONFIG.SHEETS.MURID) };
        break;
        
      case 'getTetapan':
        result = { success: true, data: getTetapanObj_(ss) };
        break;
        
      case 'getAll':
        result = {
          success: true,
          murid: getData_(ss, CONFIG.SHEETS.MURID),
          tetapan: getData_(ss, CONFIG.SHEETS.TETAPAN)
        };
        break;
        
      default:
        result = { success: true, message: 'Carian Laporan PBD API v1.0 — Guna ?action=cari&ic=NOIC' };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// REST API — POST
// ============================================================
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    const data = JSON.parse(e?.postData?.contents || '{}');
    const action = data.action || '';
    let result = { success: true };
    
    switch (action) {
      case 'addMurid': result = addRow_(ss, CONFIG.SHEETS.MURID, data.fields); break;
      case 'updateLink': result = updateLink_(ss, data.id, data.linkLaporan); break;
      case 'updateTetapan': result = updateTetapan_(ss, data.kunci, data.nilai); break;
      default: result = { success: false, error: 'Action tidak dikenali: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// BANTU
// ============================================================
function getData_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i].every(c => c === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      let v = values[i][idx];
      // NoIC: pastikan kekal 12 digit (0 depan tidak hilang)
      if (/noic/i.test(h) && v !== '') {
        v = String(v).trim().padStart(12, '0');
      }
      obj[h] = v;
    });
    rows.push(obj);
  }
  return rows;
}

function getTetapanObj_(ss) {
  const data = getData_(ss, CONFIG.SHEETS.TETAPAN);
  const obj = {};
  data.forEach(function (r) {
    if (r && r.Kunci) obj[r.Kunci] = r.Nilai;
  });
  return obj;
}

function cariMurid_(ss, ic) {
  const data = getData_(ss, CONFIG.SHEETS.MURID);
  for (let i = 0; i < data.length; i++) {
    if (String(data[i].NoIC || '').trim() === ic) {
      return data[i];
    }
  }
  return null;
}

function addRow_(ss, sheetName, fields) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak dijumpai' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(h => fields[h] || '');
  sheet.appendRow(newRow);
  return { success: true, message: 'Rekod ditambah' };
}

function updateLink_(ss, id, linkLaporan) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MURID);
  if (!sheet) return { success: false, error: 'Sheet tidak dijumpai' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 6).setValue(linkLaporan || '');
      return { success: true, message: 'Link dikemaskini' };
    }
  }
  return { success: false, error: 'Rekod tidak dijumpai' };
}

function updateTetapan_(ss, kunci, nilai) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.TETAPAN);
  if (!sheet) return { success: false, error: 'Sheet Tetapan tidak dijumpai' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == kunci) {
      sheet.getRange(i + 1, 2).setValue(nilai);
      return { success: true, message: 'Tetapan dikemaskini' };
    }
  }
  sheet.appendRow([kunci, nilai]);
  return { success: true, message: 'Tetapan baru' };
}
