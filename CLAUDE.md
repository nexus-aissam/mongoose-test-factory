# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Mongoose plugin called **mongoose-test-factory** that generates realistic test data for MongoDB schemas with intelligent schema analysis, factory patterns, and relationship management. The plugin uses semantic field name recognition and @faker-js/faker for high-quality data generation.

## Development Commands

### Build and Development

- `yarn build` - Compile TypeScript to JavaScript in dist/
- `yarn build:watch` - Watch mode compilation
- `yarn build:prod` - Production build with minification
- `yarn dev` - Run development server with ts-node
- `yarn example` - Run basic usage example

### Code Quality

- `yarn lint` - Run ESLint on TypeScript files
- `yarn lint:fix` - Auto-fix ESLint issues
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check code formatting

### Testing

- `yarn test` - Run test suite (currently placeholder - returns "Running tests...")
- Tests are configured in jest.config.js with ts-jest preset
- Test files should be in tests/ directory with .test.ts or .spec.ts extensions
- Coverage threshold set at 80% for all metrics

### Utilities

- `yarn clean` - Remove dist/ directory
- `yarn minify` - Minify built JavaScript (via scripts/minify.js)

## Architecture

### Core Components

**Plugin System (`src/plugin.ts`):**

- Main entry point via `mongooseTestFactory()` function
- Global plugin manager with lifecycle hooks
- Schema registration and factory method injection
- Supports global configuration via `FactoryPlugin.configure()`

**Factory Engine (`src/factory.ts`):**

- Core `Factory` class implementing fluent API
- Supports three generation strategies:
  - `build()` - Plain JavaScript objects
  - `make()` - Unsaved Mongoose instances
  - `create()` - Saved Mongoose documents
- Handles batch operations and relationships

**Schema Analysis (`src/utils/schema-analyzer.ts`):**

- Intelligent field type detection and validation parsing
- Semantic field name recognition for contextual data generation
- Supports nested documents and complex schema structures

**Data Generators (`src/generators/`):**

- Modular generator system with registry pattern
- Specialized generators for strings, numbers, dates
- Semantic generators (email, password, slug, etc.)
- Extensible generator registry

**Relationship Management (`src/utils/relationship-manager.ts`):**

- Handles ObjectId references and population
- Supports one-to-one, one-to-many relationships
- Automatic relationship creation and linking

### Key Design Patterns

**Plugin Architecture:** Uses Mongoose's plugin system to extend schemas with factory methods
**Factory Pattern:** Fluent API for building test data with method chaining
**Strategy Pattern:** Multiple generation strategies (build/make/create)
**Registry Pattern:** Pluggable generator system for different data types
**Builder Pattern:** Configurable factory instances with overrides and traits

### TypeScript Configuration

The project uses strict TypeScript with path mapping:

- `@/*` maps to `src/*`
- `@/types/*` maps to `src/types/*`
- `@/utils/*` maps to `src/utils/*`
- `@/generators/*` maps to `src/generators/*`

Target is ES2020 with CommonJS modules for compatibility.

### Entry Points

- `src/index.ts` - Main library exports
- `dist/index.js` - Compiled main entry point
- `dist/index.d.ts` - TypeScript declarations

## Key Implementation Details

### Semantic Field Recognition

The plugin automatically recognizes field names and generates appropriate data:

- Email fields (`email`, `userEmail`) → realistic email addresses
- Name fields (`name`, `firstName`) → person names
- Date fields (`createdAt`, `birthDate`) → contextual dates
- Price fields (`price`, `cost`) → realistic monetary values

### Factory API Usage Pattern

```typescript
// Apply plugin to schema
userSchema.plugin(mongooseTestFactory);

// Generate data
const user = User.factory().build();
const users = User.factory(5).create();
const customUser = User.factory()
  .with({ name: 'John Doe', age: 30 })
  .create();
```

### Global Configuration

The plugin supports global settings via `FactoryPlugin.configure()`:

- Faker.js seed for reproducible data
- Locale settings for internationalization
- Debug mode and performance options
- Batch size and caching configuration

## Dependencies

### Peer Dependencies

- `mongoose` (>=6.0.0 <8.0.0) - Required for schema integration
- `@faker-js/faker` - Data generation library

### Runtime Dependencies

- `lodash` - Utility functions
- `tslib` - TypeScript runtime helpers

## Testing Strategy

- Unit tests for individual components (generators, analyzers)
- Integration tests for full factory workflows
- Schema analysis tests with various Mongoose schemas
- Relationship generation tests
- Performance benchmarks for large datasets

## Common Patterns

When extending the plugin:

1. Add new generators in `src/generators/` following the BaseGenerator interface
2. Register generators in the registry system
3. Update semantic recognition patterns for new field types
4. Add TypeScript types in `src/types/`
5. Follow the existing error handling patterns with FactoryError/GenerationError
