require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models'); // Assuming this correctly loads your Mongoose connection/models
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const authRoutes = require('./routes/auth'); 
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swaggerDesign.json');

// --- Import necessary custom modules for Passport's deserializeUser
const mongoDb = require('./DB/connect.js'); // Assuming this provides mongoDb.getDb()
const userController = require('./controllers/user.js'); // Assuming this provides createOrFindUser

// --- IMPORTANT: Import the isAuthenticated middleware ---
const { isAuthenticated } = require('./middleware/auth'); 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));


const allowedOrigins = [
  'http://localhost:3000', // For local development
  'https://porfolio-kkg6.onrender.com' // Your Render deployed API URL
  
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
      httpOnly: true, 
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
      
    }
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
    req.session.destroy(() => { // Destroy the session in the store
      res.clearCookie('connect.sid'); // Clear the session cookie from the browser
      res.redirect('/'); // Redirect to homepage
    });
  });
});

app.get('/check-session', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(), // Passport's helper
    user: req.user, // Will be populated if authenticated and deserialized
    session: req.session // Raw session object
  });
});


passport.serializeUser((user, done) => {
    
    done(null, user.username); // Or user._id.toString() if you prefer using MongoDB's _id
});

// d
passport.deserializeUser(async (username, done) => {
    try {
        // Retrieve your database connection instance.
        const dbInstance = mongoDb.getDb(); 
        
        
        const user = await dbInstance.collection('User').findOne({ username: username });

        if (user) {
            
            done(null, user); 
        } else {
            // If the user's record is no longer in the DB, it indicates a problem or deleted account.
            console.warn(`User ${username} not found in database during deserialization. Clearing session.`);
            done(new Error('User record not found.'), null); // Passport will clear the session
        }
    } catch (err) {
        console.error('Error deserializing user:', err);
        done(err, null); // Pass the error to Passport
    }
});


// --- GitHub OAuth Strategy ---
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URI, // This needs to be correctly set on Render env vars AND GitHub OAuth App!
    },
    async function (accessToken, refreshToken, profile, done) {
      
      try {
        
        const user = await userController.createOrFindUser(profile);
        return done(null, user); // Pass the user object from YOUR DATABASE to Passport's serializeUser
      } catch (err) {
        console.error('Error in GitHubStrategy callback (createOrFindUser):', err);
        return done(err, null); // Pass the error to Passport
      }
    }
  )
);

// --- Protected profile route (example of using isAuthenticated) ---
app.get('/profile', isAuthenticated, (req, res) => {
  const user = req.user; // Now, req.user should correctly contain your database user object
  res.status(200).json({
    message: 'Welcome to your profile!',
    user: {
      id: user.id || user._id, // May be GitHub ID or MongoDB _id. Use user._id for your DB doc.
      username: user.username, 
      displayName: user.displayName, 
      profileUrl: user.profileUrl, 
      photos: user.photos, 
      position: user.position || 'N/A' // This should now correctly show the user's role/position
    },
  });
});

// --- Main application routes ---
app.use('/', require('./routes')); 
app.use('/auth', authRoutes); // Your specific GitHub authentication routes (like /auth/github)



db.mongoose.connect(db.url) // Connects Mongoose (e.g., if you have Mongoose models)
  .then(() => {
    console.log('Mongoose connected successfully!');
    
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
    console.error('Cannot connect to the database (Mongoose/MongoDB Atlas)!', err);
    process.exit(1); 
  });
