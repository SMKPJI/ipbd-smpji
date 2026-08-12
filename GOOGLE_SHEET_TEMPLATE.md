# 📋 GOOGLE SHEET TEMPLATE — Carian Laporan PBD
## Import ke Google Sheet. Setiap jadual = 1 tab.

---

## TAB 1: Tetapan

```csv
Kunci,Nilai
namaSistem,Carian Laporan PBD
namaSekolah,SMK (P) Jalan Ipoh
logoUrl,
warnaUtama,#3b82f6
tahun,2026
folderLaporan,PASTE_FOLDER_ID_DI_SINI
kataLaluanAdmin,admin123
```

**folderLaporan**: ID folder Google Drive yang mengandungi semua PDF laporan.
Cara dapat ID: buka folder → URL jadi `https://drive.google.com/drive/folders/XXXXX` → salin `XXXXX`.

## TAB 2: Murid

```csv
ID,Nama,NoIC,Tingkatan,Kelas,LinkLaporan
m01,Ahmad Faiz bin Razak,010203040506,1,Amanah,
m02,Siti Aminah binti Kamal,020304050607,1,Amanah,
m03,Muhammad Hakim bin Zainal,030405060708,1,Bestari,
m04,Nur Aisyah binti Omar,040506070809,1,Bestari,
m05,Lim Wei Jie,050607080910,1,Cemerlang,
m06,Tan Mei Ling,060708091011,1,Cemerlang,
m07,Kavinesh a/l Murugan,070809101112,2,Amanah,
m08,Nurul Izzah binti Hassan,080910111213,2,Amanah,
m09,Faris Daniel bin Azman,091011121314,2,Bestari,
m10,Aina Sofea binti Rahman,101112131415,2,Bestari,
```

**LinkLaporan** — KOSONGKAN. Run `autoLinkLaporan()` dalam Apps Script, ia auto-isi.

---

## ⭐ CARA AUTO-LINK (JANGAN BUAT MANUAL 620 KALI!)

### 1. Nama Fail PDF
Simpan semua laporan dalam **SATU folder** Google Drive dengan format:

```
<Nama Murid>-<NoIC>.pdf

Contoh:
Ahmad Faiz bin Razak-010203040506.pdf
Siti Aminah binti Kamal-020304050607.pdf
```

### 2. Set folderLaporan
Paste folder ID dalam tab Tetapan.

### 3. Run autoLinkLaporan()
```
Apps Script → dropdown fungsi → pilih autoLinkLaporan → Run
```

Script akan:
- ✅ Scan semua fail dalam folder
- ✅ Ekstrak No IC dari nama fail (12 digit)
- ✅ Padankan dengan murid dalam tab Murid
- ✅ Auto-isi LinkLaporan (Google Drive link)
- ✅ Set sharing "Anyone with link" supaya website boleh buka
- ✅ Lapor berapa jumpa / berapa takde fail

**620 murid → siap dalam beberapa saat** ⚡

---

## Cara Setup Penuh

1. Buka [sheets.new](https://sheets.new)
2. Extensions → Apps Script → paste Code.gs → Run `setupSheet()`
3. Set `folderLaporan` dalam tab Tetapan
4. Run `autoLinkLaporan()`
5. Deploy → Web app → Anyone → copy URL
6. Paste URL dalam `js/data.js` → `API_URL`
7. Upload folder ke GitHub → Vercel → Deploy ✅
