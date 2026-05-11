import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();

    // Yoco sends events like "payment.succeeded" or "charge.succeeded"
    const eventType: string = payload?.type ?? '';
    const isSuccess = eventType === 'payment.succeeded' || eventType === 'charge.succeeded';

    if (!isSuccess) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // checkout ID is in payload.payload.id or payload.payload.checkoutId
    const checkoutId: string =
      payload?.payload?.id ?? payload?.payload?.checkoutId ?? payload?.id ?? '';

    if (!checkoutId) {
      return new Response(JSON.stringify({ error: 'Missing checkout ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the pending transaction by checkout_id stored in metadata
    const { data: transactions, error: txFindError } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .filter('metadata->checkout_id', 'eq', checkoutId)
      .limit(1);

    if (txFindError || !transactions || transactions.length === 0) {
      // Already processed or not found — idempotent 200
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tx = transactions[0];
    const { user_id, wallet_id, amount, type, booking_id } = tx;

    // Mark transaction completed
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        metadata: { ...tx.metadata, confirmed_at: new Date().toISOString() },
      })
      .eq('id', tx.id);

    if (type === 'wallet_topup') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', wallet_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + amount })
          .eq('id', wallet_id);
      }
    } else if (type === 'booking_payment' && booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, provider_id, amount')
        .eq('id', booking_id)
        .single();

      if (booking) {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed', payment_method: 'card' })
          .eq('id', booking_id);

        // Credit provider pending_earnings
        const { data: providerWallet } = await supabase
          .from('wallets')
          .select('id, pending_earnings')
          .eq('user_id', booking.provider_id)
          .single();

        if (providerWallet) {
          await supabase
            .from('wallets')
            .update({ pending_earnings: providerWallet.pending_earnings + booking.amount })
            .eq('id', providerWallet.id);
        }
      }
    }

    // Notify user of confirmed payment
    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        title: 'Payment Confirmed',
        body:
          type === 'wallet_topup'
            ? `R${amount.toFixed(2)} has been added to your EaZi Wallet.`
            : `Your booking payment of R${amount.toFixed(2)} was successful.`,
        data: { type: 'payment', booking_id: booking_id ?? null },
      }),
    }).catch(() => {});

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
