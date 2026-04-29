const Barang = require("../models/barangModels");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const Ruangan = require("../models/ruanganModels");
const Kategori = require("../models/kategoriModels");
const { generatePDF } = require("../services/exportPdf");
const ExcelJS = require("exceljs");
const Cabang = require("../models/cabangModels");

exports.getAllBarang = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const barang = await Barang.findAndCountAll({
            attributes: ["id", "name", "kode_barang", "image", "jumlah", "tahun_pengadaan"],

            include: [
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                },
            ],

            include: [
                {
                    model: Kategori,
                    as: "kategori",
                    attributes: ["id", "name_kategori"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                }
            ],

            limit,
            offset,
        });

        return res.status(200).json({
            message: "Get All Barang",
            data: barang.rows,
            total: barang.count,
            page,
            limit
        })
        
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBarangById = async (req, res) => {
    try {
        
        const barang = await Barang.findByPk(req.params.id, {
            include: [
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                },
            ],
            include: [
                {
                    model: Kategori,
                    as: "kategori",
                    attributes: ["id", "name_kategori"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                }
            ],
        });

        if (!barang) {
            return res.status(404).json({
                message: "Barang Not Found"
            })
        }

        return res.status(200).json({
            message: "Get Barang By Id",
            data: barang
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.createBarang = async (req, res) => {
    try {
        
        const { name, kode_barang, ruangan_id, cabang_id, kategori_id, satuan, keterangan, tahun_pengadaan } = req.body;
        if (!name || !kode_barang || !ruangan_id || !cabang_id || !kategori_id || !satuan || !tahun_pengadaan) {
            return res.status(400).json({
                message: "Name, Kode Barang, Ruangan Id, Cabang Id, Kategori Id, Satuan, and Tahun Pengadaan are required"
            })
        }

        // kode barang harus unik
        const existingBarang = await Barang.findOne({ where: { kode_barang } });
        if (existingBarang) {
            return res.status(400).json({
                message: "Kode Barang already exists"
            })
        }

        const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

        const barang = await Barang.create({
            name,
            kode_barang,
            ruangan_id,
            cabang_id,
            kategori_id,
            image: imagePath,
            satuan,
            keterangan,
            tahun_pengadaan
        });


        return res.status(201).json({
            message: "Create Barang",
            data: barang
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.updateBarang = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, kode_barang, ruangan_id, cabang_id, kategori_id, satuan, keterangan, tahun_pengadaan } = req.body; 

        if (!name || !kode_barang || !ruangan_id || !cabang_id || !kategori_id || !satuan || !tahun_pengadaan) {
            return res.status(400).json({
                message: "Name, Kode Barang, Ruangan Id, Cabang Id, Kategori Id, Satuan, and Tahun Pengadaan are required"
            })
        }       
        
        const barang = await Barang.findByPk(id);
        if (!barang) {
            return res.status(404).json({
                message: "Barang Not Found"
            })
        }

        const existingBarang = await Barang.findOne({ where: { kode_barang, id: { [Op.ne]: id } } });
        if (existingBarang) {
            return res.status(400).json({
                message: "Kode Barang already exists"
            })
        }

        if(req.file && barang.image){
            const oldImage = path.join(barang.image);
            if(fs.existsSync(oldImage)){
                fs.unlinkSync(oldImage);
            }
        }

        const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

        await barang.update({
            name,
            kode_barang,
            ruangan_id,
            cabang_id,
            kategori_id,
            image: imagePath,
            satuan,
            keterangan,
            tahun_pengadaan
        });

        return res.status(200).json({
            message: "Update Barang",
            data: barang
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deleteBarang = async (req, res) => {
    try {
        
        const { id } = req.params;
        const barang = await Barang.findByPk(id);
        if (!barang) {
            return res.status(404).json({
                message: "Barang Not Found"
            })
        }

        if (barang.image) {
            const imagePath = path.join(barang.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await barang.destroy();

        return res.status(200).json({
            message: "Delete Barang",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.exportPDFBarang = async (req, res) => {
  try {
    const barangs = await Barang.findAll({
      attributes: ['id', 'name', 'kode_barang', 'jumlah', 'satuan', 'keterangan', 'tahun_pengadaan'],
      include: [
        {
          model: Ruangan,
          as: 'ruangan',
          attributes: ['name_ruangan'],
        },
        {
          model: Kategori,
          as: 'kategori',
          attributes: ['name_kategori'],
        },
        {
            model: Cabang,
            as: "cabang",
            attributes: ["name_cabang"]
        }
      ],
      order: [['kode_barang', 'ASC']],
    });

    // Susun baris tabel HTML
    const tableRows = barangs.map((item, index) => {
      const b = item.toJSON();
      return `
        <tr>
          <td>${index + 1}</td>
          <td><span class="badge">${b.kode_barang}</span></td>
          <td>${b.name}</td>
          <td>${b.kategori?.name_kategori ?? '-'}</td>
          <td>${b.ruangan?.name_ruangan ?? '-'}</td>
          <td>${b.cabang?.name_cabang ?? '-'}</td>
          <td>${b.jumlah ?? 0}</td>
          <td>${b.satuan ?? '-'}</td>
          <td>${b.tahun_pengadaan}</td>
          <td>${b.keterangan ?? '-'}</td>
        </tr>
      `;
    }).join('');

    const data = {
      printDate: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
      totalBarang: barangs.length,
      tableRows,
    };

    const pdfBuffer = await generatePDF('barang.html', data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="laporan-barang.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

exports.exportExcelBarang = async (req, res) => {
    try {

        const barangs = await Barang.findAll({
            attributes: ['id', 'name', 'kode_barang', 'jumlah', 'satuan', 'keterangan', 'tahun_pengadaan'],
            include: [
                {
                    model: Ruangan,
                    as: 'ruangan',
                    attributes: ['name_ruangan'],
                },
                {
                    model: Kategori,
                    as: 'kategori',
                    attributes: ['name_kategori'],
                },
                {
                    model: Cabang,
                    as: 'cabang',
                    attributes: ['name_cabang'],
                }
            ],
            order: [['kode_barang', 'ASC']],
        });

        // Buat workbook dan worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Barang');

        // Style untuk header
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A73E8' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top:    { style: 'thin', color: { argb: 'FFB0C4DE' } },
                bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } },
                left:   { style: 'thin', color: { argb: 'FFB0C4DE' } },
                right:  { style: 'thin', color: { argb: 'FFB0C4DE' } },
            }
        };

        // Style untuk baris data
        const rowStyle = {
            alignment: { vertical: 'middle' },
            border: {
                top:    { style: 'thin', color: { argb: 'FFE0E0E0' } },
                bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                left:   { style: 'thin', color: { argb: 'FFE0E0E0' } },
                right:  { style: 'thin', color: { argb: 'FFE0E0E0' } },
            }
        };

        // Judul laporan (merge cell A1 sampai I1)
        worksheet.mergeCells('A1:I1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'DATA BARANG';
        titleCell.font = { bold: true, size: 14, color: { argb: 'FF1A73E8' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Tanggal cetak (merge cell A2 sampai I2)
        worksheet.mergeCells('A2:I2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`;
        dateCell.font = { italic: true, size: 10, color: { argb: 'FF888888' } };
        dateCell.alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // Baris kosong
        worksheet.addRow([]);

        // Header kolom (baris ke-4)
        const headerRow = worksheet.addRow([
            'No', 'Kode Barang', 'Nama Barang', 'Kategori',
            'Ruangan', 'Jumlah', 'Satuan', 'Tahun Pengadaan', 'Keterangan'
        ]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.font       = headerStyle.font;
            cell.fill       = headerStyle.fill;
            cell.alignment  = headerStyle.alignment;
            cell.border     = headerStyle.border;
        });

        // Lebar kolom
        worksheet.columns = [
            { key: 'no',              width: 5  },
            { key: 'kode_barang',     width: 15 },
            { key: 'name',            width: 25 },
            { key: 'kategori',        width: 20 },
            { key: 'ruangan',         width: 20 },
            { key: 'cabang',          width: 20 },
            { key: 'jumlah',          width: 10 },
            { key: 'satuan',          width: 12 },
            { key: 'tahun_pengadaan', width: 18 },
            { key: 'keterangan',      width: 30 },
        ];

        // Isi data
        barangs.forEach((item, index) => {
            const b = item.toJSON();

            const dataRow = worksheet.addRow([
                index + 1,
                b.kode_barang,
                b.name,
                b.kategori?.name_kategori ?? '-',
                b.ruangan?.name_ruangan   ?? '-',
                b.cabang?.name_cabang   ?? '-',
                b.jumlah          ?? 0,
                b.satuan          ?? '-',
                b.tahun_pengadaan,
                b.keterangan      ?? '-',
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowStyle.border;
                cell.alignment = rowStyle.alignment;
            });

            // Warna selang-seling baris
            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
                });
            }
        });

        // Baris total di bawah
        const totalRow = worksheet.addRow(['', '', '', '', 'Total', barangs.length, '', '', '']);
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(6).font = { bold: true, color: { argb: 'FF1A73E8' } };

        // Kirim response sebagai file Excel
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="laporan-barang.xlsx"',
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