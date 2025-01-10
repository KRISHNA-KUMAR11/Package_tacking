const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    TrackingNumber: { type: Number, unique: true, },
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
          type: Buffer,
          default: Buffer.alloc(0), // Initialize with empty buffer
      },
      contentType: {
          type: String,
          enum: {
              values: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
              message: 'Only JPEG, PNG, GIF, WebP, and PDF formats are allowed.',
          },
          default: 'application/pdf'
      },
      size: {
          type: Number,
          default: 0,
          validate: {
              validator: function(v) {
                      return v <= 5 * 1024 * 1024; // 5 MB limit
              },
              message: 'File size must be less than 5 MB.',
          },
      },
    }
});


// 🔄 Pre-save hook to auto-generate the TrackingNumber
PackageSchema.pre('save', async function (next) {
  const doc = this;
  if (!doc.isNew) return next();

  try {
      const lastPackage = await mongoose.model('Package_details').findOne().sort({ TrackingNumber: -1 }).exec();
      const nextTrackingNumber = lastPackage ? lastPackage.TrackingNumber + 1 : 1;
      doc.TrackingNumber = nextTrackingNumber;
      next();
  } catch (err) {
      next(err);
  }
});

PackageSchema.methods.validateIDProof = function() {
  if (this.ID_proof.data && this.ID_proof.data.length > 0) {
      if (this.ID_proof.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5 MB.');
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'].includes(this.ID_proof.contentType)) {
          throw new Error('Invalid file type.');
      }
  }
  return true;
};

module.exports = mongoose.model('Package_details', PackageSchema);


