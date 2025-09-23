/**
 * Integration tests for the complete plugin functionality
 */

import mongoose, { Schema, Model } from 'mongoose';
import mongooseTestFactory, { FactoryPlugin } from '../../src/index';
import { BaseDocument } from '../../src/types/common';

// Test interfaces
interface User extends BaseDocument {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  profile?: {
    bio: string;
    avatar: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Post extends BaseDocument {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
}

describe('Plugin Integration', () => {
  let UserModel: Model<User>;
  let PostModel: Model<Post>;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    }

    // Define schemas
    const userSchema = new Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      age: { type: Number, min: 18, max: 100 },
      isActive: { type: Boolean, default: true },
      profile: {
        bio: String,
        avatar: String
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const postSchema = new Schema({
      title: { type: String, required: true },
      content: { type: String, required: true },
      author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      tags: [String],
      published: { type: Boolean, default: false },
      publishedAt: Date,
      createdAt: { type: Date, default: Date.now }
    });

    // Apply plugin
    userSchema.plugin(mongooseTestFactory);
    postSchema.plugin(mongooseTestFactory);

    // Create models
    UserModel = mongoose.model<User>('User', userSchema);
    PostModel = mongoose.model<Post>('Post', postSchema);
  });

  afterAll(async () => {
    // Clean up test data
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});
  });

  describe('Plugin Registration', () => {
    it('should add factory method to model', () => {
      expect(typeof UserModel.factory).toBe('function');
      expect(typeof PostModel.factory).toBe('function');
    });

    it('should create factory instance', () => {
      const factory = UserModel.factory();
      expect(factory).toBeDefined();
      expect(typeof factory.count).toBe('function');
      expect(typeof factory.with).toBe('function');
      expect(typeof factory.build).toBe('function');
      expect(typeof factory.create).toBe('function');
    });
  });

  describe('Data Generation', () => {
    it('should generate realistic user data', () => {
      const user = UserModel.factory().build();

      expect(user.name).toBeDefined();
      expect(typeof user.name).toBe('string');
      expect(user.name.length).toBeGreaterThan(0);

      expect(user.email).toBeDefined();
      expect(typeof user.email).toBe('string');
      expect(user.email).toMatch(/@/);

      expect(user.age).toBeDefined();
      expect(typeof user.age).toBe('number');
      expect(user.age).toBeGreaterThanOrEqual(18);
      expect(user.age).toBeLessThanOrEqual(100);

      expect(typeof user.isActive).toBe('boolean');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should generate realistic post data', () => {
      const post = PostModel.factory().build();

      expect(post.title).toBeDefined();
      expect(typeof post.title).toBe('string');
      expect(post.title.length).toBeGreaterThan(0);

      expect(post.content).toBeDefined();
      expect(typeof post.content).toBe('string');
      expect(post.content.length).toBeGreaterThan(0);

      expect(post.author).toBeDefined();
      expect(post.author).toBeInstanceOf(mongoose.Types.ObjectId);

      expect(Array.isArray(post.tags)).toBe(true);
      expect(typeof post.published).toBe('boolean');
      expect(post.createdAt).toBeInstanceOf(Date);
    });

    it('should generate multiple documents', () => {
      const users = UserModel.factory(5).build();

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(5);

      users.forEach(user => {
        expect(user.name).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.age).toBeDefined();
      });

      // Check for some uniqueness
      const emails = users.map(u => u.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBeGreaterThan(1);
    });
  });

  describe('Field Pattern Recognition', () => {
    it('should generate appropriate email values', () => {
      const user = UserModel.factory().build();
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should generate appropriate name values', () => {
      const user = UserModel.factory().build();
      expect(user.name).toBeDefined();
      expect(user.name.split(' ').length).toBeGreaterThanOrEqual(1);
    });

    it('should generate appropriate date values', () => {
      const post = PostModel.factory().build();
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Overrides and Customization', () => {
    it('should apply field overrides', () => {
      const customName = 'John Doe';
      const customAge = 25;

      const user = UserModel.factory()
        .with('name', customName)
        .with('age', customAge)
        .build();

      expect(user.name).toBe(customName);
      expect(user.age).toBe(customAge);
    });

    it('should apply object overrides', () => {
      const overrides = {
        name: 'Jane Smith',
        age: 30,
        isActive: false
      };

      const user = UserModel.factory()
        .with(overrides)
        .build();

      expect(user.name).toBe(overrides.name);
      expect(user.age).toBe(overrides.age);
      expect(user.isActive).toBe(overrides.isActive);
    });

    it('should respect schema constraints', () => {
      // Age has min: 18, max: 100
      const users = UserModel.factory(10).build();

      users.forEach(user => {
        expect(user.age).toBeGreaterThanOrEqual(18);
        expect(user.age).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Database Operations', () => {
    it('should create and save documents to database', async () => {
      const users = await UserModel.factory(3).create();

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);

      // Verify documents were saved
      for (const user of users) {
        expect(user._id).toBeDefined();
        expect(user.isNew).toBe(false);

        // Verify in database
        const found = await UserModel.findById(user._id);
        expect(found).toBeDefined();
        expect(found!.name).toBe(user.name);
        expect(found!.email).toBe(user.email);
      }
    });

    it('should create single document when count is 1', async () => {
      const user = await UserModel.factory().create();

      expect(user).toBeDefined();
      expect(Array.isArray(user)).toBe(false);
      expect(user._id).toBeDefined();
      expect(user.isNew).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      // Try to create user with invalid age
      try {
        await UserModel.factory()
          .with('age', 200) // Exceeds max: 100
          .create();
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        // Should be validation error
      }
    });
  });

  describe('Make vs Build vs Create', () => {
    it('should create model instances with make()', () => {
      const user = UserModel.factory().make();

      expect(user).toBeInstanceOf(UserModel);
      expect(user.isNew).toBe(true);
      expect(user._id).toBeDefined();
    });

    it('should create plain objects with build()', () => {
      const user = UserModel.factory().build();

      expect(user).not.toBeInstanceOf(UserModel);
      expect(typeof user).toBe('object');
      expect(user._id).toBeUndefined(); // Plain object doesn't have _id
    });

    it('should save to database with create()', async () => {
      const user = await UserModel.factory().create();

      expect(user).toBeInstanceOf(UserModel);
      expect(user.isNew).toBe(false);
      expect(user._id).toBeDefined();

      // Verify in database
      const found = await UserModel.findById(user._id);
      expect(found).toBeDefined();
    });
  });

  describe('Nested Objects', () => {
    it('should generate nested profile data', () => {
      const user = UserModel.factory().build();

      if (user.profile) {
        expect(typeof user.profile.bio).toBe('string');
        expect(typeof user.profile.avatar).toBe('string');
      }
    });

    it('should allow nested object overrides', () => {
      const customProfile = {
        bio: 'Custom bio',
        avatar: 'custom-avatar.jpg'
      };

      const user = UserModel.factory()
        .with('profile', customProfile)
        .build();

      expect(user.profile).toEqual(customProfile);
    });
  });

  describe('Arrays', () => {
    it('should generate array fields', () => {
      const post = PostModel.factory().build();

      expect(Array.isArray(post.tags)).toBe(true);
      // Tags might be empty or have values
    });

    it('should allow array overrides', () => {
      const customTags = ['tech', 'javascript', 'nodejs'];

      const post = PostModel.factory()
        .with('tags', customTags)
        .build();

      expect(post.tags).toEqual(customTags);
    });
  });

  describe('Plugin Configuration', () => {
    it('should configure global settings', () => {
      FactoryPlugin.configure({
        debug: true,
        locale: 'en'
      });

      // Configuration should be applied
      const config = FactoryPlugin.getManager().getState().config;
      expect(config.debug).toBe(true);
      expect(config.locale).toBe('en');
    });

    it('should enable debug mode', () => {
      FactoryPlugin.enableDebug();
      const config = FactoryPlugin.getManager().getState().config;
      expect(config.debug).toBe(true);
    });

    it('should set locale', () => {
      FactoryPlugin.setLocale('fr');
      const config = FactoryPlugin.getManager().getState().config;
      expect(config.locale).toBe('fr');
    });

    it('should set seed for reproducible data', () => {
      FactoryPlugin.setSeed(12345);
      const config = FactoryPlugin.getManager().getState().config;
      expect(config.seed).toBe(12345);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', () => {
      // This should generate required fields automatically
      const user = UserModel.factory().build();

      expect(user.name).toBeDefined(); // Required field
      expect(user.email).toBeDefined(); // Required field
    });

    it('should handle invalid field overrides gracefully', () => {
      expect(() => {
        UserModel.factory()
          .with('name', undefined as any)
          .build();
      }).toThrow();
    });
  });

  describe('Performance', () => {
    it('should generate large datasets efficiently', async () => {
      const startTime = Date.now();
      const users = UserModel.factory(1000).build();
      const endTime = Date.now();

      expect(users).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should batch database operations', async () => {
      const startTime = Date.now();
      const users = await UserModel.factory(100).create();
      const endTime = Date.now();

      expect(users).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds

      // Verify all documents were created
      const count = await UserModel.countDocuments();
      expect(count).toBe(100);
    });
  });
});