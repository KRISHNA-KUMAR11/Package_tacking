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

  afterEach(async () => {
    // Clean up after each test
    await Package.deleteMany({});
  });

  // ✅ Test: Create a valid package
  it('should create a package with valid data', async () => {
    const validPackage = new Package({
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
    expect(savedPackage.Package_weight).toBe('2.50 kg');
    expect(savedPackage.Price).toBe('$50.00');
  });

  // ❌ Test: Invalid status
  it('should throw a validation error for an invalid status', async () => {
    const invalidPackage = new Package({
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
    expect(err.errors['Status'].message).toMatch(/`invalid-status` is not a valid enum value for path `Status`/);
  });

  // ❌ Test: Invalid sender name
  it('should throw a validation error for an invalid sender name', async () => {
    const invalidPackage = new Package({
      Status: 'pending',
      SenderName: 'John123', // Invalid name
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
    expect(err.errors['SenderName'].message).toBe('John123 is not a valid name! Only letters and spaces are allowed.');
  });

  // ❌ Test: Invalid package weight
  it('should throw a validation error for an invalid package weight', async () => {
    const invalidPackage = new Package({
      Status: 'in-transit',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 'invalid-weight', // Invalid weight
      Price: 50,
    });

    let err;
    try {
      await invalidPackage.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['Package_weight'].message).toContain('Cast to Number failed for value');
  });

  // ❌ Test: Invalid price
  it('should throw a validation error for an invalid price', async () => {
    const invalidPackage = new Package({
      Status: 'pending',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 2.5,
      Price: -50, // Invalid price
    });

    let err;
    try {
      await invalidPackage.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['Price'].message).toBe('-50 is not a valid price! Must be a positive number');
  });

  // ❌ Test: Invalid ID proof size
  it('should throw a validation error for an ID proof file size exceeding 5 MB', async () => {
    const invalidPackage = new Package({
      Status: 'pending',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 2.5,
      Price: 50,
      ID_proof: {
        data: Buffer.alloc(6 * 1024 * 1024), // 6 MB
        contentType: 'application/pdf',
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
    expect(err.errors['ID_proof.size'].message).toBe('File size must be less than 5 MB.');
  });

  // ❌ Test: Invalid ID proof format
  it('should throw a validation error for an unsupported ID proof format', async () => {
    const invalidPackage = new Package({
      Status: 'pending',
      SenderName: 'John Doe',
      RecipientId: new mongoose.Types.ObjectId(),
      Origin: 'New York',
      Destination: 'Los Angeles',
      Package_weight: 2.5,
      Price: 50,
      ID_proof: {
        data: Buffer.from('test-file'),
        contentType: 'image/bmp', // Unsupported format
        size: 1024,
      },
    });

    let err;
    try {
      await invalidPackage.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['ID_proof.contentType'].message).toBe('Only JPEG, PNG, GIF, WebP, and PDF formats are allowed.');
  });
});