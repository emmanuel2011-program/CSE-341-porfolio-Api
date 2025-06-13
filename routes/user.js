const express = require('express');
const router = express.Router();
const passport = require('passport'); // import passport

const userController = require('../controllers/user');

// Public Routes
router.post('/', userController.create); // allow new user creation
router.get('/:username', userController.getUser); // optional: make this private if needed

// Protected Routes (require authentication)
router.get('/', passport.authenticate('session'), userController.getAll);
router.put('/:username', passport.authenticate('session'), userController.updateUser);
router.delete('/:username', passport.authenticate('session'), userController.deleteUser);

module.exports = router;
