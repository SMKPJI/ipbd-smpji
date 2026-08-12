/* ==========================================================================
   Carian Laporan PBD — js/common.js
   Fungsi sepunya: header, footer, tema (gelap/cerah), tetapan, utiliti
   ========================================================================== */

/* ---------- 1. Utiliti ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function namaHalaman() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

/* ---------- 2. Tema (gelap lalai, cerah pilihan) ---------- */
var KEY_TEMA = 'pbd_tema';

function getTema() {
  var t = 'dark';
  try {
    t = localStorage.getItem(KEY_TEMA) || 'dark';
  } catch (e) {
    t = 'dark';
  }
  return t === 'light' ? 'light' : 'dark';
}

function setTema(tema) {
  var t = tema === 'light' ? 'light' : 'dark';
  try {
    localStorage.setItem(KEY_TEMA, t);
  } catch (e) {
    /* abaikan */
  }
  if (t === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
}

/* Pasang butang tukar tema (idempoten — selamat dipanggil berulang) */
function initTemaToggle() {
  var btn = document.getElementById('toggle-tema');
  if (!btn) {
    return;
  }
  btn.textContent = getTema() === 'dark' ? '☀️' : '🌙';
  btn.title = getTema() === 'dark' ? 'Tukar ke tema cerah' : 'Tukar ke tema gelap';
  btn.onclick = function () {
    setTema(getTema() === 'dark' ? 'light' : 'dark');
    btn.textContent = getTema() === 'dark' ? '☀️' : '🌙';
    btn.title = getTema() === 'dark' ? 'Tukar ke tema cerah' : 'Tukar ke tema gelap';
  };
}

/* ---------- 3. Guna tetapan pada halaman (tajuk, warna aksen) ---------- */
function applySettings() {
  var t = getTetapan();
  document.title = t.namaSistem + ' — ' + t.namaSekolah;
  document.documentElement.style.setProperty('--accent', t.warnaUtama || '#3b82f6');
}

/* ---------- 4. Header sepunya ---------- */
function renderHeader() {
  var ph = document.getElementById('header-placeholder');
  if (!ph) {
    return;
  }
  var t = getTetapan();
  var halaman = namaHalaman();
  var logo = t.logoUrl && String(t.logoUrl).trim() !== ''
    ? '<img class="logo-img" src="' + esc(t.logoUrl) + '" alt="Logo">'
    : '<span class="logo-emoji">📘</span>';

  var linkCarian = '<a class="nav-link' + (halaman === 'index.html' ? ' aktif' : '') + '" href="index.html"><span class="nav-label">Carian</span> 🔍</a>';
  var linkSemakan = '<a class="nav-link' + (halaman === 'admin.html' ? ' aktif' : '') + '" href="admin.html"><span class="nav-label">Semakan</span> 🛠️</a>';

  ph.innerHTML =
    '<header class="header">' +
    '  <div class="container header-inner">' +
    '    <a class="brand" href="index.html">' +
    logo +
    '      <span class="brand-text">' +
    '        <strong>' + esc(t.namaSistem) + '</strong>' +
    '        <small>' + esc(t.namaSekolah) + '</small>' +
    '      </span>' +
    '    </a>' +
    '    <nav class="nav">' +
    linkCarian +
    linkSemakan +
    '    </nav>' +
    '    <button type="button" class="btn-tema" id="toggle-tema" aria-label="Tukar tema"></button>' +
    '  </div>' +
    '</header>';
}

/* ---------- 5. Footer sepunya ---------- */
function renderFooter() {
  var ph = document.getElementById('footer-placeholder');
  if (!ph) {
    return;
  }
  var t = getTetapan();
  var tahun = t.tahun || String(new Date().getFullYear());
  ph.innerHTML =
    '<footer class="footer">' +
    '  <div class="container">' +
    '    <span>© ' + esc(tahun) + ' ' + esc(t.namaSekolah) + '</span>' +
    '    <span class="footer-merk">' + esc(t.namaSistem) + ' · Pentaksiran Bilik Darjah</span>' +
    '  </div>' +
    '</footer>';
}

/* ---------- 6. But (boot) sepunya — panggil pada setiap halaman ---------- */
function pbdBoot() {
  initData();
  applySettings();
  renderHeader();
  renderFooter();
  initTemaToggle();

  /* Render semula chrome apabila data disegerakkan daripada API */
  window.addEventListener('pbd:synced', function () {
    applySettings();
    renderHeader();
    renderFooter();
    initTemaToggle();
  });
}

/* Jalankan boot selepas DOM sedia */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', pbdBoot);
} else {
  pbdBoot();
}
