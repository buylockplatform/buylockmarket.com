import nodemailer from 'nodemailer';

// Email configuration using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface CourierNotificationData {
  courierEmail: string;
  courierName: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  vendorBusinessName: string;
  vendorLocation: string;
  vendorPhone: string;
  deliveryAddress: string;
  orderTotal: string;
  pickupInstructions?: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
}

interface CustomerOrderConfirmationData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderTotal: string;
  deliveryAddress: string;
  deliveryFee: string;
  estimatedDelivery: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
}

export async function sendCourierNotification(data: CourierNotificationData): Promise<boolean> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #FF4705; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .vendor-info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .pickup-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 1.2em; color: #FF4705; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚛 New Pickup Request - BuyLock</h1>
            <p>Order #${data.orderId}</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.courierName},</h2>
            <p>You have a new pickup request from BuyLock marketplace. Please review the details below:</p>
            
            <div class="order-info">
              <h3>📦 Order Information</h3>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Customer:</strong> ${data.customerName}</p>
              <p><strong>Customer Phone:</strong> ${data.customerPhone}</p>
              <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
              <p class="total"><strong>Order Total:</strong> KES ${data.orderTotal}</p>
            </div>
            
            <div class="vendor-info">
              <h3>🏪 Pickup Location (Vendor Details)</h3>
              <p><strong>Business:</strong> ${data.vendorBusinessName}</p>
              <p><strong>Location:</strong> ${data.vendorLocation}</p>
              <p><strong>Phone:</strong> ${data.vendorPhone}</p>
            </div>
            
            ${data.pickupInstructions ? `
            <div class="pickup-info">
              <h3>📋 Special Pickup Instructions</h3>
              <p>${data.pickupInstructions}</p>
            </div>
            ` : ''}
            
            <h3>📋 Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${data.orderItems.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>KES ${item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin: 20px 0; padding: 15px; background: #d4edda; border-radius: 5px;">
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Contact the vendor at <strong>${data.vendorPhone}</strong> to coordinate pickup</li>
                <li>Collect the items from <strong>${data.vendorLocation}</strong></li>
                <li>Deliver to <strong>${data.deliveryAddress}</strong></li>
                <li>Contact customer at <strong>${data.customerPhone}</strong> for delivery coordination</li>
              </ol>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 BuyLock Marketplace | Kenya's Premier E-commerce Platform</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
      NEW PICKUP REQUEST - BUYLOCK
      Order #${data.orderId}
      
      Hello ${data.courierName},
      
      You have a new pickup request from BuyLock marketplace.
      
      ORDER INFORMATION:
      - Order ID: ${data.orderId}
      - Customer: ${data.customerName}
      - Customer Phone: ${data.customerPhone}
      - Delivery Address: ${data.deliveryAddress}
      - Order Total: KES ${data.orderTotal}
      
      PICKUP LOCATION (VENDOR DETAILS):
      - Business: ${data.vendorBusinessName}
      - Location: ${data.vendorLocation}
      - Phone: ${data.vendorPhone}
      
      ${data.pickupInstructions ? `SPECIAL PICKUP INSTRUCTIONS:\n${data.pickupInstructions}\n\n` : ''}
      
      ORDER ITEMS:
      ${data.orderItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - KES ${item.price}`).join('\n')}
      
      NEXT STEPS:
      1. Contact the vendor at ${data.vendorPhone} to coordinate pickup
      2. Collect the items from ${data.vendorLocation}
      3. Deliver to ${data.deliveryAddress}
      4. Contact customer at ${data.customerPhone} for delivery coordination
      
      © 2025 BuyLock Marketplace | Kenya's Premier E-commerce Platform
    `;

    await transporter.sendMail({
      from: `"BuyLock Marketplace" <${process.env.GMAIL_USER}>`,
      to: data.courierEmail,
      subject: `🚛 New Pickup Request - Order #${data.orderId}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Courier notification sent successfully to ${data.courierEmail} for order ${data.orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending courier notification:', error);
    return false;
  }
}

export async function sendCustomerOrderConfirmation(data: CustomerOrderConfirmationData): Promise<boolean> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #FF4705; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .delivery-info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 1.2em; color: #FF4705; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
            .tracking-info { background: #d4edda; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Order Confirmed - BuyLock</h1>
            <p>Thank you for your purchase!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Your order has been successfully placed and confirmed! Here are your order details:</p>
            
            <div class="order-summary">
              <h3>📦 Order Summary</h3>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-KE')}</p>
              <p class="total"><strong>Total Amount:</strong> KES ${data.orderTotal}</p>
              <p><strong>Delivery Fee:</strong> KES ${data.deliveryFee}</p>
            </div>
            
            <div class="delivery-info">
              <h3>🚚 Delivery Information</h3>
              <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
              <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
            </div>
            
            <h3>📋 Your Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${data.orderItems.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>KES ${item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="tracking-info">
              <h3>📱 Track Your Order</h3>
              <p>You can track your order status by logging into your BuyLock account and visiting the "My Orders" section.</p>
              <p><strong>Order Status:</strong> Payment Confirmed - Processing</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <p><strong>What happens next?</strong></p>
              <ol>
                <li>Your order is being prepared by the vendor</li>
                <li>Our courier partner will pickup your items</li>
                <li>You'll receive delivery updates via SMS/Email</li>
                <li>Items will be delivered to your specified address</li>
              </ol>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 BuyLock Marketplace | Kenya's Premier E-commerce Platform</p>
            <p>Need help? Contact our support team or visit your account dashboard.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
      ORDER CONFIRMED - BUYLOCK
      
      Hello ${data.customerName},
      
      Your order has been successfully placed and confirmed!
      
      ORDER SUMMARY:
      - Order ID: ${data.orderId}
      - Order Date: ${new Date().toLocaleDateString('en-KE')}
      - Total Amount: KES ${data.orderTotal}
      - Delivery Fee: KES ${data.deliveryFee}
      
      DELIVERY INFORMATION:
      - Delivery Address: ${data.deliveryAddress}
      - Estimated Delivery: ${data.estimatedDelivery}
      
      YOUR ITEMS:
      ${data.orderItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - KES ${item.price}`).join('\n')}
      
      TRACK YOUR ORDER:
      You can track your order status by logging into your BuyLock account and visiting the "My Orders" section.
      Order Status: Payment Confirmed - Processing
      
      WHAT HAPPENS NEXT:
      1. Your order is being prepared by the vendor
      2. Our courier partner will pickup your items
      3. You'll receive delivery updates via SMS/Email
      4. Items will be delivered to your specified address
      
      © 2025 BuyLock Marketplace | Kenya's Premier E-commerce Platform
    `;

    await transporter.sendMail({
      from: `"BuyLock Marketplace" <${process.env.GMAIL_USER}>`,
      to: data.customerEmail,
      subject: `✅ Order Confirmed #${data.orderId} - BuyLock`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Order confirmation sent successfully to ${data.customerEmail} for order ${data.orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email service connection verified successfully');
    return true;
  } catch (error) {
    console.error('Email service connection failed:', error);
    return false;
  }
}