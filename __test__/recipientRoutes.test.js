const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Recipient = require('../Package_detatils/Recipient');
const recipientRoutes = require('../Package_Track/recipientRoutes');

const app = express();
app.use(express.json());
app.use('/recipients', recipientRoutes);

// Mock data
const mockRecipient = {
  RecipientName: "John Doe",
  RecipientEmail: "john.doe@example.com",
  RecipientContact: 1234567890,
  Address: "123 Test St"
};

const mockRecipients = [
  mockRecipient,
  {
    RecipientName: "Jane Doe",
    RecipientEmail: "jane.doe@example.com",
    RecipientContact: 9876543210,
    Address: "456 Test Ave"
  }
];

// Mock the Recipient model
jest.mock('../Package_detatils/Recipient');

describe('Recipient Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /recipients', () => {
    test('should create a new recipient successfully', async () => {
      Recipient.prototype.save.mockResolvedValue(mockRecipient);

      const response = await request(app)
        .post('/recipients')
        .send(mockRecipient);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRecipient);
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteRecipient = {
        RecipientName: "John Doe",
        // Missing other required fields
      };

      const response = await request(app)
        .post('/recipients')
        .send(incompleteRecipient);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid email format', async () => {
      const invalidEmailRecipient = {
        ...mockRecipient,
        RecipientEmail: "invalid-email"
      };

      const response = await request(app)
        .post('/recipients')
        .send(invalidEmailRecipient);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /recipients', () => {
    test('should get all recipients', async () => {
      Recipient.find.mockResolvedValue(mockRecipients);

      const response = await request(app)
        .get('/recipients');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipients);
    });

    test('should handle server error', async () => {
      Recipient.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/recipients');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /recipients/:RecipientContact', () => {
    test('should get recipient by contact number', async () => {
      const mockRecipientWithID = {
        ...mockRecipient,
        ID_proof: {
          data: Buffer.from('mock-data'),
          contentType: 'image/jpeg'
        }
      };

      Recipient.findOne.mockResolvedValue(mockRecipientWithID);

      const response = await request(app)
        .get('/recipients/1234567890');

      expect(response.status).toBe(200);
    });

    test('should return 404 if recipient not found', async () => {
      Recipient.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/recipients/1234567890');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /recipients/:RecipientContact', () => {
    test('should update recipient successfully', async () => {
      const updatedRecipient = {
        ...mockRecipient,
        RecipientName: "Updated Name"
      };

      Recipient.findOneAndUpdate.mockResolvedValue(updatedRecipient);

      const response = await request(app)
        .put('/recipients/1234567890')
        .send(updatedRecipient);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedRecipient);
    });

    test('should return 404 if recipient not found', async () => {
      Recipient.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/recipients/1234567890')
        .send(mockRecipient);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /recipients/:RecipientContact', () => {
    test('should delete recipient successfully', async () => {
      Recipient.findOneAndDelete.mockResolvedValue(mockRecipient);

      const response = await request(app)
        .delete('/recipients/1234567890');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Recipient deleted successfully.');
    });

    test('should return 404 if recipient not found', async () => {
      Recipient.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/recipients/1234567890');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /recipients/add-many', () => {
    test('should add multiple recipients successfully', async () => {
      Recipient.insertMany.mockResolvedValue(mockRecipients);

      const response = await request(app)
        .post('/recipients/add-many')
        .send({ recipients: mockRecipients });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockRecipients);
    });

    test('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/recipients/add-many')
        .send({ recipients: [] });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /recipients/:RecipientContact/ID_Proof', () => {
    test('should upload ID proof successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('mock-image-data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test.jpg'
      };

      Recipient.findOneAndUpdate.mockResolvedValue(mockRecipient);

      const response = await request(app)
        .post('/recipients/1234567890/ID_Proof')
        .attach('image', mockFile.buffer, mockFile.originalname);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('ID proof uploaded successfully');
    });
  });
});