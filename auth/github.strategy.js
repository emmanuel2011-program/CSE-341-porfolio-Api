const GitHubStrategy = require('passport-github2').Strategy;

module.exports = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URI || 'http://localhost:3000/auth/github/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    // Typically, you’d find or create a user here
    return done(null, profile);
  }
);
