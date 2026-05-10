import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface YocoWebhookPayload {
  id: string;
  type: string;
  createdDate: string;
  payload: {
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      booking_id?: string;
      user_id?: string;
      type?: string;
    };
    checkoutId?: string;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('YOCO_WEBHOOK_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature
    const rawBody = await req.text();
    const signature = req.headers.get('x-yoco-signature') ?? '';

    if (webhookSecret) {
      const expectedSig = createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const event: YocoWebhookPayload = JSON.parse(rawBody);
    const { type, payload } = event;

    if (type === 'payment.succeeded') {
      const checkoutId = payload.checkoutId ?? payload.id;
      const bookingId = payload.metadata?.booking_id;
      const userId = payload.metadata?.user_id;
      const paymentType = payload.metadata?.type ?? 'booking';
      const amountZAR = payload.amount / 100;

      // Find transaction by checkout_id in metadata
      const { data: transaction } = await supabase
        .from('transactions')
        .select('id, wallet_id, user_id, booking_id')
        .contains('metadata', { checkout_id: checkoutId })
        .single();

      if (!transaction) {
        return new Response(JSON.stringify({ error: 'Transaction not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update transaction to completed
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      if (paymentType === 'booking' && bookingId) {
        // Fetch booking details for provider credit
        const { data: booking } = await supabase
          .from('bookings')
          .select('provider_id, amount')
          .eq('id', bookingId)
          .single();

        // Confirm booking
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_method: 'card',
          })
          .eq('id', bookingId);

        // Credit provider pending earnings
        if (booking) {
          const { data: providerWallet } = await supabase
            .from('wallets')
            .select('id, pending_earnings')
            .eq('user_id', booking.provider_id)
            .single();

          if (providerWallet) {
            await supabase
              .from('wallets')
              .update({
                pending_earnings: (providerWallet.pending_earnings ?? 0) + amountZAR,
              })
              .eq('id', providerWallet.id);
          }

          // Notify provider
          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: booking.provider_id,
              title: 'New Confirmed Booking!',
              body: `A booking of R${amountZAR.toFixed(2)} has been confirmed.`,
              data: { type: 'booking', booking_id: bookingId },
            }),
          }).catch(() => {});
        }

        // Notify client
        if (userId) {
          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              title: 'Payment Successful',
              body: `Your booking payment of R${amountZAR.toFixed(2)} was successful.`,
              data: { type: 'payment', booking_id: bookingId },
            }),
          }).catch(() => {});
        }
      } else if (paymentType === 'topup' && userId) {
        // Top up wallet balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', userId)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: (wallet.balance ?? 0) + amountZAR })
            .eq('id', wallet.id);
        }

        // Notify client
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            title: 'Wallet Topped Up',
            body: `R${amountZAR.toFixed(2)} has been added to your EaZi wallet.`,
            data: { type: 'topup' },
          }),
        }).catch(() => {});
      }
    } else if (type === 'payment.failed') {
      const checkoutId = payload.checkoutId ?? payload.id;
      const bookingId = payload.metadata?.booking_id;
      const userId = payload.metadata?.user_id;

      // Update transaction to failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .contains('metadata', { checkout_id: checkoutId });

      // Cancel booking if applicable
      if (bookingId) {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId);
      }

      // Notify user of failure
      if (userId) {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            title: 'Payment Failed',
            body: 'Your payment could not be processed. Please try again.',
            data: { type: 'payment_failed', booking_id: bookingId ?? null },
          }),
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
