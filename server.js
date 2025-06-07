const cors = require('cors');
require('dotenv').config();
const express = require('express');
const session = require('express-session');


const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors({
    origin: '*', // Allows any origin - use this only for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  // <---- Add this line

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
