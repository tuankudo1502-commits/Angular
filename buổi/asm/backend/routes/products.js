// backend/routes/products.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getNewProducts,
  getFeaturedProducts,
  getRareProducts,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/new', getNewProducts);
router.get('/featured', getFeaturedProducts);
router.get('/rare', getRareProducts);
router.get('/:id/related', getRelatedProducts);
router.get('/:slug', getProductBySlug);

// Admin routes
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;