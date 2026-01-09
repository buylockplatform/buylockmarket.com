import dotenv from 'dotenv';
import { FargoCourierAPI } from './deliveryService';

dotenv.config();

console.log('DEBUG: Environment variables loaded.');
const API_KEY = process.env.FARGO_API_KEY;
console.log('DEBUG: FARGO_API_KEY present:', !!API_KEY);

async function testFargoIntegration() {
    if (!API_KEY) {
        console.error('❌ FARGO_API_KEY not found in environment variables.');
        return;
    }

    console.log('🚀 Starting Fargo API Integration Test...');
    const fargo = new FargoCourierAPI(API_KEY, process.env.FARGO_ENV || 'production');
    console.log(`Environment: ${process.env.FARGO_ENV || 'production'} (URL: ${process.env.FARGO_ENV === 'uat' ? 'api-uat' : 'api'}.fargocourier.co.ke)`);

    // 1. Test Create Shipment (Dry Run/Mock data)
    console.log('\n--- Test 1: Create Shipment ---');
    const mockRequest = {
        orderId: 'TEST-' + Date.now(),
        pickupAddress: 'Warehouse A, Nairobi West',
        deliveryAddress: 'Riara Road, Kilimani',
        building: 'Riara Center',
        city: 'Nairobi',
        suburb: 'Kilimani',
        postalCode: '00100',
        vendorPhone: '+254712345678',
        customerPhone: '+254722345678',
        packageDescription: 'Box of electronics',
        estimatedWeight: 2.5,
        declaredValue: 5000,
    };

    try {
        const createResult = await fargo.createDelivery(mockRequest);
        if (createResult.success) {
            console.log('✅ Shipment created successfully!');
            console.log('Tracking ID:', createResult.trackingId);

            // 2. Test Get Status
            if (createResult.trackingId) {
                console.log('\n--- Test 2: Get Status ---');
                const status = await fargo.getDeliveryStatus(createResult.trackingId);
                console.log('✅ Status retrieved:', status.status);
                console.log('Full details:', JSON.stringify(status, null, 2));
            }
        } else {
            console.error('❌ Shipment creation failed:', createResult.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error during test:', error);
    }
}

testFargoIntegration();
