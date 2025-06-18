const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport'); // FIX: This should import passport, not your config file
const GitHubStrategy = require('passport-github2').Strategy; // FIX: Proper GitHub strategy package
const db = require('./models'); // FIX: Add your database connection
const routes = require('./routes/index.js');

const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(bodyParser.json());
app.use('/', routes);
app.use(cors({
  origin: '*',
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Z-key'
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// CORS Headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Z-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Passport GitHub OAuth
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URI // FIX: was misspelled as `callbackurl`
},
function (accessToken, refreshToken, profile, done) {
  // You can also call your userController.createOrFindUser(profile) here
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Routes


app.get('/', (req, res) => {
  res.send(req.session.user !== undefined ? `Logged in as ${req.session.user.displayName}` : 'Logged out');
});

app.get('/github/callback', passport.authenticate('github', {
  failureRedirect: '/api-docs',
  session: false
}), (req, res) => {
  req.session.user = req.user;
  res.redirect('/');
});

// Start Server after DB connects
db.mongoose.connect(db.url)
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ Cannot connect to the database!', err);
    process.exit(1);
  });
