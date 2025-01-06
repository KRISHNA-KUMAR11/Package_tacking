const mongoose = require('mongoose');

const RecipientSchema = new mongoose.Schema({
    RecipientName: { 
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                return /^[A-Za-z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid name! Only letters and spaces are allowed.`
        }
    },
    RecipientEmail: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
              // Basic email validation regex
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(v);
            },
            message: (props) => `${props.value} is not a valid email address`,
          },
      },
      RecipientContact: {
        type: Number,
        required: [true, 'RecipientContact is required'],
        validate: {
          validator: function (v) {
            // Ensure phone number is between 10 and 15 digits
            return v.toString().length >= 10 && v.toString().length <= 15;
          },
          message: (props) =>
            `${props.value} is not a valid phone number. Must be 10 to 15 digits long`,
        },
      },
    Address: {
        type: String, 
        required: true,
        minlength: [10, 'Address must be at least 10 characters long'],
        maxlength: [100, 'Address cannot exceed 100 characters'],
        validate: {
        validator: function (v) {
            // Ensure the address includes at least one alphanumeric character
            const addressRegex = /^[a-zA-Z0-9\s,.'-]+$/;
            return addressRegex.test(v);
        },
        message: (props) => `${props.value} is not a valid address format`,
        },
    },
    Image: {
      data: {
        type: Buffer,
        validate: {
          validator: function (v) {
            return v && v.length > 0;
          },
        },
      },
      contentType: {
        type: String,
        enum: {
          values: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          message: 'Only JPEG, PNG, GIF, and WebP image formats are allowed.',
        },
      },
      size: {
        type: Number,
        validate: {
          validator: function (v) {
            return v <= 5 * 1024 * 1024; // 5 MB limit
          },
          message: 'Image size must be less than 5 MB.',
        },
      },
    },
  });


module.exports = mongoose.model('Recipient', RecipientSchema);