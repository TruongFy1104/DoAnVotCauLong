const Brand = require('../models/Brand');

// Nếu cần lấy cả tên category khi getAllBrands
const Category = require('../models/Category');

exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.findAll({
            include: [
                {
                    model: Category,
                    attributes: ['CategoryId', 'CategoryName']
                }
            ]
        });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addBrand = async (req, res) => {
    try {
        const { BrandName, CategoryId } = req.body;
        if (!BrandName || !CategoryId) {
            return res.status(400).json({ message: "Thiếu tên thương hiệu hoặc danh mục." });
        }
        const newBrand = await Brand.create({ BrandName, CategoryId });
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
        const { BrandName, CategoryId } = req.body;

        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({ message: 'Thương hiệu không tồn tại.' });
        }

        if (!BrandName || !CategoryId) {
            return res.status(400).json({ message: "Thiếu tên thương hiệu hoặc danh mục." });
        }

        brand.BrandName = BrandName;
        brand.CategoryId = CategoryId;
        await brand.save();

        res.json({ message: 'Cập nhật thành công.', brand });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};