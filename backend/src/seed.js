const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const Prize = require('./models/Prize');
const Settings = require('./models/Settings');

const seedInitialData = async () => {
  try {
    // 1. Seed Admin
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        name: 'Expo Administrator',
        role: 'superadmin'
      });
      console.log('Default admin created: username="admin", password="admin123"');
    }

    // 2. Seed Default Settings
    const settingsExists = await Settings.findOne();
    if (!settingsExists) {
      await Settings.create({
        allowDuplicateMobile: false,
        expoName: 'TechExpo International 2026',
        welcomeMessage: 'Spin & Win exclusive technology gadgets, merchandise & coupons!'
      });
      console.log('Default settings seeded.');
    }

    // 3. Seed Default Prizes
    const prizeCount = await Prize.countDocuments();
    if (prizeCount === 0) {
      const defaultPrizes = [
        {
          name: 'Better Luck Next Time',
          description: 'Thank you for visiting our booth! Enjoy the rest of the expo.',
          category: 'No Prize',
          probability: 65,
          quantity: -1,
          discountPercentage: 0,
          color: '#64748B', // Slate
          textColor: '#FFFFFF',
          icon: 'smile',
          claimInstructions: 'Thank you for playing! Check out our product showcase.',
          order: 1
        },
        {
          name: 'Free Gift',
          description: 'Official branded Expo Merchandise Kit.',
          category: 'Gift',
          probability: 20,
          quantity: 100,
          discountPercentage: 0,
          color: '#10B981', // Emerald
          textColor: '#FFFFFF',
          icon: 'gift',
          claimInstructions: 'Show your screen to our reception desk to collect your Gift Pack.',
          order: 2
        },
        {
          name: 'Premium Gift',
          description: 'Executive Wireless Power Bank & Smart Water Bottle.',
          category: 'Gift',
          probability: 8,
          quantity: 25,
          discountPercentage: 0,
          color: '#F59E0B', // Amber
          textColor: '#000000',
          icon: 'award',
          claimInstructions: 'Congratulations! Visit Counter 1 with your ID for your Premium Gift.',
          order: 3
        },
        {
          name: '5% Product Discount',
          description: 'Flat 5% Off coupon valid on all expo purchases today.',
          category: 'Discount',
          probability: 5,
          quantity: 200,
          discountPercentage: 5,
          color: '#3B82F6', // Blue
          textColor: '#FFFFFF',
          icon: 'tag',
          claimInstructions: 'Use voucher code EXPO5 at checkout or show this ticket.',
          order: 4
        },
        {
          name: '10% Product Discount',
          description: 'Exclusive 10% Off VIP voucher valid this week.',
          category: 'Discount',
          probability: 2,
          quantity: 50,
          discountPercentage: 10,
          color: '#8B5CF6', // Purple
          textColor: '#FFFFFF',
          icon: 'percent',
          claimInstructions: 'Use voucher code VIP10 at checkout or counter.',
          order: 5
        }
      ];

      await Prize.insertMany(defaultPrizes);
      console.log('Default prizes seeded successfully with exact 100% combined probability.');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedInitialData;
