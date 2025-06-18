module.exports = (mongoose) => {
    const userSchema = mongoose.Schema({
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
     
    });
  
    return mongoose.model('users', userSchema);
  };