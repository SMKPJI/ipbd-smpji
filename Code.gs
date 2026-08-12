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
  setupTab(ss, CONFIG.SHEETS.MURID, ['ID', 'Nama', 'NoIC', 'Tingkatan', 'Kelas', 'LinkKeseluruhan', 'LinkKemahiran'], [80, 250, 130, 100, 120, 350, 350]);
  
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
    ['m01', 'Ahmad Faiz bin Razak', '010203040506', '1', 'Amanah', '', ''],
    ['m02', 'Siti Aminah binti Kamal', '020304050607', '1', 'Amanah', '', ''],
    ['m03', 'Muhammad Hakim bin Zainal', '030405060708', '1', 'Bestari', '', ''],
    ['m04', 'Nur Aisyah binti Omar', '040506070809', '1', 'Bestari', '', ''],
    ['m05', 'Lim Wei Jie', '050607080910', '1', 'Cemerlang', '', ''],
    ['m06', 'Tan Mei Ling', '060708091011', '1', 'Cemerlang', '', ''],
    ['m07', 'Kavinesh a/l Murugan', '070809101112', '2', 'Amanah', '', ''],
    ['m08', 'Nurul Izzah binti Hassan', '080910111213', '2', 'Amanah', '', ''],
    ['m09', 'Faris Daniel bin Azman', '091011121314', '2', 'Bestari', '', ''],
    ['m10', 'Aina Sofea binti Rahman', '101112131415', '2', 'Bestari', '', '']
  ];
  m.getRange(2, 1, murid.length, 7).setValues(murid);
}

// ============================================================
// 🔍 DIAGNOSTIK — SENARAI FAIL DALAM FOLDER
// ============================================================
// Run ini untuk tengok nama fail sebenar dalam folder.
// Ini membantu cari punca "Tiada fail" — contoh nama tak padan.
// ============================================================
function senaraiFailFolder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tetapan = getTetapanObj_(ss);
  const folderId = tetapan.folderLaporan;
  
  if (!folderId || folderId.indexOf('PASTE_FOLDER_ID') !== -1) {
    SpreadsheetApp.getUi().alert('⚠️ Sila set folderLaporan dahulu.');
    return;
  }
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const hasil = [];
    kumpulNamaFail_(folder, hasil, 0);
    
    if (hasil.length === 0) {
      SpreadsheetApp.getUi().alert('📂 Folder kosong atau tiada fail PDF ditemui.');
      return;
    }
    
    const teks = hasil.slice(0, 30).join('\n');
    SpreadsheetApp.getUi().alert(
      '📂 ' + hasil.length + ' fail ditemui. Contoh:\n\n' + teks +
      (hasil.length > 30 ? '\n... dan ' + (hasil.length - 30) + ' lagi' : '')
    );
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ralat: ' + e.toString());
  }
}

function kumpulNamaFail_(folder, hasil, kedalaman) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const nama = file.getName();
    // Kumpul fail PDF + fail bernombor IC (tanpa extension)
    if (/\.pdf$/i.test(nama) || /\d{12}/.test(nama)) {
      hasil.push(nama + (kedalaman > 0 ? '   [sub-folder]' : ''));
    }
  }
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    kumpulNamaFail_(subFolders.next(), hasil, kedalaman + 1);
  }
}

// Kumpul nama fail (PDF + IC tanpa extension) untuk pengiraan
function kumpulNamaFailPdf_(folder, senarai) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const nama = file.getName();
    if (/\.pdf$/i.test(nama) || /\d{12}/.test(nama)) {
      senarai.push(nama);
    }
  }
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    kumpulNamaFailPdf_(subFolders.next(), senarai);
  }
}

// ============================================================
// ⭐ AUTO-LINK LAPORAN — TOLONG JANGAN BUAT MANUAL!
// ============================================================
// Padankan fail PDF dalam Google Drive dengan murid guna No IC
// dalam nama fail. Scan RECURSIVE — masuk semua sub-folder.
//
// Format nama fail:
//   Slip Keseluruhan: <NoIC>.pdf              → 010203040506.pdf
//   Slip Kemahiran:   <NoIC>-kemahiran.pdf    → 010203040506-kemahiran.pdf
//   ("KEMAHIRAN"/"Kemahiran"/"kemahiran" semua diterima — case tak kira)
//
// Struktur folder (ikut cikgu PBD):
//   PBD > 2026 > SLIP PAT/UASA | SLIP PPT > TINGKATAN x > KELAS
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
    
    // Kumpul semua fail secara recursive (masuk semua sub-folder)
    const failByIC = {};       // IC -> { keseluruhan: file, kemahiran: file }
    scanFolder_(folder, failByIC);
    
    // Padankan dengan murid dalam sheet
    const sheet = ss.getSheetByName(CONFIG.SHEETS.MURID);
    const data = sheet.getDataRange().getValues();
    let keseluruhan = 0;
    let kemahiran = 0;
    let tiadaFail = 0;
    
    // Kira fail yang ada (untuk maklum berapa dah rename)
    const semuaPdf = [];
    kumpulNamaFailPdf_(folder, semuaPdf);
    const dahRename = semuaPdf.filter(function (n) {
      return /\d{12}/.test(n);  // ada 12 digit = dah ada IC
    }).length;
    
    for (let i = 1; i < data.length; i++) {
      const ic = String(data[i][2] || '').trim().padStart(12, '0');
      if (!ic || ic.length !== 12) continue;
      
      const jumpa = failByIC[ic];
      if (jumpa) {
        if (jumpa.keseluruhan) {
          const file = jumpa.keseluruhan;
          try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
          sheet.getRange(i + 1, 6).setValue('https://drive.google.com/file/d/' + file.getId() + '/view');
          keseluruhan++;
        }
        if (jumpa.kemahiran) {
          const file = jumpa.kemahiran;
          try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
          sheet.getRange(i + 1, 7).setValue('https://drive.google.com/file/d/' + file.getId() + '/view');
          kemahiran++;
        }
        if (!jumpa.keseluruhan && !jumpa.kemahiran) tiadaFail++;
      } else {
        tiadaFail++;
      }
    }
    
    SpreadsheetApp.getUi().alert(
      '✅ Selesai!\n\n' +
      'Slip Keseluruhan diisi: ' + keseluruhan + '\n' +
      'Slip Kemahiran diisi: ' + kemahiran + '\n' +
      'Tiada fail (perlu semak): ' + tiadaFail + '\n\n' +
      '📂 Fail berformat IC dalam folder: ' + dahRename + '/' + semuaPdf.length + '\n' +
      '(Yang lain masih nama murid — tunggu guru rename manual, lepas tu run semula.)'
    );
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ralat: ' + e.toString());
  }
}

// Scan folder + semua sub-folder, kumpul fail mengikut IC
// FLEKSIBEL: terima pelbagai format nama fail
function scanFolder_(folder, failByIC) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const namaAsal = file.getName();
    const namaLower = namaAsal.toLowerCase();
    // Terima fail PDF ATAU fail bernombor IC tanpa extension
    // (contoh: "130306011534" tanpa .pdf)
    
    // Cari 12 digit (No IC) di mana-mana dalam nama fail
    const matchIC = namaLower.match(/(\d{12})/);
    if (!matchIC) continue;  // tiada IC — diabaikan
    
    const ic = matchIC[1];
    if (!failByIC[ic]) failByIC[ic] = {};
    
    // Ada perkataan "kemahiran" → slip kemahiran (tak kira - _ ruang atau huruf besar)
    if (namaLower.indexOf('kemahiran') !== -1) {
      failByIC[ic].kemahiran = file;
    } else {
      failByIC[ic].keseluruhan = file;
    }
  }
  
  // Recurse sub-folder
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    scanFolder_(subFolders.next(), failByIC);
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
