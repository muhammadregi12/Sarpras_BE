const Supplier = require("../models/supplierModels");
const { generatePDF } = require("../services/exportPdf");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const ExcelJs = require("exceljs");

exports.getAllSupplier = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const supplier = await Supplier.findAndCountAll({
            limit,
            offset,
        });

        return res.status(200).json({
            message: "Get All Supplier",
            data: supplier.rows,
            total: supplier.count,
            page,
            limit
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.getSupplierById = async (req, res) => {
    try {

        const { id } = req.params;
        const supplier = await Supplier.findByPk(id);

        if (!supplier) {
            return res.status(404).json({
                message: "Supplier Not Found"
            })
        }

        return res.status(200).json({
            message: "Get Supplier By Id",
            data: supplier
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.createSupplier = async (req, res) => {
    try {
        
        const { name_supplier, perusahaan, alamat_perusahaan, no_telp } = req.body;
        if (!name_supplier || !perusahaan || !alamat_perusahaan || !no_telp) {
            return res.status(400).json({
                message: "Name Supplier, Perusahaan, Alamat Perusahaan and No Telp are required"
            })
        }
        
        const phoneRegex = /^08\d{8,10}$/;
        if (!phoneRegex.test(no_telp)) {
            return res.status(400).json({
                message: "No Telp must start with 08 and have 10-12 digits"
            })
        }

        const supplier = await Supplier.create({
            name_supplier,
            perusahaan,
            alamat_perusahaan,
            no_telp
        });

        return res.status(200).json({
            message: "Create Supplier",
            data: supplier
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateSupplier = async (req, res) => {
    try {
        
        const { id } = req.params;
        const { name_supplier, perusahaan, alamat_perusahaan, no_telp } = req.body;
        if (!name_supplier || !perusahaan || !alamat_perusahaan || !no_telp) {
            return res.status(400).json({
                message: "Name Supplier, Perusahaan, Alamat Perusahaan and No Telp are required"
            })
        }

        const phoneRegex = /^08\d{8,10}$/;
        if (!phoneRegex.test(no_telp)) {
            return res.status(400).json({
                message: "No Telp must start with 08 and have 10-12 digits"
            })
        }

        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({
                message: "Supplier Not Found"
            })
        }

        const updateSupplier = await supplier.update({
            name_supplier,
            perusahaan,
            alamat_perusahaan,
            no_telp
        })

        return res.status(200).json({
            message: "Update Supplier",
            data: updateSupplier
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.deleteSupplier = async (req, res) => {
    try {
        
        const { id } = req.params;
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({
                message: "Supplier Not Found"
            })
        }

        await supplier.destroy();

        return res.status(200).json({
            message: "Delete Supplier"
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.exportPDFSupplier = async (req, res) => {
  try {

    const suppliers = await Supplier.findAll({
      order: [['name_supplier', 'ASC']],
    });

    const tableRows = suppliers.map((item, index) => {
      const s = item.toJSON();
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${s.name_supplier}</td>
          <td><span class="badge">${s.perusahaan}</span></td>
          <td>${s.alamat_perusahaan}</td>
          <td>${s.no_telp}</td>
        </tr>
      `;
    }).join('');

    const data = {
      printDate: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
      totalSupplier: suppliers.length,
      tableRows,
    };

    const pdfBuffer = await generatePDF('supplier.html', data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="laporan-supplier.pdf"',
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

exports.exportExcelSupplier = async (req, res) => {
    try {

        const suppliers = await Supplier.findAll({
            order: [['name_supplier', 'ASC']],
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Supplier');

        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F9D58' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top:    { style: 'thin', color: { argb: 'FF99D6B0' } },
                bottom: { style: 'thin', color: { argb: 'FF99D6B0' } },
                left:   { style: 'thin', color: { argb: 'FF99D6B0' } },
                right:  { style: 'thin', color: { argb: 'FF99D6B0' } },
            }
        };

        const rowBorder = {
            top:    { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left:   { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right:  { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };

        // Judul
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'LAPORAN DATA SUPPLIER';
        titleCell.font = { bold: true, size: 14, color: { argb: 'FF0F9D58' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Tanggal cetak
        worksheet.mergeCells('A2:E2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`;
        dateCell.font = { italic: true, size: 10, color: { argb: 'FF888888' } };
        dateCell.alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // Baris kosong
        worksheet.addRow([]);

        // Header kolom
        const headerRow = worksheet.addRow([
            'No', 'Nama Supplier', 'Perusahaan', 'Alamat Perusahaan', 'No. Telepon'
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
            { key: 'no',               width: 5  },
            { key: 'name_supplier',    width: 25 },
            { key: 'perusahaan',       width: 25 },
            { key: 'alamat_perusahaan',width: 35 },
            { key: 'no_telp',          width: 15 },
        ];

        // Isi data
        suppliers.forEach((item, index) => {
            const s = item.toJSON();

            const dataRow = worksheet.addRow([
                index + 1,
                s.name_supplier,
                s.perusahaan,
                s.alamat_perusahaan,
                s.no_telp,
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: 'middle' };
            });

            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF6' } };
                });
            }
        });

        // Baris total
        const totalRow = worksheet.addRow(['', 'Total', suppliers.length, '', '']);
        totalRow.getCell(2).font = { bold: true };
        totalRow.getCell(3).font = { bold: true, color: { argb: 'FF0F9D58' } };

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="laporan-supplier.xlsx"',
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
