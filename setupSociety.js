require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/admin.model');
const Agent = require('./models/agent.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/society-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB successfully!');
  
  try {
    // Create default super admin
    const existingAdmin = await Admin.findOne({ email: 'admin@society.com' });
    if (!existingAdmin) {
      const superAdmin = new Admin({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@society.com',
        phone: '9876543210',
        password: 'admin123',
        role: 'super_admin',
        permissions: [
          'manage_students',
          'manage_courses',
          'manage_batches',
          'manage_payments',
          'manage_kyc',
          'manage_marksheets',
          'manage_certificates',
          'view_reports',
          'manage_admins'
        ],
        address: {
          street: 'Admin Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });
      
      await superAdmin.save();
      console.log('✅ Super Admin created successfully!');
      console.log('Email: admin@society.com');
      console.log('Password: admin123');
    } else {
      console.log('ℹ️  Super Admin already exists');
    }

    // Create default agents
    const defaultAgents = [
      {
        agentCode: 'AGENT001',
        agentName: 'John Agent',
        phone: '9876543211',
        email: 'agent1@society.com',
        address: {
          street: 'Agent Street 1',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        commissionRate: 5,
        isActive: true,
        isVerified: true
      },
      {
        agentCode: 'AGENT002',
        agentName: 'Jane Agent',
        phone: '9876543212',
        email: 'agent2@society.com',
        address: {
          street: 'Agent Street 2',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002'
        },
        commissionRate: 5,
        isActive: true,
        isVerified: true
      },
      {
        agentCode: 'AGENT003',
        agentName: 'Mike Agent',
        phone: '9876543213',
        email: 'agent3@society.com',
        address: {
          street: 'Agent Street 3',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003'
        },
        commissionRate: 7,
        isActive: true,
        isVerified: true
      }
    ];

    for (const agentData of defaultAgents) {
      const existingAgent = await Agent.findOne({ agentCode: agentData.agentCode });
      if (!existingAgent) {
        const agent = new Agent(agentData);
        await agent.save();
        console.log(`✅ Agent ${agentData.agentCode} created successfully!`);
      } else {
        console.log(`ℹ️  Agent ${agentData.agentCode} already exists`);
      }
    }

    // Create regular admin
    const existingRegularAdmin = await Admin.findOne({ email: 'manager@society.com' });
    if (!existingRegularAdmin) {
      const regularAdmin = new Admin({
        firstName: 'Society',
        lastName: 'Manager',
        email: 'manager@society.com',
        phone: '9876543214',
        password: 'manager123',
        role: 'admin',
        permissions: [
          'manage_students',
          'manage_kyc',
          'view_reports'
        ],
        address: {
          street: 'Manager Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });
      
      await regularAdmin.save();
      console.log('✅ Regular Admin created successfully!');
      console.log('Email: manager@society.com');
      console.log('Password: manager123');
    } else {
      console.log('ℹ️  Regular Admin already exists');
    }

    console.log('\n🎉 Society Management System Setup Complete!');
    console.log('\n📋 Default Credentials:');
    console.log('Super Admin: admin@society.com / admin123');
    console.log('Regular Admin: manager@society.com / manager123');
    console.log('\n🤝 Default Agent Codes:');
    console.log('- AGENT001 (John Agent)');
    console.log('- AGENT002 (Jane Agent)');
    console.log('- AGENT003 (Mike Agent)');
    console.log('\n🚀 You can now start using the society management system!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
});
