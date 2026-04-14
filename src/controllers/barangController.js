const Barang = require("../models/barangModels");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const Ruangan = require("../models/ruanganModels");
const Kategori = require("../models/kategoriModels");

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
        
        const { name, kode_barang, ruangan_id, kategori_id, satuan, keterangan, tahun_pengadaan } = req.body;
        if (!name || !kode_barang || !ruangan_id || !kategori_id || !satuan || !tahun_pengadaan) {
            return res.status(400).json({
                message: "Name, Kode Barang, Ruangan Id, Kategori Id, Satuan, and Tahun Pengadaan are required"
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
        const { name, kode_barang, ruangan_id, kategori_id, satuan, keterangan, tahun_pengadaan } = req.body; 

        if (!name || !kode_barang || !ruangan_id || !kategori_id || !satuan || !tahun_pengadaan) {
            return res.status(400).json({
                message: "Name, Kode Barang, Ruangan Id, Kategori Id, Satuan, and Tahun Pengadaan are required"
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