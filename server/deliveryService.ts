import {
  DeliveryProvider,
  Delivery,
  DeliveryUpdate,
  InsertDelivery,
  InsertDeliveryUpdate,
  Order
} from "@shared/schema";

// Standardized courier API interface
export interface CourierAPIProvider {
  createDelivery(delivery: DeliveryRequest): Promise<CourierResponse>;
  getDeliveryStatus(trackingId: string): Promise<CourierStatus>;
  cancelDelivery(trackingId: string): Promise<boolean>;
  requestQuote(delivery: DeliveryRequest): Promise<CourierQuoteResponse>;
}

export interface CourierQuoteResponse {
  success: boolean;
  amount?: number;
  currency?: string;
  quoteId?: string;
  estimatedDeliveryTime?: Date;
  error?: string;
  errorCode?: string;
}

export interface DeliveryRequest {
  orderId: string;
  pickupAddress: string;
  pickupCity?: string;
  pickupSuburb?: string;
  pickupBuilding?: string;
  pickupPostalCode?: string;
  deliveryAddress: string;
  deliveryCity?: string;
  deliverySuburb?: string;
  deliveryBuilding?: string;
  deliveryPostalCode?: string;
  customerPhone: string;
  vendorPhone: string;
  packageDescription: string;
  specialInstructions?: string;
  estimatedWeight?: number;
  declaredValue?: number;
}

export interface CourierResponse {
  success: boolean;
  trackingId?: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  error?: string;
}

export interface CourierStatus {
  trackingId: string;
  status: string;
  description: string;
  location?: string;
  timestamp: Date;
  estimatedDelivery?: Date;
}

// G4S Courier Implementation
export class G4SCourierAPI implements CourierAPIProvider {
  private apiKey: string;
  private baseUrl = "https://api.g4s.co.ke";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createDelivery(request: DeliveryRequest): Promise<CourierResponse> {
    try {
      // Simulate G4S API call
      const response = await fetch(`${this.baseUrl}/deliveries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_address: request.pickupAddress,
          delivery_address: request.deliveryAddress,
          customer_phone: request.customerPhone,
          vendor_phone: request.vendorPhone,
          package_description: request.packageDescription,
          special_instructions: request.specialInstructions,
          weight: request.estimatedWeight,
          declared_value: request.declaredValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`G4S API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        trackingId: data.tracking_id,
        estimatedPickupTime: new Date(data.estimated_pickup),
        estimatedDeliveryTime: new Date(data.estimated_delivery),
      };
    } catch (error) {
      console.error('G4S API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getDeliveryStatus(trackingId: string): Promise<CourierStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/deliveries/${trackingId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`G4S API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        trackingId,
        status: data.status,
        description: data.description,
        location: data.location,
        timestamp: new Date(data.timestamp),
        estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
      };
    } catch (error) {
      console.error('G4S Status API Error:', error);
      throw error;
    }
  }

  async cancelDelivery(trackingId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/deliveries/${trackingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('G4S Cancel API Error:', error);
      return false;
    }
  }

  async requestQuote(request: DeliveryRequest): Promise<CourierQuoteResponse> {
    // G4S stub - logic could be added if G4S supports quoting
    return {
      success: true,
      amount: 200,
      currency: 'KES',
      estimatedDeliveryTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };
  }
}

// Fargo Courier Implementation (v1.0.0 compatible)
export class FargoCourierAPI implements CourierAPIProvider {
  private apiKey: string;
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(apiKey: string, username: string, password: string, env: string = 'production') {
    this.apiKey = apiKey;
    this.username = username;
    this.password = password;
    this.baseUrl = env.toLowerCase() === 'uat'
      ? "https://api-uat.fargocourier.co.ke/v1"
      : "https://api.fargocourier.co.ke/v1";
  }

  async createDelivery(request: DeliveryRequest): Promise<CourierResponse> {
    try {
      // Helper to clean suburb names (remove slashes, 'ward', etc.)
      // Helper to clean suburb names (remove slashes, 'ward', etc.)
      const cleanSuburb = (rawSuburb: string | undefined | null) => {
        if (!rawSuburb) return "CBD";
        // Split by slash and take first part (e.g. "Woodley/Kenyatta" -> "Woodley")
        let cleaned = rawSuburb.split('/')[0].trim();
        // Remove administrative suffixes (case insensitive)
        const suffixesToRemove = [
          / ward$/i,
          / division$/i,
          / location$/i,
          / sub-location$/i,
          / sub location$/i,
          / district$/i,
          / constituency$/i
        ];

        suffixesToRemove.forEach(regex => {
          cleaned = cleaned.replace(regex, '');
        });

        // Remove any trailing commas or spaces
        cleaned = cleaned.replace(/,.*$/, '').trim();

        return cleaned || "CBD";
      };

      const payload = {
        credentials: {
          username: this.username,
          password: this.password,
        },
        sender: {
          name: "BuyLock Vendor", // Should ideally come from vendor profile
          address: request.pickupAddress,
          building: request.pickupBuilding,
          postalCode: request.pickupPostalCode,
          city: request.pickupCity || "Nairobi",
          suburb: cleanSuburb(request.pickupSuburb),
          phone: request.vendorPhone,
        },
        recipient: {
          name: "BuyLock Customer", // Should ideally come from user profile
          address: request.deliveryAddress,
          building: request.deliveryBuilding,
          postalCode: request.deliveryPostalCode,
          city: request.deliveryCity || "Nairobi",
          suburb: cleanSuburb(request.deliverySuburb),
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
        shipperReference: request.orderId.slice(-30) // Fargo API max 30 chars
      };

      console.log('🚚 Fargo API Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/shipmentRequest`, {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fargo API Error Body:', JSON.stringify(errorData, null, 2));
        throw new Error(`Fargo API error (${response.status}): ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        trackingId: data.trackingNumber,
        // Fargo ShipmentCreationResponse doesn't provide ETAs directly in 1.0.0 shipmentRequest response
        // but we can estimate or fetch via status if needed.
        estimatedPickupTime: new Date(),
        estimatedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
      };
    } catch (error) {
      console.error('Fargo API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getDeliveryStatus(trackingId: string): Promise<CourierStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${trackingId}`, {
        headers: {
          'Authorization': `ApiKey ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Fargo API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        trackingId,
        status: data.status,
        description: `Shipment Status: ${data.status}`,
        location: data.recipient.city, // Rough location approximation from recipient city
        timestamp: new Date(),
        estimatedDelivery: undefined,
      };
    } catch (error) {
      console.error('Fargo Status API Error:', error);
      throw error;
    }
  }

  async cancelDelivery(trackingId: string): Promise<boolean> {
    // Note: Cancel delivery endpoint not found in v1.0.0 spec
    console.warn(`Cancel delivery requested for ${trackingId}, but endpoint is not available in Fargo API v1.0.0`);
    return false;
  }

  async requestQuote(request: DeliveryRequest): Promise<CourierQuoteResponse> {
    // Note: Fargo API v1.0.0 does not support direct quoting via API.
    // The /shipmentRequest endpoint creates a shipment immediately and does not return pricing.
    // We will perform a basic local validation and return a standard rate.

    // Basic validation of required fields
    if (!request.deliveryCity || !request.deliverySuburb) {
      return {
        success: false,
        error: "City and Suburb are required for Fargo Courier",
        errorCode: "INVALID_LOCATION"
      };
    }

    // Since we can't reliably quote via API without creating a shipment (and creating garbage data),
    // we will return a successful "quote" with a standard base rate.
    // The actual cost will be finalized upon shipment creation.
    console.log(`DEBUG: Fargo quote requested (simulated). Path blocked due to API limitations.`);

    return {
      success: true,
      amount: 250, // Standard base rate for Fargo within Nairobi
      currency: "KES",
      estimatedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
      quoteId: "EST-" + Date.now()
    };
  }
}

// Delivery Service Manager
export class DeliveryService {
  private providers: Map<string, CourierAPIProvider> = new Map();

  constructor() {
    // Initialize courier providers (API keys would come from environment variables)
    this.providers.set('g4s', new G4SCourierAPI(process.env.G4S_API_KEY || 'demo-key'));
    this.providers.set('fargo_courier', new FargoCourierAPI(
      process.env.FARGO_API_KEY || 'demo-key',
      process.env.FARGO_USERNAME || 'demo-user',
      process.env.FARGO_PASSWORD || 'demo-pass',
      process.env.FARGO_ENV || 'production'
    ));
  }

  async createDelivery(order: Order, provider: DeliveryProvider): Promise<CourierResponse> {
    const courierAPI = this.providers.get(provider.id);
    if (!courierAPI) {
      throw new Error(`Courier provider ${provider.id} not supported`);
    }

    // Dynamic import to avoid circular dependency
    const { storage } = await import('./storage');
    const vendor = await storage.getVendorById(order.vendorId);
    const customer = await storage.getUser(order.userId);

    const deliveryRequest: DeliveryRequest = {
      orderId: order.id,
      // Sender (Vendor) Info
      pickupAddress: vendor?.businessAddress || vendor?.address || "Vendor Address",
      pickupCity: vendor?.city || "Nairobi",
      pickupSuburb: vendor?.suburb || "CBD",
      pickupBuilding: vendor?.building || undefined,
      pickupPostalCode: vendor?.postalCode || undefined,

      // Recipient (Customer) Info
      deliveryAddress: order.deliveryAddress || customer?.address || "No address provided",
      deliveryCity: (order as any).deliveryCity || customer?.city || "Nairobi",
      deliverySuburb: (order as any).deliverySuburb || customer?.suburb || "CBD",
      deliveryBuilding: (order as any).deliveryBuilding || customer?.building || undefined,
      deliveryPostalCode: (order as any).deliveryPostalCode || customer?.postalCode || undefined,

      customerPhone: customer?.phone || "0700000000",
      vendorPhone: vendor?.phone || "0700000001",
      packageDescription: `Order ${order.id} - ${order.orderType}`,
      specialInstructions: order.notes || undefined,
      estimatedWeight: 1.0,
      declaredValue: parseFloat(order.totalAmount.toString()),
    };

    return await courierAPI.createDelivery(deliveryRequest);
  }

  async getDeliveryStatus(providerId: string, trackingId: string): Promise<CourierStatus> {
    const courierAPI = this.providers.get(providerId);
    if (!courierAPI) {
      throw new Error(`Courier provider ${providerId} not supported`);
    }

    return await courierAPI.getDeliveryStatus(trackingId);
  }

  async cancelDelivery(providerId: string, trackingId: string): Promise<boolean> {
    const courierAPI = this.providers.get(providerId);
    if (!courierAPI) {
      throw new Error(`Courier provider ${providerId} not supported`);
    }

    return await courierAPI.cancelDelivery(trackingId);
  }

  async getQuote(providerId: string, request: DeliveryRequest): Promise<CourierQuoteResponse> {
    const courierAPI = this.providers.get(providerId);
    if (!courierAPI) {
      throw new Error(`Courier provider ${providerId} not supported`);
    }

    return await courierAPI.requestQuote(request);
  }

  mapCourierStatusToInternal(courierStatus: string, providerId: string): string {
    // Standardize status across different courier providers
    const statusMap: Record<string, Record<string, string>> = {
      g4s: {
        'created': 'pending',
        'pickup_scheduled': 'pickup_scheduled',
        'picked_up': 'picked_up',
        'in_transit': 'in_transit',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'failed': 'failed',
        'cancelled': 'cancelled',
      },
      fargo_courier: {
        'booked': 'pending',
        'pickup_arranged': 'pickup_scheduled',
        'collected': 'picked_up',
        'in_warehouse': 'in_transit',
        'out_for_delivery': 'out_for_delivery',
        'To Deliver': 'out_for_delivery', // Mapped from observed test data
        'delivered': 'delivered',
        'Delivered': 'delivered', // Case sensitive check just in case
        'delivery_failed': 'failed',
        'cancelled': 'cancelled',
      },
    };

    return statusMap[providerId]?.[courierStatus] || courierStatus;
  }
}

export const deliveryService = new DeliveryService();