const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Specification = require('../models/Specification');
const ClothingSize = require('../models/ClothingSize');
const ShoeSize = require('../models/ShoesSize');
const Category = require('../models/Category');
const OrderDetail = require('../models/OrderDetail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Image = require('../models/Image')
const { Op } = require("sequelize");

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({ 
            where: {
                IsHidden: 0  // Chỉ lấy sản phẩm không bị ẩn
            },
            include: [
                { model: Brand, as: 'Brand' },
                { model: Category, as: 'Category' }
            ]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy tất cả sản phẩm cho admin (bao gồm cả sản phẩm ẩn)
exports.getAllProductsAdmin = async (req, res) => {
    try {
        const products = await Product.findAll({ 
            include: [
                { model: Brand, as: 'Brand' },
                { model: Category, as: 'Category' }
            ],
            order: [['ProductId', 'DESC']]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params; // Lấy id từ URL
        const product = await Product.findOne({
            where: { ProductId: id },
            include: [
                {
                    model: Image, // Kết hợp với bảng Image
                    as: 'Images', // Alias để dễ dàng truy cập
                },
                {
                    model: Specification, // Kết hợp với bảng Specification
                    as: 'Specifications', // Alias để dễ dàng truy cập
                },
                {
                    model: Brand, // Kết hợp với bảng Brand
                    as: 'Brand', // Alias để dễ dàng truy cập
                },
                { model: ClothingSize, as: 'ClothingSizes' },
                { model: ShoeSize, as: 'ShoeSizes' },
            ]
        });
        if (!product) {
            return res.status(404).json({ error: "Sản phẩm không tồn tại" });
        }
        res.json(product); // Trả về sản phẩm nếu tìm thấy
    } catch (error) {
        res.status(500).json({ error: error.message }); // Xử lý lỗi server
    }
};

// Tạo thư mục upload nếu chưa tồn tại
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// multer luu anh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
exports.addProduct = async (req, res) => {
    upload.fields([
        { name: 'Avatar', maxCount: 1 }, 
        { name: 'Images', maxCount: 10 } 
    ])(req, res, async (err) => {
        if (err) {
            console.error('Lỗi upload:', err);
            return res.status(500).json({ error: 'Lỗi khi upload hình ảnh' });
        }

        try {
            const { ProductName, Description, SummaryDescription, Discount, IdBrand, Price, CostPrice, Quantity, specifications, CategoryId } = req.body;

            // Ép kiểu và kiểm tra hợp lệ
            const categoryIdNumber = Number(CategoryId);
            if (!categoryIdNumber) {
                return res.status(400).json({ error: "CategoryId không hợp lệ!" });
            }

            let avatarPath = req.files['Avatar'] ? req.files['Avatar'][0].filename : null;

            const newProduct = await Product.create({
                ProductName,
                Description,
                SummaryDescription,
                Discount,
                IdBrand,
                Price,
                CostPrice: CostPrice || 0,
                Quantity: Quantity || 0,
                CategoryId: categoryIdNumber,
                Avatar: avatarPath
            });

            const images = req.files['Images'] || [];
            if (images.length > 0) {
                // Lưu các hình ảnh vào bảng Image
                const imagePromises = images.map((image) =>
                    Image.create({
                        ImageUrl: image.filename, 
                        ProductId: newProduct.ProductId 
                    })
                );
                await Promise.all(imagePromises); 
            }

            let parsedSpecifications = [];
            if (specifications) {
                try {
                    parsedSpecifications = JSON.parse(specifications);
                } catch (parseError) {
                    console.error('Lỗi khi parse thông số kỹ thuật:', parseError);
                    return res.status(400).json({ error: 'Thông số kỹ thuật không hợp lệ' });
                }
            }

            // Lưu thông số kỹ thuật vào bảng Specification
            if (parsedSpecifications.length > 0) {
                const specPromises = parsedSpecifications.map((spec) =>
                    Specification.create({
                        SpecificationName: spec.SpecificationName,
                        SpecificationContent: spec.SpecificationContent,
                        ProductId: newProduct.ProductId
                    })
                );
                await Promise.all(specPromises); 
            }

            // Lưu size quần áo nếu có và tính lại tổng số lượng
            let totalQuantityFromSizes = 0;
            if (req.body.clothingSizes) {
                let clothingSizes = [];
                try {
                    clothingSizes = JSON.parse(req.body.clothingSizes);
                } catch (e) {
                    return res.status(400).json({ error: 'Dữ liệu size quần áo không hợp lệ' });
                }
                if (Array.isArray(clothingSizes) && clothingSizes.length > 0) {
                    const clothingPromises = clothingSizes.map(item => {
                        totalQuantityFromSizes += Number(item.quantity) || 0;
                        return ClothingSize.create({
                            ProductId: newProduct.ProductId,
                            Size: item.size,
                            Quantity: item.quantity
                        });
                    });
                    await Promise.all(clothingPromises);
                    // Cập nhật tổng số lượng vào Product
                    await newProduct.update({ Quantity: totalQuantityFromSizes });
                }
            }

            // Lưu size giày nếu có và tính lại tổng số lượng
            if (req.body.shoeSizes) {
                let shoeSizes = [];
                try {
                    shoeSizes = JSON.parse(req.body.shoeSizes);
                } catch (e) {
                    return res.status(400).json({ error: 'Dữ liệu size giày không hợp lệ' });
                }
                if (Array.isArray(shoeSizes) && shoeSizes.length > 0) {
                    const shoePromises = shoeSizes.map(item => {
                        totalQuantityFromSizes += Number(item.quantity) || 0;
                        return ShoeSize.create({
                            ProductId: newProduct.ProductId,
                            Size: item.size,
                            Quantity: item.quantity
                        });
                    });
                    await Promise.all(shoePromises);
                    // Cập nhật tổng số lượng vào Product
                    await newProduct.update({ Quantity: totalQuantityFromSizes });
                }
            }

            res.status(201).json({ message: 'Thêm sản phẩm thành công', productId: newProduct.ProductId });
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm:', error);
            res.status(500).json({ error: error.message });
        }
    });
};
// Ẩn/Hiện sản phẩm
exports.toggleHideProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // Toggle trạng thái ẩn/hiện
        const newStatus = product.IsHidden === 1 ? 0 : 1;
        await product.update({ IsHidden: newStatus });

        res.json({ 
            message: newStatus === 1 ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm',
            isHidden: newStatus
        });
    } catch (error) {
        console.error('Lỗi khi ẩn/hiện sản phẩm:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // Kiểm tra xem sản phẩm đã có trong đơn hàng chưa
        const orderDetailCount = await OrderDetail.count({
            where: { ProductId: id }
        });

        if (orderDetailCount > 0) {
            return res.status(400).json({ 
                message: 'Không thể xóa sản phẩm này vì đã có trong đơn hàng. Bạn có thể ẩn sản phẩm thay vì xóa.',
                hasOrders: true
            });
        }

        // Xóa ảnh đại diện nếu có
        if (product.Avatar && fs.existsSync(product.Avatar)) {
            fs.unlinkSync(product.Avatar);
        }
        // Xóa ảnh phụ
        await Image.destroy({ where: { ProductId: id } });
        // Xóa thông số kỹ thuật
        await Specification.destroy({ where: { ProductId: id } });
        // XÓA SIZE QUẦN ÁO VÀ GIÀY
        await ClothingSize.destroy({ where: { ProductId: id } });
        await ShoeSize.destroy({ where: { ProductId: id } });

        await product.destroy();
        res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        
        // Xử lý lỗi foreign key constraint
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                message: 'Không thể xóa sản phẩm này vì đã có liên kết với dữ liệu khác (đơn hàng, giỏ hàng...).',
                error: 'FOREIGN_KEY_CONSTRAINT'
            });
        }
        
        res.status(500).json({ error: error.message });
    }
};
exports.updateProduct = async (req, res) => {
    upload.fields([
        { name: 'Avatar', maxCount: 1 },
        { name: 'Images', maxCount: 10 }
    ])(req, res, async (err) => {
        if (err) {
            console.error('Lỗi upload:', err);
            return res.status(500).json({ error: 'Lỗi khi upload hình ảnh' });
        }
        try {
            const { id } = req.params; // Lấy id sản phẩm từ URL
            const {
                ProductName,
                Description,
                SummaryDescription,
                Discount,
                IdBrand,
                Price,
                CostPrice,
                Quantity,
                specifications
            } = req.body;
            const product = await Product.findByPk(id);
            if (!product) {
                return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
            }

            // Cập nhật Avatar nếu có file mới
            let avatarPath = product.Avatar;
            if (req.files['Avatar']) {
                if (avatarPath && fs.existsSync(path.join(uploadDir, avatarPath))) {
                    fs.unlinkSync(path.join(uploadDir, avatarPath));
                }
                avatarPath = req.files['Avatar'][0].filename;
            }

            // Cập nhật thông tin sản phẩm
            await product.update({
                ProductName,
                Description,
                SummaryDescription,
                Discount,
                IdBrand,
                Price,
                CostPrice: CostPrice || 0,
                Quantity: Quantity || 0,
                Avatar: avatarPath
            });

            // Cập nhật hình ảnh nếu có file mới
            if (req.files['Images'] && req.files['Images'].length > 0) {
                // Xóa hình ảnh cũ
                const oldImages = await Image.findAll({ where: { ProductId: id } });
                for (const oldImage of oldImages) {
                    const oldPath = path.join(uploadDir, oldImage.ImageUrl);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
                await Image.destroy({ where: { ProductId: id } });

                // Thêm hình ảnh mới
                const imagePromises = req.files['Images'].map((image) =>
                    Image.create({
                        ImageUrl: image.filename,
                        ProductId: id
                    })
                );
                await Promise.all(imagePromises);
            }

            // Cập nhật thông số kỹ thuật
            if (specifications) {
                let parsedSpecifications = [];
                try {
                    parsedSpecifications = JSON.parse(specifications);
                } catch (parseError) {
                    console.error('Lỗi khi parse thông số kỹ thuật:', parseError);
                    return res.status(400).json({ error: 'Thông số kỹ thuật không hợp lệ' });
                }

                // Xóa thông số kỹ thuật cũ
                await Specification.destroy({ where: { ProductId: id } });

                // Thêm thông số kỹ thuật mới
                const specPromises = parsedSpecifications.map((spec) =>
                    Specification.create({
                        SpecificationName: spec.SpecificationName,
                        SpecificationContent: spec.SpecificationContent,
                        ProductId: id
                    })
                );
                await Promise.all(specPromises);
            }

            // Xử lý cập nhật size quần áo và tính lại tổng số lượng
            let totalQuantityFromSizes = 0;
            if (req.body.clothingSizes) {
                let clothingSizes = [];
                try {
                    clothingSizes = JSON.parse(req.body.clothingSizes);
                } catch (e) {
                    return res.status(400).json({ error: 'Dữ liệu size quần áo không hợp lệ' });
                }
                // Xóa size cũ
                await ClothingSize.destroy({ where: { ProductId: id } });
                // Thêm size mới
                if (Array.isArray(clothingSizes) && clothingSizes.length > 0) {
                    const clothingPromises = clothingSizes.map(item => {
                        totalQuantityFromSizes += Number(item.quantity) || 0;
                        return ClothingSize.create({
                            ProductId: id,
                            Size: item.size,
                            Quantity: item.quantity
                        });
                    });
                    await Promise.all(clothingPromises);
                    // Cập nhật tổng số lượng vào Product
                    await product.update({ Quantity: totalQuantityFromSizes });
                }
            }

            // Xử lý cập nhật size giày và tính lại tổng số lượng
            if (req.body.shoeSizes) {
                let shoeSizes = [];
                try {
                    shoeSizes = JSON.parse(req.body.shoeSizes);
                } catch (e) {
                    return res.status(400).json({ error: 'Dữ liệu size giày không hợp lệ' });
                }
                // Xóa size cũ
                await ShoeSize.destroy({ where: { ProductId: id } });
                // Thêm size mới
                if (Array.isArray(shoeSizes) && shoeSizes.length > 0) {
                    const shoePromises = shoeSizes.map(item => {
                        totalQuantityFromSizes += Number(item.quantity) || 0;
                        return ShoeSize.create({
                            ProductId: id,
                            Size: item.size,
                            Quantity: item.quantity
                        });
                    });
                    await Promise.all(shoePromises);
                    // Cập nhật tổng số lượng vào Product
                    await product.update({ Quantity: totalQuantityFromSizes });
                }
            }

            res.json({ message: 'Cập nhật sản phẩm thành công' });
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
            res.status(500).json({ error: error.message });
        }
    });
};



//
exports.getProductDetails = async (req, res) => {
    try {
        const { id } = req.params; 
        const product = await Product.findOne({
            where: { ProductId: id },
            include: [
                { model: Brand, as: 'Brand' },
                { model: Specification, as: 'Specifications' },
                { model: ClothingSize, as: 'ClothingSizes' },
                { model: ShoeSize, as: 'ShoeSizes' },
                { model: Category, as: 'Category' }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tìm thấy' });
        }

        res.json(product); 
    } catch (error) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', error);
        res.status(500).json({ error: error.message });
    }
};
// Thêm vào phần các route của bạn
exports.searchProducts = async (req, res) => {
    const query = req.query.q; // Lấy từ khóa tìm kiếm từ query string
    try {
      const results = await Product.findAll({
        where: {
          ProductName: {
            [Op.like]: `%${query}%` // Sử dụng Op.like thay cho $like
          },
        },
      });
      res.json(results);
    } catch (error) {
      console.error("Lỗi tìm kiếm:", error); // Log chi tiết lỗi
      res.status(500).json({ message: "Lỗi khi tìm kiếm sản phẩm", error });
    }
  };
  //Hiện thông số kĩ thuật
exports.getProductSpecifications = async (req, res) => {
try {
    const { productId } = req.params; // Lấy productId từ URL

    // Tìm tất cả các thông số kỹ thuật dựa trên ProductId
    const specifications = await Specification.findAll({
        where: { ProductId: productId },
    });

    if (specifications.length === 0) {
        return res.status(404).json({
            message: 'Không có thông số kỹ thuật nào cho sản phẩm này.',
        });
    }

    res.json({
        message: 'Thông số kỹ thuật của sản phẩm',
        data: specifications,
    });
} catch (error) {
    console.error('Lỗi khi lấy thông số kỹ thuật:', error);
    res.status(500).json({
        error: 'Lỗi khi lấy thông số kỹ thuật của sản phẩm',
        details: error.message,
    });
}
};
// Cập nhật số lượng sản phẩm
exports.updateProductQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity === null) {
            return res.status(400).json({ message: 'Số lượng không được để trống' });
        }

        if (quantity < 0) {
            return res.status(400).json({ message: 'Số lượng không được nhỏ hơn 0' });
        }

        const product = await Product.findByPk(id, {
            include: [{ model: Category, as: 'Category' }]
        });

        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        const categoryName = product.Category?.CategoryName;

        // Nếu là sản phẩm có size (Quần áo hoặc Giày), cảnh báo
        if (categoryName === 'Quần áo' || categoryName === 'Giày') {
            return res.status(400).json({ 
                message: `Sản phẩm này có size. Vui lòng cập nhật số lượng từng size trong phần chỉnh sửa sản phẩm.`,
                isProductWithSize: true
            });
        }

        // Cập nhật số lượng cho sản phẩm thông thường
        await product.update({ Quantity: parseInt(quantity) });

        res.json({ 
            message: 'Cập nhật số lượng thành công',
            product: {
                ProductId: product.ProductId,
                ProductName: product.ProductName,
                Quantity: product.Quantity
            }
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật số lượng:', error);
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật số lượng size cụ thể
exports.updateSizeQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { sizeType, size, quantity } = req.body;

        if (quantity === undefined || quantity === null) {
            return res.status(400).json({ message: 'Số lượng không được để trống' });
        }

        if (quantity < 0) {
            return res.status(400).json({ message: 'Số lượng không được nhỏ hơn 0' });
        }

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Cập nhật số lượng size
        if (sizeType === 'clothing') {
            const clothingSize = await ClothingSize.findOne({
                where: { ProductId: id, Size: size }
            });
            
            if (!clothingSize) {
                return res.status(404).json({ message: `Không tìm thấy size ${size}` });
            }
            
            await clothingSize.update({ Quantity: parseInt(quantity) });
            
            // Tính lại tổng số lượng
            const totalQuantity = await ClothingSize.sum('Quantity', { where: { ProductId: id } }) || 0;
            await product.update({ Quantity: totalQuantity });
            
            return res.json({ 
                message: 'Cập nhật số lượng size thành công',
                totalQuantity
            });
        } else if (sizeType === 'shoe') {
            const shoeSize = await ShoeSize.findOne({
                where: { ProductId: id, Size: size }
            });
            
            if (!shoeSize) {
                return res.status(404).json({ message: `Không tìm thấy size ${size}` });
            }
            
            await shoeSize.update({ Quantity: parseInt(quantity) });
            
            // Tính lại tổng số lượng
            const totalQuantity = await ShoeSize.sum('Quantity', { where: { ProductId: id } }) || 0;
            await product.update({ Quantity: totalQuantity });
            
            return res.json({ 
                message: 'Cập nhật số lượng size thành công',
                totalQuantity
            });
        } else {
            return res.status(400).json({ message: 'Loại size không hợp lệ' });
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật số lượng size:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getImagesByProductId = async (req, res) => {
    try {
        const { productId } = req.params; // Lấy productId từ URL
    
        // Tìm tất cả các thông số kỹ thuật dựa trên ProductId
        const images = await Image.findAll({
            where: { ProductId: productId },
        });
        if (images.length === 0) {
            return res.status(404).json({
                message: 'Không có ảnh  nào cho sản phẩm .',
            });
        }
    
        res.json({
            message: 'Ảnh của sản phẩm',
            data: images,
        });
    } catch (error) {
        console.error('Lỗi khi lấy ảnht:', error);
        res.status(500).json({
            error: 'Lỗi khi lấy ảnh của sản phẩm',
            details: error.message,
        });
    }
    };