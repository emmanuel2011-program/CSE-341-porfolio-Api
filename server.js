require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./auth/passport'); // your passport config
const githubStrategy = require('./auth/github.strategy'); // your GitHub strategy config

const port = process.env.PORT || 3000;
const app = express();

// CORS Middleware (adjust origin for production)
app.use(cors({
  origin: 'http://localhost:3000',  // change to your client app URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// JSON Body Parser
app.use(express.json());

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false  // better to false generally
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(githubStrategy);


// Passport Configuration 
// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});
app.use('/', require('./routes'));
app.use('/auth', require('./routes/auth.routes'));

// DB Connection and Server Start
const db = require('./models');
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
