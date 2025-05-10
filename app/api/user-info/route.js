import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Read tokens from cookie
    const cookies = request.headers.get('cookie')?.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {}) || {};

    console.log('API: Cookies', cookies);

    const tokens = cookies.propensiaTokens ? JSON.parse(cookies.propensiaTokens) : null;
    console.log('API: Parsed tokens', tokens);

    if (!tokens || !tokens.accessToken || !tokens.instanceUrl || !tokens.userId) {
      return new Response('No authentication tokens or user ID available', { status: 401 });
    }

    const { accessToken, instanceUrl, userId, orgId } = tokens;

    // Set timeout for fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${instanceUrl}/services/data/v61.0/sobjects/User/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('API: Fetch error', errorData);
        return new Response(`Error fetching user info: ${errorData[0]?.message || 'Unknown error'}`, { status: response.status });
      }

      const userInfo = await response.json();
      console.log('API: User info', userInfo);

      // Format response to match dashboard expectations
      const formattedInfo = {
        user_id: userInfo.Id,
        username: userInfo.Username,
        organization_id: orgId || 'Unknown', // Use orgId from cookie
        display_name: userInfo.Name
      };

      return NextResponse.json(formattedInfo);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API: Fetch error', error);
      return new Response(`Error fetching user info: ${error.message}`, { status: 500 });
    }
  } catch (error) {
    console.error('API: Error processing request', error);
    return new Response(`Error processing request: ${error.message}`, { status: 500 });
  }
}