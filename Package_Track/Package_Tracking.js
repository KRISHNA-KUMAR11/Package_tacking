const express = require('express');
const Package = require('../Package_detatils/Package_details');
const Package_Tracking = express.Router();


Package_Tracking.post('/', async (req, res) => {
    try {
        const newPackage = new Package(req.body);
        const savedPackage = await newPackage.save();
        res.status(201).json(savedPackage);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

Package_Tracking.get('/', async (req, res) => {
    try {
        const packages = await Package.find();
        res.status(200).json(packages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

Package_Tracking.get('/:id', async (req, res) => {
    try {
        const package = await Package.findById(req.params.id);
        if (!package) {
            return res.status(404).json({ error: "Package not found" });
        }
        res.status(200).json;
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

Package_Tracking.put('/:id', async (req, res) => {
    try {
        const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPackage) {
            return res.status(404).json({ error: "Package not found" });
        }
        res.status(200).json(updatedPackage);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

Package_Tracking.delete('/:id', async (req, res) => {
    try {
        const deletedPackage = await Package.findByIdAndDelete(req.params.id);
        if (!deletedPackage) {
            return res.status(404).json({ error: "Package not found" });
        }
        res.status(200).json({ message: "Package deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = Package_Tracking;
