import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pageId, userAccessToken } = await request.json();

    if (!pageId || !userAccessToken) {
      return NextResponse.json({ error: 'Missing pageId or userAccessToken' }, { status: 400 });
    }

    // Define the webhook fields for Facebook page subscription
    const webhookFields = encodeURIComponent('messages,messaging_postbacks,messaging_optins,messaging_optouts,message_deliveries,message_reads,messaging_referrals,messaging_handovers,feed');

    const url = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${userAccessToken}&subscribed_fields=${webhookFields}`;

    // Subscribe the app to the page to receive webhook events
    const subscribeResponse = await fetch(url, {
      method: 'POST',
    });

    if (!subscribeResponse.ok) {
      const errorData = await subscribeResponse.text();
      console.error('Facebook subscription error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to subscribe app to Facebook page', 
        details: errorData 
      }, { status: 400 });
    }

    const responseData = await subscribeResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Facebook page subscribed successfully',
      data: responseData 
    });
  } catch (error) {
    console.error('Facebook subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
