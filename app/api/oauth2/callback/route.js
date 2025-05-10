import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SALESFORCE_CONFIG = {
  clientId: '3MVG91oqviqJKoEFK5ATqzD7l0qLHbGhbO0NMIiGWq_BrC7c9W0fCvfBXtPR1sCN8VYju1g6Y.ESsXaGvtbC8',
  clientSecret: '965ECBCEDFA9B2C0645B0F33803580C542A27E12439A94E4638FAC1EE8233743',
  redirectUri: 'http://localhost:3000/api/oauth2/callback',
  loginUrl: 'https://login.salesforce.com' // Change to 'https://test.salesforce.com' for sandbox
};

export async function GET(request) {
  console.log('Handling /api/oauth2/callback');
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('Query params:', { code, state, error, errorDescription });

  if (error) {
    console.log('Salesforce error:', error, errorDescription);
    return new Response(`Salesforce error: ${error} - ${errorDescription}`, { status: 400 });
  }

  if (!code) {
    console.log('No authorization code received');
    return new Response('Error: No authorization code received', { status: 400 });
  }

  try {
    // Retry cookie retrieval
    let codeVerifier;
    for (let i = 0; i < 3; i++) {
      const cookieStore = await cookies();
      const codeVerifierCookie = cookieStore.get('codeVerifier');
      codeVerifier = codeVerifierCookie?.value;
      console.log(`Attempt ${i + 1} - Retrieved codeVerifier:`, codeVerifier);
      console.log(`Attempt ${i + 1} - Code verifier cookie:`, codeVerifierCookie);
      if (codeVerifier) break;
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    }

    if (!codeVerifier) {
      console.log('No code verifier found after retries');
      return new Response('Error: No code verifier found', { status: 400 });
    }

    const tokenResponse = await fetch(`${SALESFORCE_CONFIG.loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: SALESFORCE_CONFIG.clientId,
        client_secret: SALESFORCE_CONFIG.clientSecret,
        redirect_uri: SALESFORCE_CONFIG.redirectUri,
        code,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.log('Token request failed:', errorData);
      return new Response(`Token request failed: ${errorData.error_description}`, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token data:', tokenData);

    // Extract userId and orgId from id field (e.g., https://login.salesforce.com/id/00Dbm00000KEXbqEAH/005bm00000BwIe9AAF)
    const idParts = tokenData.id ? tokenData.id.split('/') : [];
    const orgId = idParts.length > 2 ? idParts[idParts.length - 2] : null;
    const userId = idParts.length > 1 ? idParts[idParts.length - 1] : null;

    // Store tokens, userId, and orgId in a cookie
    const tokenCookie = `propensiaTokens=${JSON.stringify({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      instanceUrl: tokenData.instance_url,
      userId: userId,
      orgId: orgId
    })}; Path=/; SameSite=Lax; Max-Age=3600`;

    console.log('Setting token cookie:', tokenCookie);

    return new NextResponse(
      `<h1>Propensia.ai Authentication Successful!</h1>
      <p>Access Token: ${tokenData.access_token}</p>
      <p>Refresh Token: ${tokenData.refresh_token}</p>
      <p>Instance URL: ${tokenData.instance_url}</p>
      <p>User: ${tokenData.id}</p>
      <a href="/dashboard">View Dashboard Data</a>`,
      {
        headers: {
          'Content-Type': 'text/html',
          'Set-Cookie': [
            `codeVerifier=; Path=/; SameSite=Lax; Max-Age=0`,
            tokenCookie
          ]
        }
      }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return new Response('Error exchanging code for token: ' + error.message, { status: 500 });
  }
}