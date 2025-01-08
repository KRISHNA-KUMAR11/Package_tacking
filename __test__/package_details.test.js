const mongoose = require('mongoose');
const Package = require('../Package_detatils/Package_details'); // Adjust the path if needed
  
describe('Package_details Model Test Suite', () => {
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

  it('should create a package with valid data', async () => {
    const validPackage = new Package({
      TrackingNumber: Math.floor(Math.random() * 100000),
      Status: 'in-transit',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 2.5,
      Price: 50,
    });

    const savedPackage = await validPackage.save();

    expect(savedPackage._id).toBeDefined();
    expect(savedPackage.Status).toBe('in-transit');
  });

  it('should throw a validation error for an invalid status', async () => {
    const invalidPackage = new Package({
      TrackingNumber: 12346,
      Status: 'invalid-status',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 2.5,
      Price: 50,
    });

    let err;
    try {
      await invalidPackage.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['Status'].message).toMatch(/invalid-status.*Status/);

  });

  it('should throw a validation error for a non-numeric weight', async () => {
    const invalidPackage = new Package({
      TrackingNumber: 12347,
      Status: 'in-transit',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 'invalid-weight',
      Price: 50,
    });

    let err;
    try {
      await invalidPackage.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['Package_weight'].message).toContain(
        'Cast to Number failed for value'
      );
      
  });

  it('should throw a validation error for invalid image size', async () => {
    const invalidPackage = new Package({
      TrackingNumber: 12348,
      Status: 'in-transit',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 2.5,
      Price: 50,
      Image: {
        data: Buffer.alloc(6 * 1024 * 1024), // 6 MB
        contentType: 'image/png',
        size: 6 * 1024 * 1024,
      },
    });

    let err;
    try {
      await invalidPackage.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['Image.size'].message).toBe('Image size must be less than 5 MB.');
  });
});
