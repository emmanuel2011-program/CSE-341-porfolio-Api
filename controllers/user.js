const MongoDb = require('../db/connect.js');
const ObjectId = require('mongodb').ObjectId;
const User = require('../models/user');

exports.create = async (req, res) => {
  try {
    if (!req.body.username || !req.body.password || !req.body.email) {
      return res.status(400).send({ message: 'Missing required fields: username, password, and email are required!' });
    }

    const passwordCheck = passwordUtil.passwordPass(req.body.password);
    if (passwordCheck.error) {
      return res.status(422).send({ message: passwordCheck.error });
    }

    if (req.body.email && !/.+@.+\..+/.test(req.body.email)) {
      return res.status(422).send({ message: 'Invalid email format.' });
    }
    if (req.body.phoneNumber && !/^\+?[0-9]{7,15}$/.test(req.body.phoneNumber)) {
        return res.status(422).send({ message: 'Invalid phone number format. Use international format, e.g., +2348012345678.' });
    }
    if (req.body.openToNewOpportunities !== undefined && typeof req.body.openToNewOpportunities !== 'boolean') {
        return res.status(422).send({ message: 'openToNewOpportunities must be a boolean.' });
    }
    if (req.body.profileIsPublic !== undefined && typeof req.body.profileIsPublic !== 'boolean') {
        return res.status(422).send({ message: 'profileIsPublic must be a boolean.' });
    }

    const user = new User({
        username: req.body.username,
        password: req.body.password,
        displayName: req.body.displayName || req.body.username,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber || '',
        currentLocation: req.body.currentLocation || '',
        openToNewOpportunities: req.body.openToNewOpportunities !== undefined ? req.body.openToNewOpportunities : true,
        profileIsPublic: req.body.profileIsPublic !== undefined ? req.body.profileIsPublic : true,
        theme_name: req.body.theme_name || 'Default',
        info: req.body.info || {},
        profile: req.body.profile || {}
    });

    const data = await user.save();
    console.log('User created successfully:', data.username);
    res.status(201).send(data);
  } catch (err) {
    console.error('User creation error:', err);
    if (err.code === 11000) {
      let duplicateField = 'A field';
      if (err.message.includes('username')) duplicateField = 'Username';
      else if (err.message.includes('email')) duplicateField = 'Email';

      return res.status(409).send({
        message: `${duplicateField} already exists.`,
        error: err.message
      });
    }
    if (err.name === 'ValidationError') {
        return res.status(422).send({
            message: 'Validation failed for user creation.',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    res.status(500).send({
      message: 'Some error occurred while creating the user.',
      error: err.message,
      details: err.errors || err
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await User.find({});
    res.status(200).send(data);
  } catch (err) {
    console.error('Fetch all users error:', err);
    res.status(500).send({
      message: 'Some error occurred while retrieving users.',
      error: err.message
    });
  }
};

exports.getUser = async (req, res) => {
  const { username } = req.params;

  try {
    const data = await User.findOne({ username: username });

    if (!data) {
      return res.status(404).send({ message: 'User not found with username: ' + username });
    }

    res.status(200).send(data);
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).send({
      message: 'Error retrieving user with username=' + username,
      error: err.message
    });
  }
};

exports.updateUser = async (req, res) => {
  const { username } = req.params;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: 'Update data cannot be empty.' });
  }

  try {
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(404).json({ message: 'User not found with username: ' + username });
    }

    if (req.body.password !== undefined) {
      const passwordCheck = passwordUtil.passwordPass(req.body.password);
      if (passwordCheck.error) {
        return res.status(422).json({ message: passwordCheck.error });
      }
      user.password = req.body.password;
    }

    if (req.body.displayName !== undefined) user.displayName = req.body.displayName;
    if (req.body.email !== undefined) {
        if (!/.+@.+\..+/.test(req.body.email)) {
            return res.status(422).send({ message: 'Invalid email format for update.' });
        }
        user.email = req.body.email;
    }
    if (req.body.phoneNumber !== undefined) {
        if (!/^\+?[0-9]{7,15}$/.test(req.body.phoneNumber)) {
            return res.status(422).send({ message: 'Invalid phone number format for update. Use international format, e.g., +2348012345678.' });
        }
        user.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.currentLocation !== undefined) user.currentLocation = req.body.currentLocation;

    if (req.body.openToNewOpportunities !== undefined) {
        if (typeof req.body.openToNewOpportunities !== 'boolean') {
            return res.status(422).send({ message: 'openToNewOpportunities must be a boolean for update.' });
        }
        user.openToNewOpportunities = req.body.openToNewOpportunities;
    }
    if (req.body.profileIsPublic !== undefined) {
        if (typeof req.body.profileIsPublic !== 'boolean') {
            return res.status(422).send({ message: 'profileIsPublic must be a boolean for update.' });
        }
        user.profileIsPublic = req.body.profileIsPublic;
    }
    if (req.body.theme_name !== undefined) user.theme_name = req.body.theme_name;

    if (req.body.info !== undefined) user.info = req.body.info;
    if (req.body.profile !== undefined) user.profile = req.body.profile;

    const updatedUser = await user.save();

    return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.code === 11000) {
        let duplicateField = 'A field';
        if (err.message.includes('username')) duplicateField = 'Username';
        else if (err.message.includes('email')) duplicateField = 'Email';
        return res.status(409).send({
            message: `${duplicateField} already exists with that value.`,
            error: err.message
        });
    }
    if (err.name === 'ValidationError') {
        return res.status(422).send({
            message: 'Validation failed for user update.',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    res.status(500).json({
      message: 'Internal server error while updating user with username=' + username,
      error: err.message || err
    });
  }
};

exports.deleteUser = async (req, res) => {
  const { username } = req.params;

  try {
    const result = await User.deleteOne({ username: username });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'User not found with username: ' + username });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({
      message: 'Could not delete user with username=' + username,
      error: err.message || err
    });
  }
};