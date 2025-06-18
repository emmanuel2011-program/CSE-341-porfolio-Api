const db = require('../models');
const User = db.user; 
const passwordUtil = require('../util/passwordComplexityCheck');

module.exports.createOrFindUser = async (profile) => {
    console.log('--- Inside userController.createOrFindUser ---');
    console.log('  Profile received by createOrFindUser:', profile.id, profile.username, profile.displayName);

    try {
        // 1. Try to find the user by their GitHub ID
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
            console.log('  User found in DB for GitHub ID:', profile.id, 'Username:', user.username);
            // Optionally, update existing user info like last login or display name if it changed on GitHub
            user.lastLogin = new Date();
            if (profile.displayName && user.displayName !== profile.displayName) {
                user.displayName = profile.displayName;
            }
           
            await user.save(); // Save any updates
            return user;
        }

        
        console.log('  User not found, creating new user for GitHub ID:', profile.id);

        const newUser = new User({
            githubId: profile.id,
            username: profile.username, // GitHub username
            displayName: profile.displayName || profile.username,
            profileUrl: profile.profileUrl,
            
            photos: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            createdAt: new Date(),
            // Initialize nested objects if your schema requires them
            info: {},
            profile: {}
        });

        const savedUser = await newUser.save();
        console.log('  New user created successfully:', savedUser.username || savedUser._id);
        return savedUser;

    } catch (error) {
        console.error('  ERROR in createOrFindUser:', error.message);
        console.error('  createOrFindUser Stack trace:', error.stack);
        throw error; // Re-throw the error for the Passport strategy to catch
    }
};



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
                console.error('User creation error:', err);
                res.status(500).send({
                    message: 'Some error occurred while creating the user.',
                    error: err.message,
                    details: err.errors || err
                });
            });
    } catch (err) {
        console.error('Unexpected server error during user creation:', err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }
};

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

module.exports.updateUser = async (req, res) => {
    try {
        const username = req.params.username;
        if (!username) {
            return res.status(400).json({ message: 'Invalid Username Supplied' });
        }

        const password = req.body.password;
        // Check if password exists in body before validating
        if (password) {
            const passwordCheck = passwordUtil.passwordPass(password);
            if (passwordCheck.error) {
                return res.status(400).json({ message: passwordCheck.error });
            }
        }

        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields only if they are provided in the request body
        if (req.body.password) user.password = req.body.password;
        if (req.body.displayName) user.displayName = req.body.displayName;
        if (req.body.info) user.info = req.body.info;
        if (req.body.profile) user.profile = req.body.profile;

        const updatedUser = await user.save();

        return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        console.error('Unexpected error in updateUser:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message || err
        });
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

        return res.status(204).send();
    } catch (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ message: 'Server error', error: err });
    }
};