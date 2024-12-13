const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    TrackingNumber: { type: Number, required:true, unique: true, },
    Status: { type: String, required: true, enum: ['pending', 'in-transit', 'delivered', 'not delivered']},
    Send_Date: { type: Date, default: Date.now },
    SenderName: { type: String, required: true,
        validate: {
            validator: function(v) {
                // Regex to match only letters and spaces
                return /^[A-Za-z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid name! Only letters and spaces are allowed.`
        }
     },
     RecipientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipient', 
        required: true,
     },
    Origin: { type: String, required: true,
        validate: {
            validator: function(v) {
                // Regex to match only letters and spaces
                return /^[A-Za-z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid name! Only letters and spaces are allowed.`
        }
     },
    Destination: { type: String, required: true,
        validate: {
            validator: function(v) {
                // Regex to match only letters and spaces
                return /^[A-Za-z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid name! Only letters and spaces are allowed.`
        }
     },
    Description: { type: String },
    Package_weight: { type: Number, required: true,
        validate:{
            validator: function(v) {
            // Ensure weight is rounded to 2 decimal places
            return /^\d+(\.\d{1,2})?$/.test(v.toFixed(2)) && v > 0;
            },
        message: props => `${props.value} must be a weight in kilograms with up to 2 decimal places`
        },
    get: v => `${v.toFixed(2)} kg`,
    set: v => parseFloat(v),
    },
    Price: { type: Number, required: true,
        validate: {
            validator: function(v) {
            // Ensure price is a positive number with 2 decimal places
            return /^\d+(\.\d)?$/.test(v) && v > 0;
            },
        message: props => `${props.value} is not a valid price! Must be a positive number`
        },
    get: v => `$${v.toFixed(2)}`,
    set: v => parseFloat(v),
    }
});

module.exports = mongoose.model('Package_details', PackageSchema);


