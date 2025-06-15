const express = require('express')
const router = express.Router();

const themeController = require('../controllers/theme');
const {isAuthenticated} = require('../middleware/auth'); // Assuming you have an auth middleware
const { validateThemeCreation } = require('../middleware/validate'); // <<< Import your validation
// Public route (optional: make GET all or GET by name public)
router.get('/', themeController.getAllThemes);
router.get('/:themeName', themeController.getTheme);

// Protected routes
router.post('/', isAuthenticated, themeController.createTheme);
router.put('/:themeName', isAuthenticated, themeController.updateTheme);
router.delete('/:themeName', isAuthenticated, themeController.deleteTheme);
router.post('/',validateThemeCreation, themeController.createTheme );
module.exports = router;
