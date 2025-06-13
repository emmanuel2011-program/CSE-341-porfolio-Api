const express = require('express');
const router = express.Router();
const passport = require('passport');

const themeController = require('../controllers/theme');

// Authentication middleware
const isAuthenticated = passport.authenticate('session', { session: true });

// Public route (optional: make GET all or GET by name public)
router.get('/', themeController.getAllThemes);
router.get('/:themeName', themeController.getTheme);

// Protected routes
router.post('/', isAuthenticated, themeController.createTheme);
router.put('/:themeName', isAuthenticated, themeController.updateTheme);
router.delete('/:themeName', isAuthenticated, themeController.deleteTheme);

module.exports = router;
