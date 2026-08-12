/* ==========================================================================
   Carian Laporan PBD — js/data.js
   Lapisan data: localStorage (cache) + API Google Apps Script (pilihan)

   Aliran:
   1. initData() — benih data mock jika versi berubah (pbd_versi)
   2. UI membaca getMurid() / getTetapan() daripada localStorage (pantas)
   3. syncDataFromApi() — tarik data terkini daripada Google Sheet (jika API_URL diisi)
   ========================================================================== */

/* ---------- 1. Tetapan API ----------
   Isi API_URL dengan URL Web App Google Apps Script, contoh:
   'https://script.google.com/macros/s/ABCDEFGHIJKLMNOPQRSTUVWXYZ/exec'
   Biarkan kosong ('') untuk guna data mock setempat sahaja. */
var API_URL = 'https://script.google.com/macros/s/AKfycbzt2vVdFanrBMJJw-ORSTSBNf-a-JdFr8xZNjIACDRlT6QHT5y3uAPp7cRMGrbo4mYV2A/exec';

/* ---------- 2. Kunci & versi localStorage ---------- */
var KEY_MURID = 'pbd_murid';
var KEY_TETAPAN = 'pbd_tetapan';
var KEY_VERSI = 'pbd_versi';
var DATA_VERSI = '1.0.0';

/* ---------- 3. Data mock: Tetapan ----------
   Semua nilai ini boleh ditimpa oleh Google Sheet melalui syncDataFromApi(). */
var MOCK_TETAPAN = {
  namaSistem: 'Carian Laporan PBD',
  namaSekolah: 'SMK (P) Jalan Ipoh',
  logoUrl: '',
  warnaUtama: '#3b82f6',
  tahun: '2026',
  kataLaluanAdmin: 'admin123'
};

/* ---------- 4. Data mock: Murid ----------
   10 contoh murid. Dua (2) murid telah ada link laporan; lapan (8) lagi belum.
   No IC: 12 digit (format YYMMDD-PB-####, disimpan tanpa tanda sempang). */
var MOCK_MURID = [
  {
    id: 'm-001',
    nama: 'Aisyah Binti Ahmad',
    ic: '090105145678',
    tingkatan: '1',
    kelas: 'Amanah',
    linkLaporan: 'https://drive.google.com/file/d/1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV/view'
  },
  {
    id: 'm-002',
    nama: 'Muhammad Danial bin Roslan',
    ic: '090310011234',
    tingkatan: '1',
    kelas: 'Amanah',
    linkLaporan: ''
  },
  {
    id: 'm-003',
    nama: 'Nurul Izzah binti Abdullah',
    ic: '090620082211',
    tingkatan: '1',
    kelas: 'Bestari',
    linkLaporan: ''
  },
  {
    id: 'm-004',
    nama: 'Ahmad Faiz bin Ismail',
    ic: '090812103345',
    tingkatan: '1',
    kelas: 'Bestari',
    linkLaporan: ''
  },
  {
    id: 'm-005',
    nama: 'Siti Nurhaliza binti Mohd Ali',
    ic: '091127067788',
    tingkatan: '1',
    kelas: 'Cemerlang',
    linkLaporan: ''
  },
  {
    id: 'm-006',
    nama: 'Muhammad Haikal bin Zulkifli',
    ic: '100215034455',
    tingkatan: '1',
    kelas: 'Cemerlang',
    linkLaporan: ''
  },
  {
    id: 'm-007',
    nama: 'Nur Aisyah Humaira binti Salleh',
    ic: '100501128899',
    tingkatan: '1',
    kelas: 'Dedikasi',
    linkLaporan: 'https://drive.google.com/file/d/9xY8zW7vU6tS5rQ4pO3nM2lK1jH0gF9eD/view'
  },
  {
    id: 'm-008',
    nama: 'Lim Wei Jian',
    ic: '100718145566',
    tingkatan: '1',
    kelas: 'Dedikasi',
    linkLaporan: ''
  },
  {
    id: 'm-009',
    nama: 'Kavitha a/p Ramesh',
    ic: '100930089900',
    tingkatan: '1',
    kelas: 'Integriti',
    linkLaporan: ''
  },
  {
    id: 'm-010',
    nama: 'Muhammad Irfan bin Hafiz',
    ic: '101115011122',
    tingkatan: '1',
    kelas: 'Integriti',
    linkLaporan: ''
  }
];

/* ---------- 5. Inisialisasi data (benih sekali sahaja) ---------- */
function initData() {
  var versi = '';
  try {
    versi = localStorage.getItem(KEY_VERSI) || '';
  } catch (e) {
    versi = '';
  }
  if (versi !== DATA_VERSI) {
    try {
      localStorage.setItem(KEY_TETAPAN, JSON.stringify(MOCK_TETAPAN));
      localStorage.setItem(KEY_MURID, JSON.stringify(MOCK_MURID));
      localStorage.setItem(KEY_VERSI, DATA_VERSI);
    } catch (e) {
      /* localStorage tidak tersedia — teruskan dengan data mock dalam memori */
    }
  }
}

/* ---------- 6. Baca / simpan Tetapan ---------- */
function getTetapan() {
  var t = {};
  try {
    t = JSON.parse(localStorage.getItem(KEY_TETAPAN) || '{}');
  } catch (e) {
    t = {};
  }
  return Object.assign({}, MOCK_TETAPAN, t);
}

function simpanTetapan(tetapan) {
  try {
    localStorage.setItem(KEY_TETAPAN, JSON.stringify(tetapan || {}));
  } catch (e) {
    /* abaikan */
  }
}

/* ---------- 7. Baca / simpan Murid ---------- */
function getMurid() {
  try {
    var arr = JSON.parse(localStorage.getItem(KEY_MURID) || 'null');
    if (Array.isArray(arr)) {
      return arr;
    }
  } catch (e) {
    /* fallthrough */
  }
  return MOCK_MURID;
}

function simpanMurid(senarai) {
  try {
    localStorage.setItem(KEY_MURID, JSON.stringify(senarai || []));
  } catch (e) {
    /* abaikan */
  }
}

/* ---------- 8. Carian murid mengikut No IC ---------- */
function cariMurid(ic) {
  ic = String(ic == null ? '' : ic).trim();
  if (!ic) {
    return null;
  }
  var senarai = getMurid();
  for (var i = 0; i < senarai.length; i++) {
    if (String(senarai[i].ic || '').trim() === ic) {
      return senarai[i];
    }
  }
  return null;
}

/* Petakan baris daripada API (kekunci = nama header sheet)
   kepada bentuk aplikasi (huruf kecil) supaya UI tidak
   terdedah kepada nama header sheet. */
function mapMuridDariApi(row) {
  return {
    id: String(row.ID != null ? row.ID : '').toLowerCase() || ('api-' + Math.random().toString(36).slice(2, 8)),
    nama: row.Nama || '',
    /* Google Sheets simpan NoIC sebagai nombor → 0 depan hilang.
       Pad semula ke 12 digit supaya carian IC berfungsi. */
    ic: String(row.NoIC || '').trim().padStart(12, '0'),
    tingkatan: row.Tingkatan != null ? String(row.Tingkatan) : '',
    kelas: row.Kelas || '',
    linkLaporan: row.LinkLaporan || ''
  };
}

/* Tetapan tiba sebagai baris {Kunci, Nilai} -> tukar kepada objek */
function mapTetapanDariApi(baris) {
  var obj = {};
  (baris || []).forEach(function (r) {
    if (r && r.Kunci) {
      obj[r.Kunci] = r.Nilai;
    }
  });
  return obj;
}

/* ---------- 10. Segerak data daripada API (Google Apps Script) ----------
   Jangkaan respons API_URL?action=getAll:
   { murid: [{ID, Nama, NoIC, Tingkatan, Kelas, LinkLaporan}],
     tetapan: [{Kunci, Nilai}] }
   Pulangkan Promise<boolean> — true jika berjaya, false jika gagal/tiada API. */
function syncDataFromApi() {
  if (!API_URL) {
    return Promise.resolve(false);
  }
  return fetch(API_URL + '?action=getAll')
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      if (data && Array.isArray(data.murid) && data.murid.length > 0) {
        simpanMurid(data.murid.map(mapMuridDariApi));
      }
      if (data && data.tetapan) {
        simpanTetapan(Object.assign({}, getTetapan(), mapTetapanDariApi(data.tetapan)));
      }
      /* Beritahu halaman (header/footer) supaya render semula dengan data terkini */
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('pbd:synced'));
      }
      return true;
    })
    .catch(function () {
      return false;
    });
}

/* ---------- 11. Bantuan CRUD (asas) ---------- */
function tambahMurid(murid) {
  var senarai = getMurid();
  murid = murid || {};
  murid.id = murid.id || ('m-' + Date.now().toString(36));
  senarai.push(murid);
  simpanMurid(senarai);
  return murid;
}

function padamMurid(id) {
  var senarai = getMurid().filter(function (m) {
    return m.id !== id;
  });
  simpanMurid(senarai);
  return senarai;
}

/* Benih data apabila fail dimuat terus (bagi kes skrip ujian luar) */
if (typeof window !== 'undefined' && window.localStorage) {
  initData();
}
