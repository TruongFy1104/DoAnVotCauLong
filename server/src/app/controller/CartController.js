exports.addToCart = (req, res) => {
    const { ProductId, Quantity, ProductName, Size, Avatar } = req.body; // Thêm Avatar
    const UserId = req.session.user ? req.session.user.id : null;

    if (!UserId) {
        return res.status(403).json({ message: 'Vui lòng đăng nhập' });
    }

    if (!req.session.cart) {
        req.session.cart = [];
    }

    // Kiểm tra sản phẩm có trong giỏ hàng không (theo ProductId và Size)
    const existingProduct = req.session.cart.find(item => item.ProductId === ProductId && item.Size === Size);

    if (existingProduct) {
        existingProduct.Quantity += Quantity;
    } else {
        req.session.cart.push({ ProductId, ProductName, Quantity, Size, Avatar }); // Thêm Avatar vào object
    }

    res.status(200).json({ message: 'Sản phẩm đã được thêm vào giỏ hàng!' });
};
exports.getCart = (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(404).json({ message: 'Giỏ hàng trống' });
    }

    res.status(200).json(req.session.cart);  // Trả về giỏ hàng đầy đủ thông tin
};
exports.updateQuantity = (req, res) => {
    const { ProductId, Quantity, Size } = req.body; // Thêm Size

    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(404).json({ message: 'Giỏ hàng trống' });
    }

    // Tìm sản phẩm theo ProductId và Size
    const cartItem = req.session.cart.find(item => item.ProductId === ProductId && item.Size === Size);
    if (!cartItem) {
        return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng' });
    }

    cartItem.Quantity = Quantity;

    res.status(200).json({ message: 'Cập nhật số lượng thành công', cart: req.session.cart });
};
exports.removeFromCart = (req, res) => {
    const { ProductId, Size } = req.body; // Thêm Size

    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(404).json({ message: 'Giỏ hàng trống' });
    }

    // Tìm sản phẩm theo ProductId và Size
    const cartItemIndex = req.session.cart.findIndex(item => item.ProductId === ProductId && item.Size === Size);
    if (cartItemIndex === -1) {
        return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng' });
    }

    req.session.cart.splice(cartItemIndex, 1);

    res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng', cart: req.session.cart });
};
