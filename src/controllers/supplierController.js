const Supplier = require("../models/supplierModels");

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
