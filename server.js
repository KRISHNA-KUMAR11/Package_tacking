require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Package_Tracking = require('../Package_tacking/Package_Track/Package_Tracking');
const recipientRoutes = require('../Package_tacking/Package_Track/recipientRoutes');
const errorHandling = require('./middleware/errorhandling');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = require('./swaggerDef');
const cors = require('cors');
const path = require('path');



// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
);

app.use (cors({
  origin: "*",
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Swagger setup
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-Packages', swaggerUi.serve, swaggerUi.setup(swaggerDocs));  //http://localhost:5000/api-Packages/ for Swagger


// http://62.146.178.245:5000/api-Packages/ for server 
// ssh krishna@62.146.178.245
// Passwd: Krishna11


// Routes
app.use('/packages', Package_Tracking); // http://localhost:5000/packages/
app.use('/recipients', recipientRoutes); //http://localhost:5000/recipients/


// Error handling middleware
app.use(errorHandling);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});