const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = '3MVG91oqviqJKoEFK5ATqzD7l0qLHbGhbO0NMIiGWq_BrC7c9W0fCvfBXtPR1sCN8VYju1g6Y.ESsXaGvtbC8'; // Replace with Consumer Key
const CLIENT_SECRET = '965ECBCEDFA9B2C0645B0F33803580C542A27E12439A94E4638FAC1EE8233743'; // Replace with Consumer Secret
const REDIRECT_URI = 'http://localhost:3000/oauth2/callback';
const LOGIN_URL = 'https://propensiaai-dev-ed.develop.my.salesforce.com';

app.get('/oauth2/auth', (req, res) => {
  const authUrl = `${LOGIN_URL}/services/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=api%20refresh_token%20web`;
  res.redirect(authUrl);
});

app.get('/oauth2/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const response = await axios.post(`${LOGIN_URL}/services/oauth2/token`, null, {
      params: {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
      },
    });
    const { access_token, refresh_token, instance_url } = response.data;
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);
    console.log('Instance URL:', instance_url);
    res.send('Authentication successful! Check the terminal for tokens.');
  } catch (err) {
    console.error('OAuth Error:', err.response ? err.response.data : err.message);
    res.send('Authentication failed. Check the terminal for details.');
  }
});

app.listen(3000, () => {
  console.log('OAuth server running on http://localhost:3000');
  console.log('Visit http://localhost:3000/oauth2/auth to start authentication');
});