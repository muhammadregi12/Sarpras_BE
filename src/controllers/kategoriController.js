const { Kategori } = require('../models/kategoriModels');

exports.getAllKategori = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const kategori = await Kategori.findAndCountAll({
            limit,
            offset,
        });

        return res.status(200).json({
            message: "Get All Kategori",
            data: kategori.rows,
            total: kategori.count,
            page,
            limit
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.getKategoriById = async (req, res) => {
    try {
        
        const { id } = req.params;
        const kategori = await Kategori.findByPk(id);

        if (!kategori) {
            return res.status(404).json({
                message: "Kategori Not Found"
            })
        }

        return res.status(200).json({
            message: "Get Kategori By Id",
            data: kategori
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.createKategori = async (req, res) => {
    try {
        
        const { name_kategori } = req.body;
        if (!name_kategori) {
            return res.status(400).json({
                message: "Name Kategori is required"
            })
        }

        const newKategori = await Kategori.create({
            name_kategori
        })
        
        return res.status(201).json({
            message: "Create Kategori",
            data: newKategori
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.updateKategori = async (req, res) => {
    try {
        
        const { id } = req.params;
        const { name_kategori } = req.body;

        if (!name_kategori) {
            return res.status(400).json({
                message: "Name Kategori is required"
            })
        }

        const kategori = await Kategori.findByPk(id);
        if (!kategori) {
            return res.status(404).json({
                message: "Kategori Not Found"
            })
        }

        const updatedKategori = await kategori.update({
            name_kategori
        })

        return res.status(200).json({
            message: "Update Kategori",
            data: updatedKategori
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.deleteKategori = async (req, res) => {
    try {
        
        const { id } = req.params;
        const kategori = await Kategori.findByPk(id);

        if (!kategori) {
            return res.status(404).json({
                message: "Kategori Not Found"
            })
        }

        await kategori.destroy();

        return res.status(200).json({
            message: "Delete Kategori"
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}