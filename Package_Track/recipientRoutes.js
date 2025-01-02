const express = require ('express');
const Recipient = require('../Package_detatils/Recipient');

const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory buffer
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
});
 
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed!'));
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
 *         description: Invalid input or duplicate email
 *       500:
 *         description: Server error
 */


// Create a recipient
router.post('/', async (req, res, next) => {
  try {
    const { RecipientName, RecipientEmail, RecipientContact, Address } = req.body;
    const newRecipient = new Recipient(req.body);
    const savedRecipient = await newRecipient.save();
      res.status(201).json({
        success: true,
        message: 'Recipient created successfully!',
        data: savedRecipient,
      });
    res.status(201).json(newRecipient);
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

// Get all recipients
router.get('/', async (req, res, next) => {
  try {
    const recipients = await Recipient.find();
    res.json(recipients);
  } catch (error) {
    next(error);
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
 *           type: number
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

      // Find the recipient by contact number
      const recipient = await Recipient.findOne({ RecipientContact: RecipientContact });

      if (!recipient) {
          return res.status(404).json({ error: 'Recipient not found with the given contact number' });
      }

      res.status(200).json(recipient);
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
 * /recipients/{RecipientContact}/add_image:
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
 *                 description: ID proof image file
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *         description: Image file is required or invalid input
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Server error
 * 
 * /recipients/{RecipientContact}/get_image:
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
 *         description: Image retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found for the given recipient
 *       500:
 *         description: Server error
 */



router.post('/:RecipientContact/add_image', imageUpload.single('image'), async (req, res) => {
  try {
    const { RecipientContact } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required.' });
    }

    const recipient = await Recipient.findOneAndUpdate(
      { RecipientContact },
      {
        Image: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      },
      { new: true }
    );

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found.' });
    }

    res.status(200).json({ message: 'Image uploaded successfully', recipient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /recipients/{RecipientContact}/get_image:
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
 *         description: Image retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found for the given recipient
 *       500:
 *         description: Server error
 */

// Get image
router.get('/:RecipientContact/get_image', async (req, res) => {
  try {
    const { RecipientContact } = req.params;

    const recipient = await Recipient.findOne({ RecipientContact });

    if (!recipient || !recipient.Image) {
      return res.status(404).json({ error: 'Image not found for the given recipient.' });
    }

    res.set('Content-Type', recipient.Image.contentType);
    res.send(recipient.Image.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /recipients/{RecipientContact}/delete_image:
 *   delete:
 *     summary: Delete the ID proof image of a recipient
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
 *         description: Image deleted successfully
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

// Delete image
router.delete('/:RecipientContact/delete_image', async (req, res) => {
  try {
    const { RecipientContact } = req.params;

    const recipient = await Recipient.findOneAndUpdate(
      { RecipientContact },
      { $unset: { Image: "" } },
      { new: true }
    );

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found.' });
    }

    res.status(200).json({ message: 'Image deleted successfully', recipient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;