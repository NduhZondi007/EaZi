import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushNotificationBody {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: 'default';
  priority: 'high';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const expoPushToken = Deno.env.get('EXPO_PUSH_ACCESS_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, data }: PushNotificationBody = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Look up push token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', user_id)
      .single();

    if (userError || !user?.push_token) {
      // No push token registered — skip silently
      return new Response(
        JSON.stringify({ skipped: true, reason: 'No push token' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const pushToken = user.push_token;

    // Validate Expo push token format
    if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Invalid push token format' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      title,
      body,
      data: data ?? {},
      sound: 'default',
      priority: 'high',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (expoPushToken) {
      headers['Authorization'] = `Bearer ${expoPushToken}`;
    }

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
    });

    const expoData = await expoResponse.json();

    // Handle invalid/expired tokens
    const ticketData = expoData?.data;
    if (ticketData?.status === 'error') {
      const details = ticketData.details as { error?: string } | undefined;
      if (
        details?.error === 'DeviceNotRegistered' ||
        details?.error === 'InvalidCredentials'
      ) {
        // Clear stale token
        await supabase
          .from('users')
          .update({ push_token: null })
          .eq('id', user_id);
      }
    }

    return new Response(JSON.stringify({ sent: true, ticket: expoData }), {
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
