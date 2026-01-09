
import { db } from "./db";
import { deliveryProviders } from "../shared/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function seedCouriers() {
    console.log("Seeding delivery providers...");

    const fargoCourier = {
        id: "fargo_courier",
        name: "Fargo Courier Services",
        type: "courier",
        logo: "🚛",
        apiEndpoint: "https://api.fargocourier.co.ke/v1",
        apiKey: process.env.FARGO_API_KEY || "test_key",
        baseRate: "200.00",
        distanceRate: "18.00",
        weightMultiplier: "1.00",
        estimatedDeliveryTime: "24-48 hours",
        supportedRegions: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Machakos"],
        contactPhone: "+254722555888",
        isActive: true,
        notificationMethod: "api",
    };

    try {
        // Check if exists
        const existing = await db.select().from(deliveryProviders).where(eq(deliveryProviders.id, "fargo_courier"));

        if (existing.length > 0) {
            console.log("Fargo Courier already exists, updating...");
            await db.update(deliveryProviders)
                .set(fargoCourier)
                .where(eq(deliveryProviders.id, "fargo_courier"));
        } else {
            console.log("Creating Fargo Courier...");
            await db.insert(deliveryProviders).values(fargoCourier as any);
        }

        console.log("Seed completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding couriers:", error);
        process.exit(1);
    }
}

seedCouriers();
