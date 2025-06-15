const express = require('express');
const router = express.Router();
const passport = require('passport');

// Start GitHub OAuth flow
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// Callback after GitHub login
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login-failure' }),
  (req, res) => {
    req.session.save(() => {
    // Successful authentication
    res.redirect('/'); // Redirect to profile or dashboard
  });
}
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;
