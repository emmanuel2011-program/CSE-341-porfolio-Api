// models/user.js
const mongoose = require('mongoose'); // <--- ADD THIS LINE HERE

const userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  password: {
    type: String
  },
  displayName: {
    type: String
  },
  email: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  currentLocation: {
    type: String
  },
  openToNewOpportunities: {
    type: Boolean
  },
  profileIsPublic: {
    type: Boolean
  },
  theme_name: { 
    type: String
  },
  info: {
    email: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    currentLocation: {
      type: String
    },
    openToNewOpportunities: {
      type: Boolean
    },
    profileIsPublic: {
      type: Boolean
    },
    theme_name: {
      type: String
    }
  },
  profile: {
    experience: {
      type: [mongoose.SchemaTypes.Mixed] // Using Mixed for flexibility, but specific schemas are better
    },
    education: {
      type: [mongoose.SchemaTypes.Mixed]
    },
    projects: {
      type: [mongoose.SchemaTypes.Mixed]
    },
    skills: {
      type: [String]
    },
    references: {
      type: [mongoose.SchemaTypes.Mixed]
    }
  }
});

module.exports = mongoose.model('User', userSchema); // Use 'User' as the model name, Mongoose pluralizes to 'users' collection