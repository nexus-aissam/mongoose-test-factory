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
 * Utility type that combines any model type with factory capabilities
 *
 * This type preserves all existing model methods and properties while
 * adding only the factory method. It works with custom model interfaces.
 *
 * @template T - The document type extending Document
 * @template M - The model type (defaults to mongoose.Model<T>)
 *
 * @example
 * ```typescript
 * // Works with standard models
 * const UserModel: ModelWithFactory<IUser> = mongoose.model('User', userSchema);
 *
 * // Works with custom model interfaces
 * interface ICustomUserModel extends mongoose.Model<IUser> {
 *   findByEmail(email: string): Promise<IUser | null>;
 *   findByAnyId(id: string): Promise<IUser | null>;
 * }
 * const CustomUserModel: ModelWithFactory<IUser, ICustomUserModel> = mongoose.model('User', userSchema);
 * ```
 */
export type ModelWithFactory<
  T extends Document = any,
  M extends mongoose.Model<T> = mongoose.Model<T>
> = M & WithFactoryMethod<T>;
