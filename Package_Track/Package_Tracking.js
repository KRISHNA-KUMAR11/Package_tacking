const express = require('express');
const Package = require('../Package_detatils/Package_details');
const Recipient = require('../Package_detatils/Recipient');
const Package_details = require ('../Package_detatils/Package_details.js')
const Package_Tracking = express.Router();
const multer = require('multer'); // File upload middleware
const path = require('path');


// Set up multer storage to handle file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and PDF files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and PDF files are allowed!'));
    } else {
      cb(null, true);
    }
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Package:
 *       type: object
 *       required:
 *         - Status
 *         - SenderName
 *         - RecipientId
 *         - Origin
 *         - Destination
 *         - Package_weight
 *         - Price
 *       properties:
 *         TrackingNumber:
 *           type: number
 *           description: Auto-generated unique tracking number
 *         Status:
 *           type: string
 *           enum: [pending, in-transit, delivered, not delivered]
 *         Send_Date:
 *           type: string
 *           format: date-time
 *           description: Automatically set to current date
 *         SenderName:
 *           type: string
 *           pattern: '^[A-Za-z\s]+$'
 *           description: Only letters and spaces allowed
 *         RecipientId:
 *           type: string
 *           description: MongoDB ObjectId reference to Recipient
 *         Origin:
 *           type: string
 *           pattern: '^[A-Za-z\s]+$'
 *           description: Only letters and spaces allowed
 *         Destination:
 *           type: string
 *           pattern: '^[A-Za-z\s]+$'
 *           description: Only letters and spaces allowed
 *         Description:
 *           type: string
 *         Package_weight:
 *           type: number
 *           description: Weight in kg with up to 2 decimal places
 *         Price:
 *           type: number
 *           description: Price with up to 2 decimal places
 *         ID_proof:
 *           type: object
 *           properties:
 *             data:
 *               type: string
 *               format: binary
 *             contentType:
 *               type: string
 *               enum: [image/jpeg, image/png, image/gif, image/webp, application/pdf]
 *             size:
 *               type: number
 *               maximum: 5242880
 *       example:
 *         Status: "in-transit"
 *         SenderName: "Krishna"
 *         RecipientId: "001"
 *         Origin: "Pune"
 *         Destination: "Bangalore"
 *         Description: "Mobile"
 *         Package_weight: 0.71
 *         Price: 500
 */

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: API for managing Packages
 */

/**
 * @swagger
 * /packages/:
 *   post:
 *     summary: Create a new package
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       201:
 *         description: The package was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Some server error
 */

// Middleware to validate package data
const validatePackage = (req, res, next) => {
  const { Status, SenderName, RecipientId, Origin, Destination, Package_weight, Price } = req.body;

  const requiredFields = ['Status', 'SenderName', 'RecipientId', 'Origin', 'Destination', 'Package_weight', 'Price'];
  
  // Check for missing fields
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${field}`,
        requiredFields,
      });
    }
  }

  // Validate Status field
  const validStatuses = ['pending', 'in-transit', 'delivered', 'not delivered'];
  if (!validStatuses.includes(Status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid Status value. Allowed values are: ${validStatuses.join(', ')}`,
    });
  }

  // Validate name fields format (letters and spaces only)
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(SenderName)) {
    return res.status(400).json({
      success: false,
      message: 'SenderName must contain only letters and spaces',
    });
  }
  if (!nameRegex.test(Origin)) {
    return res.status(400).json({
      success: false,
      message: 'Origin must contain only letters and spaces',
    });
  }
  if (!nameRegex.test(Destination)) {
    return res.status(400).json({
      success: false,
      message: 'Destination must contain only letters and spaces',
    });
  }

  // Validate numeric fields
  if (typeof Package_weight !== 'number' || !/^\d+(\.\d{1,2})?$/.test(Package_weight.toFixed(2)) || Package_weight <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Package_weight must be a positive number with up to 2 decimal places',
    });
  }

  if (typeof Price !== 'number' || !/^\d+(\.\d{1,2})?$/.test(Price.toFixed(2)) || Price <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Price must be a positive number with up to 2 decimal places',
    });
  }

  next();
};


Package_Tracking.post('/', validatePackage, async (req, res, next) => {
  try {
    const recipient = await Recipient.findById(req.body.RecipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Initialize ID_proof with required fields
    const newPackage = new Package(req.body);

    const savedPackage = await newPackage.save();

    res.status(201).json({
      success: true,
      message: 'Package created successfully!',
      data: savedPackage,
    });
  } catch (error) {
    next(error);
  }
});



/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Retrieve all packages
 *     tags: [Packages]
 *     responses:
 *       200:
 *         description: List of all packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Package'
 */

// Get all packages
Package_Tracking.get('/', async (req, res, next) => {
  try {
    const packages = await Package.find({}, { 'ID_proof.data': 0 }).exec();
    
    const formattedPackages = packages.map(pkg => ({
      _id: pkg._id,
      TrackingNumber: pkg.TrackingNumber,
      Status: pkg.Status,
      Send_Date: pkg.Send_Date,
      SenderName: pkg.SenderName,
      RecipientId: pkg.RecipientId,
      Origin: pkg.Origin,
      Destination: pkg.Destination,
      Description: pkg.Description,
      Package_weight: pkg.Package_weight,
      Price: pkg.Price,
      ID_proof: pkg.ID_proof ? {
        contentType: pkg.ID_proof.contentType,
        size: pkg.ID_proof.size,
      } : null
    }));
    
    res.status(200).json(formattedPackages);
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
});
  
  /**
 * @swagger
 * /packages/{trackingNumber}:
 *   get:
 *     summary: Get a package by tracking number
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         schema:
 *           type: number
 *         required: true
 *         description: The tracking number of the package
 *     responses:
 *       200:
 *         description: The package data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       404:
 *         description: Package not found
 */

  // Get a package by TrackingNumber
  Package_Tracking.get('/:trackingNumber', async (req, res, next) => {
    try {
      const pkg = await Package.findOne({
        TrackingNumber: req.params.trackingNumber,
      }).populate('RecipientId');
      
      if (!pkg || !pkg.ID_proof.data) {
        // If package isn't found, return early, preventing further code execution
        return res.status(404).send('Package not found');
      }

      // Prepare the package data without the binary ID proof
    const packageData = {
      ...pkg._doc,
      ID_proof: undefined, // Exclude raw binary data from JSON
    };

    // Send both the package details and ID proof in the same response
    return res.json({
      package: packageData,
      ID_proof: {
        data: pkg.ID_proof.data.toString('base64'), // Convert binary data to Base64
        contentType: pkg.ID_proof.contentType,
      },
    });
    } catch (error) {
      // If an error occurs, ensure you don't send a response more than once
      return next(error);
    }
  });


/**
 * @swagger
 * /packages/{trackingNumber}:
 *   put:
 *     summary: Update a package by tracking number
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         schema:
 *           type: number
 *         required: true
 *         description: The tracking number of the package to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       200:
 *         description: The package was successfully updated
 *       404:
 *         description: Package not found
 */

  // Update (replace) a package by TrackingNumber
  Package_Tracking.put('/:trackingNumber', async (req, res, next) => {
    try {
      const updatedPackage = await Package.findOneAndUpdate(
        { TrackingNumber: req.params.trackingNumber },
        req.body, // New data to replace the existing package
        { new: true, runValidators: true, overwrite: true } // Overwrite ensures the entire document is replaced
      ).populate('RecipientId');
  
      if (!updatedPackage) {
        return res.status(404).json({
          success: false,
          message: 'Package not found!',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Package updated successfully!',
        data: updatedPackage,
      });
    } catch (error) {
      return next(error);
    }
  });
  
/**
 * @swagger
 * /packages/{trackingNumber}:
 *   patch:
 *     summary: Partially update a package by tracking number
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         schema:
 *           type: number
 *         required: true
 *         description: The tracking number of the package to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       200:
 *         description: Package partially updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       404:
 *         description: Package not found
 */

  // Update a package's status
  Package_Tracking.patch('/:trackingNumber', async (req, res, next) => {
    try {
      const pkg = await Package.findOneAndUpdate(
        { TrackingNumber: req.params.trackingNumber },
        { Status: req.body.Status },
        { new: true, runValidators: true }
      );
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found!',
        });
      }
      res.status(200).json({
        success: true,
        message: 'Package status updated successfully!',
        data: pkg,
      });
    } catch (error) {
      return next(error);
    }
  });
  
/**
 * @swagger
 * /packages/{trackingNumber}:
 *   delete:
 *     summary: Delete a package by tracking number
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         schema:
 *           type: number
 *         required: true
 *         description: The tracking number of the package to delete
 *     responses:
 *       200:
 *         description: Package successfully deleted
 *       404:
 *         description: Package not found
 */

  // Delete a package
  Package_Tracking.delete('/:trackingNumber', async (req, res, next) => {
    try {
      const pkg = await Package.findOneAndDelete({
        TrackingNumber: req.params.trackingNumber,
      });
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found!',
        });
      }
      res.status(200).json({
        success: true,
        message: 'Package deleted successfully!',
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
 * @swagger
 * /packages/add-many:
 *   post:
 *     summary: Bulk adding packages
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Package'
 *     responses:
 *       201:
 *         description: Packages were successfully created
 *       500:
 *         description: Some server error
 */
  Package_Tracking.post('/add-many', async (req, res, next) => {
    try {
        const { packages } = req.body;
  
        // Validate if each package has valid recipient ID
        for (let i = 0; i < packages.length; i++) {
            const recipient = await Recipient.findById(packages[i].RecipientId);
            if (!recipient) {
                return res.status(404).json({ message: `Recipient not found for Package ${i + 1}` });
            }
        }
  
        // Manually generate TrackingNumber for each package
        const lastPackage = await Package_details.findOne().sort({ TrackingNumber: -1 }).exec(); // Correct model used here
        let nextTrackingNumber = lastPackage ? lastPackage.TrackingNumber + 1 : 1;
  
        // Add TrackingNumber to each package
        for (let i = 0; i < packages.length; i++) {
            packages[i].TrackingNumber = nextTrackingNumber++;
        }
  
        // Bulk insert packages
        const result = await Package_details.insertMany(packages); // Correct model used here
        res.status(201).json({
            success: true,
            message: 'Packages created successfully!',
            data: result,
        });
  
    } catch (error) {
        return next(error);
    }
  });

/**
 * @swagger
 * /packages/import:
 *   post:
 *     summary: Bulk importing packages from a JSON file
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON file containing an array of packages
 *     responses:
 *       201:
 *         description: Packages imported successfully
 *       400:
 *         description: Invalid file content
 *       500:
 *         description: Server error
 */

// Bulk import packages from a JSON file
Package_Tracking.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required.' });
    }

    let packagesData;
    try {
      packagesData = JSON.parse(req.file.buffer.toString('utf-8')); // Ensure UTF-8 encoding
    } catch (error) {
      console.error('JSON Parsing Error:', error.message);
      return res.status(400).json({ error: 'Invalid JSON file content.' });
    }

    if (!Array.isArray(packagesData) || packagesData.length === 0) {
      return res.status(400).json({ error: 'Invalid file content. An array of packages is required.' });
    }

    // Manually generate TrackingNumber for each package
    const lastPackage = await Package_details.findOne().sort({ TrackingNumber: -1 }).exec(); // Correct model used here
    let nextTrackingNumber = lastPackage ? lastPackage.TrackingNumber + 1 : 1;

    // Validate each package and assign TrackingNumber
    for (let i = 0; i < packagesData.length; i++) {
      const recipient = await Recipient.findById(packagesData[i].RecipientId);
      if (!recipient) {
        return res.status(404).json({ message: `Recipient not found for Package ${i + 1}` });
      }
      packagesData[i].TrackingNumber = nextTrackingNumber++;
    }

    // Bulk insert packages
    const result = await Package_details.insertMany(packagesData, { ordered: true }); // Correct model used here
    res.status(201).json({
      message: 'Packages imported successfully!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});


/**
 * @swagger
 * /packages/delete-many:
 *   post:
 *     summary: Delete multiple packages by their tracking numbers
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackingNumbers
 *             properties:
 *               trackingNumbers:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of package tracking numbers to delete
 *             example:
 *               trackingNumbers: [123456, 789012]
 *     responses:
 *       200:
 *         description: Packages deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: number
 *                 notFoundNumbers:
 *                   type: array
 *                   items:
 *                     type: number
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

Package_Tracking.post('/delete-many', async (req, res, next) => {
  try {
    const { trackingNumbers } = req.body;

    // Validate input
    if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. An array of tracking numbers is required.'
      });
    }

    // Verify all items are numbers
    if (!trackingNumbers.every(num => typeof num === 'number')) {
      return res.status(400).json({
        success: false,
        message: 'All tracking numbers must be numeric values.'
      });
    }

    // Find existing packages before deletion
    const existingPackages = await Package.find({
      TrackingNumber: { $in: trackingNumbers }
    });

    const existingNumbers = existingPackages.map(p => p.TrackingNumber);
    const notFoundNumbers = trackingNumbers.filter(num => !existingNumbers.includes(num));

    // Delete the packages
    const deleteResult = await Package.deleteMany({
      TrackingNumber: { $in: trackingNumbers }
    });

    res.status(200).json({
      success: true,
      message: 'Packages deleted successfully',
      deletedCount: deleteResult.deletedCount,
      notFoundNumbers: notFoundNumbers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /packages/update-many:
 *   post:
 *     summary: Update multiple packages by their tracking numbers
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - TrackingNumber
 *                   properties:
 *                     TrackingNumber:
 *                       type: number
 *                       description: The tracking number of the package to update
 *                     fieldsToUpdate:
 *                       type: object
 *                       description: Key-value pairs of fields to update
 *             example:
 *               updates:
 *                 - TrackingNumber: 123456
 *                   fieldsToUpdate: { Status: "delivered", Price: 600 }
 *                 - TrackingNumber: 789012
 *                   fieldsToUpdate: { Status: "in-transit" }
 *     responses:
 *       200:
 *         description: Packages updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedPackages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Package'
 *                 notFoundNumbers:
 *                   type: array
 *                   items:
 *                     type: number
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

// Update many packages
Package_Tracking.post('/update-many', async (req, res, next) => {
  try {
    const { updates } = req.body;

    // Validate input
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. An array of updates is required.',
      });
    }

    const notFoundNumbers = [];
    const updatedPackages = [];

    // Process each update
    for (const update of updates) {
      const { TrackingNumber, fieldsToUpdate } = update;

      if (!TrackingNumber || typeof fieldsToUpdate !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Each update must contain a valid TrackingNumber and fieldsToUpdate object.',
        });
      }

      // Attempt to find and update the package
      const updatedPackage = await Package.findOneAndUpdate(
        { TrackingNumber },
        fieldsToUpdate,
        { new: true, runValidators: true }
      );

      if (updatedPackage) {
        updatedPackages.push(updatedPackage);
      } else {
        notFoundNumbers.push(TrackingNumber);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Packages updated successfully',
      updatedPackages,
      notFoundNumbers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /packages/{trackingNumber}/ID_Proof:
 *   post:
 *     summary: Upload an ID_Proof for a package
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The tracking number of the package
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: ID_Proof uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 package:
 *                   type: object
 *                   $ref: '#/components/schemas/Package'
 *       400:
 *         description: ID_Proof file is required or invalid input
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */

// Add image
Package_Tracking.post('/:trackingNumber/ID_Proof', fileUpload.single('file'), async (req, res) => {
  try {
      const { trackingNumber } = req.params;

      if (!req.file) {
          return res.status(400).json({ 
              success: false,
              error: 'ID proof file is required.' 
          });
      }

      const updateData = {
          'ID_proof.data': req.file.buffer,
          'ID_proof.contentType': req.file.mimetype,
          'ID_proof.size': req.file.size
      };

      const pkg = await Package.findOneAndUpdate(
          { TrackingNumber: trackingNumber },
          updateData,
          { new: true, runValidators: true }
      );

      if (!pkg) {
          return res.status(404).json({ 
              success: false,
              error: 'Package not found.' 
          });
      }

      // Run custom validation
      pkg.validateIDProof();

      res.status(200).json({
          success: true,
          message: 'ID proof uploaded successfully',
          fileDetails: {
              originalName: req.file.originalname,
              size: req.file.size,
              contentType: req.file.mimetype,
          },
      });
  } catch (error) {
      res.status(500).json({ 
          success: false,
          error: error.message 
      });
  }
});

/**
 * @swagger
 * /packages/{trackingNumber}/ID_Proof:
 *   get:
 *     summary: Retrieve the ID_Proof for a package
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The tracking number of the package
 *     responses:
 *       200:
 *         description: ID_Proof retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: ID_Proof not found for the given package
 *       500:
 *         description: Server error
 */

// Get image
Package_Tracking.get('/:trackingNumber/ID_Proof', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const pkg = await Package.findOne({ TrackingNumber: trackingNumber });

    if (!pkg || !pkg.ID_proof || !pkg.ID_proof.data) {
      return res.status(404).json({ error: 'ID_Proof not found for this package.' });
    }

    res.set('Content-Type', pkg.ID_proof.contentType);
    res.send(pkg.ID_proof.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /packages/{trackingNumber}/delete_ID_Proof:
 *   delete:
 *     summary: Delete the ID_Proof for a package
 *     tags:
 *       - Packages
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The tracking number of the package
 *     responses:
 *       200:
 *         description: ID_Proof deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 package:
 *                   type: object
 *                   $ref: '#/components/schemas/Package'
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */

// Delete image
Package_Tracking.delete('/:trackingNumber/delete_ID_Proof', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const pkg = await Package.findOneAndUpdate(
      { TrackingNumber: trackingNumber },
      { $unset: { 'ID_proof.data': '', 'ID_proof.contentType': '', 'ID_proof.size': '' } },
      { new: true }
    );

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    res.status(200).json({ message: 'ID_Proof deleted successfully', package: pkg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




module.exports = Package_Tracking;
