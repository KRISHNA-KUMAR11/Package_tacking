const express = require ('express');
const Recipient = require('../Package_detatils/Recipient');

const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory buffer
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
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

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipient:
 *       type: object
 *       required:
 *         - RecipientName
 *         - RecipientEmail
 *         - RecipientContact
 *         - Address
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID for the recipient
 *         RecipientName:
 *           type: string
 *           description: The name of the recipient
 *         RecipientEmail:
 *           type: string
 *           description: The email of the recipient
 *         RecipientContact:
 *           type: number
 *           description: Contact number of the recipient (10-15 digits)
 *         Address:
 *           type: string
 *           description: The address of the recipient
 *       example:
 *         RecipientName: John Doe
 *         RecipientEmail: john.doe@example.com
 *         RecipientContact: 1234567890
 *         Address: 123 Main Street, Springfield
 */

/**
 * @swagger
 * tags:
 *   name: Recipients
 *   description: API for managing Recipients
 */

/**
 * @swagger
 * /recipients/:
 *   post:
 *     summary: Create a new recipient
 *     tags: [Recipients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipient'
 *     responses:
 *       201:
 *         description: Recipient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipient'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */

const validateRecipient = (req, res, next) => {
  const { RecipientName, RecipientEmail, RecipientContact, Address } = req.body;

  // Check for missing fields
  if (!RecipientName || !RecipientEmail || !RecipientContact || !Address) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      requiredFields: ['RecipientName', 'RecipientEmail', 'RecipientContact', 'Address'],
    });
  }

  // Validate RecipientEmail using basic regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(RecipientEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  // Validate RecipientContact (ensure it's a string of 10 to 15 digits)
  const phoneRegex = /^[0-9]{10,15}$/;  // Allows 10 to 15 digits
  if (!phoneRegex.test(RecipientContact)) {
    return res.status(400).json({
      success: false,
      message: 'RecipientContact must be a string of 10 to 15 digits',
    });
  }

  next();
};

// Create a recipient
router.post('/', validateRecipient, async (req, res, next) => {
  try {
    const newRecipient = new Recipient(req.body);
    const savedRecipient = await newRecipient.save();

    res.status(201).json({
      success: true,
      message: 'Recipient created successfully!',
      data: savedRecipient,
    });

  } catch (error) {
    next(error);
  }
});



/**
 * @swagger
 * /recipients:
 *   get:
 *     summary: Get all recipients
 *     tags: [Recipients]
 *     responses:
 *       200:
 *         description: List of recipients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipient'
 *       500:
 *         description: Server error
 */

router.get('/', async (req, res, next) => {
  try {
    const recipients = await Recipient.find({}, { 'ID_proof.data': 0 }); // Exclude ID_proof data
    res.status(200).json(recipients);
  } catch (err) {
    res.status(500).send(err.message);
  }
});



/**
 * @swagger
 * /recipients/{RecipientContact}:
 *   get:
 *     summary: Get a recipient by contact
 *     tags: [Recipients]
 *     parameters:
 *       - in: path
 *         name: RecipientContact
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipient's contact number
 *     responses:
 *       200:
 *         description: The recipient information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipient'
 *       404:
 *         description: Recipient not found
 */

router.get('/:RecipientContact', async (req, res) => {
  try {
    const { RecipientContact } = req.params;

    const recipient = await Recipient.findOne({ RecipientContact });

    if (!recipient || !recipient.ID_proof.data ) {
      return res.status(404).send('ID proof not found');
    }
    
    res.set('Content-Type', recipient.ID_proof.contentType);
    res.send(recipient.ID_proof.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /recipients/{RecipientContact}:
 *   put:
 *     summary: Fully update a recipient
 *     tags: [Recipients]
 *     parameters:
 *       - in: path
 *         name: RecipientContact
 *         schema:
 *           type: number
 *         required: true
 *         description: The recipient's contact number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipient'
 *     responses:
 *       200:
 *         description: Recipient updated successfully
 *       404:
 *         description: Recipient not found
 */

router.put('/:RecipientContact', async (req, res) => {
    try {
        const { RecipientContact } = req.params;
        const { RecipientName, RecipientEmail, Address } = req.body;

        // Validate required fields
        if (!RecipientName || !RecipientEmail || !Address) {
            return res.status(400).json({ error: 'RecipientName, RecipientEmail, and Address are required.' });
        }

        // Find and update the recipient
        const updatedRecipient = await Recipient.findOneAndUpdate(
            { RecipientContact: RecipientContact },
            { RecipientName, RecipientEmail, Address },
            { new: true, runValidators: true } // Return the updated document and validate inputs
        );

        if (!updatedRecipient) {
            return res.status(404).json({ error: 'Recipient not found with the given contact number' });
        }

        res.status(200).json(updatedRecipient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/**
 * @swagger
 * /recipients/{RecipientContact}:
 *   patch:
 *     summary: Partially update a recipient
 *     tags: [Recipients]
 *     parameters:
 *       - in: path
 *         name: RecipientContact
 *         schema:
 *           type: number
 *         required: true
 *         description: The recipient's contact number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipient'
 *     responses:
 *       200:
 *         description: Recipient updated successfully
 *       404:
 *         description: Recipient not found
 */

router.patch('/:RecipientContact', async (req, res) => {
  try {
      const { RecipientContact } = req.params;
      const updates = req.body;

      // If RecipientContact is being updated, ensure it's unique
      if (updates.RecipientContact) {
          const existingContact = await Recipient.findOne({ RecipientContact: updates.RecipientContact });
          if (existingContact && updates.RecipientContact != RecipientContact) {
              return res.status(400).json({ error: 'The new contact number is already in use.' });
          }
      }

      // Find and update the recipient
      const updatedRecipient = await Recipient.findOneAndUpdate(
          { RecipientContact },
          updates,
          { new: true, runValidators: true } // Return the updated document and validate inputs
      );

      if (!updatedRecipient) {
          return res.status(404).json({ error: 'Recipient not found with the given contact number' });
      }

      res.status(200).json(updatedRecipient);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /recipients/{RecipientContact}:
 *   delete:
 *     summary: Delete a recipient
 *     tags: [Recipients]
 *     parameters:
 *       - in: path
 *         name: RecipientContact
 *         schema:
 *           type: number
 *         required: true
 *         description: The recipient's contact number
 *     responses:
 *       200:
 *         description: Recipient deleted successfully
 *       404:
 *         description: Recipient not found
 */

router.delete('/:RecipientContact', async (req, res) => {
  try {
      const { RecipientContact } = req.params;
      const deletedRecipient = await Recipient.findOneAndDelete({ RecipientContact });
      if (!deletedRecipient) return res.status(404).json({ error: 'Recipient not found.' });
      res.status(200).json({ message: 'Recipient deleted successfully.' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /recipients/add-many:
 *   post:
 *     summary: Bulk adding recipients
 *     tags: [Recipients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Recipient'
 *     responses:
 *       201:
 *         description: Recipients added successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */


router.post('/add-many', async (req, res, next) => {
  try {
    const recipients = req.body.recipients; // Array of recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Invalid input. An array of recipients is required.' });
    }

    const result = await Recipient.insertMany(recipients, { ordered: true });
    res.status(201).json({ message: 'Recipients added successfully!', data: result });
  } catch (error) {
    next(error); // Pass errors to the error-handling middleware
  }
});


/**
 * @swagger
 * /recipients/import:
 *   post:
 *     summary: Bulk importing recipients from a JSON file
 *     tags: [Recipients]
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
 *                 description: JSON file containing an array of recipients
 *     responses:
 *       201:
 *         description: Recipients imported successfully
 *       400:
 *         description: Invalid file content
 *       500:
 *         description: Server error
 */

router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required.' });
    }

    const recipientsData = JSON.parse(req.file.buffer.toString()); // Parse file content
    if (!Array.isArray(recipientsData) || recipientsData.length === 0) {
      return res.status(400).json({ error: 'Invalid file content. An array of recipients is required.' });
    }

    const result = await Recipient.insertMany(recipientsData, { ordered: true });
    res.status(201).json({ message: 'Recipients imported successfully!', data: result });
  } catch (error) {
    next(error); // Pass errors to the error-handling middleware
  }
});

/**
 * @swagger
 * /recipients/delete-many:
 *   post:
 *     summary: Delete multiple recipients by their contact numbers
 *     tags: [Recipients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactNumbers
 *             properties:
 *               contactNumbers:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of recipient contact numbers to delete
 *             example:
 *               contactNumbers: [1234567890, 9876543210]
 *     responses:
 *       200:
 *         description: Recipients deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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

router.post('/delete-many', async (req, res, next) => {
  try {
    const { contactNumbers } = req.body;

    // Validate input
    if (!Array.isArray(contactNumbers) || contactNumbers.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input. An array of contact numbers is required.' 
      });
    }

    // Verify all items are numbers
    if (!contactNumbers.every(num => typeof num === 'number')) {
      return res.status(400).json({ 
        error: 'All contact numbers must be numeric values.' 
      });
    }

    // Find existing recipients before deletion
    const existingRecipients = await Recipient.find({
      RecipientContact: { $in: contactNumbers }
    });

    const existingNumbers = existingRecipients.map(r => r.RecipientContact);
    const notFoundNumbers = contactNumbers.filter(num => !existingNumbers.includes(num));

    // Delete the recipients
    const deleteResult = await Recipient.deleteMany({
      RecipientContact: { $in: contactNumbers }
    });

    res.status(200).json({
      message: 'Recipients deleted successfully',
      deletedCount: deleteResult.deletedCount,
      notFoundNumbers: notFoundNumbers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /recipients/update-many:
 *   post:
 *     summary: Update multiple recipients by their contact numbers
 *     tags: [Recipients]
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
 *                     - RecipientContact
 *                   properties:
 *                     RecipientContact:
 *                       type: number
 *                       description: Contact number to identify the recipient
 *                     RecipientName:
 *                       type: string
 *                       description: New name for the recipient
 *                     RecipientEmail:
 *                       type: string
 *                       description: New email for the recipient
 *                     Address:
 *                       type: string
 *                       description: New address for the recipient
 *             example:
 *               updates: [
 *                 {
 *                   RecipientContact: 1234567890,
 *                   RecipientName: "Updated Name",
 *                   Address: "New Address"
 *                 },
 *                 {
 *                   RecipientContact: 9876543210,
 *                   RecipientEmail: "new.email@example.com"
 *                 }
 *               ]
 *     responses:
 *       200:
 *         description: Recipients updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: number
 *                 notFoundNumbers:
 *                   type: array
 *                   items:
 *                     type: number
 *                 updatedRecipients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipient'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

router.post('/update-many', async (req, res, next) => {
  try {
    const { updates } = req.body;

    // Validate input
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. An array of updates is required.'
      });
    }

    // Verify all items have RecipientContact
    if (!updates.every(update => typeof update.RecipientContact === 'number')) {
      return res.status(400).json({
        success: false,
        message: 'Each update must include a numeric RecipientContact.'
      });
    }

    const contactNumbers = updates.map(update => update.RecipientContact);
    const updatedRecipients = [];
    const notFoundNumbers = [];

    // Process updates one by one to handle validation properly
    for (const update of updates) {
      const { RecipientContact, ...updateData } = update;

      // Find and update the recipient
      const updatedRecipient = await Recipient.findOneAndUpdate(
        { RecipientContact },
        updateData,
        { new: true, runValidators: true }
      );

      if (updatedRecipient) {
        updatedRecipients.push(updatedRecipient);
      } else {
        notFoundNumbers.push(RecipientContact);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Recipients update operation completed',
      updatedCount: updatedRecipients.length,
      notFoundNumbers,
      updatedRecipients
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /recipients/{RecipientContact}/ID_Proof:
 *   post:
 *     summary: Upload or update an ID proof image for a recipient
 *     tags:
 *       - Recipients
 *     parameters:
 *       - in: path
 *         name: RecipientContact
 *         required: true
 *         schema:
 *           type: number
 *         description: Contact number of the recipient
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: ID proof file
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
 *                 recipient:
 *                   type: object
 *                   $ref: '#/components/schemas/Recipient'
 *       400:
 *         description: ID_Proof file is required or invalid input
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Server error
 * 
 * 
 */



router.post('/:RecipientContact/ID_Proof', fileUpload.single('image'), async (req, res) => {
  try {
    const { RecipientContact } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'file is required.' });
    }

    const recipient = await Recipient.findOneAndUpdate(
      { RecipientContact },
      {
        'ID_proof.data': req.file.buffer,
        'ID_proof.contentType': req.file.mimetype,
        'ID_proof.size': req.file.size,
      },
      { new: true }
    );

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found.' });
    }

    res.status(200).json({
      message: 'ID proof uploaded successfully',
      fileDetails: {
        originalName: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});


/**
 * @swagger
 * /recipients/{RecipientContact}/ID_Proof:
 *   get:
 *     summary: Retrieve the ID proof image of a recipient
 *     tags:
 *       - Recipients
 *     parameters:
 *       - in: path
 *         name: RecipientContact
 *         required: true
 *         schema:
 *           type: number
 *         description: Contact number of the recipient
 *     responses:
 *       200:
 *         description: ID_Proof retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: ID_Proof not found for the given recipient
 *       500:
 *         description: Server error
 */


router.get('/:RecipientContact/ID_Proof', async (req, res) => {
  try {
    const { RecipientContact } = req.params;

    const recipient = await Recipient.findOne({ RecipientContact });

    if (!recipient || !recipient.ID_proof || !recipient.ID_proof.data) {
      return res.status(404).json({ error: 'ID_Proof not found for the given recipient.' });
    }

    res.set('Content-Type', recipient.ID_proof.contentType);
    res.send(recipient.ID_proof.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Swagger for deleting the image
/**
 * @swagger
 * /recipients/{RecipientContact}/delete_ID_Proof:
 *   delete:
 *     summary: Delete the ID proof of a recipient
 *     tags:
 *       - Recipients
 *     parameters:
 *       - in: path
 *         name: RecipientContact
 *         required: true
 *         schema:
 *           type: number
 *         description: Contact number of the recipient
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
 *                 recipient:
 *                   type: object
 *                   $ref: '#/components/schemas/Recipient'
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Server error
 */


router.delete('/:RecipientContact/delete_ID_Proof', async (req, res) => {
  try {
    const { RecipientContact } = req.params;

    const recipient = await Recipient.findOneAndUpdate(
      { RecipientContact },
      { $unset: { 'ID_proof.data': '', 'ID_proof.contentType': '', 'ID_proof.size': '' } },
      { new: true }
    );

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found.' });
    }

    res.status(200).json({ message: 'ID_Proof deleted successfully', recipient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;