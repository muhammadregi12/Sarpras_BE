const Barang = require("../models/barangModels");
const BarangRusak = require("../models/barangrusakModels");
const User = require("../models/userModels");
const { generatePDF } = require("../services/exportPdf");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const Cabang = require("../models/cabangModels");
const Ruangan = require("../models/ruanganModels");

exports.getAllBarangRusak = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const barangRusak = await BarangRusak.findAndCountAll({
            attributes: ["id", "jumlah_rusak", "tanggal_rusak", "keterangan"],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                }
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ]
        })

        return res.status(200).json({
            message: "Get All Barang Rusak",
            data: barangRusak.rows,
            total: barangRusak.count,
            page: page,
            limit: limit,
            offset: offset
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBarangRusakById = async (req, res) => {
    try {
        
        const barangRusak = await BarangRusak.findByPk(req.params.id, {
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                }
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ]
        })

        return res.status(200).json({
            message: "Get Barang Rusak By Id",
            data: barangRusak
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.createBarangRusak = async (req, res) => {
    try {
        
        const { barang_id, cabang_id, ruangan_id, jumlah_rusak, tingkat_kerusakan, tanggal_rusak, keterangan, user_id } = req.body;

        if (!barang_id || !jumlah_rusak || !cabang_id || !ruangan_id || !tanggal_rusak || !tingkat_kerusakan) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Barang ID, Jumlah Rusak, Cabang ID, Ruangan ID, Tanggal Rusak, Tingkat Rusak, dan User ID harus diisi"
            })
        }

        const barang = await Barang.findByPk(barang_id);
        if (!barang) {
            return res.status(404).json({
                message: "Barang Not Found"
            })
        }


        const newJumlahBarang = barang.jumlah - parseInt(jumlah_rusak);
        if (newJumlahBarang < 0) {
            return res.status(400).json({
                message: "Jumlah Rusak tidak boleh lebih besar dari jumlah barang yang tersedia"
            })
        }

        const createBarangRusak = await BarangRusak.create({
            barang_id,
            cabang_id,
            ruangan_id,
            jumlah_rusak,
            tanggal_rusak,
            tingkat_kerusakan,
            keterangan,
            user_id: req.user.id
        })

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        updateJumlahBarang.jumlah = newJumlahBarang;
        await updateJumlahBarang.save();

        return res.status(201).json({
            message: "Create Barang Rusak",
            data: createBarangRusak,
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateBarangRusak = async (req, res) => {
    try {
        const { barang_id, cabang_id, ruangan_id, jumlah_rusak, tingkat_kerusakan, tanggal_rusak, keterangan } = req.body;

        if (!barang_id || !jumlah_rusak || !tanggal_rusak || !tingkat_kerusakan) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Barang ID, Jumlah Rusak, Tanggal Rusak, dan Tingkat Rusak harus diisi"
            });
        }

        const barangRusak = await BarangRusak.findByPk(req.params.id);
        if (!barangRusak) {
            return res.status(404).json({ message: "Barang Rusak Not Found" });
        }

        const oldBarangId = parseInt(barangRusak.barang_id);
        const newBarangId = parseInt(barang_id);
        const oldJumlahRusak = parseInt(barangRusak.jumlah_rusak);
        const newJumlahRusak = parseInt(jumlah_rusak);

        if (oldBarangId !== newBarangId) {
            const oldBarang = await Barang.findByPk(oldBarangId);
            if (oldBarang) {
                oldBarang.jumlah += oldJumlahRusak;
                await oldBarang.save();
            }

            const newBarang = await Barang.findByPk(newBarangId);
            if (!newBarang) {
                return res.status(404).json({ message: "Barang Not Found" });
            }

            if (newBarang.jumlah < newJumlahRusak) {
                return res.status(400).json({
                    message: "Jumlah Rusak tidak boleh lebih besar dari jumlah barang yang tersedia"
                });
            }

            newBarang.jumlah -= newJumlahRusak;
            await newBarang.save();

        } else {
            const barang = await Barang.findByPk(newBarangId);
            if (!barang) {
                return res.status(404).json({ message: "Barang Not Found" });
            }

            const stokAktual = barang.jumlah + oldJumlahRusak;

            if (stokAktual < newJumlahRusak) {
                return res.status(400).json({
                    message: "Jumlah Rusak tidak boleh lebih besar dari jumlah barang yang tersedia"
                });
            }

            barang.jumlah = stokAktual - newJumlahRusak;
            await barang.save();
        }

        const updatebarangRusak = await barangRusak.update({
            user_id: req.user.id,
            barang_id: newBarangId,
            jumlah_rusak: newJumlahRusak,
            tingkat_kerusakan,
            ruangan_id,
            cabang_id,
            tanggal_rusak,
            keterangan
        });

        return res.status(200).json({
            message: "Update Barang Rusak",
            data: updatebarangRusak
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.deleteBarangRusak = async (req, res) => {
    try {
        
        const barangRusak = await BarangRusak.findByPk(req.params.id);
        if (!barangRusak) {
            return res.status(404).json({
                message: "Barang Rusak Not Found"
            })
        }

        const barang = await Barang.findByPk(barangRusak.barang_id);
        if (barang) {
            barang.jumlah += barangRusak.jumlah_rusak;
            await barang.save();
        }

        await barangRusak.destroy();

        return res.status(200).json({
            message: "Delete Barang Rusak",
        })
    
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.exportPDFBarangRusak = async (req, res) => {
    try {

        const barangRusak = await BarangRusak.findAll({
            order: [['tanggal_rusak', 'DESC']],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ]
        });

        const tableRows = barangRusak.map((item, index) => {
            const d = item.toJSON();

            const tanggalRusak = d.tanggal_rusak
                ? new Date(d.tanggal_rusak).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            // Badge warna sesuai tingkat kerusakan
            const tingkatMap = {
                ringan: `<span class="badge-ringan">Ringan</span>`,
                sedang: `<span class="badge-sedang">Sedang</span>`,
                berat:  `<span class="badge-berat">Berat</span>`,
            };
            const tingkatBadge = tingkatMap[d.tingkat_kerusakan?.toLowerCase()]
                ?? `<span class="badge-ringan">${d.tingkat_kerusakan ?? '-'}</span>`;

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${d.barang ? d.barang.kode_barang : '-'}</td>
                    <td>${d.barang ? d.barang.name : '-'}</td>
                    <td>${d.cabang ? d.cabang.name_cabang : '-'}</td>
                    <td>${d.ruangan ? d.ruangan.name_ruangan : '-'}</td>
                    <td>${d.jumlah_rusak}</td>
                    <td>${tingkatBadge}</td>
                    <td>${tanggalRusak}</td>
                    <td>${d.keterangan ?? '-'}</td>
                </tr>
            `;
        }).join('');

        const data = {
            printDate: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
            totalBarangRusak: barangRusak.length,
            tableRows,
        };

        const pdfBuffer = await generatePDF('barangRusak.html', data);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="laporan-barang-rusak.pdf"',
            'Content-Length': pdfBuffer.length
        });

        return res.send(pdfBuffer);

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.exportExcelBarangRusak = async (req, res) => {
    try {

        const barangRusak = await BarangRusak.findAll({
            order: [['tanggal_rusak', 'DESC']],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Barang Rusak');

        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top:    { style: 'thin', color: { argb: 'FFFF9999' } },
                bottom: { style: 'thin', color: { argb: 'FFFF9999' } },
                left:   { style: 'thin', color: { argb: 'FFFF9999' } },
                right:  { style: 'thin', color: { argb: 'FFFF9999' } },
            }
        };

        const rowBorder = {
            top:    { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left:   { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right:  { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };

        // Judul
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'DATA BARANG RUSAK';
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFC0392B' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Tanggal cetak
        worksheet.mergeCells('A2:G2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`;
        dateCell.font = { italic: true, size: 10, color: { argb: 'FF888888' } };
        dateCell.alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // Baris kosong
        worksheet.addRow([]);

        // Header kolom
        const headerRow = worksheet.addRow([
            'No', 'Kode Barang', 'Nama Barang',
            'Jumlah Rusak', 'Tingkat Kerusakan', 'Tanggal Rusak', 'Keterangan'
        ]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.font      = headerStyle.font;
            cell.fill      = headerStyle.fill;
            cell.alignment = headerStyle.alignment;
            cell.border    = headerStyle.border;
        });

        // Lebar kolom
        worksheet.columns = [
            { key: 'no',                width: 5  },
            { key: 'kode_barang',       width: 15 },
            { key: 'name',              width: 25 },
            { key: 'cabang',              width: 25 },
            { key: 'ruangan',              width: 25 },
            { key: 'jumlah_rusak',      width: 14 },
            { key: 'tingkat_kerusakan', width: 18 },
            { key: 'tanggal_rusak',     width: 22 },
            { key: 'keterangan',        width: 30 },
        ];

        // Warna tingkat kerusakan
        const tingkatColor = {
            ringan: { font: 'FF856404', fill: 'FFFFF3CD' },
            sedang: { font: 'FFA04000', fill: 'FFFFE5D0' },
            berat:  { font: 'FFC0392B', fill: 'FFFDE8E8' },
        };

        // Isi data
        barangRusak.forEach((item, index) => {
            const d = item.toJSON();

            const tanggalRusak = d.tanggal_rusak
                ? new Date(d.tanggal_rusak).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            const dataRow = worksheet.addRow([
                index + 1,
                d.barang?.kode_barang ?? '-',
                d.barang?.name        ?? '-',
                d.cabang?.name_cabang ?? '-',
                d.ruangan?.name_ruangan ?? '-',
                d.jumlah_rusak,
                d.tingkat_kerusakan   ?? '-',
                tanggalRusak,
                d.keterangan          ?? '-',
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: 'middle' };
            });

            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F0' } };
                });
            }

            // Warna cell tingkat kerusakan
            const tingkat = d.tingkat_kerusakan?.toLowerCase();
            const color = tingkatColor[tingkat];
            if (color) {
                const tingkatCell = dataRow.getCell(5);
                tingkatCell.font = { bold: true, color: { argb: color.font } };
                tingkatCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.fill } };
            }
        });

        // Baris total
        const totalRow = worksheet.addRow(['', '', 'Total', barangRusak.length, '', '', '']);
        totalRow.getCell(3).font = { bold: true };
        totalRow.getCell(4).font = { bold: true, color: { argb: 'FFC0392B' } };

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="laporan-barang-rusak.xlsx"',
        });

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};