# Mongoose Test Factory

[![NPM Version](https://img.shields.io/npm/v/mongoose-test-factory.svg)](https://www.npmjs.com/package/mongoose-test-factory)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/nexus-aissam/mongoose-test-factory)

**Mongoose Test Factory** is a powerful and intuitive data generation tool for Mongoose. It completely eliminates the hassle of manually creating mock data for your tests, database seeding, or application prototypes.

By intelligently analyzing your Mongoose schemas, it generates realistic, valid, and context-aware data with an elegant, fluent API. Stop writing tedious mock objects and start building meaningful test data in seconds.

## Core Philosophy

Testing and development should be fast and efficient. Manually creating test data is slow, error-prone, and doesn't scale. This factory is built on a simple philosophy: **your schema definition is the ultimate source of truth, and it should be all you need to generate perfect test data.**

`mongoose-test-factory` bridges the gap between your schema and your testing needs, letting you focus on writing great code instead of mocking data.

## Key Features

- ✅ **Deep Schema Introspection:** Automatically understands your schema's types, validators (`required`, `min`, `max`, `enum`, etc.), and default values.
- 🧠 **Intelligent Semantic Analysis:** Recognizes field names like `email`, `name`, `password`, or `productPrice` to generate contextually relevant data using [`@faker-js/faker`](https://fakerjs.dev/).
- ⛓️ **Elegant Fluent API:** A clean, chainable, and highly readable API makes defining data variations effortless.
- 🚀 **Multiple Generation Strategies:**
  - `build()`: Creates lightweight, plain JavaScript objects.
  - `make()`: Creates unsaved Mongoose document instances.
  - `create()`: Creates and saves Mongoose documents directly to your database.
- 🔧 **Fully Customizable:** Easily override any generated field with your own specific data.
- 🌐 **Global Configuration:** Set a global seed for reproducible data, configure locales for international data, and more.
- 🤝 **Relationship Management:** Effortlessly create and link related documents.
- 🔷 **First-Class TypeScript Support:** Written in TypeScript for robust type safety and excellent autocompletion.

## How It Works

The factory follows a sophisticated, multi-step process to generate the highest quality data for your models:

1. **Plugin Integration**: First, you apply the factory as a plugin to your Mongoose schema. This seamlessly injects a static `.factory()` method into your model, making it accessible everywhere.
2. **Schema Analysis**: When you invoke `YourModel.factory()`, the plugin performs a deep analysis of your schema. It maps out all fields, their data types, validation rules (like `required`, `min`, `max`, `enum`), and default values.
3. **Semantic Recognition**: This is the "magic" step. The analyzer examines the **name** of each field (e.g., `userEmail`, `lastName`, `avatarUrl`). It uses a powerful pattern-recognition engine to understand the *semantic meaning* of the field, going far beyond just its data type.
4. **Intelligent Data Generation**: For each field, the factory selects the best generator. If it recognized a semantic meaning, it uses a specialized generator (e.g., `faker.internet.email()` for an `email` field). If not, it falls back to a generator appropriate for the field's data type, always respecting the validation rules.
5. **Applying Overrides**: Any custom data you provide using the `.with()` method is applied at the end of the process, giving you the final say on the generated object's shape.
6. **Final Output**: The factory delivers the data in the precise format you requested—whether it's a plain `object` (`build`), a Mongoose instance (`make`), or a database-saved document (`create`).

## Installation

Install the package and its peer dependencies using your favorite package manager.

### pnpm

```bash
pnpm add --save-dev mongoose-test-factory @faker-js/faker mongoose
```

### npm

```bash
npm install --save-dev mongoose-test-factory @faker-js/faker mongoose
```

### yarn

```bash
yarn add --dev mongoose-test-factory @faker-js/faker mongoose
```

> **Note:** `mongoose` and `@faker-js/faker` are required peer dependencies and must be installed in your project.

## Getting Started: A 5-Minute Guide

Let's see how easy it is to get up and running.

```typescript
import mongoose, { Schema, Model } from 'mongoose';
import mongooseTestFactory from 'mongoose-test-factory';

// 1. Define your Mongoose interface and schema
interface User extends mongoose.Document {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 18 },
  isActive: { type: Boolean, default: true },
});

// 2. Apply the plugin to your schema
userSchema.plugin(mongooseTestFactory);

// 3. Create your Mongoose model
const User = mongoose.model<User>('User', userSchema);

// 4. That's it! You're ready to generate data.

async function run() {
  // Generate a single plain object with realistic, valid data
  const userObject = User.factory().build();
  console.log('Built Object:', userObject);
  // -> { name: 'Eleanore Glover', email: 'glover.eleanore@example.com', age: 42, isActive: true }

  // Generate and save 5 users directly to the database
  const savedUsers = await User.factory(5).create();
  console.log('Saved Users:', savedUsers.length); // -> 5

  // Generate a specific user by overriding generated values
  const adminUser = await User.factory()
    .with({ name: 'Admin User', age: 99 })
    .create();
  console.log('Admin User:', adminUser.name, adminUser.age); // -> 'Admin User' 99
}
```

## Detailed Usage Guide

### Global Configuration (`FactoryPlugin`)

For a consistent testing environment, you can set global configurations once in your test setup file (e.g., `jest.setup.ts`).

```typescript
import { FactoryPlugin } from 'mongoose-test-factory';

FactoryPlugin.configure({
  /**
   * By setting a seed, you ensure that @faker-js/faker generates the same
   * sequence of data every time your tests run. This makes tests
   * deterministic and prevents random failures.
   */
  seed: 1337,
  
  /**
   * Set a default locale for internationalized data (e.g., names, addresses).
   * Supports any locale supported by Faker.js.
   */
  locale: 'en_US',

  /**
   * Set to true to see detailed logs from the factory during its
   * analysis and generation process. Useful for debugging.
   */
  debug: false,

  factory: {
    /**
     * When using .create() for multiple documents, they are inserted in batches.
     * This sets the default size for those batches.
     */
    defaultBatchSize: 100,
  }
});
```

### Generation Strategies: `build`, `make`, and `create`

The factory offers three distinct ways to generate data, each with a specific use case.

#### `build()` -> Plain JavaScript Object

- **What it does:** Generates a plain, raw JavaScript object. It does **not** create a Mongoose document instance.
- **When to use it:** Perfect for **unit tests** where you need simple data objects to pass to functions. It's the fastest method as it doesn't involve Mongoose's overhead or database calls.
- **Output:** `{ name: '...', email: '...' }`

```typescript
// Build a single user object
const user = User.factory().build();

// Build an array of 3 user objects
const users = User.factory(3).build();
```

#### `make()` -> Unsaved Mongoose Instance

- **What it does:** Creates a `new User()` instance of your Mongoose model. The instance is **not** saved to the database.
- **When to use it:** Ideal for testing your Mongoose **instance methods** or virtuals without needing to perform a database write.
- **Output:** A Mongoose document instance with `isNew: true`.

```typescript
const userInstance = User.factory().make();

console.log(userInstance instanceof User); // -> true
console.log(userInstance.isNew); // -> true
// You can now test instance methods, e.g., userInstance.generateAuthToken()
```

#### `create()` -> Saved Mongoose Document

- **What it does:** Creates a Mongoose document and saves it to the database. This is an `async` operation.
- **When to use it:** Essential for **integration tests** where your logic needs to query the database to find and interact with the data.
- **Output:** A resolved `Promise` containing a saved Mongoose document with `isNew: false`.

```typescript
// Create and save a single user
const savedUser = await User.factory().create();

// Create and save 10 users efficiently in batches
const savedUsers = await User.factory(10).create();
```

### Overriding Attributes with `.with()`

The `.with()` method is your tool for precise control over the generated data.

```typescript
// Override a single attribute
const ceo = User.factory()
  .with('name', 'The Big Boss')
  .build();

// Override multiple attributes at once by passing an object
const customUser = User.factory()
  .with({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    age: 42,
  })
  .build();

// Override nested document attributes
const userWithBio = User.factory()
  .with({
    profile: {
      bio: 'An expert in Mongoose data generation.',
      avatar: 'https://i.pravatar.cc/150'
    }
  })
  .build();
```

### Working with Relationships

To create related documents, the pattern is simple: create the primary document first, then use its `_id` when creating the dependent documents.

```typescript
// Assume a Post model with `author: { type: Schema.Types.ObjectId, ref: 'User' }`

// 1. Create the primary document (the author)
const author = await User.factory().create();

// 2. Create the dependent documents (the posts) and link them
const posts = await Post.factory(3)
  .with('author', author._id) // Pass the author's ObjectId
  .create();

// Verification
console.log(posts[0].author.toString() === author._id.toString()); // -> true
```

### The Magic: Intelligent Semantic Generation

`mongoose-test-factory` automatically generates realistic data for fields with common names. You get sensible data out-of-the-box with zero extra configuration.

| Field Name Pattern Contains... | Generated Data Example | Faker.js Method Used |
| :--- | :--- | :--- |
| `name`, `title`, `fullName` | "Eleanore Glover" | `faker.person.fullName` |
| `firstName` | "John" | `faker.person.firstName` |
| `email` | "<tavares.forrest@example.org>" | `faker.internet.email` |
| `password`, `pwd` | "s7@D_9!aB" | `faker.internet.password` |
| `username` | "john.doe23" | `faker.internet.userName` |
| `slug` | "a-perfectly-formed-slug" | `faker.helpers.slugify` |
| `age` | `42` | `faker.number.int` (realistic range) |
| `website`, `url`, `link` | "<https://fakerjs.dev>" | `faker.internet.url` |
| `avatar`, `imageUrl` | "<https://avatars.fakerjs.dev/>..." | `faker.image.avatar` |
| `city`, `state`, `country` | "New York", "California", "USA" | `faker.location.*` |
| `price`, `cost`, `amount` | `199.99` | `faker.commerce.price` |
| `description`, `content`, `bio` | "A paragraph of lorem ipsum..." | `faker.lorem.paragraph` |
| `createdAt`, `updatedAt` | A recent past `Date` object | `faker.date.recent` |
| `birthDate`, `dob` | A `Date` for an 18-80 year old | `faker.date.birthdate` |
| `expiresAt`, `dueDate` | A future `Date` object | `faker.date.future` |
| `uuid`, `guid` | "123e4567-e89b-12d3-a456-426614174000" | `faker.string.uuid` |
| `company`, `organization` | "Tech Solutions Inc." | `faker.company.name` |
| `productName` | "Awesome Steel Keyboard" | `faker.commerce.productName` |
| `category` | "Electronics" | `faker.commerce.department` |

...and many more!

## API Reference

### Main Factory Method

- **`YourModel.factory(count?: number): FactoryBuilder`**
  - The entry point for the factory, attached to your Mongoose model.
  - `count` (optional): The number of documents to generate. Defaults to `1`.

### `FactoryBuilder` Instance Methods

- **`.count(num: number): this`**
  - Sets the number of documents to generate.
- **`.with(field: string, value: any): this`**
  - Overrides a single field with a specific value.
- **`.with(overrides: object): this`**
  - Merges an object of key-value pairs to override multiple fields.
- **`.build(): T | T[]`**
  - Generates and returns plain JavaScript object(s).
- **`.make(): T | T[]`**
  - Generates and returns new, unsaved Mongoose document instance(s).
- **`.create(): Promise<T | T[]>`**
  - Generates, saves to the database, and returns Mongoose document(s).

### `FactoryPlugin` Global Object

- **`.configure(options: PluginOptions): void`**
  - Sets the global configuration for all factories.
- **`.setLocale(locale: string): void`**
  - Shortcut to configure the Faker.js locale.
- **`.setSeed(seed: number): void`**
  - Shortcut to configure the Faker.js seed for deterministic results.
- **`.getMetrics(): Record<string, any>`**
  - Returns performance metrics about the generation process.

## Contributing

We welcome contributions of all kinds! If you have a feature idea, a bug to report, or want to improve the documentation, please open an issue or submit a pull request.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/my-new-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/my-new-feature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
