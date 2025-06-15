// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Keep this if it contains specific GitHub OAuth callback routes
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swaggerDesign.json');

// --- IMPORTANT: Import the isAuthenticated middleware ---
const { isAuthenticated } = require('./middleware/auth'); // Assuming middleware/auth.js exists

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_fallback_secret_here', // IMPORTANT: Use a strong secret from .env!
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true for https in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Middleware for logging session and user (KEEP THIS, it's helpful)
app.use((req, res, next) => {
  console.log('🔍 Session:', req.session);
  console.log('🔍 User:', req.user); // req.user is populated by passport.deserializeUser
  next();
});

// --- Swagger UI setup - MUST be before any general authentication middleware ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Public routes ---
app.get('/', (req, res) => {
  const user = req.session?.passport?.user; // Passport stores user info under req.session.passport.user
  if (user) {
    res.send(`Logged in as ${user.displayName || user.username || user.id}`);
  } else {
    res.send('Not logged in. Go to /user/login to authenticate with GitHub.');
  }
});

app.get('/user/login', (req, res) => {
  res.redirect('/auth/github'); // This redirects to your GitHub OAuth initiation
});

app.get('/user/logout', (req, res, next) => {
  // Passport's req.logout requires a callback in newer versions
  req.logout(function(err) {
    if (err) { return next(err); } // Handle error if logout fails
    req.session.destroy(() => { // Destroy the session on the server
      res.clearCookie('connect.sid'); // Clear the session cookie from the client
      res.redirect('/'); // Redirect to homepage or login page
    });
  });
});

app.get('/check-session', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user, // `req.user` contains the deserialized user object if authenticated
    session: req.session
  });
});

// --- Passport Serialization/Deserialization ---
// These functions define how user data is stored in the session
passport.serializeUser((user, done) => {
  // `user` here is the `profile` object returned by GitHubStrategy
  done(null, user); // Store the entire profile object in the session
});
passport.deserializeUser((obj, done) => {
  // `obj` here is the object stored by serializeUser
  done(null, obj); // Retrieve the user object from the session
});

// --- GitHub OAuth Strategy ---
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URI,
    },
    function (accessToken, refreshToken, profile, done) {
      // In a real app, you'd typically find or create a user in your database here
      // based on profile.id or profile.username, then pass your internal user object to done.
      // For this setup, we're just passing the GitHub profile directly.
      return done(null, profile);
    }
  )
);

// --- Protected profile route (uses the imported isAuthenticated middleware) ---
app.get('/profile', isAuthenticated, (req, res) => {
  const user = req.user; // `req.user` is available because passport.deserializeUser populates it
  res.status(200).json({
    message: 'Welcome to your profile!',
    user: {
      id: user.id, // GitHub profile ID
      username: user.username, // GitHub username
      displayName: user.displayName, // GitHub display name
      profileUrl: user.profileUrl, // Link to GitHub profile
      photos: user.photos, // Array of photo objects
    },
  });
});

// --- IMPORTANT: Mount your main router here ---
// This line connects all the routes defined in routes/index.js
// (which includes your /user and /theme routes) to your Express app.
app.use('/', require('./routes'));

// --- Authentication-specific routes (e.g., GitHub callback) ---
// This is typically where your '/auth/github/callback' route would be defined
// within routes/auth.js.
app.use('/auth', authRoutes);


// --- Database connection and server start ---
db.mongoose.connect(db.url)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Cannot connect to the database!', err);
    process.exit(1);
  });