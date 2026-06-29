const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');

const seedDatabase = async () => {
  try {
    // Check if users already exist to avoid duplicate seeding
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded, skipping auto-seed.');
      return;
    }

    console.log('🌱 Auto-seeding database...');

    const salt = await bcrypt.genSalt(8);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskpipeline.com',
      password: await bcrypt.hash('admin123', salt),
      role: 'Admin',
    });

    const talent1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@taskpipeline.com',
      password: await bcrypt.hash('talent123', salt),
      role: 'Talent',
    });

    const talent2 = await User.create({
      name: 'Bob Smith',
      email: 'bob@taskpipeline.com',
      password: await bcrypt.hash('talent123', salt),
      role: 'Talent',
    });

    console.log('✅ Users auto-seeded:', admin.email, talent1.email, talent2.email);

    await Task.create([
      {
        title: 'Complete Brand Identity Kit',
        description: 'Deliver a full brand kit including logo variants, color palette, and typography guide. Export as a shareable Figma link.',
        status: 'Open',
        assignedTo: talent1._id,
        dueDate: '2024-06-15',
        createdBy: admin._id,
      },
      {
        title: 'Write Q2 Market Analysis Report',
        description: 'Research competitors in the SaaS talent space and produce a 5-page report with key findings and recommendations.',
        status: 'Claimed',
        assignedTo: talent1._id,
        dueDate: '2024-06-20',
        createdBy: admin._id,
      },
      {
        title: 'Record Onboarding Video Series',
        description: 'Create a 3-part video series (max 5 min each) walking new talents through the platform features.',
        status: 'Submitted',
        assignedTo: talent2._id,
        dueDate: '2024-06-10',
        createdBy: admin._id,
      },
      {
        title: 'Social Media Content Calendar',
        description: 'Plan and draft 30 days of social content across LinkedIn, Twitter, and Instagram for the talent portal launch.',
        assignedTo: talent2._id,
        dueDate: '2024-07-01',
        createdBy: admin._id,
      },
      {
        title: 'Build Landing Page Copy',
        description: 'Write compelling hero copy, feature descriptions, and CTAs for the new landing page. Deliver as a Google Doc.',
        status: 'Open',
        dueDate: '2024-06-28',
        createdBy: admin._id,
      },
    ]);

    console.log('✅ Tasks auto-seeded: 5 tasks created');
    console.log('\n🔑 Live credentials:');
    console.log('   Admin  → admin@taskpipeline.com  / admin123');
    console.log('   Talent → alice@taskpipeline.com  / talent123');
    console.log('   Talent → bob@taskpipeline.com    / talent123\n');
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
  }
};

module.exports = seedDatabase;
