const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

const Package_Tracking = require('../Package_tacking/Package_Track/Package_Tracking');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('web'));


app.use(bodyParser.json());

app.use('/api/packages', Package_Tracking);


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () =>{ 
        console.log(`Server running on port ${PORT}`)
    });
}).catch(err => console.error(err));