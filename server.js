require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models'); // Assuming this correctly loads your Mongoose connection/models
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Your authentication routes
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swaggerDesign.json');
// --- IMPORTANT: Import your MongoDB connection module (if still needed for raw driver access) ---
const mongoDb = require('./DB/connect.js'); 
const User = db.user; // Ensure this correctly gets your Mongoose User model
// --- IMPORTANT: Import the isAuthenticated middleware ---
const { isAuthenticated } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const allowedOrigins = [
  'http://localhost:3000', // For local development
  'https://porfolio-kkg6.onrender.com' // Your Render deployed API URL (ensure this is correct)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests from browsers)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Crucial for allowing session cookies to be sent cross-origin
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// --- END: Refined CORS Configuration ---


app.use(
  session({
    secret: process.env.SESSION_SECRET || 'a_very_strong_fallback_secret_for_dev_only', // IMPORTANT: Use a strong, unique, long secret from .env!
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't save empty sessions
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to true in production (Render handles HTTPS)
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
    // IMPORTANT: In production, you should use connect-mongo or similar for session store
    // store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
  })
);
app.use(passport.initialize());
app.use(passport.session()); // This middleware depends on `passport.serializeUser` and `passport.deserializeUser`

// Middleware for logging session and user (KEEP THIS FOR DEBUGGING)
app.use((req, res, next) => {
  console.log('🔍 Request received. Session ID:', req.sessionID);
  console.log('🔍 Session Content:', req.session);
  console.log('🔍 User (after Passport deserialize):', req.user); // THIS SHOULD NOW SHOW YOUR DB USER OBJECT
  next();
});

// --- Swagger UI setup --
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Public routes ---
app.get('/', (req, res) => {
  const user = req.user; // Use req.user which is populated by deserializeUser
  if (user) {
    res.send(`Logged in as ${user.displayName || user.username || user.id}. Your role is: ${user.position || 'N/A'}`);
  } else {
    res.send('Not logged in. Go to /auth/github to authenticate with GitHub.');
  }
});

app.get('/user/login', (req, res) => {
  // This route should trigger the GitHub OAuth flow
  res.redirect('/auth/github');
});

app.get('/user/logout', (req, res, next) => {
  req.logout(function(err) { // Passport's logout method
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

// --- PASSPORT SERIALIZEUSER ---
passport.serializeUser((user, done) => {
  console.log('--- Inside serializeUser ---');
  console.log('User object received by serializeUser:', user);
  if (user && user.id) { // Mongoose documents have an 'id' property which is the _id as a string
    console.log('Serializing user ID:', user.id);
    done(null, user.id);
  } else {
    console.error('Error: User or user.id is undefined/null in serializeUser');
    done(new Error('User ID not found for serialization'), null);
  }
});

// --- PASSPORT DESERIALIZEUSER ---
passport.deserializeUser(async (id, done) => {
  console.log('--- Inside deserializeUser ---');
  console.log('Deserializing user with ID received:', id);
  if (!id) {
    console.warn('DeserializeUser received undefined/null ID. Clearing session.');
    return done(null, false); // If ID is null/undefined, cannot deserialize
  }
  try {
    const user = await User.findById(id); // Using Mongoose's findById
    if (user) {
      console.log('User SUCCESSFULLY found during deserialization:', user.username || user.displayName || user.id);
      done(null, user);
    } else {
      console.warn('User NOT found in DB during deserialization for ID:', id);
      done(null, false); // Important: Pass false if user not found
    }
  } catch (err) {
    console.error('CRITICAL ERROR during deserialization for ID:', id, err);
    done(err); // Pass the error to Passport
  }
});


// --- GitHub OAuth Strategy ---
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URI, // This needs to be correctly set on Render env vars AND GitHub OAuth App!
      scope: ['user:email'] // Explicitly request email access
    },
    async function (accessToken, refreshToken, profile, done) {
      console.log('\n--- Inside GitHubStrategy Callback ---');
      console.log('GitHub Profile ID:', profile.id);
      console.log('GitHub Profile Username (login):', profile.username); // Often profile.login or profile.username
      console.log('GitHub Profile Display Name:', profile.displayName);
      console.log('GitHub Profile Emails:', profile.emails); // Check if this array exists and has values

      try {
        // Search by GitHub username, which matches your existing 'username' field in DB
        let existingUser = await User.findOne({ username: profile.username }); 
        // If you truly intend to use a nested 'github.id' for lookup AND your schema supports it,
        // then your findOne should be { 'github.id': profile.id } AND your new user creation must also populate it.

        if (existingUser) {
          console.log('GitHubStrategy: Existing user found in DB:', existingUser.username);
          // Optional: Update existing user's profile info if it might have changed on GitHub
          // existingUser.displayName = profile.displayName || existingUser.displayName;
          // existingUser.email = (profile.emails && profile.emails.length > 0) ? profile.emails[0].value : existingUser.email;
          // await existingUser.save();
          return done(null, existingUser);
        } else {
          console.log('GitHubStrategy: No existing user found. Attempting to CREATE new user for GitHub Username:', profile.username);
          const newUser = new User({
            username: profile.username || profile.id, // Prefer GitHub username, fall back to ID if missing
            displayName: profile.displayName,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
            // Ensure your User schema has a 'github' object to store this data
            github: { 
              id: profile.id, // GitHub's unique ID for the user
              username: profile.username,
              displayName: profile.displayName,
              profileUrl: profile.profileUrl,
              photos: profile.photos,
            },
            // Add any other relevant GitHub profile fields you want to save that are directly in your User schema
          });
          await newUser.save();
          console.log('GitHubStrategy: NEW user created and saved to DB:', newUser.username);
          return done(null, newUser);
        }
      } catch (err) {
        console.error('GitHubStrategy: CRITICAL ERROR during user find/create/save:', err);
        return done(err); // Pass the error to Passport
      }
    }
  )
);

// --- Protected profile route (example of using isAuthenticated) ---
app.get('/profile', isAuthenticated, (req, res) => {
  console.log('--- Inside /profile route ---');
  const user = req.user; // Now, req.user should correctly contain your database user object
  res.status(200).json({
    message: 'Welcome to your profile!',
    user: {
      id: user.id || user._id, // Prefer user._id for your DB document
      username: user.username,
      displayName: user.displayName,
      profileUrl: user.github ? user.github.profileUrl : null, // Access from github subdocument
      photos: user.github ? user.github.photos : null, // Access from github subdocument
      position: user.position || 'N/A' // This should now correctly show the user's role/position
    },
  });
});

// --- Main application routes ---
app.use('/', require('./routes')); // If you have a general index route (e.g., / )
app.use('/auth', authRoutes); // Your specific GitHub authentication routes (like /auth/github, /auth/github/callback)


// --- Database Connection and Server Start ---
db.mongoose.connect(db.url) // Connects Mongoose (e.g., if you have Mongoose models)
  .then(() => {
    console.log('Mongoose connected successfully!');

    // This line initializes your raw MongoDB driver connection.
    // If you are primarily using Mongoose, you might not strictly need this separate raw connection,
    // as Mongoose handles its own connection. However, if other parts of your app explicitly use
    // the raw driver via mongoDb.getDb(), keep it.
    mongoDb.initDb((err) => {
        if (err) {
            console.error('Failed to initialize raw MongoDB connection:', err);
            process.exit(1); // Exit if critical connection fails
        } else {
            console.log('Raw MongoDB connection initialized successfully.');
            // Start the server ONLY after ALL necessary database connections are ready
            app.listen(port, () => {
                console.log(`Server running on port ${port}`);
            });
        }
    });
  })
  .catch((err) => {
    console.error('Cannot connect to the database (Mongoose/MongoDB Atlas)!', err, err.message);
    process.exit(1);
  });