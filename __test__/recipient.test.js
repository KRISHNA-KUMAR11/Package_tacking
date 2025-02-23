const mongoose = require('mongoose');
const Recipient = require('../Package_detatils/Recipient'); // Adjust the path if necessary

describe('Recipient Model Test Suite', () => {
  beforeAll(async () => {
    // Connect to a mock MongoDB server
    await mongoose.connect('mongodb://localhost:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Disconnect from the mock server
    await mongoose.disconnect();
  });

  it('should create a valid recipient', async () => {
    const validRecipient = new Recipient({
      RecipientName: 'John Doe',
      RecipientEmail: 'johndoe@example.com',
      RecipientContact: 1234567890,
      Address: '123 Main St, New York, NY',
      ID_proof: {
        data: Buffer.from('valid-pdf-file'),
        contentType: 'application/pdf',
        size: 1024 * 1024, // 1 MB
      },
    });

    const savedRecipient = await validRecipient.save();
    expect(savedRecipient._id).toBeDefined();
    expect(savedRecipient.RecipientName).toBe('John Doe');
  });

  it('should throw validation error for invalid email', async () => {
    const invalidRecipient = new Recipient({
      RecipientName: 'John Doe',
      RecipientEmail: 'invalid-email',
      RecipientContact: 1234567890,
      Address: '123 Main St, New York, NY',
    });

    let err;
    try {
      await invalidRecipient.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['RecipientEmail'].message).toBe('invalid-email is not a valid email address');
  });

  it('should throw validation error for short address', async () => {
    const invalidRecipient = new Recipient({
      RecipientName: 'John Doe',
      RecipientEmail: 'johndoe@example.com',
      RecipientContact: 1234567890,
      Address: 'Short',
    });

    let err;
    try {
      await invalidRecipient.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['Address'].message).toBe('Address must be at least 10 characters long');
  });

  it('should throw validation error for invalid contact number', async () => {
    const invalidRecipient = new Recipient({
      RecipientName: 'John Doe',
      RecipientEmail: 'johndoe@example.com',
      RecipientContact: 12345,
      Address: '123 Main St, New York, NY',
    });

    let err;
    try {
      await invalidRecipient.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['RecipientContact'].message).toBe('12345 is not a valid phone number. Must be 10 to 15 digits long');
  });

  it('should throw validation error for ID proof size exceeding limit', async () => {
    const invalidRecipient = new Recipient({
      RecipientName: 'John Doe',
      RecipientEmail: 'johndoe@example.com',
      RecipientContact: 1234567890,
      Address: '123 Main St, New York, NY',
      ID_proof: {
        data: Buffer.alloc(6 * 1024 * 1024), // 6 MB file
        contentType: 'application/pdf',
        size: 6 * 1024 * 1024,
      },
    });

    let err;
    try {
      await invalidRecipient.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['ID_proof.size'].message).toBe('File size must be less than 5 MB.');
  });

  it('should throw validation error for unsupported ID proof format', async () => {
    const invalidRecipient = new Recipient({
      RecipientName: 'John Doe',
      RecipientEmail: 'johndoe@example.com',
      RecipientContact: 1234567890,
      Address: '123 Main St, New York, NY',
      ID_proof: {
        data: Buffer.from('test-data'),
        contentType: 'image/bmp', // Unsupported format
        size: 1024,
      },
    });

    let err;
    try {
      await invalidRecipient.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['ID_proof.contentType'].message).toBe(
      'Only JPEG, PNG, GIF, WebP, and PDF formats are allowed.'
    );
  });
});