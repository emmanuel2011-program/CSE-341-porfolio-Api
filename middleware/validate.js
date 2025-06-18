const validationError = (res, errors) => {
    return res.status(400).json({
        message: 'Validation failed',
        errors: errors
    });
};

const validateThemeCreation = (req, res, next) => {
    const { themeName, color, layout } = req.body;
    const errors = [];

    if (!themeName || typeof themeName !== 'string' || themeName.trim() === '') {
        errors.push({ field: 'themeName', message: 'Theme name is required and must be a non-empty string.' });
    }
    if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        errors.push({ field: 'color', message: 'Color is required and must be a valid hex code (e.g., #RRGGBB).' });
    }
    if (!layout || typeof layout !== 'string' || layout.trim() === '') {
        errors.push({ field: 'layout', message: 'Layout is required and must be a non-empty string.' });
    }

    if (errors.length > 0) {
        return validationError(res, errors);
    }
    next();
};

const validateUserCreation = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];

    if (!username || typeof username !== 'string' || username.trim() === '') {
        errors.push({ field: 'username', message: 'Username is required and cannot be empty.' });
    } else if (username.length < 3) {
        errors.push({ field: 'username', message: 'Username must be at least 3 characters long.' });
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
        errors.push({ field: 'password', message: 'Password is required and cannot be empty.' });
    } else if (password.length < 6) {
        errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
    }

    if (errors.length > 0) {
        return validationError(res, errors);
    }
    next();
};
console.log('typeof validateUserCreation:', typeof validateUserCreation);


module.exports = {
    validateThemeCreation,
    validateUserCreation
};
