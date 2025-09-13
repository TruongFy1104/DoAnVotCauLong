const { Op } = require("sequelize");
const Order = require("../models/Order");

exports.getRevenue = async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const startOfMonth = new Date(year, month, 1, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const startOfYear = new Date(year, 0, 1, 0, 0, 0);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        // Sử dụng đúng tên trường CreateAt
        const ordersMonthly = await Order.findAll({
            where: {
                CreateAt: { // Đúng tên trường trong model
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        const ordersYear = await Order.findAll({
            where: {
                CreateAt: { // Đúng tên trường trong model
                    [Op.between]: [startOfYear, endOfYear]
                }
            }
        });

        const revenueMonthly = ordersMonthly
            .map(order => Number(order.TotalPrice) || 0)
            .reduce((total, price) => total + price, 0);

        const revenueYear = ordersYear
            .map(order => Number(order.TotalPrice) || 0)
            .reduce((total, price) => total + price, 0);

        const countOrdersMonthly = ordersMonthly.length;
        const countOrdersYear = ordersYear.length;

        res.json({
            RevenueMonthly: revenueMonthly,
            RevenueYear: revenueYear,
            CountOrdersMonthly: countOrdersMonthly,
            CountOrdersYear: countOrdersYear
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};