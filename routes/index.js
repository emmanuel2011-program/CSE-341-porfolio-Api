const express = require('express')
const router = express.Router();
const passport = require('passport');


router.use('/user', require('./user'));
router.use('/theme', require('./theme'));

router.get('/login', passport.authenticate('github'),(req,res)=> {});
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err); 
    }
    res.redirect('/');
  });
});

module.exports = router;