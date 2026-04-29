const ExcelJS = require('exceljs');
const Barang = require('../models/barangModels');
const Ruangan = require('../models/ruanganModels');
const Kategori = require('../models/kategoriModels');
const Cabang = require('../models/cabangModels');
const Supplier = require('../models/supplierModels');

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