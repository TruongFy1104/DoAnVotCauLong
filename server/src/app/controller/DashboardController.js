const { Op } = require("sequelize");
const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const Product = require("../models/Product");
const Account = require("../models/Account");
const Customer = require("../models/Customer");
const OrderStatus = require("../models/OrderStatus");
const Booking = require("../models/Booking");
const sequelize = require("../../config/db");

exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // Ngày hôm nay
        const startOfDay = new Date(year, month, now.getDate(), 0, 0, 0);
        const endOfDay = new Date(year, month, now.getDate(), 23, 59, 59);
        
        // Tháng hiện tại
        const startOfMonth = new Date(year, month, 1, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        // 1. Thống kê hôm nay
        const ordersToday = await Order.findAll({
            where: {
                CreateAt: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            include: [{
                model: OrderDetail,
                as: 'OrderDetails',
                include: [{
                    model: Product,
                    attributes: ['ProductId', 'Price', 'CostPrice']
                }]
            }]
        });

        let revenueTodayAmount = 0;
        let costTodayAmount = 0;
        ordersToday.forEach(order => {
            revenueTodayAmount += Number(order.TotalPrice) || 0;
            if (order.OrderDetails) {
                order.OrderDetails.forEach(detail => {
                    const quantity = Number(detail.Quantity) || 0;
                    const costPrice = Number(detail.Product?.CostPrice) || 0;
                    costTodayAmount += quantity * costPrice;
                });
            }
        });
        const profitTodayAmount = revenueTodayAmount - costTodayAmount;

        // Thống kê booking hôm nay
        const BOOKING_PRICE = 70000;
        let bookingsToday = [];
        let bookingsTodayStats = { total: 0, completed: 0, cancelled: 0, revenue: 0 };
        try {
            bookingsToday = await Booking.findAll({
                where: {
                    BookingDate: {
                        [Op.between]: [startOfDay, endOfDay]
                    }
                }
            });
            
            console.log("Bookings today found:", bookingsToday.length);
            console.log("Start of day:", startOfDay);
            console.log("End of day:", endOfDay);
            console.log("Bookings data:", bookingsToday.map(b => ({ 
                BookingId: b.BookingId, 
                BookingDate: b.BookingDate, 
                Status: b.Status,
                TotalPrice: b.TotalPrice 
            })));
            
            bookingsTodayStats = {
                total: bookingsToday.length,
                completed: bookingsToday.filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công').length,
                cancelled: bookingsToday.filter(b => b.Status === 'Cancelled' || b.Status === 'Đã hủy').length,
                revenue: bookingsToday
                    .filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công')
                    .reduce((sum, b) => {
                        const price = (b.TotalPrice !== undefined && b.TotalPrice !== null) ? Number(b.TotalPrice) : BOOKING_PRICE;
                        return sum + price;
                    }, 0)
            };
            console.log("Booking today stats:", bookingsTodayStats);
        } catch (bookingError) {
            console.error("Lỗi khi lấy dữ liệu booking hôm nay:", bookingError.message);
        }

        // Thống kê booking tháng này
        let bookingsMonthly = [];
        let bookingsMonthlyStats = { total: 0, completed: 0, cancelled: 0, revenue: 0 };
        try {
            bookingsMonthly = await Booking.findAll({
                where: {
                    BookingDate: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });
            
            bookingsMonthlyStats = {
                total: bookingsMonthly.length,
                completed: bookingsMonthly.filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công').length,
                cancelled: bookingsMonthly.filter(b => b.Status === 'Cancelled' || b.Status === 'Đã hủy').length,
                revenue: bookingsMonthly
                    .filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công')
                    .reduce((sum, b) => {
                        const price = (b.TotalPrice !== undefined && b.TotalPrice !== null) ? Number(b.TotalPrice) : BOOKING_PRICE;
                        return sum + price;
                    }, 0)
            };
        } catch (bookingError) {
            console.error("Lỗi khi lấy dữ liệu booking tháng này:", bookingError.message);
        }

        // 2. Thống kê tháng này
        const ordersMonthly = await Order.findAll({
            where: {
                CreateAt: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            },
            include: [{
                model: OrderDetail,
                as: 'OrderDetails',
                include: [{
                    model: Product,
                    attributes: ['ProductId', 'Price', 'CostPrice']
                }]
            }]
        });

        let revenueMonthlyAmount = 0;
        let costMonthlyAmount = 0;
        ordersMonthly.forEach(order => {
            revenueMonthlyAmount += Number(order.TotalPrice) || 0;
            if (order.OrderDetails) {
                order.OrderDetails.forEach(detail => {
                    const quantity = Number(detail.Quantity) || 0;
                    const costPrice = Number(detail.Product?.CostPrice) || 0;
                    costMonthlyAmount += quantity * costPrice;
                });
            }
        });
        const profitMonthlyAmount = revenueMonthlyAmount - costMonthlyAmount;

        // 3. Sản phẩm bán chạy nhất (top 5)
        const topProducts = await OrderDetail.findAll({
            attributes: [
                'ProductId',
                [sequelize.fn('SUM', sequelize.col('OrderDetail.Quantity')), 'totalSold']
            ],
            include: [{
                model: Product,
                attributes: ['ProductId', 'ProductName', 'Avatar', 'Price']
            }],
            group: ['ProductId', 'Product.ProductId'],
            order: [[sequelize.fn('SUM', sequelize.col('OrderDetail.Quantity')), 'DESC']],
            limit: 5
        });

        // 4. Đơn hàng gần nhất (5 đơn)
        const recentOrders = await Order.findAll({
            limit: 5,
            order: [['CreateAt', 'DESC']],
            include: [{
                model: OrderStatus,
                as: 'OrderStatus',
                attributes: ['OrderStatusName']
            }]
        });

        // 5. Tổng số khách hàng
        const totalCustomers = await Account.count({
            where: {
                IdGroup: 2 // Giả sử IdGroup=2 là khách hàng
            }
        });

        // 6. Tổng số sản phẩm
        const totalProducts = await Product.count();

        // 7. Tổng đơn hàng (tất cả thời gian)
        const totalOrders = await Order.count();

        // 8. Doanh thu 7 ngày gần nhất
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(year, month, now.getDate() - i, 0, 0, 0);
            const dayEnd = new Date(year, month, now.getDate() - i, 23, 59, 59);
            
            const ordersInDay = await Order.findAll({
                where: {
                    CreateAt: {
                        [Op.between]: [dayStart, dayEnd]
                    }
                },
                include: [{
                    model: OrderDetail,
                    as: 'OrderDetails',
                    include: [{
                        model: Product,
                        attributes: ['ProductId', 'Price', 'CostPrice']
                    }]
                }]
            });
            
            let revenue = 0;
            let cost = 0;
            ordersInDay.forEach(order => {
                revenue += Number(order.TotalPrice) || 0;
                if (order.OrderDetails) {
                    order.OrderDetails.forEach(detail => {
                        const quantity = Number(detail.Quantity) || 0;
                        const costPrice = Number(detail.Product?.CostPrice) || 0;
                        cost += quantity * costPrice;
                    });
                }
            });
            
            last7Days.push({
                date: dayStart.toLocaleDateString('vi-VN'),
                revenue: revenue,
                cost: cost,
                profit: revenue - cost,
                orders: ordersInDay.length
            });
        }

        res.json({
            today: {
                revenue: revenueTodayAmount,
                cost: costTodayAmount,
                profit: profitTodayAmount,
                orders: ordersToday.length
            },
            monthly: {
                revenue: revenueMonthlyAmount,
                cost: costMonthlyAmount,
                profit: profitMonthlyAmount,
                orders: ordersMonthly.length
            },
            bookingToday: bookingsTodayStats,
            bookingMonthly: bookingsMonthlyStats,
            topProducts: topProducts.map(item => ({
                productId: item.Product.ProductId,
                productName: item.Product.ProductName,
                imageUrl: item.Product.Avatar,
                price: item.Product.Price,
                totalSold: item.dataValues.totalSold
            })),
            recentOrders: await Promise.all(recentOrders.map(async order => {
                const customer = await Customer.findByPk(order.CustomerId);
                return {
                    orderId: order.OrderId,
                    customerName: customer ? `${customer.Firstname || ''} ${customer.Lastname || ''}`.trim() || 'N/A' : 'N/A',
                    totalPrice: order.TotalPrice,
                    status: order.OrderStatus?.OrderStatusName || 'N/A',
                    createAt: order.CreateAt
                };
            })),
            totalCustomers: totalCustomers,
            totalProducts: totalProducts,
            totalOrders: totalOrders,
            last7Days: last7Days
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: error.message });
    }
};
