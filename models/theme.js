// models/theme.js
const mongoose = require('mongoose'); // <--- ADD THIS LINE HERE

const themeSchema = mongoose.Schema({ // Define schema directly
  themeName: {
    type: String
  },
  fontSize: {
    type: Number
  },
  fontFamily: {
    type: String
  },
  inspiration: {
    type: String
  },
  colors: {
    type: [String]
  }
});


module.exports = mongoose.model('theme', themeSchema); // Export the Mongoose Model