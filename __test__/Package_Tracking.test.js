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

// Mock data
const mockPackage = {
  TrackingNumber: 12345,
  Status: 'in-transit',
  SenderName: 'John Doe',
  RecipientId: '507f1f77bcf86cd799439011', // Mock MongoDB ObjectId
  Origin: 'New York',
  Destination: 'Los Angeles',
  Package_weight: 2.5,
  Price: 50
};

const mockRecipient = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Jane Doe',
  address: '123 Main St',
  phone: '1234567890'
};

// Mock MongoDB and models
jest.mock('../Package_detatils/Package_details');
jest.mock('../Package_detatils/Recipient');

describe('Package Tracking API', () => {
  beforeAll(() => {
    mongoose.connect = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mongoose.disconnect();
  });

  describe('POST /', () => {
    it('should create a new package successfully', async () => {
      // Mock Recipient.findById
      Recipient.findById.mockResolvedValue(mockRecipient);
    
      // Mock Package.save
      jest.spyOn(Package.prototype, 'save').mockResolvedValue(mockPackage);

      const response = await request(app)
        .post('/packages')
        .send(mockPackage);
        

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject(mockPackage); // This should now match the expected value
    });

    it('should return 400 for missing required fields', async () => {
      const invalidPackage = { ...mockPackage };
      delete invalidPackage.TrackingNumber;

      const response = await request(app)
        .post('/packages')
        .send(invalidPackage);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when recipient not found', async () => {
      Recipient.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/packages')
        .send(mockPackage);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Recipient not found');
    });
  });

  describe('GET /', () => {
    it('should retrieve all packages', async () => {
      const mockPackages = [mockPackage];
      Package.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPackages)
      });

      const response = await request(app).get('/packages');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPackages);
    });
  });

  describe('GET /:trackingNumber', () => {
    it('should retrieve a package by tracking number', async () => {
      Package.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPackage)
      });

      const response = await request(app)
        .get('/packages/12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPackage);
    });

    it('should return 404 when package not found', async () => {
      Package.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/packages/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /:trackingNumber', () => {
    it('should update a package successfully', async () => {
      const updatedPackage = { ...mockPackage, Status: 'delivered' };
      Package.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedPackage)
      });

      const response = await request(app)
        .put('/packages/12345')
        .send(updatedPackage);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedPackage);
    });
  });

  describe('PATCH /:trackingNumber', () => {
    it('should update package status successfully', async () => {
      const updatedPackage = { ...mockPackage, Status: 'delivered' };
      Package.findOneAndUpdate.mockResolvedValue(updatedPackage);

      const response = await request(app)
        .patch('/packages/12345')
        .send({ Status: 'delivered' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedPackage);
    });
  });

  describe('DELETE /:trackingNumber', () => {
    it('should delete a package successfully', async () => {
      Package.findOneAndDelete.mockResolvedValue(mockPackage);

      const response = await request(app)
        .delete('/packages/12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Package deleted successfully!');
    });
  });

  describe('POST /add-many', () => {
    it('should add multiple packages successfully', async () => {
      const mockPackages = [mockPackage, { ...mockPackage, TrackingNumber: 12346 }];
      Recipient.findById.mockResolvedValue(mockRecipient);
      Package.insertMany.mockResolvedValue(mockPackages);

      const response = await request(app)
        .post('/packages/add-many')
        .send({ packages: mockPackages });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPackages);
    });
  });

  describe('POST /delete-many', () => {
    it('should delete multiple packages successfully', async () => {
      Package.find.mockResolvedValue([mockPackage]);
      Package.deleteMany.mockResolvedValue({ deletedCount: 1 });

      const response = await request(app)
        .post('/packages/delete-many')
        .send({ trackingNumbers: [12345] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(1);
    });
  });

  describe('Image Operations', () => {
    const mockBuffer = Buffer.from('mock-image-data');
    const mockFile = {
      buffer: mockBuffer,
      mimetype: 'image/jpeg'
    };

    describe('POST /:trackingNumber/add_image', () => {
      it('should upload an image successfully', async () => {
        Package.findOneAndUpdate.mockResolvedValue({
          ...mockPackage,
          Image: {
            data: mockBuffer,
            contentType: 'image/jpeg'
          }
        });

        // Note: Actual file upload testing would require additional setup
        // This is a simplified test
        const response = await request(app)
          .post('/packages/12345/add_image')
          .attach('file', mockBuffer, 'test.jpg');

        expect(response.status).toBe(200);
      });
    });

    describe('GET /:trackingNumber/get_image', () => {
      it('should retrieve an image successfully', async () => {
        Package.findOne.mockResolvedValue({
          ...mockPackage,
          Image: {
            data: mockBuffer,
            contentType: 'image/jpeg'
          }
        });

        const response = await request(app)
          .get('/packages/12345/get_image');

        expect(response.status).toBe(200);
      });
    });
  });
});