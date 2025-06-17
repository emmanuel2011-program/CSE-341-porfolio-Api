// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const authRoutes = require('./routes/auth'); 
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swaggerDesign.json');

// --- IMPORTANT: Import the isAuthenticated middleware ---
const { isAuthenticated } = require('./middleware/auth'); 

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
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Middleware for logging session and user 
app.use((req, res, next) => {
  console.log('🔍 Session:', req.session);
  console.log('🔍 User:', req.user); 
  next();
});

// --- Swagger UI setup --
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Public routes ---
app.get('/', (req, res) => {
  const user = req.session?.passport?.user; 
  if (user) {
    res.send(`Logged in as ${user.displayName || user.username || user.id}`);
  } else {
    res.send('Not logged in. Go to /user/login to authenticate with GitHub.');
  }
});

app.get('/user/login', (req, res) => {
  res.redirect('/auth/github'); 
});

app.get('/user/logout', (req, res, next) => {
 
  req.logout(function(err) {
    if (err) { return next(err); } 
    req.session.destroy(() => { 
      res.clearCookie('connect.sid'); 
      res.redirect('/'); 
    });
  });
});

app.get('/check-session', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user, 
    session: req.session
  });
});


passport.serializeUser((user, done) => {
  
  done(null, user); 
});
passport.deserializeUser((obj, done) => {
  
  done(null, obj); 
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
     
      return done(null, profile);
    }
  )
);

// --- Protected profile route 
app.get('/profile', isAuthenticated, (req, res) => {
  const user = req.user; 
  res.status(200).json({
    message: 'Welcome to your profile!',
    user: {
      id: user.id, 
      username: user.username, 
      displayName: user.displayName, 
      profileUrl: user.profileUrl, 
      photos: user.photos, 
    },
  });
});


app.use('/', require('./routes'));


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