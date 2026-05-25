const BarangRusak = require("../../models/barangrusakModels");
const Barang      = require("../../models/barangModels");
const Cabang      = require("../../models/cabangModels");
const Ruangan     = require("../../models/ruanganModels");
const User        = require("../../models/userModels");
const { Op }      = require("sequelize");
const { generatePDF } = require("../../services/exportPdf");
const ExcelJS     = require("exceljs");

const formatTanggal = (tgl) =>
    tgl ? new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

function buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date }) {
    if (!tipe) throw { status: 400, message: "Parameter 'tipe' wajib diisi: harian | bulanan | tahunan | custom" };

    const formatOpts = { day: "numeric", month: "long", year: "numeric" };

    if (tipe === "harian") {
        if (!tanggal) throw { status: 400, message: "Parameter 'tanggal' wajib diisi (format: YYYY-MM-DD)" };
        const start = new Date(tanggal); start.setHours(0, 0, 0, 0);
        const end   = new Date(tanggal); end.setHours(23, 59, 59, 999);
        return {
            whereClause:  { tanggal_rusak: { [Op.between]: [start, end] } },
            labelPeriode: new Date(tanggal).toLocaleDateString("id-ID", { dateStyle: "long" }),
        };
    }

    if (tipe === "bulanan") {
        if (!bulan || !tahun) throw { status: 400, message: "Parameter 'bulan' dan 'tahun' wajib diisi" };
        const start = new Date(tahun, bulan - 1, 1);
        const end   = new Date(tahun, bulan, 0, 23, 59, 59, 999);
        return {
            whereClause:  { tanggal_rusak: { [Op.between]: [start, end] } },
            labelPeriode: new Date(tahun, bulan - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        };
    }

    if (tipe === "tahunan") {
        if (!tahun) throw { status: 400, message: "Parameter 'tahun' wajib diisi" };
        const start = new Date(tahun, 0, 1);
        const end   = new Date(tahun, 11, 31, 23, 59, 59, 999);
        return {
            whereClause:  { tanggal_rusak: { [Op.between]: [start, end] } },
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

        return { whereClause: { tanggal_rusak: { [Op.between]: [start, end] } }, labelPeriode };
    }

    throw { status: 400, message: "Tipe tidak valid. Gunakan: harian | bulanan | tahunan | custom" };
}

function buildLokasiFilter(whereClause, { cabang_id, ruangan_id }) {
    const where = { ...whereClause };
    if (cabang_id)  where.cabang_id  = cabang_id;
    if (ruangan_id) where.ruangan_id = ruangan_id;
    return where;
}

const standardInclude = [
    { model: Barang,  as: "barang",  attributes: ["id", "name", "kode_barang"] },
    { model: Cabang,  as: "cabang",  attributes: ["id", "name_cabang"] },
    { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan"], required: false },
    { model: User,    as: "user",    attributes: ["id", "name"] },
];

async function resolveLokasiInfo({ cabang_id, ruangan_id }) {
    let infoCabang  = null;
    let infoRuangan = null;

    if (cabang_id) {
        infoCabang = await Cabang.findByPk(cabang_id, { attributes: ["id", "name_cabang"] });
        if (!infoCabang) throw { status: 404, message: "Cabang tidak ditemukan" };
    }

    if (ruangan_id) {
        infoRuangan = await Ruangan.findByPk(ruangan_id, { attributes: ["id", "name_ruangan"] });
        if (!infoRuangan) throw { status: 404, message: "Ruangan tidak ditemukan" };
    }

    return { infoCabang, infoRuangan };
}

exports.getLaporanBarangRusak = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, start_date, end_date, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date });
        const finalWhere = buildLokasiFilter(whereClause, { cabang_id, ruangan_id });
        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });

        const data = await BarangRusak.findAll({
            where:   finalWhere,
            order:   [["tanggal_rusak", "DESC"]],
            include: standardInclude,
        });

        const totalJumlahRusak = data.reduce((sum, item) => sum + item.jumlah_rusak, 0);

        const rekapTingkat = data.reduce((acc, item) => {
            const tingkat = item.tingkat_kerusakan?.toLowerCase() ?? "unknown";
            acc[tingkat] = (acc[tingkat] || 0) + item.jumlah_rusak;
            return acc;
        }, {});

        const labelLokasi = [
            infoCabang  ? `Cabang: ${infoCabang.name_cabang}`    : null,
            infoRuangan ? `Ruangan: ${infoRuangan.name_ruangan}` : null,
        ].filter(Boolean).join(" | ");

        return res.status(200).json({
            message:            `Laporan Barang Rusak - ${labelPeriode}${labelLokasi ? ` | ${labelLokasi}` : ""}`,
            periode:            labelPeriode,
            filter: {
                cabang:  infoCabang  ? { id: infoCabang.id,  name: infoCabang.name_cabang }   : null,
                ruangan: infoRuangan ? { id: infoRuangan.id, name: infoRuangan.name_ruangan } : null,
            },
            total_data:         data.length,
            total_jumlah_rusak: totalJumlahRusak,
            rekap_tingkat:      rekapTingkat,
            data:               data.map((item) => item.toJSON()),
        });

    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.exportPDFLaporanBarangRusak = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, start_date, end_date, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date });
        const finalWhere = buildLokasiFilter(whereClause, { cabang_id, ruangan_id });
        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });

        const barangRusakData = await BarangRusak.findAll({
            where:   finalWhere,
            order:   [["tanggal_rusak", "DESC"]],
            include: standardInclude,
        });

        const totalJumlahRusak = barangRusakData.reduce((sum, item) => sum + item.jumlah_rusak, 0);

        const labelLokasi = [
            infoCabang  ? infoCabang.name_cabang    : null,
            infoRuangan ? infoRuangan.name_ruangan  : null,
        ].filter(Boolean).join(" - ");

        const tingkatMap = {
            ringan: `<span class="badge-ringan">Ringan</span>`,
            sedang: `<span class="badge-sedang">Sedang</span>`,
            berat:  `<span class="badge-berat">Berat</span>`,
        };

        const tableRows = barangRusakData.map((item, index) => {
            const d = item.toJSON();
            const tingkatBadge = tingkatMap[d.tingkat_kerusakan?.toLowerCase()]
                ?? `<span class="badge-ringan">${d.tingkat_kerusakan ?? "-"}</span>`;

            return `
                <tr>
                    <td class="center">${index + 1}</td>
                    <td class="center"><span class="badge-kode">${d.barang?.kode_barang ?? "-"}</span></td>
                    <td>${d.barang?.name              ?? "-"}</td>
                    <td>${d.cabang?.name_cabang        ?? "-"}</td>
                    <td>${d.ruangan?.name_ruangan      ?? "-"}</td>
                    <td class="center">${d.jumlah_rusak}</td>
                    <td class="center">${tingkatBadge}</td>
                    <td class="center">${formatTanggal(d.tanggal_rusak)}</td>
                    <td>${d.keterangan ?? "-"}</td>
                </tr>
            `;
        }).join("");

        const pdfData = {
            printDate:        new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }),
            labelPeriode:     labelLokasi ? `${labelPeriode} | ${labelLokasi}` : labelPeriode,
            totalBarangRusak: barangRusakData.length,
            totalJumlahRusak,
            tableRows,
        };

        const pdfBuffer = await generatePDF("barangRusak.html", pdfData);
        const fileLabel = [tipe, labelLokasi.replace(/ /g, "-")].filter(Boolean).join("-");

        res.set({
            "Content-Type":        "application/pdf",
            "Content-Disposition": `attachment; filename="laporan-barang-rusak-${fileLabel}.pdf"`,
            "Content-Length":      pdfBuffer.length,
        });

        return res.send(pdfBuffer);

    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.exportExcelLaporanBarangRusak = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, start_date, end_date, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun, start_date, end_date });
        const finalWhere = buildLokasiFilter(whereClause, { cabang_id, ruangan_id });
        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });

        const barangRusakData = await BarangRusak.findAll({
            where:   finalWhere,
            order:   [["tanggal_rusak", "DESC"]],
            include: standardInclude,
        });

        const totalJumlahRusak = barangRusakData.reduce((sum, item) => sum + item.jumlah_rusak, 0);

        const labelLokasi = [
            infoCabang  ? infoCabang.name_cabang    : null,
            infoRuangan ? infoRuangan.name_ruangan  : null,
        ].filter(Boolean).join(" - ");

        const fullLabel = labelLokasi ? `${labelPeriode} | ${labelLokasi}` : labelPeriode;

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Laporan Barang Rusak");

        const headerStyle = {
            font:      { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
            fill:      { type: "pattern", pattern: "solid", fgColor: { argb: "FFC0392B" } },
            alignment: { horizontal: "center", vertical: "middle" },
            border: {
                top:    { style: "thin", color: { argb: "FFFF9999" } },
                bottom: { style: "thin", color: { argb: "FFFF9999" } },
                left:   { style: "thin", color: { argb: "FFFF9999" } },
                right:  { style: "thin", color: { argb: "FFFF9999" } },
            },
        };

        const rowBorder = {
            top:    { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left:   { style: "thin", color: { argb: "FFE0E0E0" } },
            right:  { style: "thin", color: { argb: "FFE0E0E0" } },
        };

        const tingkatColor = {
            ringan: { font: "FF856404", fill: "FFFFF3CD" },
            sedang: { font: "FFA04000", fill: "FFFFE5D0" },
            berat:  { font: "FFC0392B", fill: "FFFDE8E8" },
        };

        // Judul
        worksheet.mergeCells("A1:I1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value     = "LAPORAN BARANG RUSAK";
        titleCell.font      = { bold: true, size: 14, color: { argb: "FFC0392B" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // Periode + Lokasi
        worksheet.mergeCells("A2:I2");
        const periodeCell = worksheet.getCell("A2");
        periodeCell.value     = `Periode: ${fullLabel}`;
        periodeCell.font      = { bold: true, size: 11, color: { argb: "FF333333" } };
        periodeCell.alignment = { horizontal: "center" };
        worksheet.getRow(2).height = 22;

        // Tanggal cetak
        worksheet.mergeCells("A3:I3");
        const dateCell = worksheet.getCell("A3");
        dateCell.value     = `Dicetak pada: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`;
        dateCell.font      = { italic: true, size: 10, color: { argb: "FF888888" } };
        dateCell.alignment = { horizontal: "center" };
        worksheet.getRow(3).height = 18;

        worksheet.addRow([]);

        const headerRow = worksheet.addRow([
            "No", "Kode Barang", "Nama Barang", "Cabang", "Ruangan",
            "Jumlah Rusak", "Tingkat Kerusakan", "Tanggal Rusak", "Keterangan",
        ]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.font      = headerStyle.font;
            cell.fill      = headerStyle.fill;
            cell.alignment = headerStyle.alignment;
            cell.border    = headerStyle.border;
        });

        worksheet.columns = [
            { key: "no",                width: 5  },
            { key: "kode_barang",       width: 15 },
            { key: "name",              width: 25 },
            { key: "cabang",            width: 20 },
            { key: "ruangan",           width: 20 },
            { key: "jumlah_rusak",      width: 14 },
            { key: "tingkat_kerusakan", width: 18 },
            { key: "tanggal_rusak",     width: 22 },
            { key: "keterangan",        width: 30 },
        ];

        barangRusakData.forEach((item, index) => {
            const d = item.toJSON();

            const dataRow = worksheet.addRow([
                index + 1,
                d.barang?.kode_barang        ?? "-",
                d.barang?.name               ?? "-",
                d.cabang?.name_cabang         ?? "-",
                d.ruangan?.name_ruangan       ?? "-",
                d.jumlah_rusak,
                d.tingkat_kerusakan           ?? "-",
                formatTanggal(d.tanggal_rusak),
                d.keterangan                  ?? "-",
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: "middle" };
            });

            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF0F0" } };
                });
            }

            const tingkat = d.tingkat_kerusakan?.toLowerCase();
            const color   = tingkatColor[tingkat];
            if (color) {
                const tingkatCell = dataRow.getCell(7);
                tingkatCell.font      = { bold: true, color: { argb: color.font } };
                tingkatCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: color.fill } };
                tingkatCell.alignment = { horizontal: "center", vertical: "middle" };
            }
        });

        const totalRow = worksheet.addRow(["", "", "", "", "TOTAL", totalJumlahRusak, "", "", ""]);
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(6).font = { bold: true, color: { argb: "FFC0392B" } };
        totalRow.getCell(6).alignment = { horizontal: "center" };

        const fileLabel = [tipe, labelLokasi.replace(/ /g, "-")].filter(Boolean).join("-");

        res.set({
            "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="laporan-barang-rusak-${fileLabel}.xlsx"`,
        });

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};