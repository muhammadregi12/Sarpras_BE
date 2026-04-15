const BarangMasuk = require("../models/barangmasukModels");
const Barang = require("../models/barangModels");
const Cabang = require("../models/cabangModels");
const Supplier = require("../models/supplierModels");
const User = require("../models/userModels");

exports.getAllBarangMasuk = async (req, res) => {
    try {
        
       const limit = parseInt(req.query.limit) || 10;
       const page = parseInt(req.query.page) || 1;
       const offset = (page - 1) * limit;

       const barangMasuk = await BarangMasuk.findAndCountAll({
            attributes: ["id", "jumlah", "tanggal_masuk", "harga_satuan"],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                }
            ],
            include: [
                {
                    model: Supplier,
                    as: "supplier",
                    attributes: ["id", "name_supplier"]
                }
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                }
            ],  
            include: [
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                }
            ],
            limit: limit,
            offset: offset
        });


        return res.status(200).json({
            message: "Get All Barang Masuk",
            data: barangMasuk.rows,
            total: barangMasuk.count,
            page: page,
            limit: limit
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBarangMasukById = async (req, res) => {
    try {
        
        const barangMasuk = await BarangMasuk.findByPk(req.params.id, {
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                },
                {
                    model: Supplier,
                    as: "supplier",
                    attributes: ["id", "name_supplier"]
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
                }
            ]
        });

        if(!barangMasuk) {
            return res.status(404).json({
                message: "Barang Masuk Not Found"
            });
        }

        return res.status(200).json({
            message: "Get Barang Masuk By Id",
            data: barangMasuk
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}


exports.createBarangMasuk = async (req, res) => {
    try {
        
        const { barang_id, supplier_id, cabang_id, no_dokumen, harga_satuan, tanggal_masuk, keterangan, user_id } = req.body;

        if (!barang_id || !supplier_id || !cabang_id || !harga_satuan || !tanggal_masuk || !user_id) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const barangMasuk = await BarangMasuk.create({
            barang_id,
            supplier_id,
            cabang_id,
            no_dokumen,
            harga_satuan,
            tanggal_masuk,
            keterangan,
            user_id: req.user.id
        })

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        if (updateJumlahBarang) {
            updateJumlahBarang.jumlah += 1;
            await updateJumlahBarang.save();
        }

        return res.status(201).json({
            message: "Create Barang Masuk",
            data: barangMasuk
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateBarangMasuk = async (req, res) => {
    try {
        
        const { barang_id, supplier_id, cabang_id, no_dokumen, harga_satuan, tanggal_masuk, keterangan } = req.body;

        if (!barang_id || !supplier_id || !cabang_id || !harga_satuan || !tanggal_masuk) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const barangMasuk = await BarangMasuk.findByPk(req.params.id);
        if (!barangMasuk) {
            return res.status(404).json({
                message: "Barang Masuk Not Found"
            });
        }

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        if (updateJumlahBarang) {
            if (barangMasuk.barang_id !== barang_id) {
                const oldBarang = await Barang.findByPk(barangMasuk.barang_id);
                if (oldBarang) {
                    oldBarang.jumlah -= 1;
                    await oldBarang.save();
                }
            }
        }

        await barangMasuk.update({
            barang_id,
            supplier_id,
            cabang_id,
            no_dokumen,
            harga_satuan,
            tanggal_masuk,
            keterangan
        });


        return res.status(200).json({
            message: "Update Barang Masuk",
            data: barangMasuk
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deleteBarangMasuk = async (req, res) => {
    try {
        const barangMasuk = await BarangMasuk.findByPk(req.params.id);
        if (!barangMasuk) {
            return res.status(404).json({
                message: "Barang Masuk Not Found"
            });
        }

        const updateJumlahBarang = await Barang.findByPk(barangMasuk.barang_id);
        if (updateJumlahBarang) {
            updateJumlahBarang.jumlah -= 1;
            await updateJumlahBarang.save();
        }

        await barangMasuk.destroy();

        return res.status(200).json({
            message: "Delete Barang Masuk"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}