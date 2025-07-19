const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');

exports.getAllOrder = async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (error) {
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
        const { status } = req.body;
        const order = await Order.findOne({
            where: { OrderId: id }
        });
        if(order.OrderStatusId === 2 && order.OrderStatusId === 4){
            return res.status(404).json({ message: 'Thay đổi trạng thái thất bại' });
        }
        if(status === 4){
            order.OrderStatusId = 4; 
        }else if(status === 3){
            order.OrderStatusId = 5; 
        }else if(status === 5){
            order.OrderStatusId = 1; 
        }
        await order.save()
        res.json({ message: 'Trạng thái đơn hàng đã được thay đổi', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
