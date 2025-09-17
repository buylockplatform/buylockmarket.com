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

interface VendorAccountUnderReviewData {
  vendorEmail: string;
  vendorName: string;
  businessName: string;
}

interface VendorAccountApprovedData {
  vendorEmail: string;
  vendorName: string;
  businessName: string;
  loginUrl: string;
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

export async function sendVendorAccountUnderReviewNotification(data: VendorAccountUnderReviewData): Promise<boolean> {
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
            .status-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FFC107; }
            .next-steps { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
            .highlight { color: #FF4705; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Account Under Review - BuyLock</h1>
            <p>Your vendor application is being processed</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.vendorName},</h2>
            <p>Thank you for registering <strong>${data.businessName}</strong> on BuyLock marketplace!</p>
            
            <div class="status-box">
              <h3>⏳ Application Status: Under Review</h3>
              <p>Your vendor account application has been successfully submitted and is currently being reviewed by our team.</p>
              <p><strong>Business Name:</strong> ${data.businessName}</p>
              <p><strong>Submitted documents:</strong> National ID and Tax Certificate</p>
            </div>
            
            <div class="next-steps">
              <h3>🔍 What's Next?</h3>
              <ul>
                <li><strong>Document Verification:</strong> Our team will verify your submitted documents (National ID and Tax Certificate)</li>
                <li><strong>Business Validation:</strong> We'll validate your business information and compliance</li>
                <li><strong>Account Approval:</strong> Once verified, you'll receive an approval email with login instructions</li>
              </ul>
              <p><span class="highlight">Estimated Review Time:</span> 1-3 business days</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #d4edda; border-radius: 5px;">
              <h3>📞 Need Help?</h3>
              <p>If you have any questions about your application or need to update your information, please contact our vendor support team.</p>
              <p><strong>Important:</strong> You will receive another email once your account is approved with login instructions.</p>
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
      ACCOUNT UNDER REVIEW - BUYLOCK
      
      Hello ${data.vendorName},
      
      Thank you for registering ${data.businessName} on BuyLock marketplace!
      
      APPLICATION STATUS: Under Review
      
      Your vendor account application has been successfully submitted and is currently being reviewed by our team.
      
      Business Name: ${data.businessName}
      Submitted documents: National ID and Tax Certificate
      
      WHAT'S NEXT:
      1. Document Verification: Our team will verify your submitted documents
      2. Business Validation: We'll validate your business information and compliance
      3. Account Approval: Once verified, you'll receive an approval email with login instructions
      
      Estimated Review Time: 1-3 business days
      
      NEED HELP?
      If you have any questions about your application or need to update your information, please contact our vendor support team.
      
      Important: You will receive another email once your account is approved with login instructions.
      
      © 2025 BuyLock Marketplace | Kenya's Premier E-commerce Platform
    `;

    await transporter.sendMail({
      from: `"BuyLock Marketplace" <${process.env.GMAIL_USER}>`,
      to: data.vendorEmail,
      subject: `📋 Account Under Review - ${data.businessName} | BuyLock`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Vendor account under review notification sent successfully to ${data.vendorEmail} for business ${data.businessName}`);
    return true;
  } catch (error) {
    console.error('Error sending vendor account under review notification:', error);
    return false;
  }
}

export async function sendVendorAccountApprovedNotification(data: VendorAccountApprovedData): Promise<boolean> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .approval-box { background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
            .login-button { 
              background: #FF4705; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              display: inline-block; 
              font-weight: bold; 
              margin: 20px 0;
              text-align: center;
            }
            .next-steps { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
            .highlight { color: #FF4705; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Account Approved - BuyLock</h1>
            <p>Welcome to BuyLock Marketplace!</p>
          </div>
          
          <div class="content">
            <h2>Congratulations ${data.vendorName}!</h2>
            <p>Your vendor account for <strong>${data.businessName}</strong> has been approved and is now active on BuyLock marketplace!</p>
            
            <div class="approval-box">
              <h3>✅ Account Status: Approved & Active</h3>
              <p>Your business documents have been verified and your vendor account is now ready to use.</p>
              <p><strong>Business Name:</strong> ${data.businessName}</p>
              <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString('en-KE')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <h3>🚀 Start Selling Today!</h3>
              <p>Click the button below to access your vendor dashboard and begin listing your products or services:</p>
              <a href="${data.loginUrl}" class="login-button" data-testid="button-vendor-login">
                Access Vendor Dashboard
              </a>
            </div>
            
            <div class="next-steps">
              <h3>📈 Getting Started Guide</h3>
              <ol>
                <li><strong>Complete Your Profile:</strong> Add business description, logo, and contact details</li>
                <li><strong>List Products/Services:</strong> Start adding your inventory to the marketplace</li>
                <li><strong>Set Up Payment:</strong> Configure your Paystack account for automatic payments</li>
                <li><strong>Manage Orders:</strong> Use the dashboard to track and fulfill customer orders</li>
              </ol>
              <p><span class="highlight">Pro Tip:</span> Complete listings with high-quality images perform better!</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <h3>📚 Vendor Resources</h3>
              <ul>
                <li><strong>Commission Rate:</strong> Platform commission is deducted automatically from sales</li>
                <li><strong>Payment Schedule:</strong> Earnings are processed and paid out regularly</li>
                <li><strong>Support:</strong> Access help documentation and vendor support in your dashboard</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 BuyLock Marketplace | Kenya's Premier E-commerce Platform</p>
            <p>Welcome to the BuyLock family! Let's grow your business together.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
      ACCOUNT APPROVED - BUYLOCK
      
      Congratulations ${data.vendorName}!
      
      Your vendor account for ${data.businessName} has been approved and is now active on BuyLock marketplace!
      
      ACCOUNT STATUS: Approved & Active
      
      Your business documents have been verified and your vendor account is now ready to use.
      
      Business Name: ${data.businessName}
      Approval Date: ${new Date().toLocaleDateString('en-KE')}
      
      START SELLING TODAY!
      
      Access your vendor dashboard: ${data.loginUrl}
      
      GETTING STARTED GUIDE:
      1. Complete Your Profile: Add business description, logo, and contact details
      2. List Products/Services: Start adding your inventory to the marketplace
      3. Set Up Payment: Configure your Paystack account for automatic payments
      4. Manage Orders: Use the dashboard to track and fulfill customer orders
      
      Pro Tip: Complete listings with high-quality images perform better!
      
      VENDOR RESOURCES:
      - Commission Rate: Platform commission is deducted automatically from sales
      - Payment Schedule: Earnings are processed and paid out regularly
      - Support: Access help documentation and vendor support in your dashboard
      
      © 2025 BuyLock Marketplace | Kenya's Premier E-commerce Platform
      Welcome to the BuyLock family! Let's grow your business together.
    `;

    await transporter.sendMail({
      from: `"BuyLock Marketplace" <${process.env.GMAIL_USER}>`,
      to: data.vendorEmail,
      subject: `🎉 Account Approved - Welcome to BuyLock | ${data.businessName}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Vendor account approved notification sent successfully to ${data.vendorEmail} for business ${data.businessName}`);
    return true;
  } catch (error) {
    console.error('Error sending vendor account approved notification:', error);
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