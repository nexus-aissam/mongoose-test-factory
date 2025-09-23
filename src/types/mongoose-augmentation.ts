/**
 * Mongoose type augmentation and utilities for mongoose-test-factory
 *
 * This module provides TypeScript type helpers and utilities for working
 * with the factory method on Mongoose models.
 */

import { FactoryBuilder } from "./common";
import mongoose, { Document } from "mongoose";

/**
 * Interface for objects that have a factory method
 *
 * This interface defines the factory method signature that can be applied
 * to any object to enable test data generation capabilities.
 *
 * @template T - The document type extending Document
 *
 * @example
 * ```typescript
 * // Use with custom model types
 * interface CustomModel extends WithFactoryMethod<IUser> {
 *   // ... other methods
 * }
 * ```
 */
export interface WithFactoryMethod<T extends Document> {
  /**
   * Create a factory instance for generating test data
   *
   * @param count - Optional number of documents to generate
   * @returns Factory builder instance for method chaining
   */
  factory(count?: number): FactoryBuilder<T>;
}

/**
 * Utility type that combines a Mongoose model with factory capabilities
 *
 * This type extends the standard Mongoose Model interface to include
 * the factory method, providing full type safety for factory operations.
 *
 * @template T - The document type extending Document
 *
 * @example
 * ```typescript
 * // Use as a type annotation
 * const UserModel: ModelWithFactory<IUser> = mongoose.model('User', userSchema);
 * const user = UserModel.factory().build(); // Fully typed
 * ```
 */
export type ModelWithFactory<T extends Document> = mongoose.Model<T> &
  WithFactoryMethod<T>;
