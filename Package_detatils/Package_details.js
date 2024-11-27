const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    Number: { type: Number, required: true },
    Package_Name: { type: String, required: true },
    Send_Date: { type: Date, required: true },
    Deliver_From: { type: String, required: true },
    Delivered_Location: { type: String, required: true },
    Description: { type: String },
    Package_weight_in_kgs: { type: Number, required: true },
    Price: { type: Number, required: true }
});

module.exports = mongoose.model('Package_details', PackageSchema);

