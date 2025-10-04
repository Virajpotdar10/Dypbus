const express = require('express');
const {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  exportStudentsCSVForRoute,
  exportStudentsPDFForRoute,
  exportAllStudentsCSV,
  exportAllStudentsPDF,
  listStudents,
  createStudent,
} = require('../controllers/students');

const router = express.Router({ mergeParams: true });

const { protect, admin } = require('../middleware/auth');
const { cacheStudents } = require('../middleware/cache');

router.route('/').get(protect, getStudents).post(protect, addStudent);

// Export students for a single route (driver owner or admin)
router.get('/export.csv', protect, exportStudentsCSVForRoute);
router.get('/export.pdf', protect, exportStudentsPDFForRoute);

// The following routes are on /api/v1/students/:id, not nested.
// So we create a separate router for them.
const studentRouter = express.Router();

// Global students root: list and create (admin only)
studentRouter.route('/')
  .get(protect, admin, cacheStudents, listStudents)
  .post(protect, admin, createStudent);

studentRouter.route('/:id').put(protect, updateStudent).delete(protect, deleteStudent);

// Admin global exports: /api/v1/students/export.*
studentRouter.get('/export.csv', protect, admin, exportAllStudentsCSV);
studentRouter.get('/export.pdf', protect, admin, exportAllStudentsPDF);

// We will export both routers and mount them appropriately in server.js
module.exports = { router, studentRouter };
