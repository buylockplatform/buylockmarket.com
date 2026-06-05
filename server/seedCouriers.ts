
import { db } from "./db";
import { deliveryProviders } from "../shared/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function seedCouriers() {
    console.log("Seeding delivery providers...");

    // ── Buylock Delivery (in-house rider fleet) ────────────────────────────────
    // This is the PRIMARY active courier. All orders dispatched via the internal
    // rider app. No external API — delivery_jobs table drives the workflow.
    const buylockDelivery = {
        id: "buylock_delivery",
        name: "Buylock Delivery",
        type: "internal",
        logo: "🏍️",
        apiEndpoint: null as any,
        apiKey: null as any,
        baseRate: "150.00",
        distanceRate: "15.00",
        weightMultiplier: "1.00",
        estimatedDeliveryTime: "1-3 hours",
        supportedRegions: ["Nairobi", "Kiambu", "Machakos", "Kajiado"],
        contactPhone: process.env.BUYLOCK_DISPATCH_PHONE || "+254700000000",
        isActive: true,            // ← Active by default
        notificationMethod: "api" as const,
    };

    // ── Fargo Courier (external — kept inactive) ───────────────────────────────
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
        isActive: false,           // ← Deactivated — Buylock Delivery is primary
        notificationMethod: "api" as const,
    };

    const couriersToSeed = [buylockDelivery, fargoCourier];

    try {
        for (const courier of couriersToSeed) {
            const existing = await db
                .select()
                .from(deliveryProviders)
                .where(eq(deliveryProviders.id, courier.id));

            if (existing.length > 0) {
                console.log(`Updating ${courier.name}...`);
                await db
                    .update(deliveryProviders)
                    .set(courier as any)
                    .where(eq(deliveryProviders.id, courier.id));
            } else {
                console.log(`Creating ${courier.name}...`);
                await db.insert(deliveryProviders).values(courier as any);
            }

            console.log(`✅ ${courier.name} — isActive: ${courier.isActive}`);
        }

        console.log("\n🏍️  Buylock Delivery is now the active courier.");
        console.log("Seed completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding couriers:", error);
        process.exit(1);
    }
}

seedCouriers();
