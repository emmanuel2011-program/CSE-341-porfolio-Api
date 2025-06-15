const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URI || 'http://localhost:3000/auth/github/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    console.log('✅ GitHub profile:', profile);

    // Normally you'd store the user in your DB here
    return done(null, profile);
  }
));

// Serialize the user into the session
passport.serializeUser((user, done) => {
  console.log('✅ Serializing user:', user.username || user.displayName);
  done(null, user);
});

// Deserialize the user from the session
passport.deserializeUser((obj, done) => {
  console.log('✅ Deserializing user:', obj.username || obj.displayName);
  done(null, obj);
});
