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
  resetFeesForRoute,
} = require('../controllers/students');

const router = express.Router({ mergeParams: true });

const { protect, admin } = require('../middleware/auth');
const { cacheStudents } = require('../middleware/cache');

router.route('/').get(protect, getStudents).post(protect, addStudent);
router.get('/export.csv', protect, exportStudentsCSVForRoute);
router.get('/export.pdf', protect, exportStudentsPDFForRoute);
router.post('/reset-fees', protect, resetFeesForRoute);

const studentRouter = express.Router();

//  (admin only)
studentRouter.route('/')
  .get(protect, admin, cacheStudents, listStudents)
  .post(protect, admin, createStudent);

studentRouter.route('/:id').put(protect, updateStudent).delete(protect, deleteStudent);

// Admin global exports: /api/v1/students/export.*
studentRouter.get('/export.csv', protect, admin, exportAllStudentsCSV);
studentRouter.get('/export.pdf', protect, admin, exportAllStudentsPDF);

// We will export both routers and mount them appropriately in server.js
module.exports = { router, studentRouter };
