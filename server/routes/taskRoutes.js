const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All task routes require authentication + Admin role
router.get('/', protect, adminOnly, getAllTasks);
router.get('/stats', protect, adminOnly, getTaskStats);
router.get('/:id', protect, adminOnly, getTaskById);
router.post('/', protect, adminOnly, createTask);
router.put('/:id', protect, adminOnly, updateTask);
router.delete('/:id', protect, adminOnly, deleteTask);

module.exports = router;
