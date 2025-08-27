const mongoose = require('mongoose');
const Admin = require('./models/admin.model');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/student_management_system')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Update admin permissions
const updateAdminPermissions = async () => {
  try {
    console.log('🔍 Finding all admin accounts...');
    
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admin accounts`);
    
    let updatedCount = 0;
    
    for (const admin of admins) {
      if (!admin.permissions.includes('manage_society_members')) {
        admin.permissions.push('manage_society_members');
        await admin.save();
        updatedCount++;
        console.log(`✅ Updated admin: ${admin.email} (${admin.adminId})`);
      } else {
        console.log(`ℹ️  Admin already has permission: ${admin.email} (${admin.adminId})`);
      }
    }
    
    console.log(`\n🎉 Update complete!`);
    console.log(`📈 Total admins processed: ${admins.length}`);
    console.log(`✅ Admins updated: ${updatedCount}`);
    console.log(`ℹ️  Admins already had permission: ${admins.length - updatedCount}`);
    
    if (updatedCount > 0) {
      console.log(`\n⚠️  IMPORTANT: Please re-login to your admin account to get the new JWT token with updated permissions.`);
    }
    
  } catch (error) {
    console.error('❌ Error updating admin permissions:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

// Run the update
updateAdminPermissions();
