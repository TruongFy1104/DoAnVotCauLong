const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');
const OrderStatus = require('../models/OrderStatus');

// Setup associations nếu chưa có
if (!Order.associations.Customer) {
    Order.belongsTo(Customer, {
        foreignKey: 'CustomerId',
        as: 'Customer'
    });
}

if (!Order.associations.OrderStatus) {
    Order.belongsTo(OrderStatus, {
        foreignKey: 'OrderStatusId',
        as: 'OrderStatus'
    });
}

exports.getAllOrder = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: ['CustomerId', 'Firstname', 'Lastname', 'Mobile', 'Email'],
                    required: false
                },
                {
                    model: OrderStatus,
                    as: 'OrderStatus',
                    attributes: ['OrderStatusId', 'OrderStatusName'],
                    required: false
                }
            ],
            order: [['CreateAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('Error in getAllOrder:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        await OrderDetail.destroy({
            where: {
                OrderId: id 
            }
        });
        await order.destroy();
        res.json({ message: 'Xóa đơn hàng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const detailOrder = await OrderDetail.findAll({
            where: { OrderId: id },
            include: [
                {
                    model: Product, 
                    as: 'Product', 
                },
                {
                    model: Order, 
                    as: 'Order', 
                },
            ]
        });
        const order = await Order.findOne({
            where: { OrderId: id }
        });
        const informationCustomer = await Customer.findByPk(detailOrder[0].Order.dataValues.CustomerId)
        if (!detailOrder) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        res.json({DetailOrder: detailOrder, InformationCustomer:informationCustomer, Order:order});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.changeStatusOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelReason, cancelNote } = req.body;
        console.log("Nhận dữ liệu:", { id, status, cancelReason, cancelNote }); // Debug
        
        const order = await Order.findOne({
            where: { OrderId: id }
        });
        
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        // Không cho phép thay đổi nếu đơn đã hủy hoặc thất bại hoặc user đã hủy
        if (order.OrderStatusId === 2 || order.OrderStatusId === 4 || order.OrderStatusId === 6) {
            return res.status(400).json({ message: 'Không thể thay đổi trạng thái đơn hàng đã hủy hoặc thất bại' });
        }
        
        // Cập nhật trạng thái đơn hàng
        order.OrderStatusId = status;
        
        // Nếu là hủy đơn, lưu lý do và ghi chú
        if (status === 4) {
            order.CancelReason = cancelReason || null;
            order.CancelNote = cancelNote || null;
        }
        
        await order.save();
        
        res.json({ message: 'Trạng thái đơn hàng đã được thay đổi', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// API cho user hủy đơn hàng
exports.cancelOrderByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelReason, cancelNote } = req.body;
        
        const order = await Order.findOne({
            where: { OrderId: id }
        });
        
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        // Chỉ cho phép hủy nếu đơn đang xử lý (status = 3)
        if (order.OrderStatusId !== 3) {
            return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang được xử lý' });
        }
        
        // Cập nhật trạng thái thành User hủy đơn (status = 6)
        order.OrderStatusId = 6;
        order.CancelReason = cancelReason || 'Khách hàng hủy đơn';
        order.CancelNote = cancelNote || null;
        
        await order.save();
        
        res.json({ message: 'Đã hủy đơn hàng thành công', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
