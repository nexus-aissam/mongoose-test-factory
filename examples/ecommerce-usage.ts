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

// Define custom model interface (if you have custom static methods)
interface IProductModel extends mongoose.Model<IProduct> {
  findByAnyId(id: string): Promise<IProduct | null>;
  findByCategory(category: string): Promise<IProduct[]>;
  // Add any other custom static methods here
}

// Add custom static methods to schema
productSchema.statics.findByAnyId = function (id: string) {
  return this.findById(id);
};

productSchema.statics.findByCategory = function (category: string) {
  return this.find({ category });
};

// Create the model with factory type assistance
const ProductModel = mongoose.model<IProduct, IProductModel>(
  "Product",
  productSchema
);
const Product = withFactory<IProduct, IProductModel>(ProductModel); // Preserves all custom methods + adds factory

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

  // Test custom methods are preserved
  console.log("Testing custom methods:");
  const productWithId = await Product.findByAnyId("someId");
  console.log("findByAnyId works:", productWithId !== undefined);

  const categoryProducts = await Product.findByCategory("electronics");
  console.log("findByCategory works:", Array.isArray(categoryProducts));
}

export { Product, examples };
