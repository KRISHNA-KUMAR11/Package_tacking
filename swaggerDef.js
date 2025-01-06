const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Package Tracking API',
    version: '1.0.0',
    description: 'API documentation for the package tracking system',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Packages Server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./Package_Track/*.js',], // Path to the API docs
};

module.exports = options;
  