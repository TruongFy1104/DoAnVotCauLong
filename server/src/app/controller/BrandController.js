const Brand = require('../models/Brand');

exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.findAll();
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addBrand = async (req, res) => {
    try {
        const { BrandName } = req.body;
        const newBrand = await Brand.create({ BrandName });
        res.json(newBrand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.deleteBrand = async (req, res) => {
    try {
        const { id } = req.params; 
        const brand = await Brand.findByPk(id); 

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        await brand.destroy(); 
        res.json({ message: 'Brand deleted successfully' }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.editBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { BrandName } = req.body;

        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({ message: 'Thương hiệu không tồn tại.' });
        }

        brand.BrandName = BrandName;
        await brand.save();

        res.json({ message: 'Cập nhật thành công.', brand });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};