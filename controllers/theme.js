const MongoDb = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

// Create a new theme
exports.createTheme = async (req, res) => {
  if (!req.body.themeName) {
    return res.status(400).send({ message: "Theme name cannot be empty" });
  }

  try {
    const theme = new Theme({
      themeName: req.body.themeName,
      color: req.body.color,
      layout: req.body.layout
    });

    const data = await theme.save();
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: "Error occurred while creating the theme.",
      error: err.message
    });
  }
};

// Get all themes
exports.getAllThemes = async (req, res) => {
  try {
    const data = await Theme.find({});
    res.status(200).send(data);
  } catch (err) {
    console.error('Fetch all themes error:', err);
    res.status(500).send({
      message: 'Some error occurred while retrieving themes.',
      error: err.message
    });
  }
};

// Get a theme by themeName
exports.getTheme = async (req, res) => {
  const themeName = req.params.themeName;

  try {
    const data = await Theme.find({ themeName: themeName });

    if (!data || data.length === 0) {
      return res.status(404).send({ message: 'Not found theme with name: ' + themeName });
    }

    res.send(data[0]);
  } catch (err) {
    res.status(500).send({
      message: 'Error retrieving theme with themeName=' + themeName,
      error: err.message
    });
  }
};

// Update a theme by themeName
exports.updateTheme = async (req, res) => {
  const themeName = req.params.themeName;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: "Update data cannot be empty" });
  }

  try {
    const data = await Theme.findOneAndUpdate({ themeName: themeName }, req.body, { new: true });

    if (!data) {
      return res.status(404).send({ message: "Theme not found with name: " + themeName });
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: "Error updating theme with name=" + themeName,
      error: err.message
    });
  }
};

// Delete a theme by themeName
exports.deleteTheme = async (req, res) => {
  const themeName = req.params.themeName;

  try {
    const data = await Theme.findOneAndDelete({ themeName: themeName });

    if (!data) {
      return res.status(404).send({ message: "Theme not found with name: " + themeName });
    }

    res.send({ message: "Theme was deleted successfully." });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete theme with name=" + themeName,
      error: err.message
    });
  }
};
