const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getDriversWithRoutesAndStudents,
  unassignDriverFromRoutes,
} = require('../controllers/users');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.use(authorize('admin'));

router.get('/drivers/full', getDriversWithRoutesAndStudents);


router.post('/:id/unassign', unassignDriverFromRoutes);

// GET /api/v1/users
router.route('/').get(getUsers);
router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;