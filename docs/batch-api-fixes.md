# Batch API Fixes Documentation

## Issues Fixed

1. **500 Error on POST /batches**: Fixed comprehensive validation and error handling
2. **Missing Required Field Validation**: Added explicit checks for all required fields
3. **Unsafe JSON Parsing**: Added try-catch blocks for schedule JSON parsing
4. **Missing batchId Field**: Added batchId field to Batch schema
5. **Generic Error Handling**: Enhanced error responses with specific 400 errors
6. **Data Type Validation**: Added proper validation for numeric fields and dates
7. **Schedule Structure Validation**: Added validation for schedule array structure

## API Endpoint Details

### POST /api/admin/batches
**Create a new batch for a course**

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Required Fields
- `name`: String (max 100 characters)
- `courseId`: String (valid MongoDB ObjectId)
- `startDate`: String (valid date format)
- `endDate`: String (valid date format)
- `schedule`: String (JSON array)
- `maxStudents`: Number (positive integer)
- `batchPrice`: Number (non-negative)

#### Optional Fields
- `description`: String (max 500 characters)
- `originalPrice`: Number (non-negative)

#### Schedule JSON Structure
```json
[
  {
    "day": "monday",
    "startTime": "09:00",
    "endTime": "11:00",
    "room": "Room 101"
  }
]
```

#### Valid Days
- monday, tuesday, wednesday, thursday, friday, saturday, sunday

#### Time Format
- HH:MM format (24-hour)
- Example: "09:00", "14:30", "23:45"

## Example Request

```json
{
  "name": "Morning Batch",
  "description": "Morning session batch",
  "courseId": "course_id_here",
  "startDate": "2024-01-15",
  "endDate": "2024-03-15",
  "schedule": "[{\"day\": \"monday\", \"startTime\": \"09:00\", \"endTime\": \"11:00\", \"room\": \"Room 101\"}]",
  "maxStudents": 20,
  "batchPrice": 3999,
  "originalPrice": 4999
}
```

## Example Response

```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": {
    "_id": "batch_id",
    "name": "Morning Batch",
    "description": "Morning session batch",
    "course": "course_id",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-03-15T00:00:00.000Z",
    "schedule": [
      {
        "day": "monday",
        "startTime": "09:00",
        "endTime": "11:00",
        "room": "Room 101"
      }
    ],
    "maxStudents": 20,
    "currentStudents": 0,
    "batchPrice": 3999,
    "originalPrice": 4999,
    "discountPercentage": 20,
    "status": "upcoming",
    "isActive": true,
    "createdBy": "admin_id",
    "createdAt": "2024-01-10T10:30:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: name, courseId, startDate, endDate, schedule, maxStudents, batchPrice"
}
```

```json
{
  "success": false,
  "message": "Max students must be a positive number"
}
```

```json
{
  "success": false,
  "message": "Invalid schedule JSON format"
}
```

```json
{
  "success": false,
  "message": "Invalid day in schedule item 1. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday"
}
```

```json
{
  "success": false,
  "message": "Invalid start time in schedule item 1. Must be in HH:MM format"
}
```

```json
{
  "success": false,
  "message": "End date must be after start date"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Testing Instructions

1. **Valid Request Test**
   ```bash
   curl -X POST http://localhost:3000/api/admin/batches \
     -H "Authorization: Bearer <your_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Batch",
       "description": "Test batch description",
       "courseId": "valid_course_id",
       "startDate": "2024-02-01",
       "endDate": "2024-04-01",
       "schedule": "[{\"day\": \"monday\", \"startTime\": \"10:00\", \"endTime\": \"12:00\", \"room\": \"Room A\"}]",
       "maxStudents": 15,
       "batchPrice": 2500,
       "originalPrice": 3000
     }'
   ```

2. **Missing Required Fields Test**
   ```bash
   curl -X POST http://localhost:3000/api/admin/batches \
     -H "Authorization: Bearer <your_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Batch"
     }'
   ```

3. **Invalid Schedule JSON Test**
   ```bash
   curl -X POST http://localhost:3000/api/admin/batches \
     -H "Authorization: Bearer <your_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Batch",
       "courseId": "valid_course_id",
       "startDate": "2024-02-01",
       "endDate": "2024-04-01",
       "schedule": "invalid_json",
       "maxStudents": 15,
       "batchPrice": 2500
     }'
   ```

## Common Issues and Solutions

### Issue 1: 500 Error
**Cause**: Missing validation or unsafe JSON parsing
**Solution**: All required fields are now validated, and JSON parsing is wrapped in try-catch

### Issue 2: Invalid Schedule Format
**Cause**: Malformed JSON or invalid day/time format
**Solution**: Added comprehensive schedule validation with specific error messages

### Issue 3: Date Validation Errors
**Cause**: Invalid date format or end date before start date
**Solution**: Added date parsing and comparison validation

### Issue 4: Course Not Found
**Cause**: Invalid courseId provided
**Solution**: Added course existence verification before batch creation

## Frontend Integration Tips

1. **Form Validation**: Implement client-side validation for all required fields
2. **Date Formatting**: Ensure dates are in ISO format (YYYY-MM-DD)
3. **Schedule JSON**: Stringify schedule array before sending
4. **Error Handling**: Handle specific error messages for better UX
5. **Loading States**: Show loading indicator during API calls

## Environment Variables

Ensure these environment variables are set:
- `JWT_SECRET`: For token authentication
- `MONGODB_URI`: Database connection string

## Schema Changes

### Batch Model Updates
- Added `batchId` field to schema
- Renamed virtual `batchId` to `formattedBatchId`
- Enhanced pre-save hook for batch ID generation
- Improved discount percentage calculation

## Validation Rules

1. **Required Fields**: name, courseId, startDate, endDate, schedule, maxStudents, batchPrice
2. **Numeric Validation**: maxStudents > 0, batchPrice >= 0, originalPrice >= 0
3. **Date Validation**: endDate > startDate
4. **Schedule Validation**: Valid days, time format (HH:MM), array structure
5. **Course Validation**: Course must exist in database
6. **Permission Validation**: Admin must have 'manage_batches' permission
