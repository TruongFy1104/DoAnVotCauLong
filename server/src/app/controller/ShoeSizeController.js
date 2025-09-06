const ShoeSize = require("../models/ShoesSize");

const getAllShoeSizes = async (req, res) => {
  try {
    const shoeSizes = await ShoeSize.findAll();
    res.status(200).json(shoeSizes);
  } catch (error) {
    console.error("Error fetching shoe sizes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getShoeSizesByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const shoeSizes = await ShoeSize.findAll({
      where: { ProductId: productId },
    });
    res.status(200).json(shoeSizes);
  } catch (error) {
    console.error("Error fetching shoe sizes by product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createShoeSize = async (req, res) => {
  try {
    const { ProductId, Size, Quantity } = req.body;
    const newShoeSize = await ShoeSize.create({
      ProductId,
      Size,
      Quantity,
    });
    res.status(201).json(newShoeSize);
  } catch (error) {
    console.error("Error creating shoe size:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateShoeSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { Size, Quantity } = req.body;

    const shoeSize = await ShoeSize.findByPk(id);
    if (!shoeSize) {
      return res.status(404).json({ message: "Shoe size not found" });
    }

    await shoeSize.update({ Size, Quantity });
    res.status(200).json(shoeSize);
  } catch (error) {
    console.error("Error updating shoe size:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteShoeSize = async (req, res) => {
  try {
    const { id } = req.params;
    const shoeSize = await ShoeSize.findByPk(id);

    if (!shoeSize) {
      return res.status(404).json({ message: "Shoe size not found" });
    }

    await shoeSize.destroy();
    res.status(200).json({ message: "Shoe size deleted successfully" });
  } catch (error) {
    console.error("Error deleting shoe size:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllShoeSizes,
  getShoeSizesByProductId,
  createShoeSize,
  updateShoeSize,
  deleteShoeSize,
};
