const mongoose = require('mongoose');
const Module = require('module');

// 1. Load the REAL Task model first
const Task = require('../models/Task');

// 2. Setup Mock for Task model imports in controller to avoid DB connectivity issues
const mockQuery = (resultData) => {
  return {
    populate: function() {
      return this;
    },
    then: function(resolve, reject) {
      return Promise.resolve(resultData).then(resolve, reject);
    }
  };
};

const mockTaskInstance = {
  save: async function() { return this; }
};

const mockTaskModel = function(data) {
  return { ...mockTaskInstance, ...data };
};
mockTaskModel.create = async (data) => {
  // Mock createTask
  return { _id: new mongoose.Types.ObjectId(), ...data };
};
mockTaskModel.findById = (id) => {
  const task = {
    _id: id,
    title: 'Existing Task',
    description: 'Existing Description',
    status: 'Open',
    save: async function() { return this; }
  };
  return mockQuery(task);
};
mockTaskModel.findByIdAndUpdate = (id, update, options) => {
  const result = { _id: id, ...update };
  return mockQuery(result);
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
  if (path.endsWith('../models/Task') || path === '../models/Task') {
    return mockTaskModel;
  }
  return originalRequire.apply(this, arguments);
};

// 3. Load original controllers
const { createTask, updateTask } = require('../controllers/taskController');

// 3. Test Runner
async function runTests() {
  console.log('🧪 Running Task API & Schema Validation Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- Mongoose Schema Tests ---
  console.log('--- Mongoose Schema Validation ---');
  
  // Test 1: Empty Title & Description
  const task1 = new Task({ title: '', description: '' });
  const err1 = task1.validateSync();
  assert(err1 && err1.errors.title && err1.errors.description, 'Mongoose rejects empty strings for required title and description');

  // Test 2: Whitespace-only Title & Description (should be trimmed to empty and fail)
  const task2 = new Task({ title: '   ', description: '   ' });
  const err2 = task2.validateSync();
  assert(err2 && err2.errors.title && err2.errors.description, 'Mongoose trims and rejects whitespace-only title and description');

  // Test 3: Missing fields
  const task3 = new Task({});
  const err3 = task3.validateSync();
  assert(err3 && err3.errors.title && err3.errors.description, 'Mongoose rejects missing title and description');

  // Test 4: Valid fields
  const task4 = new Task({ title: 'Valid Task', description: 'Valid Description' });
  const err4 = task4.validateSync();
  assert(!err4, 'Mongoose accepts valid title and description');


  // --- Express Controller Tests ---
  console.log('\n--- Controller API Validation (mocked req/res) ---');

  const mockResponse = () => {
    const res = { statusCode: 200 };
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.jsonData = data;
      return res;
    };
    return res;
  };

  // Test 5: Controller Create Task with empty fields
  const reqCreateEmpty = {
    body: { title: '', description: '' },
    user: { _id: new mongoose.Types.ObjectId() }
  };
  const resCreateEmpty = mockResponse();
  await createTask(reqCreateEmpty, resCreateEmpty);
  assert(
    resCreateEmpty.statusCode === 400 && resCreateEmpty.jsonData.message.includes('required'),
    'createTask controller returns 400 Bad Request for empty strings'
  );

  // Test 6: Controller Create Task with whitespace fields
  const reqCreateWhitespace = {
    body: { title: '   ', description: '   ' },
    user: { _id: new mongoose.Types.ObjectId() }
  };
  const resCreateWhitespace = mockResponse();
  await createTask(reqCreateWhitespace, resCreateWhitespace);
  assert(
    resCreateWhitespace.statusCode === 400 && resCreateWhitespace.jsonData.message.includes('required'),
    'createTask controller returns 400 Bad Request for whitespace-only strings'
  );

  // Test 7: Controller Create Task with valid inputs
  const reqCreateValid = {
    body: { title: '  Clean Title  ', description: '  Clean Desc  ' },
    user: { _id: new mongoose.Types.ObjectId() }
  };
  const resCreateValid = mockResponse();
  await createTask(reqCreateValid, resCreateValid);
  assert(
    resCreateValid.statusCode === 201 &&
    resCreateValid.jsonData.title === 'Clean Title' &&
    resCreateValid.jsonData.description === 'Clean Desc',
    'createTask controller trims inputs and creates task successfully (201 Created)'
  );

  // Test 8: Controller Update Task with empty fields
  const reqUpdateEmpty = {
    params: { id: new mongoose.Types.ObjectId() },
    body: { title: '', description: '' }
  };
  const resUpdateEmpty = mockResponse();
  await updateTask(reqUpdateEmpty, resUpdateEmpty);
  assert(
    resUpdateEmpty.statusCode === 400 && resUpdateEmpty.jsonData.message.includes('non-empty string'),
    'updateTask controller returns 400 Bad Request for empty string updates'
  );

  // Test 9: Controller Update Task with whitespace fields
  const reqUpdateWhitespace = {
    params: { id: new mongoose.Types.ObjectId() },
    body: { title: '   ', description: '   ' }
  };
  const resUpdateWhitespace = mockResponse();
  await updateTask(reqUpdateWhitespace, resUpdateWhitespace);
  assert(
    resUpdateWhitespace.statusCode === 400 && resUpdateWhitespace.jsonData.message.includes('non-empty string'),
    'updateTask controller returns 400 Bad Request for whitespace-only updates'
  );

  // Test 10: Controller Update Task with valid fields
  const reqUpdateValid = {
    params: { id: new mongoose.Types.ObjectId() },
    body: { title: ' New Title ', description: ' New Desc ' }
  };
  const resUpdateValid = mockResponse();
  await updateTask(reqUpdateValid, resUpdateValid);
  assert(
    resUpdateValid.statusCode === 200 &&
    resUpdateValid.jsonData.title === 'New Title' &&
    resUpdateValid.jsonData.description === 'New Desc',
    'updateTask controller trims valid updates and returns 200 OK'
  );

  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
