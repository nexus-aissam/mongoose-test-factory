/**
 * Unit tests for Factory class
 */

import mongoose, { Schema, Model } from 'mongoose';
import { Factory, createFactory } from '../../src/factory';
import { BaseDocument } from '../../src/types/common';

// Test interface
interface TestUser extends BaseDocument {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
}

describe('Factory', () => {
  let TestUserModel: Model<TestUser>;
  let testSchema: Schema;

  beforeAll(() => {
    // Create test schema
    testSchema = new Schema({
      name: { type: String, required: true },
      email: { type: String, unique: true },
      age: { type: Number, min: 0, max: 150 },
      isActive: { type: Boolean, default: true },
      tags: [String],
      createdAt: { type: Date, default: Date.now }
    });

    TestUserModel = mongoose.model<TestUser>('TestUser', testSchema);
  });

  afterAll(async () => {
    // Clean up
    if (mongoose.connection.readyState === 1) {
      await TestUserModel.deleteMany({});
    }
  });

  describe('Factory Creation', () => {
    it('should create a factory instance', () => {
      const factory = createFactory(TestUserModel);
      expect(factory).toBeDefined();
      expect(typeof factory.count).toBe('function');
      expect(typeof factory.with).toBe('function');
      expect(typeof factory.build).toBe('function');
      expect(typeof factory.create).toBe('function');
    });

    it('should set initial count', () => {
      const factory = createFactory(TestUserModel, { count: 5 });
      expect(factory).toBeDefined();
      // Note: count is internal state, we'll test it through build/create
    });
  });

  describe('Fluent API', () => {
    it('should chain count method', () => {
      const factory = createFactory(TestUserModel);
      const result = factory.count(3);
      expect(result).toBe(factory); // Should return same instance for chaining
    });

    it('should chain with method', () => {
      const factory = createFactory(TestUserModel);
      const result = factory.with('name', 'Test User');
      expect(result).toBe(factory);
    });

    it('should chain with object overrides', () => {
      const factory = createFactory(TestUserModel);
      const result = factory.with({ name: 'Test User', age: 25 });
      expect(result).toBe(factory);
    });

    it('should chain trait method', () => {
      const factory = createFactory(TestUserModel);
      const result = factory.trait('active');
      expect(result).toBe(factory);
    });

    it('should chain withRelated method', () => {
      const factory = createFactory(TestUserModel);
      const result = factory.withRelated('posts', 3);
      expect(result).toBe(factory);
    });
  });

  describe('Data Generation', () => {
    it('should build single document', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.build(1);
      
      expect(document).toBeDefined();
      expect(typeof document).toBe('object');
      expect(document.name).toBeDefined();
      expect(typeof document.name).toBe('string');
    });

    it('should build multiple documents', () => {
      const factory = createFactory(TestUserModel);
      const documents = factory.count(3).build();
      
      expect(Array.isArray(documents)).toBe(true);
      expect(documents).toHaveLength(3);
      
      documents.forEach(doc => {
        expect(doc.name).toBeDefined();
        expect(typeof doc.name).toBe('string');
      });
    });

    it('should apply overrides', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.with('name', 'John Doe').build(1);
      
      expect(document.name).toBe('John Doe');
    });

    it('should apply object overrides', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.with({ 
        name: 'Jane Doe', 
        age: 30 
      }).build(1);
      
      expect(document.name).toBe('Jane Doe');
      expect(document.age).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for negative count', () => {
      const factory = createFactory(TestUserModel);
      expect(() => factory.count(-1)).toThrow();
    });

    it('should throw error when field value is missing', () => {
      const factory = createFactory(TestUserModel);
      expect(() => factory.with('name', undefined)).toThrow();
    });

    it('should throw error for negative related count', () => {
      const factory = createFactory(TestUserModel);
      expect(() => factory.withRelated('posts', -1)).toThrow();
    });
  });

  describe('Make vs Build vs Create', () => {
    it('should make new model instances', () => {
      const factory = createFactory(TestUserModel);
      const instance = factory.make(1);
      
      expect(instance).toBeInstanceOf(TestUserModel);
      expect(instance.isNew).toBe(true);
    });

    it('should build plain objects', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.build(1);
      
      expect(document).not.toBeInstanceOf(TestUserModel);
      expect(typeof document).toBe('object');
    });

    // Note: Create method tests would require actual database connection
    // These would be in integration tests
  });

  describe('Validation', () => {
    it('should respect required fields', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.build(1);
      
      // Name is required in schema
      expect(document.name).toBeDefined();
      expect(document.name.length).toBeGreaterThan(0);
    });

    it('should respect field types', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.build(1);
      
      expect(typeof document.name).toBe('string');
      expect(typeof document.age).toBe('number');
      expect(typeof document.isActive).toBe('boolean');
      expect(Array.isArray(document.tags)).toBe(true);
      expect(document.createdAt).toBeInstanceOf(Date);
    });

    it('should respect min/max constraints', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.build(1);
      
      // Age has min: 0, max: 150 in schema
      expect(document.age).toBeGreaterThanOrEqual(0);
      expect(document.age).toBeLessThanOrEqual(150);
    });
  });

  describe('Default Values', () => {
    it('should apply schema defaults', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.build(1);
      
      // isActive has default: true in schema
      expect(document.isActive).toBe(true);
    });

    it('should apply generated createdAt', () => {
      const factory = createFactory(TestUserModel);
      const document = factory.build(1);
      
      expect(document.createdAt).toBeInstanceOf(Date);
      expect(document.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});