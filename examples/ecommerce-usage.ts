/**
 * Example usage for ecommerce project
 * This shows how to use mongoose-test-factory with proper TypeScript types
 */

import mongoose, { Schema, Document } from "mongoose";
import mongooseTestFactory, { withFactory } from "../src/index";

// Define your Product interface
interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define your Product schema
const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String },
  category: { type: String, required: true },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Apply the factory plugin
productSchema.plugin(mongooseTestFactory);

// Create the model with factory type assistance
const ProductModel = mongoose.model<IProduct>("Product", productSchema);
const Product = withFactory(ProductModel);

// Usage examples - these should work without TypeScript errors
async function examples() {
  // Basic usage
  const product = Product.factory().build();
  console.log("Built product:", product);

  // Create multiple products
  const products = await Product.factory(5).create();
  console.log("Created products:", products.length);

  // Custom overrides
  const customProduct = Product.factory()
    .with({ name: "Custom Product", price: 99.99 })
    .build();
  console.log("Custom product:", customProduct);

  // Using the factory method directly
  const factoryInstance = Product.factory();
  const madeProduct = factoryInstance.make();
  console.log("Made product:", madeProduct);
}

export { Product, examples };
