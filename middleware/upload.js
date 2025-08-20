const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories
const subdirs = ['kyc', 'courses', 'profiles', 'certificates', 'marksheets', 'agents'];
subdirs.forEach(dir => {
  const subdir = path.join(uploadsDir, dir);
  if (!fs.existsSync(subdir)) {
    fs.mkdirSync(subdir, { recursive: true });
  }
});

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadsDir;
    
    // Determine upload path based on file type
    if (file.fieldname === 'aadharDocument' || file.fieldname === 'panDocument') {
      uploadPath = path.join(uploadsDir, 'kyc');
    } else if (file.fieldname === 'profilePhoto') {
      uploadPath = path.join(uploadsDir, 'profiles');
    } else if (file.fieldname === 'coursePdf' || file.fieldname === 'courseVideo') {
      uploadPath = path.join(uploadsDir, 'courses');
    } else if (file.fieldname === 'certificate') {
      uploadPath = path.join(uploadsDir, 'certificates');
    } else if (file.fieldname === 'marksheet') {
      uploadPath = path.join(uploadsDir, 'marksheets');
    } else if (file.fieldname === 'idProof' || file.fieldname === 'addressProof' || file.fieldname === 'agentProfilePhoto') {
      uploadPath = path.join(uploadsDir, 'agents');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
  
  let allowedTypes = [];
  
  // Determine allowed types based on field name
  if (file.fieldname === 'profilePhoto' || file.fieldname === 'agentProfilePhoto') {
    allowedTypes = allowedImageTypes;
  } else if (file.fieldname === 'aadharDocument' || file.fieldname === 'panDocument' || file.fieldname === 'idProof' || file.fieldname === 'addressProof') {
    allowedTypes = allowedDocumentTypes;
  } else if (file.fieldname === 'coursePdf') {
    allowedTypes = ['application/pdf'];
  } else if (file.fieldname === 'courseVideo') {
    allowedTypes = allowedVideoTypes;
  } else if (file.fieldname === 'certificate' || file.fieldname === 'marksheet') {
    allowedTypes = allowedDocumentTypes;
  }
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer with file size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Specific upload configurations
const kycUpload = upload.fields([
  { name: 'aadharDocument', maxCount: 1 },
  { name: 'panDocument', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]);

const agentUpload = upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'agentProfilePhoto', maxCount: 1 }
]);

const courseUpload = upload.fields([
  { name: 'coursePdf', maxCount: 1 },
  { name: 'courseVideo', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

const certificateUpload = upload.single('certificate');
const marksheetUpload = upload.single('marksheet');
const profileUpload = upload.single('profilePhoto');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  } else if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'File upload error.'
  });
};

module.exports = {
  kycUpload,
  agentUpload,
  courseUpload,
  certificateUpload,
  marksheetUpload,
  profileUpload,
  handleUploadError
}; 