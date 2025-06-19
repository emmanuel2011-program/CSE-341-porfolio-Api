const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'portfolio API',
        description: 'API for building portfolio',
    },
    host: 'localhost:3000',
    schemes: ['http', 'https'],
    }

const outputFile = './swagger_output.json';
const routes = ['./routes/index.js'];


swaggerAutogen(outputFile, routes, doc);