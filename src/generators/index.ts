/**
 * Generators module exports
 * 
 * This file exports all generator classes and utilities
 * for easy importing and usage throughout the library.
 */

// Base generator
export { AbstractBaseGenerator as BaseGenerator } from './base';

// Core generators
export { 
  MongooseStringGenerator as StringGenerator,
  EmailStringGenerator,
  PasswordStringGenerator,
  SlugStringGenerator
} from './string';

export { 
  MongooseNumberGenerator as NumberGenerator,
  PriceNumberGenerator,
  AgeNumberGenerator,
  RatingNumberGenerator
} from './number';

export {
  MongooseDateGenerator as DateGenerator,
  TimestampDateGenerator,
  BirthDateGenerator,
  FutureDateGenerator
} from './date';

export { MixedGenerator } from './mixed';
export { ArrayGenerator } from './array';
export { BooleanGenerator } from './boolean';
export { ObjectIdGenerator } from './objectid';
export {
  ObjectGenerator,
  BufferGenerator,
  MapGenerator,
  UuidGenerator,
  Decimal128Generator,
  BigIntGenerator,
} from './specialized';

// Registry and factory (explicitly named to avoid conflicts)
export { GeneratorRegistry as GeneratorRegistryClass } from './registry';
export { 
  globalGeneratorRegistry,
  GeneratorFactory as GeneratorFactoryClass 
} from './registry';