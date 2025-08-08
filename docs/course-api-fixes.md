# Course Creation API - Fixes and Troubleshooting

## Overview
This document outlines the fixes applied to the course creation API to resolve 400 errors and improve error handling.

## Issues Fixed

### 1. Missing Field Validation
**Problem**: The API was not validating required fields before processing.
**Fix**: Added comprehensive validation for all required fields:
- `title`, `description`, `courseType`, `category`, `duration`, `level`, `price`

### 2. JSON Parsing Errors
**Problem**: JSON fields were parsed without error handling, causing crashes.
**Fix**: Added try-catch blocks for JSON parsing with detailed error messages:
- `syllabus`, `prerequisites`, `learningOutcomes`, `offlineCourse`

### 3. File Upload Issues
**Problem**: File handling was not properly checking for file existence.
**Fix**: Added proper file existence checks and improved upload middleware.

### 4. Missing Course ID Field
**Problem**: Schema was trying to set `courseId` but field wasn't defined.
**Fix**: Added `courseId` field to the course schema.

## API Endpoint

### POST `/api/admin/courses`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Required Fields:**
- `title` (string): Course title
- `description` (string): Course description
- `courseType` (string): "online" or "offline"
- `category` (string): One of the valid categories
- `duration` (number): Course duration in hours
- `level` (string): "beginner", "intermediate", or "advanced"
- `price` (number): Course price

**Optional Fields:**
- `shortDescription` (string): Short description
- `subcategory` (string): Course subcategory
- `language` (string): Course language (default: "English")
- `originalPrice` (number): Original price for discount calculation
- `syllabus` (JSON string): Array of syllabus items
- `prerequisites` (JSON string): Array of prerequisites
- `learningOutcomes` (JSON string): Array of learning outcomes
- `offlineCourse` (JSON string): Offline course details (for offline courses)

**File Fields:**
- `thumbnail` (image file): Course thumbnail
- `banner` (image file): Course banner
- `coursePdf` (PDF file): Course PDF (for online courses)

## Valid Categories
- programming
- design
- marketing
- business
- language
- music
- art
- technology
- health
- other

## Valid Levels
- beginner
- intermediate
- advanced

## Example Request

```javascript
const formData = new FormData();

// Required fields
formData.append('title', 'JavaScript Fundamentals');
formData.append('description', 'Learn JavaScript from scratch');
formData.append('courseType', 'online');
formData.append('category', 'programming');
formData.append('duration', '40');
formData.append('level', 'beginner');
formData.append('price', '2999');

// Optional fields
formData.append('shortDescription', 'Complete JavaScript course for beginners');
formData.append('subcategory', 'web-development');
formData.append('language', 'English');
formData.append('originalPrice', '3999');
formData.append('syllabus', JSON.stringify([
  {
    week: 1,
    title: 'Introduction',
    topics: ['Variables', 'Functions']
  }
]));
formData.append('prerequisites', JSON.stringify(['Basic HTML', 'Basic CSS']));
formData.append('learningOutcomes', JSON.stringify(['Build web applications', 'Understand JavaScript concepts']));

// Files
formData.append('thumbnail', thumbnailFile);
formData.append('banner', bannerFile);
formData.append('coursePdf', pdfFile);

const response = await fetch('/api/admin/courses', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken
  },
  body: formData
});
```

## Example Response

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "course_id",
    "title": "JavaScript Fundamentals",
    "description": "Learn JavaScript from scratch",
    "courseType": "online",
    "category": "programming",
    "duration": 40,
    "level": "beginner",
    "price": 2999,
    "originalPrice": 3999,
    "discountPercentage": 25,
    "thumbnail": "/uploads/courses/thumbnail.jpg",
    "banner": "/uploads/courses/banner.jpg",
    "onlineCourse": {
      "pdfContent": "/uploads/courses/course.pdf",
      "razorpayProductId": "prod_123",
      "razorpayPriceId": "price_123"
    },
    "totalEnrollments": 0,
    "averageRating": 0,
    "totalRatings": 0,
    "createdBy": "admin_id",
    "createdAt": "2024-01-10T10:30:00.000Z"
  }
}
```

## Error Responses

### 400 - Validation Errors

```json
{
  "success": false,
  "message": "Missing required fields: title, description, courseType, category, duration, level, price"
}
```

```json
{
  "success": false,
  "message": "Invalid courseType. Must be \"online\" or \"offline\""
}
```

```json
{
  "success": false,
  "message": "Invalid category. Must be one of: programming, design, marketing, business, language, music, art, technology, health, other"
}
```

```json
{
  "success": false,
  "message": "Invalid syllabus JSON format"
}
```

### 401 - Authentication Error

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 - Permission Error

```json
{
  "success": false,
  "message": "Insufficient permissions."
}
```

### 500 - Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Testing

Use the provided test script `test-course-api.js` to test the API:

```bash
# Install dependencies
npm install axios form-data

# Update the ADMIN_TOKEN in the test file
# Run the test
node test-course-api.js
```

## Common Issues and Solutions

### 1. "Missing required fields" error
**Cause**: One or more required fields are missing from the request.
**Solution**: Ensure all required fields are included in the form data.

### 2. "Invalid JSON format" error
**Cause**: JSON strings are not properly formatted.
**Solution**: Use `JSON.stringify()` to convert arrays/objects to JSON strings.

### 3. "File upload error" error
**Cause**: File type not supported or file too large.
**Solution**: Check file type (images: jpg, jpeg, png, webp; PDFs: pdf) and size (max 10MB).

### 4. "Authentication required" error
**Cause**: Missing or invalid authorization token.
**Solution**: Ensure valid admin token is included in Authorization header.

### 5. "Insufficient permissions" error
**Cause**: Admin doesn't have 'manage_courses' permission.
**Solution**: Check admin permissions or use super admin account.

## Frontend Integration Tips

1. **Form Data**: Use `FormData` for multipart/form-data requests
2. **File Validation**: Validate file types and sizes before upload
3. **JSON Fields**: Convert arrays/objects to JSON strings using `JSON.stringify()`
4. **Error Handling**: Handle different error status codes appropriately
5. **Loading States**: Show loading indicators during API calls

## Environment Variables

Ensure these environment variables are set:
- `JWT_SECRET`: Secret key for JWT tokens
- `RAZORPAY_KEY_ID`: Razorpay key ID (for online courses)
- `RAZORPAY_KEY_SECRET`: Razorpay key secret (for online courses)
