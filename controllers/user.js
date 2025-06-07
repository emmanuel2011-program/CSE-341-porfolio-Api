const db = require('../models');
const User = db.user;
const passwordUtil = require('../util/passwordComplexityCheck');

module.exports.create = (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res.status(400).send({ message: 'Content can not be empty!' });
    }

    const password = req.body.password;
    const passwordCheck = passwordUtil.passwordPass(password);
    if (passwordCheck.error) {
      return res.status(400).send({ message: passwordCheck.error });
    }

    const user = new User(req.body);
    user
      .save()
      .then((data) => {
        console.log('User created successfully:', data);
        res.status(201).send(data);
      })
      .catch((err) => {
        console.error('User creation error:', err); // Full error output
        res.status(500).send({
          message: 'Some error occurred while creating the user.',
          error: err.message,
          details: err.errors || err // Log mongoose validation errors if present
        });
      });
  } catch (err) {
    console.error('Unexpected server error during user creation:', err);
    res.status(500).json({ message: 'Internal server error', error: err });
  }
};

// No change needed in getAll, just improved logging
module.exports.getAll = (req, res) => {
  try {
    User.find({})
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        console.error('Fetch all users error:', err);
        res.status(500).send({
          message: 'Some error occurred while retrieving users.',
          error: err.message
        });
      });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err });
  }
};

// Improved error logging in getUser
module.exports.getUser = (req, res) => {
  try {
    const username = req.params.username;
    User.findOne({ username: username })
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        console.error('Fetch user error:', err);
        res.status(500).send({
          message: 'Some error occurred while retrieving the user.',
          error: err.message
        });
      });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err });
  }
};

// Enhanced error handling in updateUser
module.exports.updateUser = async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) {
      return res.status(400).send({ message: 'Invalid Username Supplied' });
    }

    const password = req.body.password;
    const passwordCheck = passwordUtil.passwordPass(password);
    if (passwordCheck.error) {
      return res.status(400).send({ message: passwordCheck.error });
    }

    User.findOne({ username: username }, function (err, user) {
      if (err || !user) {
        return res.status(404).send({ message: 'User not found' });
      }

      user.username = req.params.username;
      user.password = req.body.password;
      user.displayName = req.body.displayName;
      user.info = req.body.info;
      user.profile = req.body.profile;

      user.save(function (err) {
        if (err) {
          console.error('Error updating user:', err);
          res.status(500).json({ message: 'Error updating user', error: err });
        } else {
          res.status(204).send();
        }
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err });
  }
};

// No major change, added better error output
module.exports.deleteUser = async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) {
      return res.status(400).send({ message: 'Invalid Username Supplied' });
    }

    const result = await User.deleteOne({ username });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    return res.status(204).send(); // No content, successful delete
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ message: 'Server error', error: err });
  }
};
