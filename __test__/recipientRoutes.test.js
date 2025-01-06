const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Recipient = require('../Package_detatils/Recipient');
const recipientRoutes = require('../Package_Track/recipientRoutes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/recipients', recipientRoutes);

// Mock data
const mockRecipient = {
  RecipientName: 'John Doe',
  RecipientEmail: 'john@example.com',
  RecipientContact: 1234567890,
  Address: '123 Test St'
};

const mockRecipients = [
  mockRecipient,
  {
    RecipientName: 'Jane Doe',
    RecipientEmail: 'jane@example.com',
    RecipientContact: 9876543210,
    Address: '456 Test Ave'
  }
];

// Setup and teardown
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/test-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Recipient.deleteMany({});
});

describe('Recipient Routes', () => {
  // POST /recipients - Create new recipient
  describe('POST /', () => {
    it('should create a new recipient', async () => {
      const response = await request(app)
        .post('/recipients')
        .send(mockRecipient);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject(mockRecipient);
    });

    it('should fail if required fields are missing', async () => {
      const invalidRecipient = {
        RecipientName: 'John Doe'
      };

      const response = await request(app)
        .post('/recipients')
        .send(invalidRecipient);

      expect(response.status).toBe(400);
    });
  });

  // GET /recipients - Get all recipients
  describe('GET /', () => {
    it('should return all recipients', async () => {
      // Create test recipients
      await Recipient.insertMany(mockRecipients);

      const response = await request(app).get('/recipients');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject(mockRecipients[0]);
    });

    it('should return empty array when no recipients exist', async () => {
      const response = await request(app).get('/recipients');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  // GET /recipients/:RecipientContact - Get recipient by contact
  describe('GET /:RecipientContact', () => {
    it('should return recipient by contact number', async () => {
      await Recipient.create(mockRecipient);

      const response = await request(app)
        .get(`/recipients/${mockRecipient.RecipientContact}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mockRecipient);
    });

    it('should return 404 if recipient not found', async () => {
      const response = await request(app)
        .get('/recipients/999999999');

      expect(response.status).toBe(404);
    });
  });

  // PUT /recipients/:RecipientContact - Update recipient
  describe('PUT /:RecipientContact', () => {
    it('should update recipient fully', async () => {
      await Recipient.create(mockRecipient);

      const updatedData = {
        RecipientName: 'Updated Name',
        RecipientEmail: 'updated@example.com',
        Address: 'Updated Address'
      };

      const response = await request(app)
        .put(`/recipients/${mockRecipient.RecipientContact}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updatedData);
    });
  });

  // PATCH /recipients/:RecipientContact - Partial update
  describe('PATCH /:RecipientContact', () => {
    it('should update recipient partially', async () => {
      await Recipient.create(mockRecipient);

      const update = {
        RecipientName: 'Updated Name'
      };

      const response = await request(app)
        .patch(`/recipients/${mockRecipient.RecipientContact}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.RecipientName).toBe(update.RecipientName);
      expect(response.body.RecipientEmail).toBe(mockRecipient.RecipientEmail);
    });
  });

  // DELETE /recipients/:RecipientContact - Delete recipient
  describe('DELETE /:RecipientContact', () => {
    it('should delete recipient', async () => {
      await Recipient.create(mockRecipient);

      const response = await request(app)
        .delete(`/recipients/${mockRecipient.RecipientContact}`);

      expect(response.status).toBe(200);
      
      const deletedRecipient = await Recipient.findOne({ 
        RecipientContact: mockRecipient.RecipientContact 
      });
      expect(deletedRecipient).toBeNull();
    });
  });

  // POST /recipients/add-many - Bulk add recipients
  describe('POST /add-many', () => {
    it('should add multiple recipients', async () => {
      const response = await request(app)
        .post('/recipients/add-many')
        .send({ recipients: mockRecipients });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveLength(2);
    });

    it('should fail with invalid input', async () => {
      const response = await request(app)
        .post('/recipients/add-many')
        .send({ recipients: [] });

      expect(response.status).toBe(400);
    });
  });

  // POST /recipients/delete-many - Bulk delete recipients
  describe('POST /delete-many', () => {
    it('should delete multiple recipients', async () => {
      await Recipient.insertMany(mockRecipients);

      const contactNumbers = mockRecipients.map(r => r.RecipientContact);
      
      const response = await request(app)
        .post('/recipients/delete-many')
        .send({ contactNumbers });

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(2);
    });
  });

  // Test file upload endpoints
  describe('File Upload Endpoints', () => {
    it('should upload image for recipient', async () => {
      await Recipient.create(mockRecipient);

      const response = await request(app)
        .post(`/recipients/${mockRecipient.RecipientContact}/add_image`)
        .attach('image', Buffer.from('fake-image'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Image uploaded successfully');
    });

    it('should get recipient image', async () => {
      const recipient = await Recipient.create({
        ...mockRecipient,
        Image: {
          data: Buffer.from('fake-image'),
          contentType: 'image/jpeg'
        }
      });

      const response = await request(app)
        .get(`/recipients/${recipient.RecipientContact}/get_image`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
    });
  });
});