import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    } else {
        return new Response('Forbidden', { status: 403 });
    }
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const body = await request.json();
        const response = new Response('EVENT_RECEIVED', { status: 200 });

        // Fire-and-forget fetch - trigger handle endpoint without waiting
        fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/webhooks/facebook/handle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(20000) // 20 second timeout
        }).catch(error => {
            // Ignore all errors including timeouts - this is fire-and-forget
            console.log('Background fetch completed (errors ignored)');
        });

        //wait for 2s then return response
        await new Promise(resolve => setTimeout(resolve, 2000));


        return response;


    } catch (error) {
        console.error('Error handling message:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
