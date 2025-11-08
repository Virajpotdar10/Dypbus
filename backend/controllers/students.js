const Student = require('../models/Student');
const Route = require('../models/Route');
const PDFDocument = require('pdfkit');
const { Transform } = require('stream');
const { invalidateCache } = require('../middleware/cache');
const mongoose = require('mongoose'); // Import mongoose

const emitStudentEvent = (req, eventType, data) => {
  const io = req.app.get('io');
  if (io && data.routeId) {
    io.to(data.routeId).emit(`student:${eventType}`, data);
  }
};

exports.getStudents = async (req, res, next) => {
  console.log('--- DEBUG: getStudents ---');
  try {
    console.log('Request Params:', req.params);
    console.log('Request Query:', req.query);

    // Validate routeId to avoid CastError
    const { routeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ success: false, msg: 'Invalid route id' });
    }
    const { search, feeStatus, department, college, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Verify route exists and user has access
    const route = await Route.findById(routeId).lean();
    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    // Check authorization
    const isAdmin = ((req.user?.role) ? String(req.user.role) : '').toLowerCase() === 'admin';
    const currentUserId = req.user?._id ? String(req.user._id) : null;
    if (!isAdmin) {
      if (!currentUserId) {
        return res.status(401).json({ success: false, msg: 'Not authorized: user context missing' });
      }
      if (String(route.driver) !== currentUserId) {
        return res.status(401).json({ success: false, msg: 'Not authorized to access this route' });
      }
    }

    // Build optimized query
    let query = { route: routeId };

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (feeStatus) query.feeStatus = feeStatus;
    if (department) query.department = department;
    if (college) query.college = college;

    console.log('Constructed MongoDB Query:', JSON.stringify(query, null, 2));

    // Determine sort order
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortField = ['name', 'department', 'feeStatus', 'createdAt', 'stop', 'year'].includes(sortBy) ? sortBy : 'createdAt';

    // Execute optimized queries in parallel
    const [students, total, routeInfo, stats] = await Promise.all([
      Student.find(query)
               .select('name mobileNumber parentMobileNumber department stop feeStatus college year createdAt route')
        .populate('route', 'routeName busNumber')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean()
        .then(students => students.map(student => {
          // Manually construct the student object to ensure no invalid fields are passed
          return {
            _id: student._id,
            name: student.name,
            mobileNumber: student.mobileNumber,
            parentMobileNumber: student.parentMobileNumber,
            department: student.department,
            stop: student.stop,
            feeStatus: student.feeStatus,
            college: student.college,
            year: student.year,
            createdAt: student.createdAt,
            route: student.route
          };
        })),
      Student.countDocuments(query),
      Route.findById(routeId).select('routeName busNumber').lean(),
      Student.aggregate([
        { $match: { route: new mongoose.Types.ObjectId(routeId) } },
        {
          $group: {
            _id: null,
            paid: { $sum: { $cond: [{ $eq: ['$feeStatus', 'Paid'] }, 1, 0] } },
            notPaid: { $sum: { $cond: [{ $eq: ['$feeStatus', 'Not Paid'] }, 1, 0] } }
      }
    }
  ])
]);

    console.log(`Found ${total} students in the database.`);
    console.log('First student record (if any):', students.length > 0 ? students[0] : 'No students found.');

    // Manually calculate stats to avoid aggregation errors
    const allStudentsOnRoute = await Student.find({ route: routeId }).select('feeStatus').lean();
    const feeStats = {
      paid: allStudentsOnRoute.filter(s => s.feeStatus === 'Paid').length,
      notPaid: allStudentsOnRoute.filter(s => s.feeStatus === 'Not Paid').length,
    };

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: students,
      stats: feeStats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      route: routeInfo
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, msg: 'Server error while fetching students' });
  }
};

exports.addStudent = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    // Destructure all fields from the body, including 'year'
    const { name, mobileNumber, parentMobileNumber, department, stop, college, feeStatus, year } = req.body;

    console.log('Student addition attempt:', { routeId, name, mobileNumber, department, stop, year });

    // Validate routeId at the top to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ success: false, msg: 'Invalid route id' });
    }

    if (!name || !department || !stop) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide all required fields: name, department, stop'
      });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      console.log('Route not found:', routeId);
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }
    console.log('Route found:', { routeId, routeName: route.routeName, driverId: route.driver });
    console.log('Current user:', { userId: req.user?._id, role: req.user?.role });

    if (req.user) {
      const isAdmin = String(req.user.role || '').toLowerCase() === 'admin';
      if (String(route.driver) !== String(req.user._id) && !isAdmin) {
        console.log('Authorization failed for logged-in user:', { routeDriver: String(route.driver), currentUser: String(req.user._id), role: req.user.role });
        return res.status(401).json({ success: false, msg: 'Not authorized to add students to this route' });
      }
    }
    if (mobileNumber && mobileNumber.trim() !== '') {
      const existingStudent = await Student.findOne({ mobileNumber });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          msg: 'Student with this mobile number already exists'
        });
      }
    }

    // Include 'year' in the object passed to Student.create
    const newStudent = await Student.create({
      name,
      mobileNumber,
      parentMobileNumber,
      department,
      stop,
      college: college || 'DYPCET',
      feeStatus: feeStatus || 'Not Paid',
      route: routeId,
      year // Ensure year is included here
    });

    console.log('Student created successfully:', { id: newStudent._id, name: newStudent.name, route: routeId, year: newStudent.year });

    // Populate route info for response
    await newStudent.populate('route', 'routeName busNumber');

    invalidateCache.students(routeId);

    emitStudentEvent(req, 'added', { student: newStudent, routeId });

    res.status(201).json({ success: true, data: newStudent });
  } catch (err) {
    console.error('Error adding student - Full error:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: 'Student with this mobile number already exists'
      });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({ success: false, msg: errors.join(', ') });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, msg: 'Invalid route id format' });
    }

    console.error('Error adding student:', err);
    res.status(500).json({ success: false, msg: 'Server error while adding student' });
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    let student = await Student.findById(req.params.id).populate('route');

    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Check authorization
    const isAdminUpdate = ((req.user?.role) ? String(req.user.role) : '').toLowerCase() === 'admin';
    if (student.route.driver.toString() !== req.user?._id?.toString() && !isAdminUpdate) {
      return res.status(401).json({ success: false, msg: 'Not authorized to update this student' });
    }

    // Check for duplicate mobile number (excluding current student)
    if (req.body.mobileNumber && req.body.mobileNumber !== student.mobileNumber) {
      const existingStudent = await Student.findOne({
        mobileNumber: req.body.mobileNumber,
        _id: { $ne: req.params.id }
      }).lean();

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          msg: 'Another student with this mobile number already exists'
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('route', 'routeName busNumber');

    invalidateCache.students(updatedStudent.route._id);
emitStudentEvent(req, 'updated', { student: updatedStudent, routeId: updatedStudent.route._id.toString() });

    res.status(200).json({ success: true, data: updatedStudent });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: 'Another student with this mobile number already exists'
      });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, msg: errors.join(', ') });
    }
    console.error('Error updating student:', err);
    res.status(500).json({ success: false, msg: 'Server error while updating student' });
  }
};
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('route').lean();

    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Check authorization
    const isAdminDelete = ((req.user?.role) ? String(req.user.role) : '').toLowerCase() === 'admin';
  // If the student is assigned to a route, perform authorization and cache invalidation
if (student.route) {
  if (student.route.driver.toString() !== req.user?._id?.toString() && !isAdminDelete) {
    return res.status(401).json({ success: false, msg: 'Not authorized to delete this student' });
  }
  // Invalidate cache for the specific route
  invalidateCache.students(student.route._id);
} else {
  
}

await Student.findByIdAndDelete(req.params.id);
if (student.route) {
    emitStudentEvent(req, 'deleted', { studentId: req.params.id, routeId: student.route._id.toString() });
}

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ success: false, msg: 'Server error while deleting student' });
  }
};

exports.listStudents = async (req, res) => {
  try {
    const {
      college,
      search,
      feeStatus,
      route,
      department,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (feeStatus) query.feeStatus = feeStatus;
    if (route) query.route = route;
    if (department) query.department = department;
    if (college) query.college = college;

    // Sort configuration
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortField = ['name', 'department', 'feeStatus', 'createdAt'].includes(sortBy) ? sortBy : 'createdAt';

    // Execute queries in parallel for better performance
    const [students, total, stats] = await Promise.all([
      Student.find(query)
        .select('name mobileNumber department stop feeStatus college route createdAt')
        .populate('route', 'routeName busNumber')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean()
        .then(students => students.map(student => {
          // Manually construct the student object to ensure no invalid fields are passed
          return {
            _id: student._id,
            name: student.name,
            mobileNumber: student.mobileNumber,
            department: student.department,
            stop: student.stop,
            feeStatus: student.feeStatus,
            college: student.college,
            route: student.route,
            createdAt: student.createdAt
          };
        })),
      Student.countDocuments(query),
      Student.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            paid: { $sum: { $cond: [{ $eq: ['$feeStatus', 'Paid'] }, 1, 0] } },
            notPaid: { $sum: { $cond: [{ $eq: ['$feeStatus', 'Not Paid'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const totalPages = Math.ceil(total / limit);
    const statsData = stats[0] || { paid: 0, notPaid: 0 };

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: statsData
    });
  } catch (err) {
    console.error('Error listing students:', err);
    res.status(500).json({ success: false, msg: 'Server error while listing students' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    // Check for duplicate mobile number
    const existingStudent = await Student.findOne({
      mobileNumber: req.body.mobileNumber
    }).lean();

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        msg: 'Student with this mobile number already exists'
      });
    }

    const newStudent = await Student.create(req.body);
    await newStudent.populate('route', 'routeName busNumber');

    invalidateCache.students(newStudent.route);

    // Emit real-time event
    emitStudentEvent(req, 'created', { student: newStudent, createdBy: req.user?.name || 'Unknown' });

    res.status(201).json({ success: true, data: newStudent });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: 'Student with this mobile number already exists'
      });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, msg: errors.join(', ') });
    }
    console.error('Error creating student:', err);
    res.status(500).json({ success: false, msg: 'Server error while creating student' });
  }
};

exports.resetAllFees = async (req, res) => {
  try {
    const updateResult = await Student.updateMany(
      {},
      { $set: { feeStatus: 'Not Paid' } }
    );

    console.log(`Fees reset for ${updateResult.nModified} students.`);

    // Invalidate the entire student cache since this is a global operation
    invalidateCache.students();

    res.status(200).json({
      success: true,
      message: `Successfully reset fee status for ${updateResult.nModified} students.`,
      data: { modifiedCount: updateResult.nModified },
    });
  } catch (err) {
    console.error('Error resetting all student fees:', err);
    res.status(500).json({ success: false, msg: 'Server error while resetting all fees.' });
  }
};

exports.exportStudentsCSVForRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.routeId).lean();
    if (!route) return res.status(404).json({ success: false, msg: 'Route not found' });

    // Stream processing for large datasets
    const cursor = Student.find({ route: req.params.routeId })
      .populate('route', 'routeName')
      .lean()
      .cursor();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="route-${req.params.routeId}-students.csv"`);

    // Write CSV header
    res.write('Name,Mobile,Department,Stop,Fee Status,College,Route\n');

    // Stream data
    for (let student = await cursor.next(); student != null; student = await cursor.next()) {
      const row = `"${student.name}","${student.mobileNumber || ''}","${student.department || ''}","${student.stop || ''}","${student.feeStatus}","${student.college}","${student.route?.routeName || ''}"\n`;
      res.write(row);
    }

    res.end();
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return res.status(500).json({ success: false, msg: 'Error exporting CSV' });
  }
};

exports.exportAllStudentsCSV = async (req, res) => {
  try {
    const cursor = Student.find().populate('route', 'routeName').lean().cursor();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="all-students.csv"');

    res.write('Name,Mobile,Department,Stop,Fee Status,College,Route\n');

    for (let student = await cursor.next(); student != null; student = await cursor.next()) {
      const row = `"${student.name}","${student.mobileNumber || ''}","${student.department || ''}","${student.stop || ''}","${student.feeStatus}","${student.college}","${student.route?.routeName || ''}"\n`;
      res.write(row);
    }

    res.end();
  } catch (err) {
    console.error('Error exporting all students CSV:', err);
    return res.status(500).json({ success: false, msg: 'Error exporting CSV' });
  }
};

exports.exportStudentsPDFForRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.routeId).lean();
    if (!route) return res.status(404).json({ success: false, msg: 'Route not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="route-${req.params.routeId}-students.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(`Students for Route: ${route.routeName}`, { underline: true });
    doc.moveDown();

    // Stream processing for PDF
    const cursor = Student.find({ route: req.params.routeId })
      .populate('route', 'routeName')
      .lean()
      .cursor();

    let index = 1;
    for (let student = await cursor.next(); student != null; student = await cursor.next()) {
      doc.fontSize(10).text(`${index}. ${student.name} | ${student.mobileNumber || ''} | ${student.department || ''} | ${student.stop || ''} | ${student.feeStatus}`);
      index++;

      // Add new page every 50 students
      if (index % 50 === 0) {
        doc.addPage();
      }
    }

    doc.end();
  } catch (err) {
    console.error('Error exporting PDF:', err);
    return res.status(500).json({ success: false, msg: 'Error exporting PDF' });
  }
};

exports.exportAllStudentsPDF = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="all-students.pdf"');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text('All Students', { underline: true });
    doc.moveDown();

    const cursor = Student.find().populate('route', 'routeName').lean().cursor();

    let index = 1;
    for (let student = await cursor.next(); student != null; student = await cursor.next()) {
      doc.fontSize(10).text(`${index}. ${student.name} | ${student.mobileNumber || ''} | ${student.department || ''} | ${student.route?.routeName || ''} | ${student.feeStatus}`);
      index++;

      if (index % 50 === 0) {
        doc.addPage();
      }
    }

    doc.end();
  } catch (err) {
    console.error('Error exporting all students PDF:', err);
    return res.status(500).json({ success: false, msg: 'Error exporting PDF' });
  }
};

exports.resetFeesForRoute = async (req, res) => {
  try {
    const { routeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ success: false, msg: 'Invalid route id' });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    // Authorization: only admin or the driver of the route can reset fees
    const isAdmin = ((req.user?.role) ? String(req.user.role) : '').toLowerCase() === 'admin';
    if (route.driver.toString() !== req.user?._id?.toString() && !isAdmin) {
      return res.status(401).json({ success: false, msg: 'Not authorized to reset fees for this route' });
    }

    const updateResult = await Student.updateMany(
      { route: routeId },
      { $set: { feeStatus: 'Not Paid' } }
    );

    console.log(`Fees reset for ${updateResult.nModified} students on route ${routeId}.`);

    invalidateCache.students(routeId);

    // Emit a real-time event to notify clients
    const io = req.app.get('io');
    if (io) {
      io.to(routeId).emit('feesReset', { routeId, modifiedCount: updateResult.nModified });
    }

    res.status(200).json({
      success: true,
      message: `Successfully reset fee status for ${updateResult.nModified} students on this route.`,
      data: { modifiedCount: updateResult.nModified },
    });
  } catch (err) {
    console.error(`Error resetting fees for route ${req.params.routeId}:`, err);
    res.status(500).json({ success: false, msg: 'Server error while resetting fees.' });
  }
};
exports.createPublicStudent = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    const { name, mobileNumber, parentMobileNumber, department, stop, college, year } = req.body;

    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ success: false, msg: 'Invalid route id' });
    }

    if (!name || !department || !stop) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide all required fields: name, department, and stop'
      });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    if (mobileNumber && mobileNumber.trim() !== '') {
      const existingStudent = await Student.findOne({ mobileNumber });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          msg: 'A student with this mobile number already exists.'
        });
      }
    }

    const studentData = {
      name,
      mobileNumber,
      parentMobileNumber,
      department,
      stop,
      college: college || 'DYPCET',
      feeStatus: 'Not Paid',
      route: routeId
    };

    if (year) {
      studentData.year = year;
    }

    const newStudent = await Student.create(studentData);

    invalidateCache.students(routeId);

emitStudentEvent(req, 'added', { student: newStudent, routeId });

    res.status(201).json({ success: true, data: newStudent });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: 'A student with this mobile number already exists.'
      });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, msg: errors.join(', ') });
    }
    console.error('Error in public student creation:', err);
    res.status(500).json({ success: false, msg: 'Server error during registration.' });
  }
};