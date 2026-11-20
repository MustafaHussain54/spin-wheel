const mongoose = require('mongoose');

const PrizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Gift', 'Discount', 'No Prize'],
    required: true,
    default: 'Gift'
  },
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  quantity: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  wonCount: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#4F46E5' // Visual slice color
  },
  textColor: {
    type: String,
    default: '#FFFFFF'
  },
  icon: {
    type: String,
    default: 'gift'
  },
  claimInstructions: {
    type: String,
    default: 'Please visit the front reception desk to collect your reward.'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field for remaining quantity
PrizeSchema.virtual('remainingQuantity').get(function() {
  if (this.quantity === -1) return Infinity;
  const rem = this.quantity - this.wonCount;
  return rem > 0 ? rem : 0;
});

PrizeSchema.set('toJSON', { virtuals: true });
PrizeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Prize', PrizeSchema);
