/**
 * ObjectId type generators for mongoose-test-factory
 *
 * Generates data for MongoDB ObjectId fields with proper format and validation.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { FieldType, ValidationConstraints } from "../types/common";
import { GenerationContext } from "../types/common";

/**
 * ObjectId generator that generates valid MongoDB ObjectIds
 *
 * This generator creates properly formatted 24-character hexadecimal ObjectIds
 * that match MongoDB's ObjectId specification.
 */
export class ObjectIdGenerator extends AbstractBaseGenerator<string> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  /**
   * Check if this generator can handle the field type
   */
  canHandle(
    fieldType: FieldType,
    _constraints?: ValidationConstraints
  ): boolean {
    return fieldType === FieldType.OBJECTID;
  }

  /**
   * Generate ObjectId data
   */
  async generate(_context: GenerationContext): Promise<string> {
    // Generate a valid MongoDB ObjectId
    return this.generateObjectId();
  }

  /**
   * Generate ObjectId data synchronously
   */
  override generateSync(_context: GenerationContext): string {
    // Generate a valid MongoDB ObjectId
    return this.generateObjectId();
  }

  /**
   * Generate a valid MongoDB ObjectId
   */
  private generateObjectId(): string {
    // ObjectId is 12 bytes (24 hex characters)
    // Format: TTTTTTTT MMMMMM PPPP CCCCCC
    // T = timestamp (4 bytes)
    // M = machine identifier (3 bytes)
    // P = process id (2 bytes)
    // C = counter (3 bytes)

    const timestamp = Math.floor(Date.now() / 1000);
    const machine = faker.number.int({ min: 0, max: 0xffffff });
    const process = faker.number.int({ min: 0, max: 0xffff });
    const counter = faker.number.int({ min: 0, max: 0xffffff });

    // Convert to hex and pad with zeros
    const timestampHex = timestamp.toString(16).padStart(8, '0');
    const machineHex = machine.toString(16).padStart(6, '0');
    const processHex = process.toString(16).padStart(4, '0');
    const counterHex = counter.toString(16).padStart(6, '0');

    return timestampHex + machineHex + processHex + counterHex;
  }

  /**
   * Validate generated value
   */
  override validate(value: string, _constraints?: ValidationConstraints): boolean {
    // Check if it's a valid ObjectId format (24 hex characters)
    if (typeof value !== 'string') {
      return false;
    }

    // ObjectId must be exactly 24 characters
    if (value.length !== 24) {
      return false;
    }

    // Must be valid hexadecimal
    const hexRegex = /^[0-9a-fA-F]{24}$/;
    return hexRegex.test(value);
  }
}