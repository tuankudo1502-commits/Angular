// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc'],
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'Giá sản phẩm là bắt buộc'],
    min: 0
  },
  image: {
    type: String,
    required: [true, 'Ảnh sản phẩm là bắt buộc']
  },
  mainImage: {
    type: String
  },
  subImage: {
    type: String
  },
  game: {
    type: String,
    required: [true, 'Tên game là bắt buộc']
  },
  rarity: {
    type: String,
    enum: ['Premium', 'Deluxe', 'Covert', 'Ultra', 'Legendary', 'Ancient'],
    default: 'Premium'
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isLimited: {
    type: Boolean,
    default: false
  },
  releaseDate: {
    type: Date
  },
  sales: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả sản phẩm là bắt buộc'],
    maxlength: 2000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.image = ret.image || ret.mainImage || ret.images?.[0] || '';
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.image = ret.image || ret.mainImage || ret.images?.[0] || '';
      return ret;
    }
  }
});

productSchema.pre('validate', function() {
  if (!this.image) {
    this.image = this.mainImage || this.images?.[0] || '';
  }

  if (!this.mainImage && this.image) {
    this.mainImage = this.image;
  }

  if ((!this.images || this.images.length === 0) && this.image) {
    this.images = [this.image];
  }
});

// Tạo slug từ name
productSchema.virtual('slug').get(function() {
  return this.name.toLowerCase().replace(/\s/g, '-');
});

module.exports = mongoose.model('Product', productSchema);