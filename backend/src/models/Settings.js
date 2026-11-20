const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  allowDuplicateMobile: {
    type: Boolean,
    default: false // If false, duplicate mobile registration is blocked
  },
  expoName: {
    type: String,
    default: 'Grand Tech & Business Expo 2026'
  },
  welcomeMessage: {
    type: String,
    default: 'Spin the Lucky Wheel and win exciting rewards & exclusive discounts!'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
