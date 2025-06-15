const express = require('express')
const router = express.Router();

const userController = require('../controllers/user');
const {isAuthenticated} = require('../middleware/auth');

// Public Routes
router.get('/', userController.getAll); // allow new user creation
router.get('/:username', userController.getUser); // optional: make this private if needed

// Protected Routes (require authentication)
router.post('/', isAuthenticated, userController.create); // create users, protected
router.put('/:username', isAuthenticated, userController.updateUser);
router.delete('/:username', isAuthenticated, userController.deleteUser);

module.exports = router;








