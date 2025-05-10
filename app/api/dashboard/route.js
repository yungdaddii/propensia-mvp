// app/api/dashboard/route.js
import { NextResponse } from 'next/server';
import jsforce from 'jsforce';

export async function GET(request) {
  const cookies = request.headers.get('cookie')?.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {}) || {};

  const tokens = cookies.propensiaTokens ? JSON.parse(cookies.propensiaTokens) : null;
  if (!tokens || !tokens.accessToken || !tokens.instanceUrl) {
    return NextResponse.json({ error: 'No authentication tokens available' }, { status: 401 });
  }

  const { accessToken, instanceUrl } = tokens;
  const conn = new jsforce.Connection({ instanceUrl, accessToken });
  try {
    const result = await conn.query(
      `SELECT Id, Name, Owner.Name, Owner.UserRole.Name, Account.Name, StageName, Amount, ExpectedRevenue, LeadSource, Type, NextStep, CloseDate, CreatedDate, Probability
       FROM Opportunity
       WHERE IsClosed = false
       ORDER BY Name ASC
       LIMIT 50`
    );
    return NextResponse.json({ opportunities: result.records });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}