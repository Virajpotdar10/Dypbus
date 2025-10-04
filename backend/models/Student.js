const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  mobileNumber: {
    type: String,
    unique: true,
    sparse: true, // This is important for allowing multiple empty entries
    match: [/^(|\d{10})$/, 'Please add a valid 10-digit mobile number or leave it empty']
  },
  parentMobileNumber: {
    type: String,
    match: [/^(|\d{10})$/, 'Please add a valid 10-digit parent mobile number or leave it empty']
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    trim: true,
    maxlength: [50, 'Department cannot be more than 50 characters']
  },
  stop: {
    type: String,
    required: [true, 'Please add a bus stop'],
    trim: true,
    maxlength: [100, 'Stop cannot be more than 100 characters']
  },
  feeStatus: {
    type: String,
    enum: ['Paid', 'Not Paid'],
    default: 'Not Paid'
  },
  college: {
    type: String,
    enum: ['DYPCET', 'DYPSEM', 'Diploma'],
    default: 'DYPCET'
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: '1st Year'
  }
}, { timestamps: true });

// Comprehensive indexes for optimal performance with 5000+ records
StudentSchema.index({ name: 1 }); // Single field index for name searches
StudentSchema.index({ name: 'text', department: 'text' }); // Text search index for full-text search
StudentSchema.index({ mobileNumber: 1 }); // Index for mobile number searches
StudentSchema.index({ department: 1 }); // Index for department filtering
StudentSchema.index({ feeStatus: 1 }); // Index for fee status filtering
StudentSchema.index({ route: 1 }); // Index for route-based queries
StudentSchema.index({ college: 1 }); // Index for college filtering
StudentSchema.index({ createdAt: -1 }); // Index for sorting by creation date

// Compound indexes for complex queries
StudentSchema.index({ route: 1, feeStatus: 1 }); // Route + fee status queries
StudentSchema.index({ route: 1, department: 1 }); // Route + department queries
StudentSchema.index({ route: 1, college: 1 }); // Route + college queries
StudentSchema.index({ department: 1, feeStatus: 1 }); // Department + fee status queries

// Virtual for student count per route (for aggregation optimization)
StudentSchema.virtual('routeStudentCount', {
  ref: 'Student',
  localField: 'route',
  foreignField: 'route',
  count: true
});

// Static method for optimized student search with pagination
StudentSchema.statics.searchStudents = function(query, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = -1,
    select = 'name mobileNumber department stop feeStatus college route'
  } = options;

  const skip = (page - 1) * limit;
  
  return this.find(query)
    .select(select)
    .populate('route', 'routeName busNumber')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean() for better performance
};

module.exports = mongoose.model('Student', StudentSchema);
