import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SALESFORCE_CONFIG = {
  clientId: '3MVG91oqviqJKoEFK5ATqzD7l0qLHbGhbO0NMIiGWq_BrC7c9W0fCvfBXtPR1sCN8VYju1g6Y.ESsXaGvtbC8',
  clientSecret: '965ECBCEDFA9B2C0645B0F33803580C542A27E12439A94E4638FAC1EE8233743',
  redirectUri: 'http://localhost:3000/api/oauth2/callback',
  loginUrl: 'https://login.salesforce.com' // Change to 'https://test.salesforce.com' for sandbox
};

// Generate code verifier and challenge for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export async function GET() {
  console.log('Handling /api/oauth2/auth');
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = `propensia_dashboard_${Date.now()}`;

    const authUrl = new URL(`${SALESFORCE_CONFIG.loginUrl}/services/oauth2/authorize`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', SALESFORCE_CONFIG.clientId);
    authUrl.searchParams.append('redirect_uri', SALESFORCE_CONFIG.redirectUri);
    authUrl.searchParams.append('scope', 'api refresh_token web');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    console.log('Generated codeVerifier:', codeVerifier);
    console.log('Generated codeChallenge:', codeChallenge);
    console.log('Setting cookie:', `codeVerifier=${codeVerifier}; Path=/; SameSite=Lax; Max-Age=1800`);
    console.log('Redirecting to Salesforce:', authUrl.toString());

    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        'Set-Cookie': `codeVerifier=${codeVerifier}; Path=/; SameSite=Lax; Max-Age=1800`
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response('Error initiating OAuth: ' + error.message, { status: 500 });
  }
}