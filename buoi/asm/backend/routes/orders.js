const express = require('express');
const router = express.Router();
const { getOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getOrders);

module.exports = router;
