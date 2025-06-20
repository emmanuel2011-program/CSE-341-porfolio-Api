const express = require('express')
const router = express.Router();

const themeController = require('../controllers/theme.js');
const { isAuthenticated } = require('../middleware/authenticate'); // Assuming you have an auth middleware
const { validateThemeCreation } = require('../validator/valdator.js'); // <<< Import your validation
// Public route (optional: make GET all or GET by name public)
router.get('/', themeController.getAllThemes);
router.get('/:themeName', themeController.getTheme);

// Protected routes
router.post('/', validateThemeCreation, isAuthenticated, themeController.createTheme);

router.put('/:themeName', isAuthenticated, themeController.updateTheme);
router.delete('/:themeName', isAuthenticated, themeController.deleteTheme);

module.exports = router;