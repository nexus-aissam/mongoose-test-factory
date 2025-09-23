# Mongoose Test Factory 🏭

[![NPM Version](https://img.shields.io/npm/v/mongoose-test-factory.svg)](https://www.npmjs.com/package/mongoose-test-factory)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/nexus-aissam/mongoose-test-factory)

**The most intelligent and powerful test data generator for Mongoose.** Generate realistic, valid, and contextually-aware test data with zero configuration OR take complete control with 40+ explicit factory types. Stop writing tedious mock objects and start building meaningful test data in seconds.

## ✨ Why Choose Mongoose Test Factory?

### 🚀 **Zero Configuration Magic**

- **Instant Setup**: Apply one plugin and immediately get intelligent data generation
- **Schema-Aware**: Automatically respects all your Mongoose validators, types, and constraints
- **Semantic Intelligence**: Recognizes field names like `email`, `phoneNumber`, `firstName` and generates appropriate realistic data

### 🧠 **Intelligent by Design**

- **Deep Schema Analysis**: Understands complex nested schemas, arrays, and subdocuments
- **Explicit Type Control**: Use `factoryType` for precise data generation (NEW!)
- **Context-Aware Generation**: Field names determine data type (e.g., `userEmail` generates emails, `firstName` generates names)
- **Validation Compliant**: Honors `required`, `min`, `max`, `enum`, `unique`, and custom validators

### ⚡ **Three Generation Strategies**

- **`build()`**: Lightning-fast plain JavaScript objects for unit tests
- **`make()`**: Mongoose instances with virtuals and methods for testing models
- **`create()`**: Fully persisted documents for integration tests

### 🔧 **Production-Ready Features**

- **TypeScript First**: Full type safety with intelligent autocompletion
- **Explicit Factory Types**: 40+ built-in types with `factoryType` specification
- **Relationship Management**: Automatic ObjectId generation and linking
- **Global Configuration**: Set seeds for reproducible tests across teams
- **Performance Optimized**: Batch operations, caching, and memory management
- **Extensible**: Custom generators, traits, and hooks for any use case

---

## 📦 Installation

```bash
# npm
npm install --save-dev mongoose-test-factory

# yarn
yarn add --dev mongoose-test-factory

# pnpm
pnpm add --save-dev mongoose-test-factory
```

> **Note**: `mongoose` is a peer dependency and must be installed in your project.

---

## 🚀 Quick Start (30 seconds)

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import mongooseTestFactory, { withFactory } from 'mongoose-test-factory';

// 1. Define your interface and schema
interface IUser extends Document {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 18, max: 120 },
  isActive: { type: Boolean, default: true }
});

// 2. Apply the plugin
userSchema.plugin(mongooseTestFactory);

// 3. Create your model with factory support
const UserModel = mongoose.model<IUser>('User', userSchema);
const User = withFactory(UserModel); // For full TypeScript support

// 4. Generate data instantly! 🎉
const user = User.factory().build();
console.log(user);
// Output: {
//   name: "John Doe",
//   email: "john.doe@example.com",
//   age: 28,
//   isActive: true
// }
```

> **💡 TypeScript Tip**: If you have custom model interfaces with static methods, use explicit type parameters: `withFactory<IDocument, ICustomModel>(model)` to preserve all method types and get full IntelliSense support.

---

## 🎯 Explicit Factory Type Specification

**NEW!** Take complete control over data generation by specifying exactly what type of data you want for each field.

### Basic Usage

```typescript
const productSchema = new Schema({
  // 📧 Generate realistic emails
  email: { type: String, factoryType: 'email' },

  // 👤 Generate person names
  firstName: { type: String, factoryType: 'firstName' },
  lastName: { type: String, factoryType: 'lastName' },

  // 💰 Generate realistic prices
  price: { type: Number, factoryType: 'price' },

  // 🎂 Generate appropriate ages
  age: { type: Number, factoryType: 'age' },

  // 🏷️ Generate tech/category tags
  tags: { type: [String], factoryType: 'tags' },

  // ✅ Generate realistic boolean distributions
  isActive: { type: Boolean, factoryType: 'active' }, // 80% true
  isPremium: { type: Boolean, factoryType: 'premium' }, // 25% true

  // 📅 Generate specific date types
  birthDate: { type: Date, factoryType: 'birthdate' },
  lastLogin: { type: Date, factoryType: 'timestamp' },

  // 🆔 Generate proper IDs
  userId: { type: ObjectId, factoryType: 'objectid' },
  sessionId: { type: String, factoryType: 'uuid' }
});
```

### E-commerce Example

```typescript
const productSchema = new Schema({
  name: { type: String, factoryType: 'title' },
  description: { type: String, factoryType: 'description' },
  price: { type: Number, factoryType: 'price' },
  category: { type: String, factoryType: 'random', enum: ['electronics', 'clothing'] },
  vendor: { type: String, factoryType: 'company' },
  tags: { type: [String], factoryType: 'tags' },
  isActive: { type: Boolean, factoryType: 'active' },
  website: { type: String, factoryType: 'url' }
});

const product = Product.factory().build();
// Perfect e-commerce data every time! 🛍️
```

### Priority System

1. **🎯 Explicit factoryType** (highest priority) - What you specify
2. **🧠 Pattern matching** (fallback) - Smart field name detection
3. **🎲 Default generators** (last resort) - Basic random data

---

## 📊 Factory Types Reference

### String Types

| Factory Type | Description | Example Output |
|-------------|-------------|----------------|
| `email` | Email addresses | `user@example.com` |
| `phone` | Phone numbers | `+1-555-123-4567` |
| `name` | Full person names | `John Doe` |
| `firstName` | First names only | `John` |
| `lastName` | Last names only | `Doe` |
| `username` | Usernames | `john_doe123` |
| `password` | Strong passwords | `Str0ng!Pass` |
| `url` | Website URLs | `https://example.com` |
| `slug` | URL slugs | `my-blog-post` |
| `address` | Street addresses | `123 Main St` |
| `city` | City names | `New York` |
| `country` | Country names | `United States` |
| `company` | Company names | `Tech Corp` |
| `description` | Text descriptions | `Lorem ipsum dolor...` |
| `title` | Titles/headlines | `Amazing Product Launch` |
| `uuid` | UUID strings | `f47ac10b-58cc-4372...` |

### Number Types

| Factory Type | Description | Example Output |
|-------------|-------------|----------------|
| `price` | Monetary values | `19.99` |
| `age` | Human ages | `28` |
| `rating` | Rating scores (1-5) | `4.2` |
| `percentage` | Percentages (0-100) | `75` |
| `quantity` | Product quantities | `150` |
| `year` | Years | `2024` |

### Date Types

| Factory Type | Description | Example Output |
|-------------|-------------|----------------|
| `timestamp` | Current timestamps | `2024-01-15T10:30:00Z` |
| `birthdate` | Birth dates | `1990-05-15` |
| `futuredate` | Future dates | `2025-06-20` |
| `pastdate` | Past dates | `2023-01-10` |

### Boolean Types

| Factory Type | Description | True Probability |
|-------------|-------------|------------------|
| `active` | Active/enabled states | 80% |
| `verified` | Verified/confirmed | 70% |
| `premium` | Premium features | 25% |
| `public` | Public visibility | 85% |

### Array Types

| Factory Type | Description | Example Output |
|-------------|-------------|----------------|
| `tags` | Tech/category tags | `['javascript', 'nodejs']` |
| `skills` | Professional skills | `['Frontend Development']` |
| `emails` | Array of emails | `['user@example.com']` |
| `phones` | Array of phone numbers | `['555-123-4567']` |
| `names` | Array of names | `['John Doe', 'Jane Smith']` |
| `categories` | Product categories | `['Electronics', 'Books']` |
| `languages` | Language codes | `['en', 'es', 'fr']` |
| `urls` | Array of URLs | `['https://example.com']` |

### Special Types

| Factory Type | Description | Example Output |
|-------------|-------------|----------------|
| `objectid` | MongoDB ObjectIds | `507f1f77bcf86cd799439011` |
| `uuid` | UUIDs | `f47ac10b-58cc-4372-a567...` |
| `random` | Context-appropriate random | Varies by field type |

---

## 🏗️ How It Works Under the Hood

### 1. **Plugin Integration & Schema Registration**

When you apply `mongooseTestFactory` to your schema, the plugin:

- Registers the schema in the global factory registry
- Injects a static `factory()` method into your model
- Performs deep analysis of field types, validators, and constraints

### 2. **Intelligent Field Analysis**

The factory analyzes each field in your schema:

```typescript
{
  email: { type: String, required: true, unique: true },
  //   ↓
  // Detected: String type + "email" name pattern + unique constraint
  // Generator: faker.internet.email() with uniqueness tracking
}
```

### 3. **Semantic Pattern Recognition**

Built-in field name patterns automatically generate appropriate data:

- `email`, `userEmail`, `contactEmail` → realistic email addresses
- `firstName`, `lastName`, `fullName` → person names
- `phoneNumber`, `mobile`, `phone` → phone numbers
- `price`, `cost`, `amount` → monetary values
- `createdAt`, `updatedAt` → timestamps

### 4. **Three-Tier Generation Strategy**

```typescript
// Plain objects (fastest)
const data = User.factory().build();

// Mongoose instances (with methods/virtuals)
const instance = User.factory().make();

// Persisted documents (database saved)
const saved = await User.factory().create();
```

---

## 📚 Comprehensive Examples

### Basic Usage Examples

#### **Single Document Generation**

```typescript
// Generate one user
const user = User.factory().build();

// Generate one user with overrides
const admin = User.factory()
  .with({ name: 'Admin User', role: 'admin' })
  .build();

// Generate and save to database
const savedUser = await User.factory().create();
```

#### **Multiple Document Generation**

```typescript
// Generate 10 users
const users = User.factory(10).build();

// Alternative syntax
const users = User.factory().count(10).build();

// Generate and save 50 users to database
const savedUsers = await User.factory(50).create();
```

#### **Field Overrides**

```typescript
// Override single field
const user = User.factory()
  .with('email', 'specific@example.com')
  .build();

// Override multiple fields
const user = User.factory()
  .with({
    name: 'John Smith',
    age: 30,
    isActive: false
  })
  .build();

// Nested field overrides
const user = User.factory()
  .with({
    profile: {
      bio: 'Software engineer',
      preferences: { theme: 'dark' }
    }
  })
  .build();
```

### Relationship Examples

#### **One-to-Many Relationships**

```typescript
// User has many Posts
interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  tags: string[];
}

const postSchema = new Schema<IPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }]
});

postSchema.plugin(mongooseTestFactory);
const Post = withFactory(mongoose.model<IPost>('Post', postSchema));

// Create user and related posts
const author = await User.factory().create();

const posts = await Post.factory(5)
  .with({ author: author._id })
  .create();

// Verify relationship
console.log(posts[0].author.toString() === author._id.toString()); // true
```

#### **Many-to-Many Relationships**

```typescript
// User belongs to many Teams, Team has many Users
interface ITeam extends Document {
  name: string;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

teamSchema.plugin(mongooseTestFactory);
const Team = withFactory(mongoose.model<ITeam>('Team', teamSchema));

// Create team with members
const users = await User.factory(5).create();
const creator = users[0];
const members = users.slice(1);

const team = await Team.factory()
  .with({
    createdBy: creator._id,
    members: members.map(u => u._id)
  })
  .create();
```

### Complex Schema Examples

#### **E-commerce Product Schema**

```typescript
interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  inventory: {
    quantity: number;
    warehouse: string;
    lastRestocked: Date;
  };
  reviews: Array<{
    userId: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  tags: string[];
  images: string[];
  vendor: Types.ObjectId;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1000 },
  price: { type: Number, required: true, min: 0.01, max: 99999.99 },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports']
  },
  inStock: { type: Boolean, default: true },
  inventory: {
    quantity: { type: Number, required: true, min: 0 },
    warehouse: { type: String, required: true },
    lastRestocked: { type: Date, default: Date.now }
  },
  reviews: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  images: [{ type: String }], // URLs
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true }
});

productSchema.plugin(mongooseTestFactory);
const Product = withFactory(mongoose.model<IProduct>('Product', productSchema));

// Generate realistic products
const products = Product.factory(10).build();
// Automatically generates:
// - Product names like "Wireless Bluetooth Headphones"
// - Realistic prices within constraints
// - Valid enum categories
// - Proper inventory data
// - Image URLs
// - ObjectId references
```

#### **User Profile with Nested Data**

```typescript
interface IUserProfile extends Document {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
  };
  contactInfo: {
    email: string;
    phoneNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  socialMedia: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  metadata: {
    createdAt: Date;
    lastLoginAt: Date;
    loginCount: number;
    isVerified: boolean;
  };
}

const userProfileSchema = new Schema<IUserProfile>({
  personalInfo: {
    firstName: { type: String, required: true, maxlength: 50 },
    lastName: { type: String, required: true, maxlength: 50 },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true }
  },
  contactInfo: {
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true }
    }
  },
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  socialMedia: {
    twitter: { type: String },
    linkedin: { type: String },
    github: { type: String }
  },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now },
    loginCount: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false }
  }
});

userProfileSchema.plugin(mongooseTestFactory);
const UserProfile = withFactory(mongoose.model<IUserProfile>('UserProfile', userProfileSchema));

// Generate complete user profiles
const profile = UserProfile.factory().build();
// Automatically generates realistic nested data for all fields
```

---

## ⚙️ Complete Configuration Guide

### Global Configuration

```typescript
import { FactoryPlugin } from 'mongoose-test-factory';

// Complete configuration example
await FactoryPlugin.initialize({
  // Reproducible data generation
  seed: 12345,

  // Internationalization
  locale: 'en_US', // or 'fr', 'es', 'de', 'ja', etc.

  // Debug information
  debug: true,

  // Factory-specific settings
  factory: {
    defaultBatchSize: 100,         // Batch size for bulk operations
    enableMetrics: true,           // Performance tracking
    enableCaching: true,           // Cache generated values
    cacheSize: 1000,               // Maximum cache entries
    validateByDefault: true,       // Validate generated data
    defaultTraits: []              // Global traits to apply
  },

  // Performance optimization
  performance: {
    enableCaching: true,
    cacheSize: 1000,
    enableBatching: true,
    batchSize: 100,
    enablePooling: false,
    poolSize: 10
  },

  // Schema analysis configuration
  schemaAnalysis: {
    enablePatternRecognition: true,
    enableSemanticAnalysis: true,
    customPatterns: {
      // Custom field name patterns
      sku: /^(sku|productCode|itemCode)$/i,
      isbn: /^isbn/i
    },
    customSemantics: {
      // Custom semantic generators
      sku: () => `SKU-${Date.now()}`,
      isbn: () => `978-${Math.random().toString().slice(2, 12)}`
    }
  },

  // Relationship handling
  autoRelations: true,
  relationMappings: {
    // Define custom relationship handlers
    'User.posts': {
      model: 'Post',
      foreignKey: 'author',
      defaultCount: 3
    }
  },

  // Global limits
  maxBatchSize: 10000
});
```

### Advanced Factory Configuration

```typescript
import { createFactory, FactoryHelpers } from 'mongoose-test-factory';

// Create factory with custom configuration
const userFactory = createFactory(User, {
  // Default field values
  defaults: {
    isActive: true,
    role: 'user',
    createdAt: new Date()
  },

  // Named traits for common variations
  traits: {
    admin: (builder) => builder.with({
      role: 'admin',
      permissions: ['read', 'write', 'delete']
    }),

    verified: (builder) => builder.with({
      emailVerified: true,
      phoneVerified: true,
      verifiedAt: new Date()
    }),

    premium: (builder) => builder.with({
      subscription: 'premium',
      subscriptionExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }),

    inactive: (builder) => builder.with({
      isActive: false,
      deactivatedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    })
  },

  // Lifecycle hooks
  hooks: {
    beforeCreate: async (doc) => {
      // Hash password before saving
      if (doc.password) {
        doc.password = await hashPassword(doc.password);
      }
    },

    afterCreate: async (doc) => {
      // Send welcome email
      await sendWelcomeEmail(doc.email);
    },

    beforeBuild: (doc) => {
      // Add computed fields
      doc.displayName = `${doc.firstName} ${doc.lastName}`;
    },

    afterBuild: (doc) => {
      // Final transformations
      doc.slug = doc.name.toLowerCase().replace(/\s+/g, '-');
    }
  }
});

// Use custom factory
const admin = userFactory().trait('admin').trait('verified').build();
const premiumUsers = await userFactory(10).trait('premium').create();
```

---

## 🎯 Real-World Use Cases

### Testing API Endpoints

```typescript
describe('User API', () => {
  beforeEach(async () => {
    // Set deterministic seed for consistent tests
    FactoryPlugin.setSeed(12345);
  });

  it('should create user with valid data', async () => {
    const userData = User.factory().build();

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body.email).toBe(userData.email);
  });

  it('should handle user registration', async () => {
    const newUser = User.factory()
      .with({ password: 'SecurePass123!' })
      .build();

    const response = await request(app)
      .post('/api/register')
      .send(newUser)
      .expect(201);

    expect(response.body.user.isActive).toBe(true);
  });
});
```

### Database Seeding

```typescript
// seeds/development.ts
import { FactoryPlugin } from 'mongoose-test-factory';

async function seedDatabase() {
  // Create admin users
  const admins = await User.factory(3)
    .trait('admin')
    .trait('verified')
    .create();

  // Create regular users
  const users = await User.factory(50)
    .trait('verified')
    .create();

  // Create products with reviews
  for (const admin of admins) {
    const products = await Product.factory(20)
      .with({ vendor: admin._id })
      .create();

    // Add reviews from random users
    for (const product of products) {
      const reviewCount = Math.floor(Math.random() * 10) + 1;
      const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, reviewCount);

      product.reviews = randomUsers.map(user => ({
        userId: user._id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: faker.lorem.paragraph(),
        createdAt: faker.date.past()
      }));

      await product.save();
    }
  }

  console.log('Database seeded successfully!');
}
```

### Performance Testing

```typescript
// Generate large datasets for performance testing
describe('Performance Tests', () => {
  it('should handle bulk user creation', async () => {
    const start = Date.now();

    // Create 10,000 users in batches
    const users = await User.factory(10000).create();

    const duration = Date.now() - start;
    console.log(`Created ${users.length} users in ${duration}ms`);

    expect(users).toHaveLength(10000);
    expect(duration).toBeLessThan(30000); // Should complete in under 30s
  });

  it('should generate complex nested data efficiently', async () => {
    const profiles = UserProfile.factory(1000).build();

    expect(profiles).toHaveLength(1000);
    expect(profiles.every(p => p.contactInfo.email.includes('@'))).toBe(true);
  });
});
```

### Integration Testing

```typescript
// Test complete workflows
describe('E-commerce Integration', () => {
  let user: IUser;
  let products: IProduct[];

  beforeEach(async () => {
    // Setup test data
    user = await User.factory()
      .trait('verified')
      .with({ balance: 1000 })
      .create();

    products = await Product.factory(5)
      .with({ price: 50, inStock: true })
      .create();
  });

  it('should complete purchase workflow', async () => {
    // Add products to cart
    const cartItems = products.slice(0, 3).map(p => ({
      productId: p._id,
      quantity: 1,
      price: p.price
    }));

    // Create order
    const order = await Order.factory()
      .with({
        userId: user._id,
        items: cartItems,
        totalAmount: cartItems.reduce((sum, item) => sum + item.price, 0)
      })
      .create();

    // Process payment
    const payment = await Payment.factory()
      .with({
        orderId: order._id,
        userId: user._id,
        amount: order.totalAmount
      })
      .create();

    expect(order.status).toBe('pending');
    expect(payment.status).toBe('completed');
  });
});
```

---

## 🔧 TypeScript Integration

### Full Type Safety

```typescript
import { withFactory, ModelWithFactory } from 'mongoose-test-factory';

// Your model with full factory typing
const User: ModelWithFactory<IUser> = withFactory(
  mongoose.model<IUser>('User', userSchema)
);

// Full autocompletion and type checking
const user = User.factory()
  .with({ name: 'John' }) // ✅ 'name' is typed
  .with({ invalidField: 'test' }) // ❌ TypeScript error
  .build(); // ✅ Returns IUser

// Type-safe method chaining
const users = User.factory(10)
  .with({ isActive: true })
  .trait('verified')
  .build(); // ✅ Returns IUser[]
```

### Custom Generator Types

```typescript
// Extend with custom generators
declare module 'mongoose-test-factory' {
  interface CustomGenerators {
    isbn(): string;
    sku(): string;
    colorHex(): string;
  }
}

// Use in your schemas
const bookSchema = new Schema({
  isbn: { type: String, required: true },
  title: { type: String, required: true }
});
```

---

## 📊 Performance & Metrics

### Built-in Performance Monitoring

```typescript
// Enable metrics collection
await FactoryPlugin.initialize({
  factory: { enableMetrics: true }
});

// Generate test data
await User.factory(1000).create();

// View performance metrics
const metrics = FactoryPlugin.getMetrics();
console.log(metrics);
// Output: {
//   totalDocumentsGenerated: 1000,
//   averageGenerationTime: 1.2,
//   cacheHitRate: 0.85,
//   memoryUsage: { ... },
//   batchOperations: 10
// }
```

### Memory Management

```typescript
// Configure memory-efficient generation
await FactoryPlugin.initialize({
  performance: {
    enableBatching: true,
    batchSize: 100,        // Process in smaller batches
    enablePooling: true,   // Reuse object instances
    poolSize: 50
  }
});
```

---

## 🚨 Troubleshooting

### Common Issues

#### TypeScript Errors

```typescript
// ❌ Property 'factory' does not exist on type 'Model'
const user = User.factory().build();

// ✅ Solution: Use withFactory helper
import { withFactory } from 'mongoose-test-factory';
const User = withFactory(UserModel);
```

#### Custom Model Interfaces

When using custom model interfaces with static methods, you need to provide explicit type parameters to preserve all method types:

```typescript
// ❌ Custom methods not recognized
interface IProductModel extends mongoose.Model<IProduct> {
  findByAnyId(id: string): Promise<IProduct | null>;
  findByCategory(category: string): Promise<IProduct[]>;
}

const ProductModel = mongoose.model<IProduct, IProductModel>('Product', productSchema);
const Product = withFactory(ProductModel);              // ❌ Lost custom methods

// ✅ Solution: Explicit type parameters
const Product = withFactory<IProduct, IProductModel>(ProductModel);

// Now all methods work perfectly:
const product = Product.factory().build();              // ✅ Factory method
const byId = await Product.findByAnyId('...');          // ✅ Custom method
const products = await Product.findByCategory('...');   // ✅ Custom method
const standard = await Product.findById('...');         // ✅ Standard method
```

#### Validation Errors

```typescript
// ❌ Generated data doesn't match schema constraints
const user = User.factory().build();

// ✅ Solution: Check field patterns and constraints
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Factory respects regex
  }
});
```

#### Performance Issues

```typescript
// ❌ Slow generation for large datasets
await User.factory(10000).create();

// ✅ Solution: Configure batch processing
await FactoryPlugin.initialize({
  factory: { defaultBatchSize: 500 },
  performance: { enableBatching: true }
});
```

### Debug Mode

```typescript
// Enable detailed logging
await FactoryPlugin.initialize({ debug: true });

// View internal operations
const user = User.factory().build();
// Logs:
// [FactoryPlugin] Schema analysis completed for User
// [StringGenerator] Generated email: john.doe@example.com
// [NumberGenerator] Generated age: 28 (within constraints 18-120)
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/nexus-aissam/mongoose-test-factory.git
cd mongoose-test-factory
npm install
npm run build
npm test
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Faker.js](https://fakerjs.dev/) for realistic data generation
- [Mongoose](https://mongoosejs.com/) for MongoDB object modeling
- The TypeScript community for excellent tooling

---

**Made with ❤️ by developers, for developers. Happy testing!** 🚀
