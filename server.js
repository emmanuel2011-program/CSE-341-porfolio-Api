require('dotenv').config();
const express = require('express');
const session = require('express-session');
const db = require('./models');

const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

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
db.mongoose.connect(db.url)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log('Cannot connect to the database!', err);
    process.exit();
  });
