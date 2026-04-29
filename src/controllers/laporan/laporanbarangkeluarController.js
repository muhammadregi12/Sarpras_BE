const BarangKeluar = require("../../models/barangkeluarModels");
const Barang      = require("../../models/barangModels");
const Cabang      = require("../../models/cabangModels");
const Ruangan     = require("../../models/ruanganModels");
const Supplier    = require("../../models/supplierModels");
const User        = require("../../models/userModels");
const { Op }      = require("sequelize");
const { generatePDF } = require("../../services/exportPdf");
const ExcelJS     = require("exceljs");

function buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date }) {
    if (!tipe) throw { status: 400, message: "Parameter 'tipe' wajib diisi: harian | bulanan | tahunan | custom" };

    const formatOpts = { day: "numeric", month: "long", year: "numeric" };

    if (tipe === "harian") {
        if (!tanggal) throw { status: 400, message: "Parameter 'tanggal' wajib diisi (format: YYYY-MM-DD)" };
        const start = new Date(tanggal); start.setHours(0, 0, 0, 0);
        const end   = new Date(tanggal); end.setHours(23, 59, 59, 999);
        return {
            whereClause:  { tanggal_keluar: { [Op.between]: [start, end] } },
            labelPeriode: new Date(tanggal).toLocaleDateString("id-ID", { dateStyle: "long" }),
        };
    }

    if (tipe === "bulanan") {
        if (!bulan || !tahun) throw { status: 400, message: "Parameter 'bulan' dan 'tahun' wajib diisi" };
        const start = new Date(tahun, bulan - 1, 1);
        const end   = new Date(tahun, bulan, 0, 23, 59, 59, 999);
        return {
            whereClause:  { tanggal_keluar: { [Op.between]: [start, end] } },
            labelPeriode: new Date(tahun, bulan - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        };
    }

    if (tipe === "tahunan") {
        if (!tahun) throw { status: 400, message: "Parameter 'tahun' wajib diisi" };
        const start = new Date(tahun, 0, 1);
        const end   = new Date(tahun, 11, 31, 23, 59, 59, 999);
        return {
            whereClause:  { tanggal_keluar: { [Op.between]: [start, end] } },
            labelPeriode: `Tahun ${tahun}`,
        };
    }

    if (tipe === "custom") {
        if (!start_date && !end_date) {
            throw { status: 400, message: "Minimal salah satu 'start_date' atau 'end_date' harus diisi" };
        }

        let start, end, labelPeriode;

        if (start_date && !end_date) {
            start        = new Date(start_date); start.setHours(0, 0, 0, 0);
            end          = new Date();            end.setHours(23, 59, 59, 999);
            labelPeriode = `Sejak ${new Date(start_date).toLocaleDateString("id-ID", formatOpts)} s/d Sekarang`;
        } else if (!start_date && end_date) {
            start        = new Date("2000-01-01"); start.setHours(0, 0, 0, 0);
            end          = new Date(end_date);     end.setHours(23, 59, 59, 999);
            labelPeriode = `Sampai dengan ${new Date(end_date).toLocaleDateString("id-ID", formatOpts)}`;
        } else {
            start = new Date(start_date); start.setHours(0, 0, 0, 0);
            end   = new Date(end_date);   end.setHours(23, 59, 59, 999);
            if (start > end) throw { status: 400, message: "start_date tidak boleh lebih besar dari end_date" };
            labelPeriode = `${new Date(start_date).toLocaleDateString("id-ID", formatOpts)} s/d ${new Date(end_date).toLocaleDateString("id-ID", formatOpts)}`;
        }

        return { whereClause: { tanggal_keluar: { [Op.between]: [start, end] } }, labelPeriode };
    }

    throw { status: 400, message: "Tipe tidak valid. Gunakan: harian | bulanan | tahunan | custom" };
}

async function resolveLokasiKeluar({ cabang_id, ruangan_id }) {
    let infoCabang  = null;
    let infoRuangan = null;

    if (cabang_id) {
        infoCabang = await Cabang.findByPk(cabang_id, { attributes: ["id", "name_cabang", "daerah_cabang"] });
        if (!infoCabang) throw { status: 404, message: "Cabang tidak ditemukan" };
    }

    if (ruangan_id) {
        infoRuangan = await Ruangan.findByPk(ruangan_id, { attributes: ["id", "name_ruangan"] });
        if (!infoRuangan) throw { status: 404, message: "Ruangan tidak ditemukan" };
    }

    return { infoCabang, infoRuangan };
}

async function fetchDataKeluar(where) {
    return await BarangKeluar.findAll({
        where,
        order: [["tanggal_keluar", "DESC"]],
        include: [
            { model: Barang,  as: "barang",  attributes: ["id", "name", "kode_barang"] },
            { model: User,    as: "user",    attributes: ["id", "name"] },
            { model: Cabang,  as: "cabang",  attributes: ["id", "name_cabang"] },
            { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan"] },
        ]
    });
}

const formatTgl = (tgl) =>
    tgl ? new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";


exports.getLaporanBarangKeluar = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, start_date, end_date, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date });

        // Tambahkan filter lokasi ke where clause
        const finalWhere = { ...whereClause };
        if (cabang_id)  finalWhere.cabang_id  = cabang_id;
        if (ruangan_id) finalWhere.ruangan_id = ruangan_id;

        const { infoCabang, infoRuangan } = await resolveLokasiKeluar({ cabang_id, ruangan_id });
        const data = await fetchDataKeluar(finalWhere);

        const totalJumlahKeluar = data.reduce((sum, item) => sum + parseInt(item.jumlah_keluar), 0);

        const labelLokasi = [
            infoCabang  ? `Cabang: ${infoCabang.name_cabang}`    : null,
            infoRuangan ? `Ruangan: ${infoRuangan.name_ruangan}` : null,
        ].filter(Boolean).join(" | ");

        return res.status(200).json({
            message:     `Laporan Barang Keluar - ${labelPeriode}${labelLokasi ? ` | ${labelLokasi}` : ""}`,
            periode:     labelPeriode,
            filter: {
                cabang:  infoCabang  ? { id: infoCabang.id,  name: infoCabang.name_cabang }   : null,
                ruangan: infoRuangan ? { id: infoRuangan.id, name: infoRuangan.name_ruangan } : null,
            },
            total_data:          data.length,
            total_jumlah_keluar: totalJumlahKeluar,
            data: data.map(d => d.toJSON())
        });

    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.exportPDFLaporanBarangKeluar = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, start_date, end_date, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date });

        const finalWhere = { ...whereClause };
        if (cabang_id)  finalWhere.cabang_id  = cabang_id;
        if (ruangan_id) finalWhere.ruangan_id = ruangan_id;

        const { infoCabang, infoRuangan } = await resolveLokasiKeluar({ cabang_id, ruangan_id });
        const data = await fetchDataKeluar(finalWhere);

        const totalJumlahKeluar = data.reduce((sum, item) => sum + parseInt(item.jumlah_keluar), 0);

        const labelLokasi = [
            infoCabang  ? infoCabang.name_cabang    : null,
            infoRuangan ? infoRuangan.name_ruangan  : null,
        ].filter(Boolean).join(" - ");

        const fullLabel = labelLokasi ? `${labelPeriode} | ${labelLokasi}` : labelPeriode;

        const tableRows = data.map((item, index) => {
            const d = item.toJSON();
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="badge">${d.barang?.kode_barang ?? "-"}</span></td>
                    <td>${d.barang?.name          ?? "-"}</td>
                    <td>${d.cabang?.name_cabang   ?? "-"}</td>
                    <td>${d.ruangan?.name_ruangan ?? "-"}</td>
                    <td>${d.jumlah_keluar}</td>
                    <td>${formatTgl(d.tanggal_keluar)}</td>
                    <td>${d.user?.name            ?? "-"}</td>
                    <td>${d.keterangan            ?? "-"}</td>
                </tr>
            `;
        }).join("");

        const pdfData = {
            printDate:          new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }),
            labelPeriode:       fullLabel,
            infoCabang:         infoCabang  ? `${infoCabang.name_cabang} (${infoCabang.daerah_cabang ?? "-"})` : "Semua Cabang",
            infoRuangan:        infoRuangan ? infoRuangan.name_ruangan : "Semua Ruangan",
            totalData:          data.length,
            totalJumlahKeluar,
            tableRows,
        };

        const pdfBuffer = await generatePDF("laporanBarangKeluar.html", pdfData);
        const fileLabel = [tipe, labelLokasi.replace(/ /g, "-")].filter(Boolean).join("-");

        res.set({
            "Content-Type":        "application/pdf",
            "Content-Disposition": `attachment; filename="laporan-barang-keluar-${fileLabel}.pdf"`,
            "Content-Length":      pdfBuffer.length,
        });

        return res.send(pdfBuffer);

    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.exportExcelLaporanBarangKeluar = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, start_date, end_date, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date });

        const finalWhere = { ...whereClause };
        if (cabang_id)  finalWhere.cabang_id  = cabang_id;
        if (ruangan_id) finalWhere.ruangan_id = ruangan_id;

        const { infoCabang, infoRuangan } = await resolveLokasiKeluar({ cabang_id, ruangan_id });
        const data = await fetchDataKeluar(finalWhere);

        const totalJumlahKeluar = data.reduce((sum, item) => sum + parseInt(item.jumlah_keluar), 0);

        const labelLokasi  = [
            infoCabang  ? infoCabang.name_cabang    : null,
            infoRuangan ? infoRuangan.name_ruangan  : null,
        ].filter(Boolean).join(" - ");

        const fullLabel = labelLokasi ? `${labelPeriode} | ${labelLokasi}` : labelPeriode;

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Laporan Barang Keluar");

        const headerStyle = {
            font:      { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
            fill:      { type: "pattern", pattern: "solid", fgColor: { argb: "FFE74C3C" } },
            alignment: { horizontal: "center", vertical: "middle" },
            border: {
                top:    { style: "thin", color: { argb: "FFFF9999" } },
                bottom: { style: "thin", color: { argb: "FFFF9999" } },
                left:   { style: "thin", color: { argb: "FFFF9999" } },
                right:  { style: "thin", color: { argb: "FFFF9999" } },
            }
        };

        const rowBorder = {
            top:    { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left:   { style: "thin", color: { argb: "FFE0E0E0" } },
            right:  { style: "thin", color: { argb: "FFE0E0E0" } },
        };

        // Judul
        worksheet.mergeCells("A1:I1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value     = "LAPORAN BARANG KELUAR";
        titleCell.font      = { bold: true, size: 14, color: { argb: "FFE74C3C" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // Periode + Lokasi
        worksheet.mergeCells("A2:I2");
        const periodeCell = worksheet.getCell("A2");
        periodeCell.value     = `Periode: ${fullLabel}`;
        periodeCell.font      = { bold: true, size: 11, color: { argb: "FF333333" } };
        periodeCell.alignment = { horizontal: "center" };
        worksheet.getRow(2).height = 22;

        // Info cabang
        worksheet.mergeCells("A3:I3");
        const cabangCell = worksheet.getCell("A3");
        cabangCell.value     = `Cabang: ${infoCabang ? `${infoCabang.name_cabang} (${infoCabang.daerah_cabang ?? "-"})` : "Semua Cabang"}`;
        cabangCell.font      = { size: 10, color: { argb: "FF555555" } };
        cabangCell.alignment = { horizontal: "center" };
        worksheet.getRow(3).height = 18;

        // Info ruangan
        worksheet.mergeCells("A4:I4");
        const ruanganCell = worksheet.getCell("A4");
        ruanganCell.value     = `Ruangan: ${infoRuangan ? infoRuangan.name_ruangan : "Semua Ruangan"}`;
        ruanganCell.font      = { size: 10, color: { argb: "FF555555" } };
        ruanganCell.alignment = { horizontal: "center" };
        worksheet.getRow(4).height = 18;

        // Tanggal cetak
        worksheet.mergeCells("A5:I5");
        const dateCell = worksheet.getCell("A5");
        dateCell.value     = `Dicetak pada: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`;
        dateCell.font      = { italic: true, size: 10, color: { argb: "FF888888" } };
        dateCell.alignment = { horizontal: "center" };
        worksheet.getRow(5).height = 18;

        worksheet.addRow([]); // baris kosong

        // Header kolom (baris ke-7)
        const headerRow = worksheet.addRow([
            "No", "Kode Barang", "Nama Barang", "Cabang",
            "Ruangan", "Jumlah Keluar", "Tanggal Keluar", "Petugas", "Keterangan"
        ]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.font      = headerStyle.font;
            cell.fill      = headerStyle.fill;
            cell.alignment = headerStyle.alignment;
            cell.border    = headerStyle.border;
        });

        worksheet.columns = [
            { key: "no",             width: 5  },
            { key: "kode_barang",    width: 15 },
            { key: "name",           width: 25 },
            { key: "cabang",         width: 20 },
            { key: "ruangan",        width: 20 },
            { key: "jumlah_keluar",  width: 15 },
            { key: "tanggal_keluar", width: 22 },
            { key: "petugas",        width: 20 },
            { key: "keterangan",     width: 30 },
        ];

        // Isi data
        data.forEach((item, index) => {
            const d = item.toJSON();

            const dataRow = worksheet.addRow([
                index + 1,
                d.barang?.kode_barang   ?? "-",
                d.barang?.name          ?? "-",
                d.cabang?.name_cabang   ?? "-",
                d.ruangan?.name_ruangan ?? "-",
                d.jumlah_keluar,
                formatTgl(d.tanggal_keluar),
                d.user?.name            ?? "-",
                d.keterangan            ?? "-",
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: "middle" };
            });

            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF5F5" } };
                });
            }
        });

        // Baris total
        const totalRow = worksheet.addRow(["", "", "", "", "TOTAL", totalJumlahKeluar, "", "", ""]);
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(6).font = { bold: true, color: { argb: "FFE74C3C" } };
        totalRow.getCell(5).border = rowBorder;
        totalRow.getCell(6).border = rowBorder;

        const fileLabel = [tipe, labelLokasi.replace(/ /g, "-")].filter(Boolean).join("-");

        res.set({
            "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="laporan-barang-keluar-${fileLabel}.xlsx"`,
        });

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};