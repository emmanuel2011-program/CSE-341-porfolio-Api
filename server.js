require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models'); 
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const authRoutes = require('./routes/auth'); 
const themeRoutes = require('./routes/theme'); // ✅ NEW: Import theme routes
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swaggerDesign.json');
const { isAuthenticated } = require('./middleware/auth'); 
const mongoDb = require('./DB/connect.js'); 
const userController = require('./controllers/user.js'); 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ... your existing CORS and session setup remain unchanged

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log('🔍 Request received. Session ID:', req.sessionID);
  console.log('🔍 Session Content:', req.session);
  console.log('🔍 User (after Passport deserialize):', req.user);
  next();
});

// --- Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Public and auth routes ---
app.get('/', (req, res) => {
  const user = req.user;
  if (user) {
    res.send(`Logged in as ${user.displayName || user.username || user.id}. Your role is: ${user.position || 'N/A'}`);
  } else {
    res.send('Not logged in. Go to /auth/github to authenticate with GitHub.');
  }
});

app.get('/user/login', (req, res) => res.redirect('/auth/github'));

app.get('/user/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
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

// --- GitHub Strategy ---
passport.serializeUser((user, done) => done(null, user.username));
passport.deserializeUser(async (username, done) => {
  try {
    const dbInstance = mongoDb.getDb(); 
    const user = await dbInstance.collection('User').findOne({ username: username });
    if (user) {
      done(null, user); 
    } else {
      console.warn(`User ${username} not found.`);
      done(new Error('User not found'), null);
    }
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URI,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const user = await userController.createOrFindUser(profile);
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// --- Protected route ---
app.get('/profile', isAuthenticated, (req, res) => {
  const user = req.user;
  res.status(200).json({
    message: 'Welcome to your profile!',
    user: {
      id: user.id || user._id,
      username: user.username,
      displayName: user.displayName,
      profileUrl: user.profileUrl,
      photos: user.photos,
      position: user.position || 'N/A'
    },
  });
});

// --- Main route usage ---
app.use('/', require('./routes'));
app.use('/auth', authRoutes);
app.use('/theme', themeRoutes); // ✅ NEW: Mount theme routes here

// --- Database startup ---
db.mongoose.connect(db.url)
  .then(() => {
    console.log('Mongoose connected successfully!');
    mongoDb.initDb((err) => {
      if (err) {
        console.error('MongoDB init error:', err);
        process.exit(1);
      } else {
        console.log('Raw MongoDB connection initialized successfully.');
        app.listen(port, () => {
          console.log(`Server running on port ${port}`);
        });
      }
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
