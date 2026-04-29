const Barang = require("../models/barangModels");
const BarangMasuk = require("../models/barangmasukModels");
const BarangKeluar = require("../models/barangkeluarModels");
const BarangRusak = require("../models/barangrusakModels");
const BarangMaintenance = require("../models/barangmaintenanceModels");
const Kategori = require("../models/kategoriModels");
const Cabang = require("../models/cabangModels");
const Ruangan = require("../models/ruanganModels");
const Supplier = require("../models/supplierModels");
const User = require("../models/userModels");
const { Op, fn, col, literal } = require("sequelize");

exports.getDashboard = async (req, res) => {
    try {

        const tahunIni = new Date().getFullYear();

        // ── 1. CARDS ─────────────────────────────────────────────
        const [
            totalBarang,
            totalBarangMasuk,
            totalBarangKeluar,
            totalBarangRusak,
            totalMaintenance,
            totalSupplier,
            totalCabang,
        ] = await Promise.all([
            Barang.count(),
            BarangMasuk.count(),
            BarangKeluar.count(),
            BarangRusak.count(),
            BarangMaintenance.count(),
            Supplier.count(),
            Cabang.count(),
        ]);

        // Total stok semua barang
        const stokResult = await Barang.findOne({
            attributes: [[fn("SUM", col("jumlah")), "total_stok"]],
            raw: true
        });
        const totalStok = parseInt(stokResult?.total_stok ?? 0);

        // Maintenance yang masih berjalan
        const maintenanceBerjalan = await BarangMaintenance.count({
            where: { status: "maintenance" }
        });

        // ── 2. CHART: Barang Masuk vs Keluar per Bulan (tahun ini) ──
        const [masukPerBulan, keluarPerBulan] = await Promise.all([
            BarangMasuk.findAll({
                attributes: [
                    [fn("MONTH", col("tanggal_masuk")), "bulan"],
                    [fn("SUM", col("jumlah")), "total"],
                ],
                where: {
                    tanggal_masuk: {
                        [Op.between]: [
                            new Date(`${tahunIni}-01-01`),
                            new Date(`${tahunIni}-12-31`)
                        ]
                    }
                },
                group: [fn("MONTH", col("tanggal_masuk"))],
                order: [[fn("MONTH", col("tanggal_masuk")), "ASC"]],
                raw: true
            }),
            BarangKeluar.findAll({
                attributes: [
                    [fn("MONTH", col("tanggal_keluar")), "bulan"],
                    [fn("SUM", col("jumlah_keluar")), "total"],
                ],
                where: {
                    tanggal_keluar: {
                        [Op.between]: [
                            new Date(`${tahunIni}-01-01`),
                            new Date(`${tahunIni}-12-31`)
                        ]
                    }
                },
                group: [fn("MONTH", col("tanggal_keluar"))],
                order: [[fn("MONTH", col("tanggal_keluar")), "ASC"]],
                raw: true
            })
        ]);

        // Mapping 12 bulan (isi 0 jika tidak ada data)
        const namaBulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
        const chartMasukKeluar = namaBulan.map((nama, i) => {
            const bulan  = i + 1;
            const masuk  = masukPerBulan.find(m => parseInt(m.bulan) === bulan);
            const keluar = keluarPerBulan.find(k => parseInt(k.bulan) === bulan);
            return {
                bulan: nama,
                masuk:  parseInt(masuk?.total  ?? 0),
                keluar: parseInt(keluar?.total  ?? 0),
            };
        });

        // ── 3. CHART: Barang per Kategori ────────────────────────
        const barangPerKategori = await Barang.findAll({
            attributes: [
                [fn("COUNT", col("Barang.id")), "total"],
                [fn("SUM", col("jumlah")), "total_stok"],
            ],
            include: [{
                model: Kategori,
                as: "kategori",
                attributes: ["id", "name_kategori"],
            }],
            group: ["kategori_id"],
            order: [[fn("COUNT", col("Barang.id")), "DESC"]],
            raw: true,
            nest: true,
        });

        const chartKategori = barangPerKategori.map(item => ({
            kategori:   item.kategori?.name_kategori ?? "Tidak ada kategori",
            total:      parseInt(item.total ?? 0),
            total_stok: parseInt(item.total_stok ?? 0),
        }));

        // ── 4. CHART: Barang per Cabang ──────────────────────────
        const barangPerCabang = await Barang.findAll({
            attributes: [
                [fn("COUNT", col("Barang.id")), "total_jenis"],
                [fn("SUM", col("jumlah")), "total_stok"],
            ],
            include: [{
                model: Cabang,
                as: "cabang",
                attributes: ["id", "name_cabang"],
            }],
            group: ["cabang_id"],
            order: [[fn("SUM", col("jumlah")), "DESC"]],
            raw: true,
            nest: true,
        });

        const chartCabang = barangPerCabang.map(item => ({
            cabang:      item.cabang?.name_cabang ?? "Tidak ada cabang",
            total_jenis: parseInt(item.total_jenis ?? 0),
            total_stok:  parseInt(item.total_stok  ?? 0),
        }));

        // ── 5. TABEL: Barang Masuk Terbaru (5 data) ─────────────
        const barangMasukTerbaru = await BarangMasuk.findAll({
            attributes: ["id", "jumlah", "harga_satuan", "tanggal_masuk"],
            include: [
                { model: Barang,   as: "barang",   attributes: ["id", "name", "kode_barang"] },
                { model: Supplier, as: "supplier", attributes: ["id", "name_supplier"] },
                { model: Cabang,   as: "cabang",   attributes: ["id", "name_cabang"] },
            ],
            order: [["tanggal_masuk", "DESC"]],
            limit: 5,
        });

        // ── 6. TABEL: Barang Rusak Terbaru (5 data) ─────────────
        const barangRusakTerbaru = await BarangRusak.findAll({
            attributes: ["id", "jumlah_rusak", "tingkat_kerusakan", "tanggal_rusak", "keterangan"],
            include: [
                { model: Barang,  as: "barang",  attributes: ["id", "name", "kode_barang"] },
                { model: Cabang,  as: "cabang",  attributes: ["id", "name_cabang"] },
                { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan"] },
            ],
            order: [["tanggal_rusak", "DESC"]],
            limit: 5,
        });

        // ── 7. ALERT: Barang Stok Rendah (jumlah <= 5) ──────────
        const barangStokRendah = await Barang.findAll({
            where: { jumlah: { [Op.lte]: 5 } },
            attributes: ["id", "name", "kode_barang", "jumlah", "satuan"],
            include: [
                { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan"] },
                { model: Cabang,  as: "cabang",  attributes: ["id", "name_cabang"] },
            ],
            order: [["jumlah", "ASC"]],
            limit: 10,
        });

        // ── 8. TABEL: Maintenance Berjalan ───────────────────────
        const maintenanceBerjalanList = await BarangMaintenance.findAll({
            where: { status: "maintenance" },
            attributes: ["id", "jumlah_maintenance", "tanggal_maintenance", "tanggal_selesai", "status", "biaya"],
            include: [
                { model: Barang, as: "barang", attributes: ["id", "name", "kode_barang"] },
                { model: User,   as: "user",   attributes: ["id", "name"] },
            ],
            order: [["tanggal_maintenance", "DESC"]],
            limit: 5,
        });

        // ── RESPONSE ─────────────────────────────────────────────
        return res.status(200).json({
            message: "Dashboard Data",
            cards: {
                total_barang:          totalBarang,
                total_stok:            totalStok,
                total_barang_masuk:    totalBarangMasuk,
                total_barang_keluar:   totalBarangKeluar,
                total_barang_rusak:    totalBarangRusak,
                total_maintenance:     totalMaintenance,
                maintenance_berjalan:  maintenanceBerjalan,
                total_supplier:        totalSupplier,
                total_cabang:          totalCabang,
            },
            charts: {
                masuk_keluar_per_bulan: chartMasukKeluar,  // line/bar chart
                barang_per_kategori:    chartKategori,      // pie/donut chart
                barang_per_cabang:      chartCabang,        // bar chart
            },
            tables: {
                barang_masuk_terbaru:   barangMasukTerbaru.map(b => b.toJSON()),
                barang_rusak_terbaru:   barangRusakTerbaru.map(b => b.toJSON()),
                maintenance_berjalan:   maintenanceBerjalanList.map(b => b.toJSON()),
            },
            alerts: {
                stok_rendah:       barangStokRendah.map(b => b.toJSON()),
                total_stok_rendah: barangStokRendah.length,
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};