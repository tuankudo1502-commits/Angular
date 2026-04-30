// backend/controllers/productController.js
const Product = require('../models/Product');

const visibleProductFilter = {
  $or: [
    { isActive: true },
    { isActive: { $exists: false } },
  ],
};

const buildProductPayload = (body) => {
  const payload = { ...body };

  if (payload.category === '') {
    delete payload.category;
  }

  if (payload.mainImage === '') {
    delete payload.mainImage;
  }

  if (payload.subImage === '') {
    delete payload.subImage;
  }

  if (payload.releaseDate === '') {
    delete payload.releaseDate;
  }

  return payload;
};

// @desc    Lấy tất cả sản phẩm
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { game, rarity, search, sort, page = 1, limit = 12, includeInactive } = req.query;
    const filters = [];

    if (includeInactive !== 'true') {
      filters.push(visibleProductFilter);
    }
    
    // Filter by game
    if (game && game !== 'all') {
      filters.push({ game });
    }
    
    // Filter by rarity
    if (rarity && rarity !== 'all') {
      filters.push({ rarity });
    }
    
    // Search by name
    if (search) {
      filters.push({ name: { $regex: search, $options: 'i' } });
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'name-asc':
        sortOption = { name: 1 };
        break;
      case 'name-desc':
        sortOption = { name: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'sales':
        sortOption = { sales: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const query = filters.length > 0 ? { $and: filters } : {};

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy sản phẩm theo slug
// @route   GET /api/products/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const escapedSlug = req.params.slug
      .replace(/-/g, ' ')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const product = await Product.findOne({
      $and: [
        visibleProductFilter,
        { name: { $regex: new RegExp('^' + escapedSlug, 'i') } },
      ]
    }).populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy sản phẩm mới
// @route   GET /api/products/new
exports.getNewProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $and: [visibleProductFilter, { isNew: true }],
    })
      .sort({ releaseDate: -1 })
      .limit(6);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy sản phẩm nổi bật (best seller)
// @route   GET /api/products/featured
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find(visibleProductFilter)
      .sort({ sales: -1 })
      .limit(6);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy sản phẩm hiếm
// @route   GET /api/products/rare
exports.getRareProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $and: [
        visibleProductFilter,
        { isLimited: true, stock: { $gt: 0 } },
      ],
    })
      .sort({ stock: 1 })
      .limit(6);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy sản phẩm liên quan
// @route   GET /api/products/:id/related
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    
    const related = await Product.find({
      $and: [
        visibleProductFilter,
        { game: product.game },
        { _id: { $ne: product._id } },
      ],
    }).limit(4);
    
    res.json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Tạo sản phẩm mới (Admin)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(buildProductPayload(req.body));
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tên sản phẩm đã tồn tại.' });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Cập nhật sản phẩm (Admin)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      buildProductPayload(req.body),
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tên sản phẩm đã tồn tại.' });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Xóa sản phẩm (Admin)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};