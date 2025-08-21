let mongoose = require("mongoose");

// Use MONGODB_URI from environment, fallback to DATABASE_URL for backward compatibility
const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/student_management_system';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection
  .on("open", () => console.log("✅ Database connected successfully!"))
  .on("error", (error) => {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  });
