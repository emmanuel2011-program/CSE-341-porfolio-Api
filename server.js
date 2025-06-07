require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const port = process.env.PORT || 3000;
const app = express();

// List your allowed frontend URLs here:
const allowedOrigins = [
  'https://your-frontend-domain.com',  // <-- replace with your actual frontend URL
  'http://localhost:3000'               // <-- local dev frontend, optional
];

// Middleware to log incoming origin (for debugging)
app.use((req, res, next) => {
  console.log('Incoming request origin:', req.headers.origin);
  next();
});

// CORS setup to only allow your frontend(s)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // if you use cookies or sessions
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.use('/', require('./routes'));

// DB Connection and Server Start
const db = require('./models');
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log('Cannot connect to the database!', err);
    process.exit();
  });
