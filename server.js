const express = require('express');
const { initDb } = require('./db/connect'); // Correctly deconstructed initDb
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github2').Strategy;
require('dotenv').config();

// Assuming 'routes' is defined somewhere, e.g., const routes = require('./routes');
const routes = require('./routes'); // <--- Make sure this line exists if routes is a separate file

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.use(cors());

app.use('/', routes); // This assumes your main routes are handled here

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you would typically save the user to your database
      return done(null, profile);
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});
app.get("/", (req, res) => {
  const user = req.session?.passport?.user;
  if (user) {
    res.send(`Logged in as ${user.displayName || user.username}`);
  } else {
    res.send("Not logged in");
  }
});


app.get("/github/callback",
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home.
    req.session.user = req.user;
    res.redirect('/');
  }
);

// CORRECTED LINE HERE
initDb((err) => { // Directly call initDb, which was deconstructed from require
  if (err) {
    console.log(err);
  } else {
    app.listen(port, () => {
      console.log(`Connected to DB and listening on port ${port}`);
    });
  }
});