const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Package = require('../Package_detatils/Package_details');
const Recipient = require('../Package_detatils/Recipient');
const Package_Tracking = require('../Package_Track/Package_Tracking');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/packages', Package_Tracking);

// Helper function to create a mock package with all necessary methods
const createMockPackage = (data) => ({
  ...data,
  toJSON: () => ({ ...data }),
  toObject: () => ({ ...data }),
  ID_proof: {
    data: null,
    contentType: null,
    size: 0
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Mock data
const mockPackage = {
  Status: 'pending',
  SenderName: 'John Smith',
  RecipientId: '507f1f77bcf86cd799439011',
  Origin: 'New York',
  Destination: 'Los Angeles',
  Package_weight: 2.5,
  Price: 50.00,
  Description: 'Test package'
};

const mockRecipient = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Jane Doe',
  address: '123 Test St',
  phone: '1234567890'
};

// Mock the mongoose models
jest.mock('../Package_detatils/Package_details');
jest.mock('../Package_detatils/Recipient');

const setupBasicMocks = () => {
  Package.find.mockReturnValue({
    exec: jest.fn().mockResolvedValue([])
  });
  
  Package.findOne.mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
    populate: jest.fn().mockReturnThis()
  });
  
  Package.findOneAndUpdate.mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
    populate: jest.fn().mockReturnThis()
  });

  Recipient.findById.mockResolvedValue(null);
};

describe('Package_Tracking Router', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a new package successfully', async () => {
      // Mock the Recipient.findById
      Recipient.findById.mockResolvedValue(mockRecipient);
      
      // Mock the Package.prototype.save
      Package.prototype.save = jest.fn().mockResolvedValue({
        ...mockPackage,
        TrackingNumber: 1
      });

      const response = await request(app)
        .post('/packages')
        .send(mockPackage)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Package created successfully!');
      expect(response.body.data).toHaveProperty('TrackingNumber');
    });

    it('should return 404 if recipient not found', async () => {
      Recipient.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/packages')
        .send(mockPackage)
        .expect(404);

      expect(response.body.message).toBe('Recipient not found');
    });

    it('should validate required fields', async () => {
      const invalidPackage = { ...mockPackage };
      delete invalidPackage.Status;

      const response = await request(app)
        .post('/packages')
        .send(invalidPackage)
        .expect(400);

      expect(response.body.message).toContain('Missing required field: Status');
    });
  });

  describe('GET /', () => {
    it('should retrieve all packages', async () => {
      const mockPackages = [
        createMockPackage({ ...mockPackage, TrackingNumber: 1 }),
        createMockPackage({ ...mockPackage, TrackingNumber: 2 })
      ];

      Package.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPackages)
      });

      const response = await request(app)
        .get('/packages')
        .expect(200);

      expect(Package.find).toHaveBeenCalledWith({}, { 'ID_proof.data': 0 });
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should handle database errors gracefully', async () => {
      Package.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .get('/packages')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('GET /:trackingNumber', () => {
    it('should retrieve a package by tracking number', async () => {
      const mockFoundPackage = {
        ...mockPackage,
        TrackingNumber: 1,
        ID_proof: {
          data: Buffer.from('test'),
          contentType: 'image/jpeg'
        }
      };

      Package.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFoundPackage)
      });

      await request(app)
        .get('/packages/1')
        .expect(200);
    });

    it('should return 404 if package not found', async () => {
      Package.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await request(app)
        .get('/packages/999')
        .expect(404);
    });
  });

  describe('PUT /:trackingNumber', () => {
    it('should update a package successfully', async () => {
      const updatedPackage = {
        ...mockPackage,
        Status: 'delivered'
      };

      Package.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedPackage)
      });

      const response = await request(app)
        .put('/packages/1')
        .send(updatedPackage)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.Status).toBe('delivered');
    });
  });

  describe('PATCH /:trackingNumber', () => {
    it('should partially update a package status', async () => {
      Package.findOneAndUpdate.mockResolvedValue({
        ...mockPackage,
        Status: 'delivered'
      });

      const response = await request(app)
        .patch('/packages/1')
        .send({ Status: 'delivered' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.Status).toBe('delivered');
    });
  });

  describe('DELETE /:trackingNumber', () => {
    it('should delete a package successfully', async () => {
      Package.findOneAndDelete.mockResolvedValue(mockPackage);

      const response = await request(app)
        .delete('/packages/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Package deleted successfully!');
    });

    it('should return 404 if package to delete not found', async () => {
      Package.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/packages/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Package not found!');
    });
  });

  describe('POST /add-many', () => {
    it('should create multiple packages successfully', async () => {
      const mockPackages = [mockPackage, { ...mockPackage, SenderName: 'Jane Doe' }];
      
      // Mock recipient check
      Recipient.findById.mockResolvedValue(mockRecipient);
      
      // Mock finding last package
      Package.findOne.mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ TrackingNumber: 0 })
      }));

      // Mock inserting packages
      const mockInsertedPackages = mockPackages.map((p, i) => ({
        ...p,
        TrackingNumber: i + 1,
        toObject: () => ({ ...p, TrackingNumber: i + 1 })
      }));
      Package.insertMany.mockResolvedValue(mockInsertedPackages);

      const response = await request(app)
        .post('/packages/add-many')
        .send({ packages: mockPackages })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should handle validation errors', async () => {
      const invalidPackages = [{ ...mockPackage, Status: 'invalid-status' }];
      
      Recipient.findById.mockResolvedValue(mockRecipient);
      Package.insertMany.mockRejectedValue(new Error('Validation error'));

      await request(app)
        .post('/packages/add-many')
        .send({ packages: invalidPackages })
        .expect(500);
    });
  });

  describe('POST /delete-many', () => {
    it('should delete multiple packages successfully', async () => {
      Package.find.mockResolvedValue([{ TrackingNumber: 1 }, { TrackingNumber: 2 }]);
      Package.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const response = await request(app)
        .post('/packages/delete-many')
        .send({ trackingNumbers: [1, 2] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(2);
    });
  });

  describe('POST /:trackingNumber/ID_Proof', () => {
    it('should upload ID proof successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test.jpg'
      };

      Package.findOneAndUpdate.mockResolvedValue({
        ...mockPackage,
        validateIDProof: jest.fn()
      });

      const response = await request(app)
        .post('/packages/1/ID_Proof')
        .attach('file', mockFile.buffer, mockFile.originalname)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('ID proof uploaded successfully');
    });
  });
});