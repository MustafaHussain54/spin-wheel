const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

const Admin = require('../models/Admin');
const Visitor = require('../models/Visitor');
const Prize = require('../models/Prize');
const Settings = require('../models/Settings');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

/**
 * @route POST /api/admin/login
 * @desc Admin Login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * @route GET /api/admin/me
 * @desc Verify session
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify session.' });
  }
});

/**
 * @route GET /api/admin/dashboard-stats
 * @desc Metrics, counts, and chart aggregations
 */
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const totalSpins = await Visitor.countDocuments({ hasSpun: true });
    const giftsWon = await Visitor.countDocuments({ 'prizeWon.category': 'Gift' });
    const discountsWon = await Visitor.countDocuments({ 'prizeWon.category': 'Discount' });
    const noPrizeCount = await Visitor.countDocuments({ 'prizeWon.category': 'No Prize' });
    const pendingClaims = await Visitor.countDocuments({ claimStatus: 'Pending', 'prizeWon.category': { $in: ['Gift', 'Discount'] } });
    const claimedRewards = await Visitor.countDocuments({ claimStatus: 'Claimed' });

    // Inventory status
    const prizes = await Prize.find();
    let totalLimitedPrizes = 0;
    let totalLimitedWon = 0;
    prizes.forEach(p => {
      if (p.quantity !== -1) {
        totalLimitedPrizes += p.quantity;
        totalLimitedWon += p.wonCount;
      }
    });
    const remainingInventory = totalLimitedPrizes - totalLimitedWon;

    // Distribution breakdown
    const categoryDistribution = [
      { name: 'Gifts Won', count: giftsWon, color: '#10B981' },
      { name: 'Discounts Won', count: discountsWon, color: '#3B82F6' },
      { name: 'Better Luck Next Time', count: noPrizeCount, color: '#9CA3AF' }
    ];

    // Prize specific breakdown
    const prizeStats = prizes.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      wonCount: p.wonCount,
      quantity: p.quantity,
      probability: p.probability,
      isActive: p.isActive
    }));

    // Registration timeline (grouped by date)
    const timeline = await Visitor.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' } },
          totalRegistered: { $sum: 1 },
          totalSpins: { $sum: { $cond: ['$hasSpun', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalVisitors,
        totalSpins,
        giftsWon,
        discountsWon,
        noPrizeCount,
        pendingClaims,
        claimedRewards,
        remainingInventory: remainingInventory >= 0 ? remainingInventory : 'Unlimited',
        categoryDistribution,
        prizeStats,
        timeline
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
});

/**
 * @route GET /api/admin/visitors
 * @desc Filtered and paginated visitor table
 */
router.get('/visitors', authMiddleware, async (req, res) => {
  try {
    const {
      search = '',
      category = 'all',
      spinStatus = 'all',
      claimStatus = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'registeredAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { mobileNumber: searchRegex },
        { participationId: searchRegex },
        { company: searchRegex },
        { city: searchRegex }
      ];
    }

    if (category !== 'all') {
      query['prizeWon.category'] = category;
    }

    if (spinStatus === 'spun') {
      query.hasSpun = true;
    } else if (spinStatus === 'unspun') {
      query.hasSpun = false;
    }

    if (claimStatus !== 'all') {
      query.claimStatus = claimStatus;
    }

    if (startDate || endDate) {
      query.registeredAt = {};
      if (startDate) {
        query.registeredAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.registeredAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [visitors, total] = await Promise.all([
      Visitor.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Visitor.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      visitors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Visitor list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visitors.' });
  }
});

/**
 * @route POST /api/admin/visitors/manual
 * @desc Manually add a visitor who did not play the game
 */
router.post('/visitors/manual', authMiddleware, async (req, res) => {
  try {
    const { fullName, mobileNumber, email, company, city, instagramHandle, adminNotes } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!mobileNumber || !mobileNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(cleanedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
      });
    }

    // Check duplicate
    const existing = await Visitor.findOne({ mobileNumber: cleanedMobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A visitor with mobile number ${cleanedMobile} already exists (${existing.fullName} - ${existing.participationId}).`
      });
    }

    // Generate unique ID
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const participationId = `MAN-${code}`;

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
      spinCount: 0,
      claimStatus: 'N/A',
      prizeWon: {
        prizeName: 'Did Not Play (Manual Entry)',
        category: 'No Prize'
      },
      adminNotes: adminNotes ? `[Manual Lead] ${adminNotes.trim()}` : '[Manual Lead Entered by Admin]',
      registeredAt: new Date()
    });

    await newVisitor.save();

    res.status(201).json({
      success: true,
      message: 'Visitor record successfully saved.',
      visitor: newVisitor
    });
  } catch (error) {
    console.error('Manual visitor creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create visitor record.' });
  }
});

/**
 * @route GET /api/admin/visitors/export
 * @desc Generate formatted Excel spreadsheet of visitors
 */
router.get('/visitors/export', authMiddleware, async (req, res) => {
  try {
    const {
      search = '',
      category = 'all',
      spinStatus = 'all',
      claimStatus = 'all',
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { mobileNumber: searchRegex },
        { participationId: searchRegex },
        { company: searchRegex },
        { city: searchRegex }
      ];
    }

    if (category !== 'all') query['prizeWon.category'] = category;
    if (spinStatus === 'spun') query.hasSpun = true;
    else if (spinStatus === 'unspun') query.hasSpun = false;
    if (claimStatus !== 'all') query.claimStatus = claimStatus;

    if (startDate || endDate) {
      query.registeredAt = {};
      if (startDate) query.registeredAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.registeredAt.$lte = end;
      }
    }

    const visitors = await Visitor.find(query).sort({ registeredAt: -1 });

    const rows = visitors.map((v, index) => ({
      'S.No': index + 1,
      'Participation ID': v.participationId,
      'Full Name': v.fullName,
      'Mobile Number': v.mobileNumber,
      'Email Address': v.email || 'N/A',
      'Company / Organization': v.company || 'N/A',
      'City': v.city || 'N/A',
      'Instagram Handle': v.instagramHandle ? `@${v.instagramHandle}` : 'N/A',
      'Spin Status': v.hasSpun ? 'Spun' : 'Pending',
      'Prize Won': v.prizeWon?.prizeName || 'None',
      'Prize Category': v.prizeWon?.category || 'N/A',
      'Discount %': v.prizeWon?.discountPercentage ? `${v.prizeWon.discountPercentage}%` : 'N/A',
      'Claim Status': v.claimStatus,
      'Registration Date': v.registeredAt ? new Date(v.registeredAt).toLocaleString('en-IN') : '',
      'Spin Timestamp': v.spinTime ? new Date(v.spinTime).toLocaleString('en-IN') : 'N/A',
      'Claim Timestamp': v.claimedAt ? new Date(v.claimedAt).toLocaleString('en-IN') : 'N/A',
      'Admin Notes': v.adminNotes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const colWidths = [
      { wch: 6 },  // S.No
      { wch: 16 }, // ID
      { wch: 22 }, // Name
      { wch: 14 }, // Mobile
      { wch: 24 }, // Email
      { wch: 22 }, // Company
      { wch: 16 }, // City
      { wch: 12 }, // Spin Status
      { wch: 25 }, // Prize Won
      { wch: 15 }, // Category
      { wch: 12 }, // Discount
      { wch: 14 }, // Claim Status
      { wch: 22 }, // Reg Date
      { wch: 22 }, // Spin Date
      { wch: 22 }, // Claim Date
      { wch: 30 }  // Notes
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expo Visitors');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `Expo_Spin_Win_Visitors_${todayStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Excel export.' });
  }
});

/**
 * @route PATCH /api/admin/visitors/:id/claim
 * @desc Update prize claim status & notes
 */
router.patch('/visitors/:id/claim', authMiddleware, async (req, res) => {
  try {
    const { claimStatus, adminNotes } = req.body;
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }

    if (claimStatus) {
      visitor.claimStatus = claimStatus;
      if (claimStatus === 'Claimed' && !visitor.claimedAt) {
        visitor.claimedAt = new Date();
      } else if (claimStatus === 'Pending') {
        visitor.claimedAt = null;
      }
    }

    if (adminNotes !== undefined) {
      visitor.adminNotes = adminNotes;
    }

    await visitor.save();

    res.status(200).json({
      success: true,
      message: 'Claim status updated successfully.',
      visitor
    });
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ success: false, message: 'Failed to update claim status.' });
  }
});

/**
 * @route PUT /api/admin/prizes/bulk-probabilities
 * @desc Update probabilities for multiple prizes at once
 */
router.put('/prizes/bulk-probabilities', authMiddleware, async (req, res) => {
  try {
    const { updates } = req.body; // array of { id, probability }
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid updates payload.' });
    }

    const bulkOps = updates.map(u => ({
      updateOne: {
        filter: { _id: u.id },
        update: { $set: { probability: Number(u.probability), updatedAt: new Date() } }
      }
    }));

    await Prize.bulkWrite(bulkOps);

    const prizes = await Prize.find().sort({ order: 1, _id: 1 });
    const totalActiveProbability = prizes
      .filter(p => p.isActive)
      .reduce((sum, p) => sum + Number(p.probability), 0);

    res.status(200).json({
      success: true,
      message: 'Probabilities updated successfully.',
      prizes,
      totalActiveProbability: parseFloat(totalActiveProbability.toFixed(2))
    });
  } catch (error) {
    console.error('Bulk probability update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update probabilities.' });
  }
});

// PRIZE CRUD & PROBABILITY MANAGEMENT

/**
 * @route GET /api/admin/prizes
 * @desc Get all prizes
 */
router.get('/prizes', authMiddleware, async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ order: 1, _id: 1 });
    const totalActiveProbability = prizes
      .filter(p => p.isActive)
      .reduce((sum, p) => sum + Number(p.probability), 0);

    res.status(200).json({
      success: true,
      prizes,
      totalActiveProbability: parseFloat(totalActiveProbability.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch prizes.' });
  }
});

/**
 * @route POST /api/admin/prizes
 * @desc Add a new prize (with auto-balancing across existing active prizes to ensure exact 100% total)
 */
router.post('/prizes', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      probability,
      quantity,
      discountPercentage,
      color,
      textColor,
      icon,
      claimInstructions,
      isActive,
      order,
      autoBalance = true
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Prize name is required.' });
    }

    let targetProbability = Math.max(0, Math.min(100, Number(probability) || 0));
    targetProbability = Math.round(targetProbability * 10) / 10;
    const isNewActive = isActive !== undefined ? isActive : true;

    // If auto-balance is active and the new prize is active, adjust existing active prizes so sum = 100%
    if (autoBalance && isNewActive) {
      const activePrizes = await Prize.find({ isActive: true });
      if (activePrizes.length > 0) {
        const remainingToDistribute = Math.max(0, 100 - targetProbability);
        const currentTotal = activePrizes.reduce((sum, p) => sum + Number(p.probability), 0);

        let bulkOps = [];
        let allocatedSum = 0;

        activePrizes.forEach((p, idx) => {
          let newProb = 0;
          if (currentTotal > 0) {
            newProb = Math.round(((p.probability / currentTotal) * remainingToDistribute) * 10) / 10;
          } else {
            newProb = Math.round((remainingToDistribute / activePrizes.length) * 10) / 10;
          }
          allocatedSum += newProb;
          bulkOps.push({ id: p._id, newProb });
        });

        // Rounding adjustment on first item
        const delta = Math.round((remainingToDistribute - allocatedSum) * 10) / 10;
        if (bulkOps.length > 0 && delta !== 0) {
          bulkOps[0].newProb = Math.max(0, Math.round((bulkOps[0].newProb + delta) * 10) / 10);
        }

        const updateOps = bulkOps.map(op => ({
          updateOne: {
            filter: { _id: op.id },
            update: { $set: { probability: op.newProb, updatedAt: new Date() } }
          }
        }));

        if (updateOps.length > 0) {
          await Prize.bulkWrite(updateOps);
        }
      }
    }

    const newPrize = new Prize({
      name: name.trim(),
      description: description || '',
      category: category || 'Gift',
      probability: targetProbability,
      quantity: quantity !== undefined ? Number(quantity) : -1,
      discountPercentage: Number(discountPercentage) || 0,
      color: color || '#4F46E5',
      textColor: textColor || '#FFFFFF',
      icon: icon || 'gift',
      claimInstructions: claimInstructions || 'Please claim at the expo counter.',
      isActive: isNewActive,
      order: order ? Number(order) : 0
    });

    await newPrize.save();

    res.status(201).json({
      success: true,
      message: 'Prize added successfully and probabilities balanced to 100%.',
      prize: newPrize
    });
  } catch (error) {
    console.error('Add prize error:', error);
    res.status(500).json({ success: false, message: 'Failed to add prize.' });
  }
});

/**
 * @route PUT /api/admin/prizes/:id
 * @desc Edit an existing prize
 */
router.put('/prizes/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      probability,
      quantity,
      discountPercentage,
      color,
      textColor,
      icon,
      claimInstructions,
      isActive,
      order
    } = req.body;

    const prize = await Prize.findById(req.params.id);
    if (!prize) {
      return res.status(404).json({ success: false, message: 'Prize not found.' });
    }

    if (name) prize.name = name.trim();
    if (description !== undefined) prize.description = description;
    if (category) prize.category = category;
    if (probability !== undefined) prize.probability = Number(probability);
    if (quantity !== undefined) prize.quantity = Number(quantity);
    if (discountPercentage !== undefined) prize.discountPercentage = Number(discountPercentage);
    if (color) prize.color = color;
    if (textColor) prize.textColor = textColor;
    if (icon) prize.icon = icon;
    if (claimInstructions !== undefined) prize.claimInstructions = claimInstructions;
    if (isActive !== undefined) prize.isActive = isActive;
    if (order !== undefined) prize.order = Number(order);
    prize.updatedAt = new Date();

    await prize.save();

    res.status(200).json({
      success: true,
      message: 'Prize updated successfully.',
      prize
    });
  } catch (error) {
    console.error('Update prize error:', error);
    res.status(500).json({ success: false, message: 'Failed to update prize.' });
  }
});

/**
 * @route DELETE /api/admin/prizes/:id
 * @desc Delete a prize (and rebalance remaining active prizes to 100%)
 */
router.delete('/prizes/:id', authMiddleware, async (req, res) => {
  try {
    const prize = await Prize.findById(req.params.id);
    if (!prize) {
      return res.status(404).json({ success: false, message: 'Prize not found.' });
    }

    const wasActive = prize.isActive;
    await Prize.findByIdAndDelete(req.params.id);

    // If deleted prize was active, redistribute 100% among remaining active prizes
    if (wasActive) {
      const remainingActive = await Prize.find({ isActive: true });
      if (remainingActive.length > 0) {
        const currentSum = remainingActive.reduce((sum, p) => sum + Number(p.probability), 0);
        let allocated = 0;
        const bulkOps = remainingActive.map((p, idx) => {
          let newProb = 0;
          if (currentSum > 0) {
            newProb = Math.round(((p.probability / currentSum) * 100) * 10) / 10;
          } else {
            newProb = Math.round((100 / remainingActive.length) * 10) / 10;
          }
          allocated += newProb;
          return { id: p._id, newProb };
        });

        const diff = Math.round((100 - allocated) * 10) / 10;
        if (bulkOps.length > 0 && diff !== 0) {
          bulkOps[0].newProb = Math.max(0, Math.round((bulkOps[0].newProb + diff) * 10) / 10);
        }

        const updateOps = bulkOps.map(op => ({
          updateOne: {
            filter: { _id: op.id },
            update: { $set: { probability: op.newProb, updatedAt: new Date() } }
          }
        }));

        if (updateOps.length > 0) {
          await Prize.bulkWrite(updateOps);
        }
      }
    }

    res.status(200).json({ success: true, message: 'Prize deleted and remaining active prizes balanced to 100%.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete prize.' });
  }
});

/**
 * @route POST /api/admin/prizes/validate-probabilities
 * @desc Checks if active prizes total 100%
 */
router.post('/prizes/validate-probabilities', authMiddleware, async (req, res) => {
  try {
    const prizes = await Prize.find({ isActive: true });
    const total = prizes.reduce((sum, p) => sum + Number(p.probability), 0);
    const isValid = Math.abs(total - 100) < 0.01;

    res.status(200).json({
      success: true,
      isValid,
      totalProbability: parseFloat(total.toFixed(2)),
      message: isValid
        ? 'Total active probability equals 100%.'
        : `Total active probability is currently ${total.toFixed(2)}%. It must equal 100% for balanced distribution.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Validation failed.' });
  }
});

/**
 * @route GET /api/admin/settings
 * @desc Fetch general expo and kiosk configuration
 */
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

/**
 * @route PUT /api/admin/settings
 * @desc Update settings
 */
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { allowDuplicateMobile, expoName, welcomeMessage } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    if (allowDuplicateMobile !== undefined) settings.allowDuplicateMobile = allowDuplicateMobile;
    if (expoName) settings.expoName = expoName;
    if (welcomeMessage) settings.welcomeMessage = welcomeMessage;
    settings.updatedAt = new Date();

    await settings.save();
    res.status(200).json({ success: true, message: 'Settings saved.', settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

module.exports = router;
