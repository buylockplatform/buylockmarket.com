import nodemailer from 'nodemailer';
import type { DeliveryProvider } from "@shared/schema";
import { uwaziiService } from './uwaziiService';
import { storage } from './storage';

export interface NotificationData {
  orderId: string;
  trackingId?: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  deliveryFee: number;
  estimatedDeliveryTime?: string;
  vendorName: string;
  vendorPhone: string;
  specialInstructions?: string;
}

export interface VendorNotificationData {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: string;
  orderType: string;
  deliveryAddress?: string;
  vendorName?: string;
  vendorPhone: string;
  itemCount?: number;
}

export class NotificationService {
  private transporter?: nodemailer.Transporter;

  constructor() {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    }
  }

  async notifyCourier(provider: DeliveryProvider, data: NotificationData): Promise<boolean> {
    try {
      switch (provider.notificationMethod) {
        case 'email':
          return await this.sendEmailNotification(provider, data);
        case 'sms':
          return await this.sendSMSNotification(provider, data);
        case 'webhook':
          return await this.sendWebhookNotification(provider, data);
        default:
          console.error(`Unknown notification method: ${provider.notificationMethod}`);
          return false;
      }
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  }

  private async sendEmailNotification(provider: DeliveryProvider, data: NotificationData): Promise<boolean> {
    if (!this.transporter || !provider.contactEmail) {
      console.error('Gmail not configured or no contact email for provider');
      return false;
    }

    const emailContent = {
      from: process.env.GMAIL_USER,
      to: provider.contactEmail,
      subject: `🚚 New Delivery Order - ${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: #FF4605; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🧠 Modern Minds Couriers</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 18px; font-weight: normal;">New Delivery Assignment</h2>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4605;">
              <h3 style="color: #FF4605; margin-top: 0;">📋 Order Details</h3>
              <table style="width: 100%; border-spacing: 0;">
                <tr><td style="padding: 5px 0; font-weight: bold; width: 40%;">Order ID:</td><td>${data.orderId}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Customer:</td><td>${data.customerName}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Customer Phone:</td><td>${data.customerPhone}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Package:</td><td>${data.packageDescription}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Delivery Fee:</td><td style="color: #28a745; font-weight: bold;">KSh ${Number(data.deliveryFee).toLocaleString()}</td></tr>
                ${data.estimatedDeliveryTime ? `<tr><td style="padding: 5px 0; font-weight: bold;">ETA:</td><td>${data.estimatedDeliveryTime}</td></tr>` : ''}
              </table>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h3 style="color: #1976d2; margin-top: 0;">📍 Pickup Information</h3>
              <table style="width: 100%; border-spacing: 0;">
                <tr><td style="padding: 5px 0; font-weight: bold; width: 40%;">Vendor:</td><td>${data.vendorName}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Vendor Phone:</td><td>${data.vendorPhone}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Pickup Address:</td><td>${data.pickupAddress}</td></tr>
              </table>
            </div>

            <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9c27b0;">
              <h3 style="color: #7b1fa2; margin-top: 0;">🏠 Delivery Information</h3>
              <table style="width: 100%; border-spacing: 0;">
                <tr><td style="padding: 5px 0; font-weight: bold; width: 40%;">Delivery Address:</td><td>${data.deliveryAddress}</td></tr>
                ${data.specialInstructions ? `<tr><td style="padding: 5px 0; font-weight: bold;">Special Instructions:</td><td>${data.specialInstructions}</td></tr>` : ''}
              </table>
            </div>

            <div style="background: linear-gradient(135deg, #FF4605, #e63900); color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">⚡ Action Required</h3>
              <p style="margin: 0; font-size: 16px;">Please coordinate with the vendor for pickup and provide tracking updates via our system.</p>
            </div>

            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This is an automated notification from BuyLock Marketplace.<br>
                Powered by Modern Minds Couriers Integration
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(emailContent);
      console.log(`✅ Email sent successfully to ${provider.contactEmail}`);
      return true;
    } catch (error) {
      console.error('Gmail send error:', error);
      return false;
    }
  }

  private async sendSMSNotification(provider: DeliveryProvider, data: NotificationData): Promise<boolean> {
    if (!provider.contactPhone) {
      console.error('No contact phone for SMS notification');
      return false;
    }

    try {
      // Create SMS message for courier
      const orderIdShort = data.orderId.slice(-8).toUpperCase();
      const message = `NEW DELIVERY ORDER! Order #${orderIdShort} from ${data.customerName}. Pickup from ${data.vendorName} (${data.vendorPhone}) at ${data.pickupAddress}. Deliver to: ${data.deliveryAddress}. Fee: KES ${Number(data.deliveryFee).toLocaleString()}. Please coordinate pickup with vendor. - BuyLock Delivery`;

      console.log(`📱 Sending courier SMS to: ${provider.contactPhone}`);
      
      const result = await uwaziiService.sendSMS(provider.contactPhone, message);
      
      if (result.success) {
        console.log(`✅ Courier SMS notification sent successfully for order ${data.orderId}, MessageId: ${result.messageId}`);
        return true;
      } else {
        console.error(`❌ Failed to send courier SMS for order ${data.orderId}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error('Courier SMS notification error:', error);
      return false;
    }
  }

  private async sendWebhookNotification(provider: DeliveryProvider, data: NotificationData): Promise<boolean> {
    if (!provider.webhookNotificationUrl) {
      console.error('No webhook URL configured for provider');
      return false;
    }

    const webhookPayload = {
      event: 'new_delivery_order',
      orderId: data.orderId,
      providerId: provider.id,
      timestamp: new Date().toISOString(),
      orderDetails: {
        customer: {
          name: data.customerName,
          phone: data.customerPhone,
        },
        vendor: {
          name: data.vendorName,
          phone: data.vendorPhone,
        },
        pickup: {
          address: data.pickupAddress,
        },
        delivery: {
          address: data.deliveryAddress,
          instructions: data.specialInstructions,
        },
        package: {
          description: data.packageDescription,
        },
        payment: {
          deliveryFee: data.deliveryFee,
        },
        estimatedDeliveryTime: data.estimatedDeliveryTime,
      }
    };

    try {
      const response = await fetch(provider.webhookNotificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BuyLock-Delivery-System/1.0',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (response.ok) {
        console.log(`Webhook notification sent successfully to ${provider.name}`);
        return true;
      } else {
        console.error(`Webhook failed with status ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Webhook notification error:', error);
      return false;
    }
  }

  async notifyDispatchService(data: NotificationData): Promise<boolean> {
    // For the internal dispatch service, we'll use a special internal notification
    console.log(`Internal dispatch notification: Order ${data.orderId} ready for internal delivery processing`);
    
    // In a real microservice architecture, this would be a message queue or internal API call
    // For now, we'll just log and return success
    return true;
  }

  async notifyVendorNewOrder(data: VendorNotificationData): Promise<boolean> {
    try {
      if (!data.vendorPhone) {
        console.error('No vendor phone number provided for SMS notification');
        return false;
      }

      // Generate public token for order link
      const token = await storage.ensurePublicToken(data.orderId);
      
      // Use the correct domain - REPLIT_DOMAINS contains the proper published domain
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
        : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`;
      
      const orderLink = `${baseUrl}/o/${token}`;

      // Create concise SMS message for vendor with order link
      const orderIdShort = data.orderId.slice(-8).toUpperCase();
      const amount = Number(data.totalAmount).toLocaleString();
      
      const message = `NEW ORDER! #${orderIdShort} from ${data.customerName}. KES ${amount}. Track: ${orderLink}`;

      console.log(`📱 Sending new order SMS to vendor: ${data.vendorPhone}`);
      
      const result = await uwaziiService.sendSMS(data.vendorPhone, message);
      
      if (result.success) {
        console.log(`✅ Vendor SMS notification sent successfully for order ${data.orderId}`);
        return true;
      } else {
        console.error(`❌ Failed to send vendor SMS for order ${data.orderId}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error('Vendor notification error:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();