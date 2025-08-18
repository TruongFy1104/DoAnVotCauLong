const Court = require('../models/Court');

// Lấy danh sách sân
exports.getAllCourts = async (req, res) => {
  try {
    const courts = await Court.findAll();
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Thêm sân mới
exports.createCourt = async (req, res) => {
  try {
    const { CourtName, BranchId } = req.body;
    if (!CourtName || !BranchId) {
      return res.status(400).json({ message: "Thiếu tên sân hoặc chi nhánh" });
    }
    const newCourt = await Court.create({ CourtName, BranchId });
    res.json(newCourt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sửa sân
exports.editCourt = async (req, res) => {
  try {

    const { id } = req.params;
    const { CourtName, BranchId } = req.body;
    const court = await Court.findByPk(id);
    if (!court) return res.status(404).json({ message: "Không tìm thấy sân" });
    court.CourtName = CourtName;
    court.BranchId = BranchId;
    await court.save();
    res.json({ court });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa sân
exports.deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const court = await Court.findByPk(id);
    if (!court) return res.status(404).json({ message: "Không tìm thấy sân" });
    await court.destroy();
    res.json({ message: "Xóa sân thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};