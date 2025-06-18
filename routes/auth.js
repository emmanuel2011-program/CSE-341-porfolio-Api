const express = require('express');
const router = express.Router();
const passport = require('passport');

// Start GitHub OAuth flow
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// Callback after GitHub login
router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/login-failure',
    successRedirect: '/profile',
    session: true
  })
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/');
    });
  });
});

module.exports = router;
