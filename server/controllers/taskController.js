const Task = require('../models/Task');
const User = require('../models/User');

// @desc  Get all tasks
// @route GET /api/tasks
// @access Admin
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single task
// @route GET /api/tasks/:id
// @access Admin
const getTaskById = async (req, res) => {
  try {
    // — will throw a CastError from Mongoose instead of a clean 400
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a task
// @route POST /api/tasks
// @access Admin
const createTask = async (req, res) => {
  const { title, description, status, assignedTo, dueDate } = req.body;

  try {
    // Validate title and description
    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      !title.trim() ||
      !description.trim()
    ) {
      return res.status(400).json({
        message: 'Title and description are required and must be non-empty strings',
      });
    }

    // Validate assigned user
    if (assignedTo) {
      const user = await User.findById(assignedTo);

      if (!user) {
        return res.status(404).json({
          message: 'Assigned user not found',
        });
      }

      if (user.role === 'Admin') {
        return res.status(400).json({
          message: 'Tasks can only be assigned to Talent users',
        });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      status,
      assignedTo: assignedTo || null,
      dueDate,
      createdBy: req.user._id,
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
// @desc  Update a task
// @route PUT /api/tasks/:id
// @access Admin
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    const { title, description, assignedTo } = req.body;

    // Validate title
    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          message: 'Title must be a non-empty string',
        });
      }
    }

    // Validate description
    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
          message: 'Description must be a non-empty string',
        });
      }
    }

    // Validate assigned user
    if (assignedTo) {
      const user = await User.findById(assignedTo);

      if (!user) {
        return res.status(404).json({
          message: 'Assigned user not found',
        });
      }

      if (user.role === 'Admin') {
        return res.status(400).json({
          message: 'Tasks can only be assigned to Talent users',
        });
      }
    }

    const updateData = { ...req.body };

    if (updateData.title !== undefined) {
      updateData.title = updateData.title.trim();
    }

    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('assignedTo', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc  Delete a task
// @route DELETE /api/tasks/:id
// @access Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // — orphaned Submission documents remain in DB after task deletion
    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
