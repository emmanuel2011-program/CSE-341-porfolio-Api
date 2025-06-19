// db/connect.js
const mongoose = require("mongoose"); // <--- CHANGE FROM "mongodb" to "mongoose"
const dotenv = require("dotenv");
dotenv.config();

let _db; // This variable will now hold the Mongoose connection object, not raw db

const initDb = async (callback) => { // Made async for cleaner await usage
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    // 1 = connected, 2 = connecting
    console.log("Db is already initialized (Mongoose)!");
    _db = mongoose.connection.db; // Get the raw db object if needed elsewhere
    return callback(null, _db);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true, // Recommended for Mongoose 5.x, might be default in 6+
      useUnifiedTopology: true, // Recommended for Mongoose 5.x, might be default in 6+
      // Add other options if you had them for MongoClient.connect
    });

    _db = mongoose.connection.db; // Store the raw db object for getDb()
    console.log("Mongoose Connected to DB!");

    // Optional: List collections (this uses the raw db object from Mongoose connection)
    _db.listCollections().toArray()
      .then((collections) => {
        console.log("Collections (via Mongoose connection):", collections.map((c) => c.name));
      })
      .catch((err) => {
        console.error("Error listing collections (via Mongoose connection):", err);
      });

    callback(null, _db);
  } catch (err) {
    console.error("Mongoose DB connection error:", err); // Log the full error
    callback(err);
  }
};

const getDb = () => {
  if (!_db) {
    throw Error("Db not initialized (Mongoose)");
  }
  return _db;
};

module.exports = {
  initDb,
  getDb,
};