const passport = require('passport');
const gitHubStrategy = require('passport-github2').Strategy;
const db = require('../models');
const User = db.user;

passport.use(
  new gitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/auth/github/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ username: profile.id });
        if (existingUser) return done(null, existingUser);

        // Create new user
        const newUser = new User({
          username: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value
        });
        await newUser.save();
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => done(null, user));
});

module.exports = passport;