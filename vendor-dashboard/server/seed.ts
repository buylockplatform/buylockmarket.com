import { db } from "./db.js";
import { vendors, categories, products, services } from "../shared/schema.js";
import * as bcrypt from "bcrypt";

export async function seedVendorDatabase() {
  console.log("🌱 Seeding vendor database...");

  try {
    // Get existing categories from the main database (categories are shared)
    const allCategories = await db.select().from(categories);
    console.log("✅ Found existing categories:", allCategories.length);
    
    // Use first available category for demo purposes
    const firstCategory = allCategories[0];
    const secondCategory = allCategories[1] || firstCategory;
    const thirdCategory = allCategories[2] || firstCategory;

    // Create sample vendor account
    const hashedPassword = await bcrypt.hash("password123", 10);
    const sampleVendor = {
      email: "vendor@buylock.com",
      password: hashedPassword,
      businessName: "BuyLock Electronics Store",
      contactName: "John Vendor",
      phone: "+234 901 234 5678",
      address: "123 Business District, Lagos, Nigeria",
      description: "Premium electronics and accessories retailer with over 10 years of experience",
      verified: true,
    };

    const [insertedVendor] = await db.insert(vendors).values(sampleVendor).onConflictDoNothing().returning();
    console.log("✅ Sample vendor created");

    // Create sample products (only if vendor and categories exist)
    if (insertedVendor && firstCategory) {
      const sampleProducts = [
        {
          vendorId: insertedVendor.id,
          categoryId: firstCategory.id,
          name: "Samsung Galaxy S24 Ultra",
          description: "Latest Samsung flagship with S Pen, 200MP camera, and powerful performance",
          price: "850000.00",
          images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500"],
          brand: "Samsung",
          stockCount: 25,
          featured: true,
        },
        {
          vendorId: insertedVendor.id,
          categoryId: firstCategory.id,
          name: "Apple MacBook Pro M3",
          description: "14-inch MacBook Pro with M3 chip, perfect for professionals",
          price: "1200000.00",
          images: ["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500"],
          brand: "Apple",
          stockCount: 15,
          featured: true,
        },
        {
          vendorId: insertedVendor.id,
          categoryId: firstCategory.id,
          name: "Sony WH-1000XM4 Headphones",
          description: "Premium noise-canceling wireless headphones",
          price: "180000.00",
          images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500"],
          brand: "Sony",
          stockCount: 50,
          featured: false,
        }
      ];

      await db.insert(products).values(sampleProducts).onConflictDoNothing();
      console.log("✅ Sample products created");
    }

    // Create sample services (only if vendor and categories exist)
    if (insertedVendor && secondCategory && thirdCategory) {
      const sampleServices = [
        {
          vendorId: insertedVendor.id,
          categoryId: secondCategory.id,
          name: "Professional Web Development",
          description: "Custom website development using modern frameworks like React, Vue.js, and Node.js",
          price: "250000.00",
          images: ["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500"],
          duration: "2-4 weeks",
          location: "Remote/On-site",
          availableToday: true,
          featured: true,
        },
        {
          vendorId: insertedVendor.id,
          categoryId: secondCategory.id,
          name: "Digital Marketing Strategy",
          description: "Comprehensive digital marketing campaigns including SEO, social media, and paid advertising",
          price: "150000.00",
          images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500"],
          duration: "1-2 weeks",
          location: "Remote",
          availableToday: true,
          featured: true,
        },
        {
          vendorId: insertedVendor.id,
          categoryId: thirdCategory.id,
          name: "Home Appliance Repair",
          description: "Expert repair services for all home appliances including refrigerators, washing machines, and air conditioners",
          price: "25000.00",
          images: ["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500"],
          duration: "2-4 hours",
          location: "Customer Location",
          availableToday: false,
          featured: false,
        }
      ];

      await db.insert(services).values(sampleServices).onConflictDoNothing();
      console.log("✅ Sample services created");
    }

    console.log("🎉 Vendor database seeded successfully!");
    console.log("📧 Sample vendor login: vendor@buylock.com");
    console.log("🔑 Sample vendor password: password123");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}