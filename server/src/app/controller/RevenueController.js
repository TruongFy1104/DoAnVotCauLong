const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');
const { Op, fn, col } = require('sequelize');


exports.getRevenue = async (req, res) => {
    try {
        const ordersMonthly = await Order.findAll({
            where: {
              [Op.and]: [
                fn('MONTH', col('createdAt')) === 12, // Kiểm tra nếu tháng của createdAt là tháng 12
                fn('YEAR', col('createdAt')) === 2024,
              ]
            }
          });
          const ordersYear = await Order.findAll({
            where: {
              [Op.and]: [
                fn('YEAR', col('createdAt')) === 2024,
              ]
            }
          });
          const revenueMonthly = ordersMonthly
          .map(order => order.TotalPrice || 0) 
          .reduce((total, price) => total + price, 0);

        
        const revenueYear = ordersYear
          .map(order => order.TotalPrice || 0)
          .reduce((total, price) => total + price, 0);
        
          var countOrdersMonthly = ordersMonthly.length;
          var countOrdersYear = ordersYear.length;

          res.json({
            RevenueMonthly: revenueMonthly,RevenueYear: revenueYear, CountOrdersMonthly: countOrdersMonthly,CountOrdersYear: countOrdersYear
          })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// exports.getAllOrder = async (req, res) => {
//     try {
//         const orders = await Order.findAll();
//         res.json(orders);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };
// exports.getOrderById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const detailOrder = await OrderDetail.findAll({
//             where: { OrderId: id },
//             include: [
//                 {
//                     model: Product, 
//                     as: 'Product', 
//                 },
//                 {
//                     model: Order, 
//                     as: 'Order', 
//                 },
//             ]
//         });
//         const order = await Order.findOne({
//             where: { OrderId: id }
//         });
//         const informationCustomer = await Customer.findByPk(detailOrder[0].Order.dataValues.CustomerId)
//         if (!detailOrder) {
//             return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
//         }
//         res.json({DetailOrder: detailOrder, InformationCustomer:informationCustomer, Order:order});
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

