const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Settings = require('../models/Settings');
const Prize = require('../models/Prize');
const { selectWinningPrize } = require('../utils/probability');

// Generate unique human-friendly participation ID: EXP-XXXXXX
function generateParticipationId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EXP-${code}`;
}

/**
 * @route POST /api/visitor/register
 * @desc Register visitor before spinning
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, mobileNumber, email, company, city, instagramHandle } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!mobileNumber || !mobileNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    // Clean and validate Indian 10-digit mobile number
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(cleanedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
      });
    }

    // Optional email validation
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
    }

    // Check duplicate mobile setting
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (!settings.allowDuplicateMobile) {
      const existing = await Visitor.findOne({ mobileNumber: cleanedMobile });
      if (existing) {
        if (existing.hasSpun) {
          return res.status(400).json({
            success: false,
            message: `Mobile number ${cleanedMobile} has already participated and completed their spin (Prize: ${existing.prizeWon.prizeName || 'Recorded'}).`
          });
        } else {
          // Allow resuming unspun session
          return res.status(200).json({
            success: true,
            resumed: true,
            message: 'Resuming your uncompleted spin session.',
            visitor: {
              participationId: existing.participationId,
              fullName: existing.fullName,
              mobileNumber: existing.mobileNumber,
              hasSpun: existing.hasSpun
            }
          });
        }
      }
    }

    // Generate unique ID
    let participationId = generateParticipationId();
    let exists = await Visitor.findOne({ participationId });
    while (exists) {
      participationId = generateParticipationId();
      exists = await Visitor.findOne({ participationId });
    }

    // Clean Instagram Handle (remove leading @ if provided)
    const cleanedInstagram = (instagramHandle || '').trim().replace(/^@/, '');

    const newVisitor = new Visitor({
      participationId,
      fullName: fullName.trim(),
      mobileNumber: cleanedMobile,
      email: (email || '').trim().toLowerCase(),
      company: (company || '').trim(),
      city: (city || '').trim(),
      instagramHandle: cleanedInstagram,
      hasSpun: false,
      registeredAt: new Date()
    });

    await newVisitor.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Proceed to spin the wheel.',
      visitor: {
        participationId: newVisitor.participationId,
        fullName: newVisitor.fullName,
        mobileNumber: newVisitor.mobileNumber,
        hasSpun: newVisitor.hasSpun
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while processing registration.' });
  }
});

/**
 * @route GET /api/visitor/status/:participationId
 * @desc Retrieve visitor session status
 */
router.get('/status/:participationId', async (req, res) => {
  try {
    const { participationId } = req.params;
    const visitor = await Visitor.findOne({ participationId });

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor participation record not found.' });
    }

    res.status(200).json({
      success: true,
      visitor: {
        participationId: visitor.participationId,
        fullName: visitor.fullName,
        mobileNumber: visitor.mobileNumber,
        company: visitor.company,
        city: visitor.city,
        instagramHandle: visitor.instagramHandle,
        hasSpun: visitor.hasSpun,
        prizeWon: visitor.prizeWon,
        claimStatus: visitor.claimStatus,
        registeredAt: visitor.registeredAt,
        spinTime: visitor.spinTime
      }
    });
  } catch (error) {
    console.error('Visitor status error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve visitor status.' });
  }
});

/**
 * @route GET /api/visitor/wheel-prizes
 * @desc Public wheel configuration for rendering slices
 */
router.get('/wheel-prizes', async (req, res) => {
  try {
    const prizes = await Prize.find({ isActive: true }).sort({ order: 1, _id: 1 });
    // Filter out items that are out of stock
    const availablePrizes = prizes.map(p => ({
      _id: p._id,
      name: p.name,
      category: p.category,
      color: p.color,
      textColor: p.textColor,
      icon: p.icon,
      discountPercentage: p.discountPercentage,
      isOutOfStock: p.quantity !== -1 && p.wonCount >= p.quantity
    }));

    res.status(200).json({
      success: true,
      prizes: availablePrizes
    });
  } catch (error) {
    console.error('Wheel prizes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wheel prizes.' });
  }
});

/**
 * @route POST /api/visitor/spin
 * @desc Atomic spin endpoint: executes weighted selection on backend & persists result
 */
router.post('/spin', async (req, res) => {
  try {
    const { participationId } = req.body;

    if (!participationId) {
      return res.status(400).json({ success: false, message: 'Participation ID is required.' });
    }

    // Atomic find to guarantee single spin even under concurrent calls
    const visitor = await Visitor.findOne({ participationId });

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Invalid participation session. Please register first.' });
    }

    if (visitor.hasSpun) {
      return res.status(400).json({
        success: false,
        message: 'This participation ticket has already been used to spin!',
        alreadySpun: true,
        prizeWon: visitor.prizeWon
      });
    }

    // Load active prizes
    const allActivePrizes = await Prize.find({ isActive: true }).sort({ order: 1, _id: 1 });

    if (!allActivePrizes.length) {
      return res.status(500).json({ success: false, message: 'No active prizes configured in the system.' });
    }

    // Perform Backend Weighted Random Selection
    let winningPrize;
    try {
      winningPrize = selectWinningPrize(allActivePrizes);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    // Determine slice index on the full active list for frontend alignment
    const prizeIndex = allActivePrizes.findIndex(p => p._id.toString() === winningPrize._id.toString());

    // Atomically increment wonCount on the prize if quantity is limited
    await Prize.findByIdAndUpdate(winningPrize._id, { $inc: { wonCount: 1 } });

    // Determine initial claim status
    let claimStatus = 'Pending';
    if (winningPrize.category === 'No Prize') {
      claimStatus = 'Not Applicable';
    }

    // Update visitor
    visitor.hasSpun = true;
    visitor.spinCount = 1;
    visitor.spinTime = new Date();
    visitor.prizeWon = {
      prizeId: winningPrize._id,
      prizeName: winningPrize.name,
      category: winningPrize.category,
      discountPercentage: winningPrize.discountPercentage,
      claimInstructions: winningPrize.claimInstructions
    };
    visitor.claimStatus = claimStatus;

    await visitor.save();

    res.status(200).json({
      success: true,
      message: 'Spin recorded successfully.',
      result: {
        prizeId: winningPrize._id,
        prizeName: winningPrize.name,
        category: winningPrize.category,
        discountPercentage: winningPrize.discountPercentage,
        claimInstructions: winningPrize.claimInstructions,
        prizeIndex: prizeIndex, // The exact zero-based segment index on the active wheel
        totalSegments: allActivePrizes.length,
        claimStatus: visitor.claimStatus
      }
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ success: false, message: 'Server error while executing spin.' });
  }
});

module.exports = router;
