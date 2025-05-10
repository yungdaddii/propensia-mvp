'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Read tokens from cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});

    console.log('Dashboard: Cookies', cookies);

    const tokens = cookies.propensiaTokens ? JSON.parse(cookies.propensiaTokens) : null;
    console.log('Dashboard: Parsed tokens', tokens);

    if (!tokens || !tokens.accessToken || !tokens.instanceUrl) {
      setError('No authentication tokens available. Please authenticate via OAuth.');
      return;
    }

    // Fetch user info from API route
    fetch('/api/user-info', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('Dashboard: Fetch response', response);
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${text}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Dashboard: Fetched user info', data);
        setUserInfo(data);
      })
      .catch(err => {
        console.error('Dashboard: Fetch error', err);
        setError('Error fetching user info: ' + err.message);
      });
  }, []);

  if (error) {
    return (
      <div>
        <h1>Dashboard Error</h1>
        <p>{error}</p>
        <a href="/api/oauth2/auth">Re-authenticate</a>
      </div>
    );
  }

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Propensia.ai Dashboard</h1>
      <p>User ID: {userInfo.user_id}</p>
      <p>Username: {userInfo.username}</p>
      <p>Organization ID: {userInfo.organization_id}</p>
      <p>Display Name: {userInfo.display_name}</p>
    </div>
  );
}