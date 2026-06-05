import cron from 'node-cron';
import { db } from './db';
import { orders, users, vendors, payoutRequests, platformSettings } from '@shared/schema';
import { eq, and, lt, gt } from 'drizzle-orm';
import { sendPushNotification } from './firebaseAdmin';

export function startCronJobs() {
  console.log('Starting cron jobs...');

  // ── Every 5 minutes: cancel vendor-unresponsive orders ──────────────────────
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running 2-hour vendor unresponsive check...');
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // Find orders that are 'paid' and created > 2 hours ago
      const unresponsiveOrders = await db.select()
        .from(orders)
        .where(
          and(
            eq(orders.status, 'paid'),
            lt(orders.createdAt, twoHoursAgo)
          )
        );

      for (const order of unresponsiveOrders) {
        console.log(`Order ${order.id} is unresponsive. Changing status to cancelled_vendor_unresponsive...`);
        
        // Update order status
        await db.update(orders)
          .set({ status: 'cancelled_vendor_unresponsive' })
          .where(eq(orders.id, order.id));

        // Fetch user to send push notification
        const [user] = await db.select().from(users).where(eq(users.id, order.userId));
        if (user && user.fcmToken) {
          await sendPushNotification(user.fcmToken, {
            title: 'Order Cancelled',
            body: `Your order for KES ${order.totalAmount} was cancelled because the vendor did not respond in time. A refund has been initiated.`,
            data: { orderId: order.id }
          });
        }
      }
    } catch (error) {
      console.error('Error in vendor unresponsive cron job:', error);
    }
  });

  // ── Every Monday at 05:00 UTC (08:00 EAT): weekly auto-settlement ────────────
  // Reads the `enable_auto_settlement` platform flag before running.
  cron.schedule('0 5 * * 1', async () => {
    console.log('🏦 Weekly auto-settlement cron triggered...');
    try {
      // Check the platform flag
      const [flagRow] = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.settingKey, 'enable_auto_settlement'))
        .limit(1);

      const isEnabled = flagRow?.settingValue === 'true';
      if (!isEnabled) {
        console.log('ℹ️  Auto-settlement is disabled. Skipping.');
        return;
      }

      // Fetch all approved vendors with positive available balance
      const eligibleVendors = await db
        .select()
        .from(vendors)
        .where(eq(vendors.verificationStatus, 'approved'));

      let queued = 0;
      let skipped = 0;

      for (const vendor of eligibleVendors) {
        const balance = parseFloat(vendor.availableBalance ?? '0');
        if (balance <= 0) {
          skipped++;
          continue;
        }

        // Find the most recent order for this vendor to link the payout request
        let [latestOrder] = await db
          .select({ id: orders.id })
          .from(orders)
          .where(and(eq(orders.vendorId, vendor.id), eq(orders.status, 'customer_confirmed')))
          .limit(1);

        if (!latestOrder) {
          // Fallback to any order by this vendor if no customer_confirmed order exists
          [latestOrder] = await db
            .select({ id: orders.id })
            .from(orders)
            .where(eq(orders.vendorId, vendor.id))
            .limit(1);
        }

        const orderIdToUse = latestOrder?.id || (null as any);

        // Create payout request
        await db.insert(payoutRequests).values({
          vendorId: vendor.id,
          orderId: orderIdToUse,
          requestedAmount: balance.toFixed(2),
          availableBalance: balance.toFixed(2),
          status: 'pending',
          requestReason: 'Weekly auto-settlement',
        });

        // Send FCM notification to vendor if token exists
        if (vendor.fcmToken) {
          try {
            await sendPushNotification(vendor.fcmToken, {
              title: 'Payout Requested',
              body: `Your weekly settlement of KES ${balance.toFixed(2)} has been queued for processing.`,
              data: { type: 'settlement' },
            });
          } catch (fcmErr) {
            console.warn(`FCM notification failed for vendor ${vendor.id}:`, fcmErr);
          }
        }

        queued++;
        console.log(`✅ Queued settlement for vendor ${vendor.businessName}: KES ${balance.toFixed(2)}`);
      }

      console.log(`🏦 Weekly settlement complete. Queued: ${queued}, Skipped: ${skipped}`);
    } catch (error) {
      console.error('Error in weekly auto-settlement cron job:', error);
    }
  });
}

