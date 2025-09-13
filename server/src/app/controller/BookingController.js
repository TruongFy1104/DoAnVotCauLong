const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const SECRET_KEY = "saddasdasadsasdadsas";
const Branch = require("../models/branch");
const Court = require("../models/Court");
const TimeSlot = require("../models/TimeSlot");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const Account = require("../models/Account");

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourtsByBranch = async (req, res) => {
  try {
    const { branchId } = req.query;
    if (!branchId) {
      return res.status(400).json({ error: "Thiếu branchId" });
    }
    const courts = await Court.findAll({ where: { BranchId: branchId } });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.findAll();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//tạo đặt sân
exports.createBooking = async (req, res) => {
  console.log("==> createBooking called");
  console.log("==> Request body:", req.body);
  console.log("==> Authorization header:", req.headers.authorization);

  const { bookings, firstname, lastname, mobile, email } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  console.log("==> Extracted token:", token ? "***EXISTS***" : "NULL");

  if (!token) {
    console.log("==> Error: No token provided");
    return res.status(403).json({ message: "Token không được cung cấp" });
  }
  if (!Array.isArray(bookings) || bookings.length === 0) {
    console.log("==> Error: Invalid bookings data");
    return res.status(400).json({ message: "Thiếu thông tin đặt sân" });
  }
  try {
    console.log("==> Verifying token with SECRET_KEY:", SECRET_KEY);
    const user = jwt.verify(token, SECRET_KEY);
    console.log("==> Token verified successfully, user:", user);
    const customer = await Customer.findOne({
      where: { CustomerId: user.customerid || user.CustomerId || user.id },
    });

    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng." });
    }
    const account = await Account.findOne({
      where: { AccountId: user.userId || user.accountid || user.AccountId },
    });

    // Update thông tin nếu khách hàng cần
    let needUpdateCustomer = false;
    let needUpdateAccount = false;
    if (firstname && firstname !== customer.Firstname) {
      customer.Firstname = firstname;
      needUpdateCustomer = true;
    }
    if (lastname && lastname !== customer.Lastname) {
      customer.Lastname = lastname;
      needUpdateCustomer = true;
    }
    if (mobile && mobile !== customer.Mobile) {
      customer.Mobile = mobile;
      needUpdateCustomer = true;
    }
    if (email && email !== customer.Email) {
      customer.Email = email;
      needUpdateCustomer = true;
    }
    if (account) {
      if (mobile && mobile !== account.Mobile) {
        account.Mobile = mobile;
        needUpdateAccount = true;
      }
      if (email && email !== account.Email) {
        account.Email = email;
        needUpdateAccount = true;
      }
    }
    if (needUpdateCustomer) {
      await customer.save();
    }
    if (needUpdateAccount) {
      await account.save();
    }

    let createdBookings = [];
    let failedBookings = [];

    for (const b of bookings) {
      console.log("==> Processing booking:", b);

      // Kiểm tra trùng lịch đặt sân
      const existed = await Booking.findOne({
        where: {
          CourtId: b.CourtId || b.courtId,
          TimeSlotId: b.TimeSlotId || b.timeSlotId,
          BookingDate: b.BookingDate || b.bookingDate,
          Status: { [Op.ne]: "Cancelled" },
        },
      });

      if (existed) {
        failedBookings.push({
          ...b,
          message: "Khung giờ này đã được đặt!",
        });
        continue;
      }

      // Tạo booking mới
      const newBooking = await Booking.create({
        CustomerId: customer.CustomerId,
        CourtId: b.CourtId || b.courtId,
        TimeSlotId: b.TimeSlotId || b.timeSlotId,
        BookingDate: b.BookingDate || b.bookingDate,
        Status: "Đang chờ duyệt",
      });

      createdBookings.push(newBooking);
    }

    res.status(201).json({
      message: "Đặt sân thành công!",
      createdBookings,
      failedBookings,
      customer: {
        Firstname: customer.Firstname,
        Lastname: customer.Lastname,
        Mobile: customer.Mobile,
        Email: customer.Email,
      },
    });
  } catch (err) {
    console.error("==> Lỗi trong createBooking:", err);
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

exports.getBookedSlots = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        Status: { [Op.ne]: "Cancelled" },
      },
      attributes: ["CourtId", "TimeSlotId", "BookingDate"],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingHistory = async (req, res) => {
  try {
    console.log("==> getBookingHistory called");
    console.log("==> Authorization header:", req.headers.authorization);

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    console.log("==> Extracted token:", token ? "***EXISTS***" : "NULL");

    if (!token) {
      console.log("==> Error: No token provided");
      return res.status(403).json({ message: "Token không được cung cấp" });
    }

    console.log("==> Verifying token...");
    const user = jwt.verify(token, SECRET_KEY);
    console.log("==> Token verified successfully, user:", user);

    const customerId = user.customerid || user.CustomerId || user.id;
    console.log("==> CustomerId extracted:", customerId);

    if (!customerId) {
      console.log("==> Error: No customerId found");
      return res
        .status(400)
        .json({ message: "Không tìm thấy thông tin khách hàng." });
    }

    console.log("==> Querying bookings for customerId:", customerId);
    const bookings = await Booking.findAll({
      where: { CustomerId: customerId },
      order: [["BookingDate", "DESC"]],
      attributes: [
        "BookingId",
        "BookingDate",
        "CourtId",
        "TimeSlotId",
        "Status",
      ],
      include: [
        {
          model: Court,
          attributes: ["BranchId"],
          include: [
            {
              model: Branch,
              attributes: ["BranchName"],
            },
          ],
        },
      ],
    });

    console.log("==> Raw bookings from DB:", JSON.stringify(bookings, null, 2));
    console.log("==> Number of bookings found:", bookings.length);

    // Thêm trường canCancel: chỉ true nếu chưa hủy/thành công
    const result = bookings.map((b) => ({
      BookingId: b.BookingId,
      BookingDate: b.BookingDate,
      CourtId: b.CourtId,
      TimeSlotId: b.TimeSlotId,
      Status: b.Status,
      BranchId: b.Court ? b.Court.BranchId : null,
      BranchName: b.Court && b.Court.Branch ? b.Court.Branch.BranchName : null,
      canCancel: b.Status !== "Đã hủy" && b.Status !== "Thành công",
    }));

    console.log("==> Processed result:", JSON.stringify(result, null, 2));
    console.log("==> Sending response...");

    res.json({ bookings: result });
  } catch (error) {
    console.error("==> Lỗi getBookingHistory:", error);
    console.error("==> Error stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
};

//get all bookings trong admin
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        {
          model: Customer,
          attributes: ["Firstname", "Lastname", "Mobile"],
        },
        {
          model: Court,
          attributes: ["CourtName", "BranchId"],
          include: [
            {
              model: Branch,
              attributes: ["BranchName"],
            },
          ],
        },
        {
          model: TimeSlot,
          attributes: ["StartTime", "EndTime"],
        },
      ],
    });

    const result = bookings.map((b) => ({
      BookingId: b.BookingId,
      BookingDate: b.BookingDate,
      Status: b.Status,
      Mobile: b.Customer ? b.Customer.Mobile : null,
      TotalPrice: b.TotalPrice,
      CustomerId: b.CustomerId,
      CustomerName: b.Customer
        ? b.Customer.Firstname + " " + b.Customer.Lastname
        : null,
      CourtId: b.CourtId,
      CourtName: b.Court ? b.Court.CourtName : null,
      BranchId: b.Court ? b.Court.BranchId : null,
      BranchName: b.Court && b.Court.Branch ? b.Court.Branch.BranchName : null,
      TimeSlotId: b.TimeSlotId,
      StartTime: b.TimeSlot ? b.TimeSlot.StartTime : null,
      EndTime: b.TimeSlot ? b.TimeSlot.EndTime : null,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Duyệt sân (approve)
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy booking" });
    if (booking.Status === "User hủy sân" || booking.Status === "Đã hủy") {
      return res
        .status(400)
        .json({ message: "Không thể duyệt booking đã bị hủy!" });
    }
    booking.Status = "Thành công";
    await booking.save();
    res.json({ message: "Duyệt sân thành công!", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.cancelManyBookings = async (req, res) => {
  try {
    const { bookingIds } = req.body;
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách bookingIds không hợp lệ" });
    }
    await Booking.update(
      { Status: "User hủy sân" },
      { where: { BookingId: bookingIds } }
    );
    res.json({ message: "User đã hủy tất cả các booking!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hủy sân (cancel)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy booking" });
    booking.Status = "Đã hủy";
    await booking.save();
    res.json({ message: "Hủy sân thành công!", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//xóa sân (delete)
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy booking" });
    await booking.destroy();
    res.json({ message: "Xóa đặt sân thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
