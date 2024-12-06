const express = require('express');
const Package = require('../Package_detatils/Package_details');
const Package_Tracking = express.Router();


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
