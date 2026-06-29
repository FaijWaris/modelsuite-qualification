const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema(
 {
  title: {
  type: String,
  required: [true, 'Title is required'],
  trim: true,
},
description: {
  type: String,
  required: [true, 'Description is required'],
  trim: true,
},
    status: {
      type: String,
      enum: ['Open', 'Claimed', 'Submitted', 'Approved', 'Rejected'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
