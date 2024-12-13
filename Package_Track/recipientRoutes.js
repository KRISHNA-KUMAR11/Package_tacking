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
 * /api/recipients/{id}:
 *   get:
 *     summary: Get a recipient by ID
 *     tags: [Recipients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The recipient ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipient retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipient'
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recipient = await Recipient.findById(id);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    res.status(200).json(recipient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/recipients/{id}:
 *   put:
 *     summary: Update a recipient by ID
 *     tags: [Recipients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The recipient ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipient'
 *     responses:
 *       200:
 *         description: Recipient updated successfully
 *       400:
 *         description: Invalid input or recipient not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { RecipientName, RecipientEmail,  RecipientContact, Address } = req.body;

    const updatedRecipient = await Recipient.findByIdAndUpdate(
      id,
      { RecipientName, RecipientEmail, RecipientContact, Address },
      { new: true, runValidators: true }
    );

    if (!updatedRecipient) {
      return res.status(400).json({ error: 'Recipient not found' });
    }

    res.status(200).json(updatedRecipient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/recipients/{id}:
 *   delete:
 *     summary: Delete a recipient by ID
 *     tags: [Recipients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The recipient ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipient deleted successfully
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecipient = await Recipient.findByIdAndDelete(id);

    if (!deletedRecipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    res.status(200).json({ message: 'Recipient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;