const TimeSlot = require('../models/TimeSlot');

// Lấy danh sách khung giờ
exports.getAllSlotTimes = async (req, res) => {
  try {
    const slots = await TimeSlot.findAll();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Thêm khung giờ mới
exports.createSlotTime = async (req, res) => {
  try {
    const { StartTime, EndTime } = req.body;
    if (!StartTime || !EndTime) return res.status(400).json({ error: "Thiếu giờ bắt đầu hoặc kết thúc" });
    const newSlot = await TimeSlot.create({ StartTime, EndTime });
    res.json({ slot: newSlot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sửa khung giờ
exports.editSlotTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { StartTime, EndTime } = req.body;
    const slot = await TimeSlot.findByPk(id);
    if (!slot) return res.status(404).json({ error: "Không tìm thấy khung giờ" });
    if (StartTime) slot.StartTime = StartTime;
    if (EndTime) slot.EndTime = EndTime;
    await slot.save();
    res.json({ slot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa khung giờ
exports.deleteSlotTime = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await TimeSlot.findByPk(id);
    if (!slot) return res.status(404).json({ error: "Không tìm thấy khung giờ" });
    await slot.destroy();
    res.json({ message: "Đã xóa khung giờ thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};