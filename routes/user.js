const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.js');
const { isAuthenticated } = require('../middleware/authenticate.js'); // Assuming you have an auth middleware
const { validateUserCreation } = require('../validator/valdator.js');

// Public Routes
router.get('/', userController.getAll);
router.get('/:username', userController.getUser);

// User creation (public or protected – pick one)
router.post('/', isAuthenticated, validateUserCreation, userController.create);

// Protected update/delete routes
router.put('/:username', isAuthenticated, userController.updateUser);
router.delete('/:username', isAuthenticated, userController.deleteUser);

module.exports = router;
