import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentBody {
  amount: number;
  booking_id?: string;
  type: 'booking' | 'topup';
  currency: string;
  method?: 'card' | 'wallet' | 'eazi_cash';
  wallet_id?: string;
  action?: 'refund';
  transaction_id?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const yocoSecretKey = Deno.env.get('YOCO_SECRET_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user JWT
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: CreatePaymentBody = await req.json();
    const { amount, booking_id, type, currency = 'ZAR', method = 'card', wallet_id, action } = body;

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate booking if provided
    if (type === 'booking' && booking_id) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, amount, client_id')
        .eq('id', booking_id)
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (booking.client_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!['pending', 'accepted'].includes(booking.status)) {
        return new Response(
          JSON.stringify({ error: 'Booking is not in a payable state' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // Handle wallet/eazi_cash payments (no Yoco redirect needed)
    if (method === 'wallet' || method === 'eazi_cash') {
      const balanceField = method === 'wallet' ? 'balance' : 'eazi_cash_balance';
      const currentBalance = wallet[balanceField] as number;

      if (currentBalance < amount) {
        return new Response(
          JSON.stringify({ error: 'Insufficient balance' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: type === 'booking' ? 'booking_payment' : 'eazi_cash_redemption',
          amount,
          currency,
          method,
          status: 'completed',
          booking_id: booking_id ?? null,
          metadata: { processed_at: new Date().toISOString() },
        })
        .select()
        .single();

      if (txError) {
        return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Deduct balance
      const newBalance = currentBalance - amount;
      await supabase
        .from('wallets')
        .update({ [balanceField]: newBalance })
        .eq('id', wallet.id);

      // Update booking status to confirmed if applicable
      if (type === 'booking' && booking_id) {
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_method: method,
          })
          .eq('id', booking_id);
      }

      // Notify via push
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          title: 'Payment Successful',
          body: type === 'topup'
            ? `R${amount.toFixed(2)} added to your wallet.`
            : `Booking payment of R${amount.toFixed(2)} confirmed.`,
          data: { type: 'payment', booking_id: booking_id ?? null },
        }),
      }).catch(() => {});

      return new Response(
        JSON.stringify({ success: true, transaction_id: transaction.id }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Card payment: create Yoco checkout session
    const amountInCents = Math.round(amount * 100);

    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${yocoSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency,
        successUrl: 'https://eazi.app/payment/success',
        cancelUrl: 'https://eazi.app/payment/cancel',
        metadata: {
          booking_id: booking_id ?? '',
          user_id: user.id,
          type,
        },
      }),
    });

    if (!yocoResponse.ok) {
      const yocoError = await yocoResponse.text();
      return new Response(
        JSON.stringify({ error: `Payment provider error: ${yocoError}` }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const yocoData = await yocoResponse.json();

    // Create pending transaction record
    await supabase.from('transactions').insert({
      user_id: user.id,
      wallet_id: wallet.id,
      type: type === 'booking' ? 'booking_payment' : 'wallet_topup',
      amount,
      currency,
      method: 'card',
      status: 'pending',
      booking_id: booking_id ?? null,
      metadata: {
        checkout_id: yocoData.id,
        yoco_redirect_url: yocoData.redirectUrl,
      },
    });

    return new Response(
      JSON.stringify({
        checkout_id: yocoData.id,
        redirect_url: yocoData.redirectUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
