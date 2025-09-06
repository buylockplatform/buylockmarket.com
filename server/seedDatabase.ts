import { db } from "./db";
import { 
  categories,
  subcategories,
  users,
  vendors,
  products,
  services,
  type InsertCategory,
  type InsertSubcategory,
  type UpsertUser,
  type InsertVendor,
  type InsertProduct,
  type InsertService
} from "@shared/schema";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  console.log("🌱 Seeding BuyLock database...");

  try {
    // 1. Create categories first
    console.log("📁 Creating categories...");
    
    const categoryData: InsertCategory[] = [
      {
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices, gadgets, and accessories",
        imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500",
        isActive: true
      },
      {
        name: "Fashion",
        slug: "fashion",
        description: "Clothing, accessories, and fashion items",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
        isActive: true
      },
      {
        name: "Home & Kitchen",
        slug: "home-kitchen",
        description: "Home appliances, furniture, and kitchen items",
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
        isActive: true
      },
      {
        name: "Health & Beauty",
        slug: "health-beauty",
        description: "Personal care, health, and beauty products",
        imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500",
        isActive: true
      },
      {
        name: "Sports & Outdoors",
        slug: "sports-outdoors",
        description: "Sports equipment and outdoor gear",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
        isActive: true
      },
      {
        name: "Professional Services",
        slug: "professional-services",
        description: "Expert professional services for your business needs",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
        isActive: true
      }
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).onConflictDoNothing().returning();
    console.log(`✅ Created ${insertedCategories.length} categories`);

    // Get all categories for reference
    const allCategories = await db.select().from(categories);
    const electronicsCategory = allCategories.find(c => c.slug === "electronics");
    const homeCategory = allCategories.find(c => c.slug === "home-kitchen");
    const sportsCategory = allCategories.find(c => c.slug === "sports-outdoors");
    const healthCategory = allCategories.find(c => c.slug === "health-beauty");
    const servicesCategory = allCategories.find(c => c.slug === "professional-services");

    // 2. Create subcategories
    if (electronicsCategory) {
      const subcategoryData: InsertSubcategory[] = [
        {
          name: "Smartphones",
          slug: "smartphones",
          categoryId: electronicsCategory.id,
          description: "Mobile phones and smartphones"
        },
        {
          name: "Laptops & Computers",
          slug: "laptops-computers",
          categoryId: electronicsCategory.id,
          description: "Laptops, desktops, and computer accessories"
        }
      ];
      await db.insert(subcategories).values(subcategoryData).onConflictDoNothing();
    }

    // 3. Create the specific vendor that matches the API data
    console.log("👤 Creating vendor user and vendor record...");
    
    // First, create/ensure the user record exists
    const vendorUserId = "74bf6c33-7f09-4844-903d-72bff3849c95";
    const vendorUserData: UpsertUser = {
      id: vendorUserId,
      email: "vendor@buylock.com",
      firstName: "John",
      lastName: "Vendor",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [vendorUser] = await db
      .insert(users)
      .values(vendorUserData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: vendorUserData.email,
          firstName: vendorUserData.firstName,
          lastName: vendorUserData.lastName,
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log("✅ Vendor user created/updated:", vendorUser.id);

    // Create vendor record
    const hashedPassword = await bcrypt.hash("password123", 10);
    const vendorData: InsertVendor = {
      id: vendorUserId,
      email: "vendor@buylock.com",
      passwordHash: hashedPassword,
      businessName: "BuyLock Premier Store",
      contactEmail: "vendor@buylock.com",
      contactName: "John Vendor",
      phone: "+254740406442",
      address: "Nairobi CBD, Kenya",
      businessCategory: "General",
      city: "Nairobi",
      country: "Kenya",
      description: "Premium products and services retailer with nationwide delivery",
      verificationStatus: "verified",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [vendor] = await db
      .insert(vendors)
      .values(vendorData)
      .onConflictDoUpdate({
        target: vendors.id,
        set: {
          businessName: vendorData.businessName,
          contactName: vendorData.contactName,
          phone: vendorData.phone,
          address: vendorData.address,
          city: vendorData.city,
          country: vendorData.country,
          description: vendorData.description,
          verificationStatus: vendorData.verificationStatus,
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log("✅ Vendor record created/updated:", vendor.id);

    // 4. Create products that match the API data
    if (electronicsCategory && homeCategory && sportsCategory && healthCategory) {
      console.log("🛍️ Creating products...");
      
      const productData: InsertProduct[] = [
        {
          id: "024cd072-cc59-45b4-ba7c-d63d48492ee8",
          name: "Camping Tent 4-Person",
          slug: "camping-tent-4-person",
          description: "Waterproof 4-person camping tent with easy setup and excellent ventilation. Perfect for family camping adventures and outdoor activities.",
          shortDescription: "Waterproof 4-person camping tent",
          price: "14999.00",
          originalPrice: "16999.00",
          imageUrl: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=500",
          categoryId: sportsCategory.id,
          vendorId: vendorUserId,
          stock: 19,
          rating: "4.60",
          reviewCount: 89,
          isActive: true,
          isFeatured: true,
          adminApproved: true,
          tags: ["camping", "tent", "waterproof"],
          createdAt: new Date("2025-08-17T11:44:35.084Z"),
          updatedAt: new Date("2025-08-17T11:44:35.084Z")
        },
        {
          id: "30430dc7-692e-4dbe-99c0-fa6f9e888bc3",
          name: "Electric Toothbrush Pro",
          slug: "electric-toothbrush-pro", 
          description: "Advanced electric toothbrush with multiple cleaning modes, pressure sensor, and long battery life for superior oral care.",
          shortDescription: "Advanced electric toothbrush with smart features",
          price: "4500.00",
          originalPrice: "5999.00",
          imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500",
          categoryId: healthCategory.id,
          vendorId: vendorUserId,
          stock: 45,
          rating: "4.80",
          reviewCount: 234,
          isActive: true,
          isFeatured: true,
          adminApproved: true,
          tags: ["electric", "toothbrush", "oral-care"],
          createdAt: new Date("2025-08-15T14:22:10.120Z"),
          updatedAt: new Date("2025-08-15T14:22:10.120Z")
        },
        {
          name: "Samsung Galaxy S24 Ultra",
          slug: "samsung-galaxy-s24-ultra",
          description: "Latest Samsung flagship with S Pen, 200MP camera, and powerful performance. Experience the future of mobile technology.",
          shortDescription: "Samsung flagship with S Pen and 200MP camera",
          price: "85000.00",
          originalPrice: "95000.00",
          imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500",
          categoryId: electronicsCategory.id,
          vendorId: vendorUserId,
          stock: 25,
          rating: "4.70",
          reviewCount: 156,
          isActive: true,
          isFeatured: true,
          adminApproved: true,
          tags: ["samsung", "smartphone", "flagship"]
        },
        {
          name: "Smart Coffee Maker Pro",
          slug: "smart-coffee-maker-pro",
          description: "WiFi-enabled coffee maker with programmable brewing, multiple cup sizes, and smartphone app control.",
          shortDescription: "Smart WiFi coffee maker with app control",
          price: "12999.00",
          originalPrice: "15999.00",
          imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
          categoryId: homeCategory.id,
          vendorId: vendorUserId,
          stock: 30,
          rating: "4.50",
          reviewCount: 89,
          isActive: true,
          isFeatured: false,
          adminApproved: true,
          tags: ["smart", "coffee", "kitchen"]
        }
      ];

      await db.insert(products).values(productData).onConflictDoNothing();
      console.log(`✅ Created products`);
    }

    // 5. Create services that match the API data
    if (servicesCategory) {
      console.log("🔧 Creating services...");
      
      const serviceData: InsertService[] = [
        {
          id: "7e560be4-8852-4289-870e-3e62e0e3ae79",
          name: "Carpentry & Furniture Repair",
          slug: "carpentry-furniture-repair",
          description: "Skilled carpenter for custom furniture, cabinet installation, door hanging, window repairs, and general woodworking projects.",
          shortDescription: "Custom furniture, cabinets, door repairs",
          price: "2200.00",
          priceType: "hourly",
          imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500",
          categoryId: servicesCategory.id,
          providerId: vendorUserId,
          rating: "0.00",
          reviewCount: 0,
          isActive: true,
          isFeatured: true,
          adminApproved: true,
          tags: ["carpentry", "furniture", "woodworking", "hourly"],
          location: "Nairobi & Surrounding Areas",
          isAvailableToday: true,
          createdAt: new Date("2025-08-13T09:19:27.572Z"),
          updatedAt: new Date("2025-08-13T09:19:27.572Z")
        },
        {
          name: "Home Cleaning Service",
          slug: "home-cleaning-service",
          description: "Professional home cleaning service including deep cleaning, regular maintenance, and specialized cleaning for all room types.",
          shortDescription: "Professional deep cleaning and maintenance",
          price: "1800.00",
          priceType: "hourly",
          imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500",
          categoryId: servicesCategory.id,
          providerId: vendorUserId,
          rating: "0.00",
          reviewCount: 0,
          isActive: true,
          isFeatured: true,
          adminApproved: true,
          tags: ["cleaning", "home-service", "hourly"],
          location: "Nairobi Metro",
          isAvailableToday: true
        },
        {
          name: "Electrical Installation & Repair",
          slug: "electrical-installation-repair",
          description: "Licensed electrician for home electrical work, wiring, fixture installation, troubleshooting, and safety inspections.",
          shortDescription: "Licensed electrical work and repairs",
          price: "2500.00",
          priceType: "hourly",
          imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500",
          categoryId: servicesCategory.id,
          providerId: vendorUserId,
          rating: "0.00",
          reviewCount: 0,
          isActive: true,
          isFeatured: true,
          adminApproved: true,
          tags: ["electrical", "wiring", "home-service", "hourly"],
          location: "Nairobi Metro",
          isAvailableToday: false
        }
      ];

      await db.insert(services).values(serviceData).onConflictDoNothing();
      console.log(`✅ Created services`);
    }

    console.log("🎉 Database seeded successfully!");
    console.log(`📧 Vendor login: vendor@buylock.com`);
    console.log(`🔑 Vendor password: password123`);
    console.log(`👤 Vendor ID: ${vendorUserId}`);

    return {
      vendorId: vendorUserId,
      vendorEmail: "vendor@buylock.com"
    };

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}