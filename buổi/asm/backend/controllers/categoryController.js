// backend/controllers/categoryController.js
const Category = require('../models/Category');
const Product = require('../models/Product');

const buildCategoryPayload = (body) => {
  const payload = {
    name: body.name,
    description: body.description,
    image: body.image,
    isActive: body.isActive,
  };

  if (body.parentCategory) {
    payload.parentCategory = body.parentCategory;
  }

  return payload;
};

// @desc    Lấy tất cả categories
// @route   GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter =
      activeOnly === 'true'
        ? {
            $or: [{ isActive: true }, { isActive: { $exists: false } }],
          }
        : {};

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name')
      .sort({ createdAt: -1 });

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });

        return {
          ...category.toObject(),
          productCount,
        };
      }),
    );

    res.json({ success: true, data: categoriesWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Tạo category mới (Admin)
// @route   POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(buildCategoryPayload(req.body));
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Cập nhật category (Admin)
// @route   PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      buildCategoryPayload(req.body),
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Xóa category (Admin)
// @route   DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};