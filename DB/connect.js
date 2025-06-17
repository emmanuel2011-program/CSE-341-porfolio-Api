const { MongoClient } = require('mongodb');

// This variable will hold our database connection instance
let _db;

/**
 * Initializes the database connection.
 * @param {Function} callback - A callback function to be executed after connection attempt.
 */
const initDb = (callback) => {
    // If a database connection already exists, just return it
    if (_db) {
        console.log('Database is already initialized!');
        return callback(null, _db);
    }

    // Connect to MongoDB using the connection string from environment variables
    // process.env.MONGODB_URI should be set in your .env file locally
    // and as an environment variable on Render.
    MongoClient.connect(process.env.MONGODB_URI)
        .then((client) => {
            // Store the database instance (client.db() will connect to the default database
            // specified in your MONGODB_URI, or you can specify it like client.db('yourDbName'))
            _db = client.db(); 
            console.log('Raw MongoDB driver connected successfully!');
            callback(null, _db); // Pass null for error, and the db instance
        })
        .catch((err) => {
            // Log any connection errors
            console.error('Failed to connect to MongoDB using raw driver:', err);
            callback(err); // Pass the error to the callback
        });
};

/**
 * Gets the currently initialized database instance.
 * @returns {Db} The MongoDB database instance.
 * @throws {Error} If the database has not been initialized yet.
 */
const getDb = () => {
    if (!_db) {
        throw Error('Database not initialized! Call initDb first.');
    }
    return _db;
};

/**
 * Closes the database connection. (Optional, useful for clean shutdowns in tests)
 */
const closeDb = () => {
    if (_db) {
        _db.client.close();
        _db = null;
        console.log('Raw MongoDB driver connection closed.');
    }
};

module.exports = {
    initDb,
    getDb,
    closeDb // Export closeDb if you plan to use it (e.g., in testing)
};
