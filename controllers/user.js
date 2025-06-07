const db = require('../models');
const User = db.user;
const passwordUtil = require('../util/passwordComplexityCheck');

module.exports.create = (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      res.status(400).send({ message: 'Content can not be empty!' });
      return;
    }
    const password = req.body.password;
    const passwordCheck = passwordUtil.passwordPass(password);
    if (passwordCheck.error) {
      res.status(400).send({ message: passwordCheck.error });
      return;
    }
    const user = new User(req.body);
    user
      .save()
      .then((data) => {
        console.log(data);
        res.status(201).send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while creating the user.'
        });
      });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports.getAll = (req, res) => {
  try {
    User.find({})
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving users.'
        });
      });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports.getUser = (req, res) => {
  try {
    const username = req.params.username;
    User.findOne({ username: username })
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving users.'
        });
      });
  } catch (err) {
    res.status(500).json(err);
  }
};

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
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err });
        }
  
        if (!user) {
          return res.status(404).send({ message: `User '${username}' not found.` });
        }
  
        // Update user fields
        user.password = req.body.password;
        user.displayName = req.body.displayName;
        user.info = req.body.info;
        user.profile = req.body.profile;
  
        user.save(function (err) {
          if (err) {
            return res.status(500).json({ message: 'Error saving user', error: err });
          } else {
            return res.status(200).send({ message: 'User updated successfully' });
          }
        });
      });
    } catch (err) {
      return res.status(500).json({ message: 'Unexpected server error', error: err });
    }
  };
  

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
      console.error('Delete error:', err); // Log error for debugging
      return res.status(500).json({ message: 'Server error', error: err });
    }
  };
  