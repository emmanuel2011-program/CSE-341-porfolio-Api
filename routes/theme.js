const express = require('express');
const router = express.Router();

const themeController = require('../controllers/theme');

router.get('/', themeController.getAll);
router.get('/:themeName', themeController.getTheme);
router.post('/', themeController.createTheme);
router.put('/:themeName', themeController.updateTheme);
router.delete('/:themeName', themeController.deleteTheme);

module.exports = router;