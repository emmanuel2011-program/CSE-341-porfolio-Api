const mongoDb = require('../db/connect.js');

// Checks if a session exists (user is logged in)
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Please log in.',
    });
  }
  next();
};

const checkAuthenticated = async (req, res, next) => {
  try {
    const githubUsername =
      req.session?.user?.username || req.session?.passport?.user?.username;

    if (!githubUsername) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. GitHub username not found in session.',
      });
    }

    const db = mongoDb.getDb();
    const user = await db.collection('User').findOne({ username: githubUsername });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. GitHub username not found in database.',
      });
    }

    if (user.position !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    req.user = user; 
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error checking authentication',
      error: error.message,
    });
  }
};


module.exports = { isAuthenticated, checkAuthenticated };