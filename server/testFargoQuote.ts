import dotenv from 'dotenv';
import { FargoCourierAPI } from './deliveryService';

dotenv.config();

const API_KEY = process.env.FARGO_API_KEY;

async function testQuote() {
    if (!API_KEY) {
        console.error('FARGO_API_KEY missing');
        return;
    }

    const envs = ['uat', 'production'];
    const paths = ['/quoteRequest', '/quoterequest', '/quotes', '/quote', '/shipmentRequest'];

    for (const env of envs) {
        console.log(`\n--- Testing Env: ${env} ---`);
        const fargo = new FargoCourierAPI(API_KEY, env);

        for (const path of paths) {
            console.log(`\n[${env}] Probing Path: ${path}`);

            const request = {
                orderId: 'QUOTE-TEST-' + Date.now(),
                pickupAddress: 'Viking House, Waiyaki Way',
                pickupCity: 'Nairobi',
                pickupSuburb: 'Westlands',
                pickupBuilding: 'Viking House',
                pickupPostalCode: '00100',
                deliveryAddress: 'Riara Road, Kilimani',
                deliveryCity: 'Nairobi',
                deliverySuburb: 'Kilimani',
                deliveryBuilding: 'Riara Center',
                deliveryPostalCode: '00100',
                customerPhone: '+254700000000',
                vendorPhone: '+254700000001',
                packageDescription: 'Quote test',
                estimatedWeight: 1.0,
                declaredValue: 1000,
            };

            try {
                // Manually call to test different paths
                const url = `${(fargo as any).baseUrl}${path}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `ApiKey ${API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sender: {
                            name: "BuyLock Vendor",
                            address: request.pickupAddress,
                            building: request.pickupBuilding || "Store",
                            postalCode: request.pickupPostalCode || "00100",
                            city: request.pickupCity || "Nairobi",
                            suburb: request.pickupSuburb || "CBD",
                            phone: request.vendorPhone,
                        },
                        recipient: {
                            name: "BuyLock Customer",
                            address: request.deliveryAddress,
                            building: request.deliveryBuilding,
                            postalCode: request.deliveryPostalCode,
                            city: request.deliveryCity || "Nairobi",
                            suburb: request.deliverySuburb || "CBD",
                            phone: request.customerPhone,
                        },
                        parcelDetails: [{
                            weight: request.estimatedWeight || 1.0,
                            length: 10,
                            breadth: 10,
                            height: 10,
                            description: request.packageDescription,
                            quantity: 1
                        }],
                        shipperReference: request.orderId
                    }),
                });

                console.log(`[${env}] ${path} Status: ${response.status} ${response.statusText}`);
                if (response.status !== 404) {
                    const text = await response.text();
                    console.log(`[${env}] ${path} Response (First 100 chars):`, text.substring(0, 100));
                    try {
                        const json = JSON.parse(text);
                        console.log(`[${env}] Has Tracking Code:`, !!json.trackingNumber);
                        console.log(`[${env}] Has Status:`, json.status);
                        console.log(`[${env}] Has Price/Amount:`, !!json.amount || !!json.price || !!json.total);
                    } catch (e) {
                        console.log(`[${env}] Response is not JSON`);
                    }
                }
            } catch (error: any) {
                console.error(`[${env}] ${path} Error:`, error.message);
            }
        }
    }
}

testQuote();
