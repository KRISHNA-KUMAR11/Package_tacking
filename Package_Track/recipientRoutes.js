const express = require('express');
const Recipient = require('../Package_detatils/Recipient');

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
 * /api/recipients/add:
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
router.post('/add', async (req, res, next) => {
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
 * /api/recipients:
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


module.exports = router;