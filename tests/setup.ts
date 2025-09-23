/**
 * Jest setup file for mongoose-test-factory tests
 * This file runs before all tests and sets up the testing environment
 */

import mongoose from 'mongoose';

// Increase timeout for MongoDB operations
jest.setTimeout(30000);

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongoose-test-factory-test';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to test database');
  } catch (error) {
    console.warn('Could not connect to MongoDB for testing. Some tests may be skipped.');
    console.warn('Make sure MongoDB is running or set MONGODB_URI environment variable');
  }
});

/**
 * Global test teardown - runs once after all tests
 */
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    // Clean up test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
    console.log('Disconnected from test database');
  }
});

/**
 * Test cleanup - runs after each test
 */
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    // Clear all collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeEach(() => {
  // Suppress console output during tests unless explicitly needed
  if (process.env.VERBOSE !== 'true') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
  }
});

afterEach(() => {
  // Restore console methods
  if (process.env.VERBOSE !== 'true') {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
  }
});

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createTestSchema: () => mongoose.Schema;
        getRandomString: (length?: number) => string;
        getRandomNumber: (min?: number, max?: number) => number;
      };
    }
  }
}

// Add global test utilities
(global as any).testUtils = {
  createTestSchema: () => {
    return new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, unique: true },
      age: { type: Number, min: 0, max: 150 },
      isActive: { type: Boolean, default: true },
      tags: [String],
      createdAt: { type: Date, default: Date.now }
    });
  },
  
  getRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, 2 + length);
  },
  
  getRandomNumber: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};