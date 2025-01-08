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
    },
    ID_proof: {
      data: {
        type: Buffer, // Supports binary data for both images and PDFs
        validate: {
          validator: function (v) {
            return v && v.length > 0;
          },
          message: 'Data is required and cannot be empty.',
        },
      },
      contentType: {
        type: String,
        enum: {
          values: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
          message: 'Only JPEG, PNG, GIF, WebP, and PDF formats are allowed.',
        },
        required: true,
      },
      size: {
        type: Number,
        validate: {
          validator: function (v) {
            return v <= 5 * 1024 * 1024; // 5 MB limit
          },
          message: 'File size must be less than 5 MB.',
        },
        required: true,
      },
    },
});

module.exports = mongoose.model('Package_details', PackageSchema);


