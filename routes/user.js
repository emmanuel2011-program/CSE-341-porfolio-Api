const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');
const { isAuthenticated } = require('../middleware/auth');
const { validateUserCreation } = require('../middleware/validate.js');

// Public Routes
router.get('/', userController.getAll);
router.get('/:username', userController.getUser);

// User creation (public or protected – pick one)
router.post('/', isAuthenticated, validateUserCreation, userController.create);

// Protected update/delete routes
router.put('/:username', isAuthenticated, userController.updateUser);
router.delete('/:username', isAuthenticated, userController.deleteUser);

module.exports = router;
