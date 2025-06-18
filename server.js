const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const db = require('./models');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swaggerDesign.json');
const routes = require('./routes/index.js'); // Assuming your main API routes are here

const port = process.env.PORT || 3000;
const app = express();

// --- DATABASE CONNECTION ---
// Connect to the database first, then start the server
db.mongoose.connect(db.url)
  .then(() => {
    console.log('✅ Connected to the database!');

    // --- MIDDLEWARE SETUP (Crucial Order) ---

    // 1. Body Parser: To parse JSON bodies
    app.use(bodyParser.json());

    // 2. Session Middleware: MUST be before Passport.js and any routes using sessions
    // For production, ensure secret is complex and from environment variables
    app.use(session({
      secret: process.env.SESSION_SECRET || 'supersecretdefaultkeyforsessions', // Use a strong, unique secret
      resave: false,
      saveUninitialized: false,
      cookie: {
        // secure: true in production with HTTPS (Render provides HTTPS)
        secure: process.env.NODE_ENV === 'production',
        // Set SameSite to 'none' for cross-site cookies, required with secure:true for most modern browsers
        // ONLY if your frontend (e.g., Swagger UI) is on a different domain than your backend.
        // Otherwise, 'lax' is generally more secure.
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      }
    }));

    // 3. Passport Middleware: MUST be after session middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // 4. CORS Middleware: MUST be after session if sending credentials (cookies)
    // For remote deployment, 'origin' should be specific domains.
    // If your Swagger UI is hosted on the same domain as your API, you might not need `credentials: true`.
    app.use(cors({
        // Replace with your actual allowed origins. Example for local and Render:
        origin: [
            process.env.FRONTEND_URL || `http://localhost:${port}`, // Your client app, if any
            'https://porfolio-kkg6.onrender.com', // Your Render app domain
            'http://localhost:8080' // Common local dev server for frontends
        ],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        credentials: true, // Crucial for sending/receiving cookies/sessions across origins
        optionsSuccessStatus: 204 // Some clients prefer 204 for successful preflight
    }));

    // --- PASSPORT GITHUB STRATEGY (Use the provided config from your last message) ---
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URI || `http://localhost:${port}/github/callback` // Use dynamic port
      },
      function (accessToken, refreshToken, profile, done) {
        console.log('✅ GitHub profile:', profile);
        // In a real app, you'd save/find the user in your DB here.
        return done(null, profile);
      }
    ));

    // Passport serialization/deserialization (as provided in your last message)
    passport.serializeUser((user, done) => {
      console.log('✅ Serializing user:', user.username || user.displayName || 'unknown');
      done(null, user);
    });

    passport.deserializeUser((obj, done) => {
      console.log('✅ Deserializing user:', obj.username || obj.displayName || 'unknown');
      done(null, obj);
    });

    // --- ROUTES ---

    // Public landing page
    app.get('/', (req, res) => {
        // req.user is set by Passport.js if a session is found
        res.send(req.user ? `<h1>Logged in as ${req.user.displayName || req.user.username}</h1><a href="/auth/github/logout">Logout</a>` : '<h1>Logged out</h1><a href="/auth/github">Login with GitHub</a>');
    });

    // GitHub OAuth routes
    app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

    app.get('/github/callback', passport.authenticate('github', {
      failureRedirect: '/', // Redirect to home on failure
      session: true // <--- CRITICAL FIX: This MUST be true for sessions to work
    }), (req, res) => {
      // req.user is populated by Passport.authenticate if successful
      // You don't necessarily need req.session.user = req.user if you only rely on req.user from Passport
      // However, it's fine to keep if you prefer that
      req.session.user = req.user;
      res.redirect('/'); // Redirect to a success page or dashboard
    });

    // Logout route
    app.get('/auth/github/logout', (req, res, next) => {
      req.logout((err) => { // Passport's logout method
        if (err) { return next(err); }
        req.session.destroy(() => { // Destroy the express-session
          res.redirect('/');
        });
      });
    });

    // Your main API routes - should come after authentication middleware
    // If your /routes/index.js contains API endpoints, it should be below passport middleware
    app.use('/api', routes); // Example: prefix your API routes

    // Swagger UI Route - MUST be accessible and after other middleware
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // Catch-all for unhandled routes
    app.use((req, res, next) => {
        res.status(404).send("Sorry, that route doesn't exist.");
    });


    // --- START SERVER ---
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port} or your Render URL`);
      console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
    });

  })
  .catch((err) => {
    console.error('❌ Cannot connect to the database!', err);
    process.exit(1);
  });