const express = require('express');
const Package = require('../Package_detatils/Package_details');
const Package_Tracking = express.Router();


/**
 * @swagger
 * components:
 *   schemas:
 *     Package:
 *       type: object
 *       required:
 *         - TrackingNumber
 *         - Status
 *         - SenderName
 *         - RecipientName
 *         - Origin
 *         - Destination
 *         - Package_weight
 *         - Price
 *       properties:
 *         TrackingNumber:
 *           type: number
 *           description: The unique tracking number for the package
 *         Status:
 *           type: string
 *           enum: [pending, in-transit, delivered , not delivered]
 *           description: The current status of the package
 *         SenderName:
 *           type: string
 *           description: Full name of the sender
 *         RecipientName:
 *           type: string
 *           description: Full name of the recipient
 *         Origin:
 *           type: string
 *           description: Package's origin location
 *         Destination:
 *           type: string
 *           description: Package's destination location
 *         Package_weight:
 *           type: number
 *           description: Weight of the package in kilograms
 *         Price:
 *           type: number
 *           description: Price of the package
 *       example:
 *         TrackingNumber: 7
 *         Status: "in-transit"
 *         SenderName: "Revanth"
 *         RecipientName: "Rohit"
 *         Origin: "Pune"
 *         Destination: "Bangalore"
 *         Description: "Mobile"
 *         Package_weight: 0.71
 *         Price: 500
 */

/**
 * @swagger
 * /api/packages/add:
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
 *       500:
 *         description: Some server error
 */




// Create a new package
Package_Tracking.post('/add', async (req, res, next) => {
    try {
      const package = new Package(req.body);
      await package.save();
      res.status(201).json({
        success: true,
        message: 'Package created successfully!',
        data: package,
      });
    } catch (error) {
      return next(error);
    }
  });
  

/**
 * @swagger
 * /api/packages:
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
      const packages = await Package.find();
      res.status(200).json({
        success: true,
        data: packages,
      });
    } catch (error) {
      return next(error);
    }
  });
  
  /**
 * @swagger
 * /api/packages/{trackingNumber}:
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
      const package = await Package.findOne({
        TrackingNumber: req.params.trackingNumber,
      });
      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'Package not found!',
        });
      }
      res.status(200).json({
        success: true,
        data: package,
      });
    } catch (error) {
      return next(error);
    }
  });


/**
 * @swagger
 * /api/packages/{trackingNumber}:
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
      );
  
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
 * /api/packages/{trackingNumber}:
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
      const package = await Package.findOneAndUpdate(
        { TrackingNumber: req.params.trackingNumber },
        { Status: req.body.Status },
        { new: true, runValidators: true }
      );
      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'Package not found!',
        });
      }
      res.status(200).json({
        success: true,
        message: 'Package status updated successfully!',
        data: package,
      });
    } catch (error) {
      return next(error);
    }
  });
  
/**
 * @swagger
 * /api/packages/{trackingNumber}:
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
      const package = await Package.findOneAndDelete({
        TrackingNumber: req.params.trackingNumber,
      });
      if (!package) {
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

module.exports = Package_Tracking;
