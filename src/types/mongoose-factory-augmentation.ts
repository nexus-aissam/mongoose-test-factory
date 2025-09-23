/**
 * Mongoose type augmentation for factory types
 *
 * This module extends Mongoose's SchemaTypeOptions to include factoryType
 * for TypeScript support.
 */

import { FactoryType } from "./factory-types";

declare module "mongoose" {
  interface SchemaTypeOptions<T> {
    /**
     * Explicit factory type for data generation
     *
     * Specifies which type of data generator to use for this field,
     * overriding pattern-based detection.
     *
     * @example
     * ```typescript
     * const userSchema = new Schema({
     *   email: { type: String, factoryType: 'email' },
     *   age: { type: Number, factoryType: 'age' },
     *   tags: { type: [String], factoryType: 'tags' }
     * });
     * ```
     */
    factoryType?: FactoryType;

    /**
     * Alternative name for factoryType (for backward compatibility)
     */
    factory?: FactoryType;

    /**
     * Alternative name for factoryType (for backward compatibility)
     */
    dataType?: FactoryType;
  }
}