const express = require('express')
const router = express.Router();

const themeController = require('../controllers/theme');
const {isAuthenticated} = require('../middleware/auth'); // Assuming you have an auth middleware

// Public route (optional: make GET all or GET by name public)
router.get('/', themeController.getAllThemes);
router.get('/:themeName', themeController.getTheme);

// Protected routes
router.post('/', isAuthenticated, themeController.createTheme);
router.put('/:themeName', isAuthenticated, themeController.updateTheme);
router.delete('/:themeName', isAuthenticated, themeController.deleteTheme);

module.exports = router;
