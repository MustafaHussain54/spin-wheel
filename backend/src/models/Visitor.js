const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  participationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  instagramHandle: {
    type: String,
    trim: true,
    default: ''
  },
  hasSpun: {
    type: Boolean,
    default: false,
    index: true
  },
  spinCount: {
    type: Number,
    default: 0
  },
  spinTime: {
    type: Date,
    default: null
  },
  prizeWon: {
    prizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prize',
      default: null
    },
    prizeName: {
      type: String,
      default: null
    },
    category: {
      type: String,
      default: null
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    claimInstructions: {
      type: String,
      default: ''
    }
  },
  claimStatus: {
    type: String,
    enum: ['Pending', 'Claimed', 'Not Applicable'],
    default: 'Pending',
    index: true
  },
  claimedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },
  registeredAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for querying
VisitorSchema.index({ mobileNumber: 1, registeredAt: -1 });

module.exports = mongoose.model('Visitor', VisitorSchema);
