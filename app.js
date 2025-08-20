require("dotenv").config();
require("./utilities/database");

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const indexRouter = require('./routes/index');
const studentRouter = require('./routes/student');
const adminRouter = require('./routes/admin');
const societyMemberRouter = require('./routes/societyMember');
const adminSocietyRouter = require('./routes/adminSociety');
const paymentRequestRouter = require('./routes/paymentRequests');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   }
// });
// app.use(limiter);

// Logging
app.use(logger('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// File uploads static route
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/', indexRouter);
app.use('/api/student', studentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/society-member', societyMemberRouter);
app.use('/api/admin-society', adminSocietyRouter);
app.use('/api/payment-requests', paymentRequestRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
