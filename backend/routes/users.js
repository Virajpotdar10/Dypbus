const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getDriversWithRoutesAndStudents,
} = require('../controllers/users');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// All routes in this file are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers);

// Get drivers with their routes and students (admin only)
router.get('/drivers/full', getDriversWithRoutesAndStudents);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
