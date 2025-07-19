const Category = require('../models/Category');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy danh mục' });
  }
};

exports.addCategory = async (req, res) => {
    try {
        const { CategoryName } = req.body;
        const newCategory = await Category.create({ CategoryName });
        res.json(newCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const category = await Category.findByPk(id); 

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.destroy(); 
        res.json({ message: 'Category deleted successfully' }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { CategoryName } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ message: 'Danh mục không tồn tại.' });
        }

        category.CategoryName = CategoryName;
        await category.save();

        res.json({ message: 'Cập nhật thành công.', category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};