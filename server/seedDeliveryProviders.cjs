const { neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool } = require('@neondatabase/serverless');
const ws = require("ws");

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const providers = [
  {
    id: 'dispatch_service',
    name: 'BuyLock Dispatch Service',
    type: 'dispatch',
    logo: '🚛',
    isActive: true,
    notificationMethod: 'webhook',
    webhookNotificationUrl: 'http://localhost:5000/api/internal/dispatch/notify',
    contactEmail: 'dispatch@buylock.com',
    contactPhone: '+254700000000',
    supportedRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    baseRate: '150.00',
    distanceRate: '10.00',
    weightMultiplier: '1.00',
    estimatedDeliveryTime: 'Same-day delivery'
  },
  {
    id: 'g4s',
    name: 'G4S Courier',
    type: 'courier',
    logo: '🚚',
    apiEndpoint: 'https://api.g4s.co.ke',
    isActive: true,
    notificationMethod: 'email',
    contactEmail: 'logistics@g4s.co.ke',
    contactPhone: '+254722000001',
    supportedRegions: ['Nairobi', 'Mombasa', 'Kisumu'],
    baseRate: '200.00',
    distanceRate: '25.00',
    weightMultiplier: '1.00',
    estimatedDeliveryTime: '24-48 hours'
  },
  {
    id: 'fargo_courier',
    name: 'Fargo Courier',
    type: 'courier',
    logo: '📦',
    apiEndpoint: 'https://api.fargocourier.co.ke',
    isActive: true,
    notificationMethod: 'sms',
    contactEmail: 'orders@fargocourier.co.ke',
    contactPhone: '+254733000001',
    supportedRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    baseRate: '150.00',
    distanceRate: '20.00',
    weightMultiplier: '1.00',
    estimatedDeliveryTime: 'Next-day delivery'
  },
  {
    id: 'pickup-mtaani',
    name: 'Pickup Mtaani',
    type: 'courier',
    logo: '🏍️',
    apiEndpoint: 'https://api.pickupmtaani.co.ke',
    isActive: true,
    notificationMethod: 'webhook',
    webhookNotificationUrl: 'https://api.pickupmtaani.co.ke/buylock/webhook',
    contactEmail: 'support@pickupmtaani.co.ke',
    contactPhone: '+254744000001',
    supportedRegions: ['Nairobi'],
    baseRate: '100.00',
    distanceRate: '15.00',
    weightMultiplier: '1.20',
    estimatedDeliveryTime: '2-3 hours'
  },
  {
    id: 'speed-af',
    name: 'Speed AF',
    type: 'courier',
    logo: '⚡',
    apiEndpoint: 'https://api.speedaf.co.ke',
    isActive: true,
    notificationMethod: 'email',
    contactEmail: 'dispatch@speedaf.com',
    contactPhone: '+254755000001',
    supportedRegions: ['Nairobi', 'Kiambu'],
    baseRate: '250.00',
    distanceRate: '30.00',
    weightMultiplier: '1.00',
    estimatedDeliveryTime: 'Express 1-2 hours'
  },
  {
    id: 'modern-minds',
    name: 'Modern Minds Couriers',
    type: 'courier',
    logo: '🧠',
    apiEndpoint: 'https://api.modernminds.co.ke',
    isActive: true,
    notificationMethod: 'email',
    contactEmail: 'buylockplatform@gmail.com',
    contactPhone: '+254700123456',
    supportedRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    baseRate: '180.00',
    distanceRate: '20.00',
    weightMultiplier: '1.00',
    estimatedDeliveryTime: '3-5 hours'
  }
];

async function seedDeliveryProviders() {
  try {
    console.log('Seeding delivery providers...');
    
    // Import schema dynamically
    const schemaModule = await import('../shared/schema.js');
    const { deliveryProviders } = schemaModule;
    
    for (const provider of providers) {
      try {
        await db.insert(deliveryProviders).values(provider).onConflictDoUpdate({
          target: deliveryProviders.id,
          set: {
            name: provider.name,
            type: provider.type || 'courier',
            logo: provider.logo,
            apiEndpoint: provider.apiEndpoint,
            isActive: provider.isActive,
            notificationMethod: provider.notificationMethod || 'email',
            webhookNotificationUrl: provider.webhookNotificationUrl,
            contactEmail: provider.contactEmail,
            contactPhone: provider.contactPhone,
            supportedRegions: provider.supportedRegions,
            baseRate: provider.baseRate,
            distanceRate: provider.distanceRate,
            weightMultiplier: provider.weightMultiplier,
            estimatedDeliveryTime: provider.estimatedDeliveryTime || '24-48 hours',
            updatedAt: new Date()
          }
        });
        console.log(`✓ Created/updated provider: ${provider.name}`);
      } catch (error) {
        console.error(`Error with provider ${provider.id}:`, error.message);
      }
    }
    
    console.log('✓ Delivery providers seeding completed successfully');
    
  } catch (error) {
    console.error('Error seeding delivery providers:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedDeliveryProviders().catch(console.error);
}

module.exports = { seedDeliveryProviders };