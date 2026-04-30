const User = require('../models/User');
const Product = require('../models/Product');

function normalizeCartItems(cartItems) {
  return cartItems
    .filter((item) => item.product)
    .map((item) => {
      const product = typeof item.product.toObject === 'function' ? item.product.toObject() : item.product;
      return {
        ...product,
        quantity: item.quantity,
      };
    });
}

async function getCartResponse(userId) {
  const user = await User.findById(userId).populate('cart.product');

  if (!user) {
    return null;
  }

  const items = normalizeCartItems(user.cart);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingFee = subtotal === 0 ? 0 : subtotal >= 500000 ? 0 : 30000;

  return {
    items,
    summary: {
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
    },
  };
}

exports.getCart = async (req, res) => {
  try {
    const response = await getCartResponse(req.user.id);

    if (!response) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, data: response.items, summary: response.summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const parsedQuantity = Number(quantity);

    if (!productId || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ success: false, message: 'Dữ liệu giỏ hàng không hợp lệ' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const user = await User.findById(req.user.id);
    const existingItem = user.cart.find((item) => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += parsedQuantity;
    } else {
      user.cart.push({ product: productId, quantity: parsedQuantity });
    }

    await user.save();

    const response = await getCartResponse(req.user.id);
    res.status(200).json({ success: true, data: response.items, summary: response.summary });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const parsedQuantity = Number(quantity);

    if (!productId || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });
    }

    const user = await User.findById(req.user.id);
    const item = user.cart.find((cartItem) => cartItem.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    item.quantity = parsedQuantity;
    await user.save();

    const response = await getCartResponse(req.user.id);
    res.json({ success: true, data: response.items, summary: response.summary });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);

    user.cart = user.cart.filter((item) => item.product.toString() !== productId);
    await user.save();

    const response = await getCartResponse(req.user.id);
    res.json({ success: true, data: response.items, summary: response.summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();

    res.json({ success: true, data: [], summary: { subtotal: 0, shippingFee: 0, total: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};