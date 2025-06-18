function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'You dont have access' });
}

module.exports = {
  isAuthenticated
};
