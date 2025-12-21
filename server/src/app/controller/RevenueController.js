const { Op } = require("sequelize");
const sequelize = require("../../config/db");
const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const Product = require("../models/Product");
const Booking = require("../models/Booking");

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

        const ordersYear = await Order.findAll({
            where: {
                CreateAt: { // Đúng tên trường trong model
                    [Op.between]: [startOfYear, endOfYear]
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

        // Tính doanh thu, chi phí và lợi nhuận tháng
        let revenueMonthly = 0;
        let costMonthly = 0;
        ordersMonthly.forEach(order => {
            revenueMonthly += Number(order.TotalPrice) || 0;
            if (order.OrderDetails) {
                order.OrderDetails.forEach(detail => {
                    const quantity = Number(detail.Quantity) || 0;
                    const costPrice = Number(detail.Product?.CostPrice) || 0;
                    costMonthly += quantity * costPrice;
                });
            }
        });
        const profitMonthly = revenueMonthly - costMonthly;

        // Tính doanh thu, chi phí và lợi nhuận năm
        let revenueYear = 0;
        let costYear = 0;
        ordersYear.forEach(order => {
            revenueYear += Number(order.TotalPrice) || 0;
            if (order.OrderDetails) {
                order.OrderDetails.forEach(detail => {
                    const quantity = Number(detail.Quantity) || 0;
                    const costPrice = Number(detail.Product?.CostPrice) || 0;
                    costYear += quantity * costPrice;
                });
            }
        });
        const profitYear = revenueYear - costYear;

        const countOrdersMonthly = ordersMonthly.length;
        const countOrdersYear = ordersYear.length;

        // Tính doanh thu và số đơn hàng theo từng tháng trong năm
        const monthlyData = [];
        for (let m = 0; m < 12; m++) {
            const startMonth = new Date(year, m, 1, 0, 0, 0);
            const endMonth = new Date(year, m + 1, 0, 23, 59, 59);
            
            const ordersInMonth = await Order.findAll({
                where: {
                    CreateAt: {
                        [Op.between]: [startMonth, endMonth]
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
            ordersInMonth.forEach(order => {
                revenue += Number(order.TotalPrice) || 0;
                if (order.OrderDetails) {
                    order.OrderDetails.forEach(detail => {
                        const quantity = Number(detail.Quantity) || 0;
                        const costPrice = Number(detail.Product?.CostPrice) || 0;
                        cost += quantity * costPrice;
                    });
                }
            });
            
            monthlyData.push({
                month: m + 1,
                revenue: revenue,
                cost: cost,
                profit: revenue - cost,
                orders: ordersInMonth.length
            });
        }

        // Thống kê chi tiết bổ sung
        
        // 1. Tỉ lệ lợi nhuận
        const profitMarginMonthly = revenueMonthly > 0 ? ((profitMonthly / revenueMonthly) * 100).toFixed(2) : 0;
        const profitMarginYear = revenueYear > 0 ? ((profitYear / revenueYear) * 100).toFixed(2) : 0;
        
        // 2. Doanh thu trung bình mỗi đơn
        const avgRevenuePerOrderMonthly = countOrdersMonthly > 0 ? (revenueMonthly / countOrdersMonthly).toFixed(0) : 0;
        const avgRevenuePerOrderYear = countOrdersYear > 0 ? (revenueYear / countOrdersYear).toFixed(0) : 0;
        
        // 3. So sánh với tháng trước
        const lastMonth = month === 0 ? 11 : month - 1;
        const lastMonthYear = month === 0 ? year - 1 : year;
        const startOfLastMonth = new Date(lastMonthYear, lastMonth, 1, 0, 0, 0);
        const endOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59);
        
        const ordersLastMonth = await Order.findAll({
            where: {
                CreateAt: {
                    [Op.between]: [startOfLastMonth, endOfLastMonth]
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
        
        let revenueLastMonth = 0;
        let costLastMonth = 0;
        ordersLastMonth.forEach(order => {
            revenueLastMonth += Number(order.TotalPrice) || 0;
            if (order.OrderDetails) {
                order.OrderDetails.forEach(detail => {
                    const quantity = Number(detail.Quantity) || 0;
                    const costPrice = Number(detail.Product?.CostPrice) || 0;
                    costLastMonth += quantity * costPrice;
                });
            }
        });
        const profitLastMonth = revenueLastMonth - costLastMonth;
        
        const revenueGrowth = revenueLastMonth > 0 
            ? (((revenueMonthly - revenueLastMonth) / revenueLastMonth) * 100).toFixed(2) 
            : 0;
        const profitGrowth = profitLastMonth > 0 
            ? (((profitMonthly - profitLastMonth) / profitLastMonth) * 100).toFixed(2) 
            : 0;
        
        // 4. Top 10 sản phẩm có lợi nhuận cao nhất trong tháng
        const topProfitProducts = await OrderDetail.findAll({
            attributes: [
                'ProductId',
                [sequelize.fn('SUM', sequelize.col('OrderDetail.Quantity')), 'totalSold']
            ],
            include: [
                {
                    model: Product,
                    attributes: ['ProductId', 'ProductName', 'Price', 'CostPrice', 'Avatar']
                },
                {
                    model: Order,
                    attributes: [],
                    where: {
                        CreateAt: {
                            [Op.between]: [startOfMonth, endOfMonth]
                        }
                    },
                    required: true
                }
            ],
            group: ['ProductId', 'Product.ProductId'],
            limit: 10,
            subQuery: false
        });
        
        const topProfitProductsData = topProfitProducts.map(item => {
            const quantity = Number(item.dataValues.totalSold) || 0;
            const price = Number(item.Product?.Price) || 0;
            const costPrice = Number(item.Product?.CostPrice) || 0;
            const revenue = quantity * price;
            const cost = quantity * costPrice;
            const profit = revenue - cost;
            const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;
            
            return {
                productId: item.Product?.ProductId,
                productName: item.Product?.ProductName,
                avatar: item.Product?.Avatar,
                price: price,
                costPrice: costPrice,
                quantitySold: quantity,
                revenue: revenue,
                cost: cost,
                profit: profit,
                profitMargin: profitMargin
            };
        }).sort((a, b) => b.profit - a.profit);
        
        // 5. Thống kê theo tuần trong tháng hiện tại
        const weeklyData = [];
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        let weekStart = new Date(firstDayOfMonth);
        let weekNumber = 1;
        
        while (weekStart <= lastDayOfMonth) {
            let weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (weekEnd > lastDayOfMonth) weekEnd = new Date(lastDayOfMonth);
            
            const ordersInWeek = await Order.findAll({
                where: {
                    CreateAt: {
                        [Op.between]: [weekStart, new Date(weekEnd.setHours(23, 59, 59))]
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
            
            let weekRevenue = 0;
            let weekCost = 0;
            ordersInWeek.forEach(order => {
                weekRevenue += Number(order.TotalPrice) || 0;
                if (order.OrderDetails) {
                    order.OrderDetails.forEach(detail => {
                        const quantity = Number(detail.Quantity) || 0;
                        const costPrice = Number(detail.Product?.CostPrice) || 0;
                        weekCost += quantity * costPrice;
                    });
                }
            });
            
            weeklyData.push({
                week: weekNumber,
                startDate: weekStart.toLocaleDateString('vi-VN'),
                endDate: weekEnd.toLocaleDateString('vi-VN'),
                revenue: weekRevenue,
                cost: weekCost,
                profit: weekRevenue - weekCost,
                orders: ordersInWeek.length
            });
            
            weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() + 1);
            weekStart.setHours(0, 0, 0, 0);
            weekNumber++;
        }
        
        // 6. Thống kê theo phương thức thanh toán
        const paymentMethods = await Order.findAll({
            attributes: [
                'PaymentMethod',
                [sequelize.fn('COUNT', sequelize.col('OrderId')), 'orderCount'],
                [sequelize.fn('SUM', sequelize.col('TotalPrice')), 'totalRevenue']
            ],
            where: {
                CreateAt: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            },
            group: ['PaymentMethod']
        });
        
        const paymentStats = paymentMethods.map(item => ({
            method: item.PaymentMethod || 'Không rõ',
            orderCount: Number(item.dataValues.orderCount) || 0,
            revenue: Number(item.dataValues.totalRevenue) || 0
        }));

        // 7. Thống kê Booking (Đặt sân)
        // Giá mặc định cho mỗi booking (70,000 VND/tiếng)
        const BOOKING_PRICE = 70000;
        
        let bookingsMonthly = [];
        let bookingsYear = [];
        let bookingStatsMonthly = { total: 0, completed: 0, cancelled: 0, pending: 0, revenue: 0 };
        let bookingStatsYear = { total: 0, completed: 0, cancelled: 0, pending: 0, revenue: 0 };
        let monthlyBookingData = [];
        
        try {
            // Lấy tất cả bookings trong tháng
            bookingsMonthly = await Booking.findAll({
                where: {
                    BookingDate: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            // Lấy tất cả bookings trong năm
            bookingsYear = await Booking.findAll({
                where: {
                    BookingDate: {
                        [Op.between]: [startOfYear, endOfYear]
                    }
                }
            });
        } catch (bookingError) {
            console.error("Lỗi khi lấy dữ liệu booking:", bookingError.message);
            // Tiếp tục với dữ liệu rỗng
        }

        // Tính toán cho tháng
        if (bookingsMonthly.length > 0) {
            bookingStatsMonthly = {
                total: bookingsMonthly.length,
                completed: bookingsMonthly.filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công').length,
                cancelled: bookingsMonthly.filter(b => b.Status === 'Cancelled' || b.Status === 'Đã hủy').length,
                pending: bookingsMonthly.filter(b => b.Status === 'Pending' || b.Status === 'Chờ duyệt').length,
                revenue: bookingsMonthly
                    .filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công')
                    .reduce((sum, b) => {
                        const price = (b.TotalPrice !== undefined && b.TotalPrice !== null) ? Number(b.TotalPrice) : BOOKING_PRICE;
                        return sum + price;
                    }, 0)
            };
        }

        // Tính toán cho năm
        if (bookingsYear.length > 0) {
            bookingStatsYear = {
                total: bookingsYear.length,
                completed: bookingsYear.filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công').length,
                cancelled: bookingsYear.filter(b => b.Status === 'Cancelled' || b.Status === 'Đã hủy').length,
                pending: bookingsYear.filter(b => b.Status === 'Pending' || b.Status === 'Chờ duyệt').length,
                revenue: bookingsYear
                    .filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công')
                    .reduce((sum, b) => {
                        const price = (b.TotalPrice !== undefined && b.TotalPrice !== null) ? Number(b.TotalPrice) : BOOKING_PRICE;
                        return sum + price;
                    }, 0)
            };
        }

        // Thống kê booking theo tháng
        try {
            for (let m = 0; m < 12; m++) {
                const startMonth = new Date(year, m, 1);
                const endMonth = new Date(year, m + 1, 0);
                
                const bookingsInMonth = await Booking.findAll({
                    where: {
                        BookingDate: {
                            [Op.between]: [startMonth, endMonth]
                        }
                    }
                });
                
                monthlyBookingData.push({
                    month: m + 1,
                    total: bookingsInMonth.length,
                    completed: bookingsInMonth.filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công').length,
                    cancelled: bookingsInMonth.filter(b => b.Status === 'Cancelled' || b.Status === 'Đã hủy').length,
                    pending: bookingsInMonth.filter(b => b.Status === 'Pending' || b.Status === 'Chờ duyệt').length,
                    revenue: bookingsInMonth
                        .filter(b => b.Status === 'Approved' || b.Status === 'Đã đặt thành công')
                        .reduce((sum, b) => {
                            const price = (b.TotalPrice !== undefined && b.TotalPrice !== null) ? Number(b.TotalPrice) : BOOKING_PRICE;
                            return sum + price;
                        }, 0)
                });
            }
        } catch (monthlyBookingError) {
            console.error("Lỗi khi lấy dữ liệu booking theo tháng:", monthlyBookingError.message);
        }

        res.json({
            // Thống kê cơ bản
            RevenueMonthly: revenueMonthly,
            CostMonthly: costMonthly,
            ProfitMonthly: profitMonthly,
            RevenueYear: revenueYear,
            CostYear: costYear,
            ProfitYear: profitYear,
            CountOrdersMonthly: countOrdersMonthly,
            CountOrdersYear: countOrdersYear,
            MonthlyData: monthlyData,
            
            // Thống kê chi tiết
            ProfitMarginMonthly: profitMarginMonthly,
            ProfitMarginYear: profitMarginYear,
            AvgRevenuePerOrderMonthly: avgRevenuePerOrderMonthly,
            AvgRevenuePerOrderYear: avgRevenuePerOrderYear,
            
            // So sánh tháng trước
            LastMonthComparison: {
                revenue: revenueLastMonth,
                cost: costLastMonth,
                profit: profitLastMonth,
                orders: ordersLastMonth.length,
                revenueGrowth: revenueGrowth,
                profitGrowth: profitGrowth
            },
            
            // Top sản phẩm lợi nhuận cao
            TopProfitProducts: topProfitProductsData,
            
            // Thống kê theo tuần
            WeeklyData: weeklyData,
            
            // Thống kê phương thức thanh toán
            PaymentStats: paymentStats,
            
            // Thống kê Booking (Đặt sân)
            BookingStatsMonthly: bookingStatsMonthly,
            BookingStatsYear: bookingStatsYear,
            MonthlyBookingData: monthlyBookingData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};