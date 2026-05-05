const ExcelJS = require('exceljs');
const Barang = require('../models/barangModels');
const Ruangan = require('../models/ruanganModels');
const Kategori = require('../models/kategoriModels');
const Cabang = require('../models/cabangModels');
const Supplier = require('../models/supplierModels');

function setHeaderRow(worksheet, headers, headerRowNumber = 4) {
    const headerRow = worksheet.getRow(headerRowNumber);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top:    { style: 'thin' },
            left:   { style: 'thin' },
            bottom: { style: 'thin' },
            right:  { style: 'thin' },
        };
    });
    headerRow.height = 20;
    headerRow.commit();
}

function setTitleRows(worksheet, title, columnCount) {
    // Row 1: Judul
    worksheet.mergeCells(1, 1, 1, columnCount);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font  = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // Row 2: Tanggal cetak
    worksheet.mergeCells(2, 1, 2, columnCount);
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    })}`;
    dateCell.alignment = { horizontal: 'center' };

    // Row 3: Kosong (spacer)
    worksheet.getRow(3).height = 8;
}

function styleDataRow(row, columnCount) {
    for (let col = 1; col <= columnCount; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
        cell.border = {
            top:    { style: 'thin' },
            left:   { style: 'thin' },
            bottom: { style: 'thin' },
            right:  { style: 'thin' },
        };
        cell.font = { italic: true, color: { argb: 'FF808080' } };
    }
}

exports.importBarang = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "File Excel tidak ditemukan. Harap upload file .xlsx"
            });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            return res.status(400).json({ message: "Worksheet tidak ditemukan" });
        }

        const results = {
            success: [],
            failed: [],
        };

        // Ambil semua ruangan, kategori & cabang untuk mapping nama -> id
        const allRuangan = await Ruangan.findAll({ attributes: ["id", "name_ruangan"] });
        const allKategori = await Kategori.findAll({ attributes: ["id", "name_kategori"] });
        const allCabang = await Cabang.findAll({ attributes: ["id", "name_cabang"] });

        const ruanganMap = {};
        allRuangan.forEach(r => { ruanganMap[r.name_ruangan.toLowerCase().trim()] = r.id; });

        const kategoriMap = {};
        allKategori.forEach(k => { kategoriMap[k.name_kategori.toLowerCase().trim()] = k.id; });

        const cabangMap = {};
        allCabang.forEach(c => { cabangMap[c.name_cabang.toLowerCase().trim()] = c.id; });

        // Baris 1 = judul, baris 2 = tanggal cetak, baris 3 = kosong, baris 4 = header
        // Data mulai dari baris ke-5
        // Kolom: No | Kode Barang | Nama | Kategori | Ruangan | Cabang | Jumlah | Satuan | Tahun | Keterangan
        const DATA_START_ROW = 5;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber < DATA_START_ROW) return;

            const no              = row.getCell(1).value;
            const kode_barang     = String(row.getCell(2).value ?? "").trim();
            const name            = String(row.getCell(3).value ?? "").trim();
            const kategoriName    = String(row.getCell(4).value ?? "").trim().toLowerCase();
            const ruanganName     = String(row.getCell(5).value ?? "").trim().toLowerCase();
            const cabangName      = String(row.getCell(6).value ?? "").trim().toLowerCase();
            const jumlah          = parseInt(row.getCell(7).value) || 0;
            const satuan          = String(row.getCell(8).value ?? "").trim();
            const tahun_pengadaan = String(row.getCell(9).value ?? "").trim();
            const keterangan      = String(row.getCell(10).value ?? "").trim();

            // Skip baris total atau kosong
            if (!kode_barang || !name || isNaN(no)) {
                return;
            }

            const ruangan_id  = ruanganMap[ruanganName]  ?? null;
            const kategori_id = kategoriMap[kategoriName] ?? null;
            const cabang_id   = cabangMap[cabangName]    ?? null;

            results.rows = results.rows || [];
            results.rows.push({
                kode_barang,
                name,
                ruangan_id,
                kategori_id,
                cabang_id,
                jumlah,
                satuan,
                tahun_pengadaan,
                keterangan,
                _meta: { rowNumber, ruanganName, kategoriName, cabangName }
            });
        });

        const rows = results.rows || [];

        if (rows.length === 0) {
            return res.status(400).json({ message: "Tidak ada data yang dapat diproses" });
        }

        // Proses setiap baris
        for (const item of rows) {
            const { _meta, ...data } = item;
            const { rowNumber, ruanganName, kategoriName, cabangName } = _meta;

            // Validasi field wajib
            const errors = [];
            if (!data.name)            errors.push("Nama barang kosong");
            if (!data.kode_barang)     errors.push("Kode barang kosong");
            if (!data.satuan)          errors.push("Satuan kosong");
            if (!data.tahun_pengadaan) errors.push("Tahun pengadaan kosong");
            if (!data.ruangan_id)      errors.push(`Ruangan "${ruanganName}" tidak ditemukan`);
            if (!data.kategori_id)     errors.push(`Kategori "${kategoriName}" tidak ditemukan`);
            if (!data.cabang_id)       errors.push(`Cabang "${cabangName}" tidak ditemukan`);

            if (errors.length > 0) {
                results.failed.push({ row: rowNumber, kode_barang: data.kode_barang, errors });
                continue;
            }

            // Cek duplikat kode_barang
            const existing = await Barang.findOne({ where: { kode_barang: data.kode_barang } });
            if (existing) {
                results.failed.push({
                    row: rowNumber,
                    kode_barang: data.kode_barang,
                    errors: [`Kode barang "${data.kode_barang}" sudah ada`]
                });
                continue;
            }

            // Simpan ke database
            try {
                const created = await Barang.create({
                    name:            data.name,
                    kode_barang:     data.kode_barang,
                    ruangan_id:      data.ruangan_id,
                    cabang_id:       data.cabang_id,
                    kategori_id:     data.kategori_id,
                    jumlah:          data.jumlah,
                    satuan:          data.satuan,
                    tahun_pengadaan: data.tahun_pengadaan,
                    keterangan:      data.keterangan || null,
                    image:           null,
                });
                results.success.push({ row: rowNumber, kode_barang: data.kode_barang, id: created.id });
            } catch (err) {
                results.failed.push({
                    row: rowNumber,
                    kode_barang: data.kode_barang,
                    errors: [err.message]
                });
            }
        }

        return res.status(200).json({
            message: "Import succesfully created",
            berhasil: results.success.length,
            gagal:    results.failed.length,
            detail_gagal: results.failed,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.importCabang = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "File Excel tidak ditemukan. Harap upload file .xlsx"
            });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            return res.status(400).json({ message: "Worksheet tidak ditemukan" });
        }

        // Struktur file: baris 1=judul, 2=tanggal, 3=kosong, 4=header, 5+=data
        const DATA_START_ROW = 5;
        const rows = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber < DATA_START_ROW) return;

            const no           = row.getCell(1).value;
            const name_cabang  = String(row.getCell(2).value ?? "").trim();
            const daerah_cabang = String(row.getCell(3).value ?? "").trim();

            // Skip baris total atau kosong
            if (!name_cabang || !daerah_cabang || isNaN(no)) return;

            rows.push({ rowNumber, name_cabang, daerah_cabang });
        });

        if (rows.length === 0) {
            return res.status(400).json({ message: "Tidak ada data yang dapat diproses" });
        }

        const results = { success: [], failed: [] };

        for (const item of rows) {
            const { rowNumber, name_cabang, daerah_cabang } = item;

            // Validasi field wajib
            const errors = [];
            if (!name_cabang)   errors.push("Nama cabang kosong");
            if (!daerah_cabang) errors.push("Daerah cabang kosong");

            if (errors.length > 0) {
                results.failed.push({ row: rowNumber, name_cabang, errors });
                continue;
            }

            // Cek duplikat nama cabang
            const existing = await Cabang.findOne({ where: { name_cabang } });
            if (existing) {
                results.failed.push({
                    row: rowNumber,
                    name_cabang,
                    errors: [`Cabang "${name_cabang}" sudah ada`]
                });
                continue;
            }

            try {
                const created = await Cabang.create({ name_cabang, daerah_cabang });
                results.success.push({ row: rowNumber, name_cabang, id: created.id });
            } catch (err) {
                results.failed.push({ row: rowNumber, name_cabang, errors: [err.message] });
            }
        }

        return res.status(200).json({
            message: "Import successfully completed",
            berhasil:     results.success.length,
            gagal:        results.failed.length,
            detail_gagal: results.failed,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.importSupplier = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "File Excel tidak ditemukan. Harap upload file .xlsx"
            });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            return res.status(400).json({ message: "Worksheet tidak ditemukan" });
        }

        // Struktur file: baris 1=judul, 2=tanggal, 3=kosong, 4=header, 5+=data
        const DATA_START_ROW = 5;
        const rows = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber < DATA_START_ROW) return;

            const no               = row.getCell(1).value;
            const name_supplier    = String(row.getCell(2).value ?? "").trim();
            const perusahaan       = String(row.getCell(3).value ?? "").trim();
            const alamat_perusahaan = String(row.getCell(4).value ?? "").trim();
            const no_telp          = String(row.getCell(5).value ?? "").trim();

            // Skip baris total atau kosong
            if (!name_supplier || !perusahaan || isNaN(no)) return;

            rows.push({ rowNumber, name_supplier, perusahaan, alamat_perusahaan, no_telp });
        });

        if (rows.length === 0) {
            return res.status(400).json({ message: "Tidak ada data yang dapat diproses" });
        }

        const phoneRegex = /^08\d{8,10}$/;
        const results = { success: [], failed: [] };

        for (const item of rows) {
            const { rowNumber, name_supplier, perusahaan, alamat_perusahaan, no_telp } = item;

            // Validasi field wajib
            const errors = [];
            if (!name_supplier)     errors.push("Nama supplier kosong");
            if (!perusahaan)        errors.push("Perusahaan kosong");
            if (!alamat_perusahaan) errors.push("Alamat perusahaan kosong");
            if (!no_telp)           errors.push("No. telepon kosong");
            else if (!phoneRegex.test(no_telp)) {
                errors.push(`No. telepon "${no_telp}" tidak valid. Harus diawali 08 dan 10-12 digit`);
            }

            if (errors.length > 0) {
                results.failed.push({ row: rowNumber, name_supplier, errors });
                continue;
            }

            // Cek duplikat berdasarkan nama supplier + perusahaan
            const existing = await Supplier.findOne({ where: { name_supplier, perusahaan } });
            if (existing) {
                results.failed.push({
                    row: rowNumber,
                    name_supplier,
                    errors: [`Supplier "${name_supplier}" dari perusahaan "${perusahaan}" sudah ada`]
                });
                continue;
            }

            try {
                const created = await Supplier.create({
                    name_supplier,
                    perusahaan,
                    alamat_perusahaan,
                    no_telp,
                });
                results.success.push({ row: rowNumber, name_supplier, id: created.id });
            } catch (err) {
                results.failed.push({ row: rowNumber, name_supplier, errors: [err.message] });
            }
        }

        return res.status(200).json({
            message: "import successfully completed",
            berhasil:     results.success.length,
            gagal:        results.failed.length,
            detail_gagal: results.failed,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.downloadTemplateBarang = async (req, res) => {
    try {
        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Barang');

        const headers = [
            'No', 'Kode Barang', 'Nama', 'Kategori',
            'Ruangan', 'Cabang', 'Jumlah', 'Satuan',
            'Tahun Pengadaan', 'Keterangan'
        ];

        setTitleRows(worksheet, 'TEMPLATE IMPORT DATA BARANG', headers.length);
        setHeaderRow(worksheet, headers, 4);

        // Contoh baris data
        const exampleRow = worksheet.getRow(5);
        exampleRow.values = [
            1, 'BRG-001', 'Kursi Kantor', 'Furniture',
            'Ruang Rapat', 'Cabang Jakarta', 5, 'Unit',
            '2024', 'Kondisi baik'
        ];
        styleDataRow(exampleRow, headers.length);
        exampleRow.commit();

        // Lebar kolom
        const colWidths = [6, 16, 25, 18, 18, 18, 10, 12, 18, 25];
        colWidths.forEach((w, i) => {
            worksheet.getColumn(i + 1).width = w;
        });

        // Sheet petunjuk
        const petunjuk = workbook.addWorksheet('Petunjuk');
        const notes = [
            ['PETUNJUK PENGISIAN TEMPLATE BARANG'],
            [''],
            ['Kolom', 'Keterangan', 'Wajib?'],
            ['No',              'Nomor urut (angka)',                                         'Ya'],
            ['Kode Barang',     'Kode unik barang (tidak boleh duplikat)',                    'Ya'],
            ['Nama',            'Nama lengkap barang',                                       'Ya'],
            ['Kategori',        'Nama kategori (harus sesuai data di sistem)',                'Ya'],
            ['Ruangan',         'Nama ruangan (harus sesuai data di sistem)',                 'Ya'],
            ['Cabang',          'Nama cabang (harus sesuai data di sistem)',                  'Ya'],
            ['Jumlah',          'Jumlah barang (angka)',                                      'Tidak'],
            ['Satuan',          'Satuan barang, misal: Unit, Buah, Set',                      'Ya'],
            ['Tahun Pengadaan', 'Tahun pengadaan, misal: 2024',                               'Ya'],
            ['Keterangan',      'Keterangan tambahan (opsional)',                             'Tidak'],
            [''],
            ['CATATAN:'],
            ['- Data dimulai dari baris ke-5 (baris 1-4 adalah judul & header, jangan dihapus)'],
            ['- Nama Kategori, Ruangan, dan Cabang harus PERSIS sama dengan data yang ada di sistem'],
            ['- Kode Barang harus unik, tidak boleh ada duplikat'],
        ];
        notes.forEach((r, i) => {
            const row = petunjuk.getRow(i + 1);
            r.forEach((v, j) => { row.getCell(j + 1).value = v; });
            if (i === 0) { row.getCell(1).font = { bold: true, size: 13 }; }
            if (i === 2) {
                ['A','B','C'].forEach(col => {
                    petunjuk.getCell(`${col}${i+1}`).font = { bold: true };
                });
            }
            row.commit();
        });
        petunjuk.getColumn(1).width = 20;
        petunjuk.getColumn(2).width = 55;
        petunjuk.getColumn(3).width = 10;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template_import_barang.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        return res.status(500).json({ message: 'Gagal generate template', error: error.message });
    }
};

exports.downloadTemplateCabang = async (req, res) => {
    try {
        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Cabang');

        const headers = ['No', 'Nama Cabang', 'Daerah Cabang'];

        setTitleRows(worksheet, 'TEMPLATE IMPORT DATA CABANG', headers.length);
        setHeaderRow(worksheet, headers, 4);

        // Contoh baris data
        const exampleRow = worksheet.getRow(5);
        exampleRow.values = [1, 'Cabang Jakarta', 'DKI Jakarta'];
        styleDataRow(exampleRow, headers.length);
        exampleRow.commit();

        worksheet.getColumn(1).width = 6;
        worksheet.getColumn(2).width = 25;
        worksheet.getColumn(3).width = 25;

        // Sheet petunjuk
        const petunjuk = workbook.addWorksheet('Petunjuk');
        const notes = [
            ['PETUNJUK PENGISIAN TEMPLATE CABANG'],
            [''],
            ['Kolom', 'Keterangan', 'Wajib?'],
            ['No',           'Nomor urut (angka)',                          'Ya'],
            ['Nama Cabang',  'Nama cabang (tidak boleh duplikat)',           'Ya'],
            ['Daerah Cabang','Daerah/kota lokasi cabang',                   'Ya'],
            [''],
            ['CATATAN:'],
            ['- Data dimulai dari baris ke-5 (baris 1-4 adalah judul & header, jangan dihapus)'],
            ['- Nama Cabang harus unik, tidak boleh ada duplikat'],
        ];
        notes.forEach((r, i) => {
            const row = petunjuk.getRow(i + 1);
            r.forEach((v, j) => { row.getCell(j + 1).value = v; });
            if (i === 0) { row.getCell(1).font = { bold: true, size: 13 }; }
            if (i === 2) {
                ['A','B','C'].forEach(col => {
                    petunjuk.getCell(`${col}${i+1}`).font = { bold: true };
                });
            }
            row.commit();
        });
        petunjuk.getColumn(1).width = 16;
        petunjuk.getColumn(2).width = 45;
        petunjuk.getColumn(3).width = 10;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template_import_cabang.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        return res.status(500).json({ message: 'Gagal generate template', error: error.message });
    }
};

exports.downloadTemplateSupplier = async (req, res) => {
    try {
        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Supplier');

        const headers = ['No', 'Nama Supplier', 'Perusahaan', 'Alamat Perusahaan', 'No. Telepon'];

        setTitleRows(worksheet, 'TEMPLATE IMPORT DATA SUPPLIER', headers.length);
        setHeaderRow(worksheet, headers, 4);

        // Contoh baris data
        const exampleRow = worksheet.getRow(5);
        exampleRow.values = [1, 'Budi Santoso', 'PT Maju Bersama', 'Jl. Sudirman No. 10, Jakarta', '081234567890'];
        styleDataRow(exampleRow, headers.length);
        exampleRow.commit();

        worksheet.getColumn(1).width = 6;
        worksheet.getColumn(2).width = 22;
        worksheet.getColumn(3).width = 25;
        worksheet.getColumn(4).width = 35;
        worksheet.getColumn(5).width = 18;

        // Sheet petunjuk
        const petunjuk = workbook.addWorksheet('Petunjuk');
        const notes = [
            ['PETUNJUK PENGISIAN TEMPLATE SUPPLIER'],
            [''],
            ['Kolom', 'Keterangan', 'Wajib?'],
            ['No',               'Nomor urut (angka)',                                       'Ya'],
            ['Nama Supplier',    'Nama lengkap supplier',                                    'Ya'],
            ['Perusahaan',       'Nama perusahaan supplier',                                 'Ya'],
            ['Alamat Perusahaan','Alamat lengkap perusahaan',                                'Ya'],
            ['No. Telepon',      'Format: diawali 08 dan total 10-12 digit, misal: 081234567890', 'Ya'],
            [''],
            ['CATATAN:'],
            ['- Data dimulai dari baris ke-5 (baris 1-4 adalah judul & header, jangan dihapus)'],
            ['- Kombinasi Nama Supplier + Perusahaan harus unik, tidak boleh duplikat'],
            ['- No. Telepon harus diawali 08 dan terdiri dari 10-12 digit angka'],
        ];
        notes.forEach((r, i) => {
            const row = petunjuk.getRow(i + 1);
            r.forEach((v, j) => { row.getCell(j + 1).value = v; });
            if (i === 0) { row.getCell(1).font = { bold: true, size: 13 }; }
            if (i === 2) {
                ['A','B','C'].forEach(col => {
                    petunjuk.getCell(`${col}${i+1}`).font = { bold: true };
                });
            }
            row.commit();
        });
        petunjuk.getColumn(1).width = 20;
        petunjuk.getColumn(2).width = 60;
        petunjuk.getColumn(3).width = 10;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template_import_supplier.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        return res.status(500).json({ message: 'Gagal generate template', error: error.message });
    }
};