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

// IMPORTANT: The model name here is 'Theme'. Mongoose will pluralize it to 'themes'
// for the collection name, which matches your existing collection.
module.exports = mongoose.model('Theme', themeSchema); // Export the Mongoose Model