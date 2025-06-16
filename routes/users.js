const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
  updateUserPreferences,
  getUserStats,
  searchUsers,
  exportUsers,
  bulkUpdateStatus
} = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Public user routes (authenticated users)
router.get('/search', searchUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/:id/preferences', updateUserPreferences);
router.get('/:id/stats', getUserStats);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.post('/', authorize('admin'), createUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/status', authorize('admin'), updateUserStatus);
router.put('/:id/role', authorize('admin'), updateUserRole);
router.get('/export', authorize('admin'), exportUsers);
router.post('/bulk/status', authorize('admin'), bulkUpdateStatus);

module.exports = router;