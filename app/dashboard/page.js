// app/dashboard/page.js
'use client';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [data, setData] = useState({ opportunities: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Read tokens from cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});

    const tokens = cookies.propensiaTokens ? JSON.parse(cookies.propensiaTokens) : null;
    if (!tokens || !tokens.accessToken || !tokens.instanceUrl) {
      setError('No authentication tokens available. Please authenticate via OAuth.');
      return;
    }

    // Fetch user info
    fetch('/api/user-info')
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${text}`);
          });
        }
        return response.json();
      })
      .then(data => setUserInfo(data))
      .catch(err => setError('Error fetching user info: ' + err.message));

    // Fetch dashboard data
    fetch('/api/dashboard')
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${text}`);
          });
        }
        return response.json();
      })
      .then(data => setData(data))
      .catch(err => setError('Error fetching dashboard data: ' + err.message));
  }, []);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-red-500">Dashboard Error</h1>
        <p>{error}</p>
        <a href="/api/oauth2/auth" className="text-blue-500 underline">Re-authenticate</a>
      </div>
    );
  }

  if (!userInfo || !data) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  // Calculate age (days since CreatedDate)
  const opportunitiesWithAge = data.opportunities.map(opp => ({
    ...opp,
    Age: Math.floor((new Date() - new Date(opp.CreatedDate)) / (1000 * 60 * 60 * 24))
  }));

  // Prepare data for Opportunity Stages Bar Chart
  const stageCounts = opportunitiesWithAge.reduce((acc, opp) => {
    acc[opp.StageName] = (acc[opp.StageName] || 0) + 1;
    return acc;
  }, {});
  const barData = {
    labels: Object.keys(stageCounts),
    datasets: [
      {
        label: 'Opportunities by Stage',
        data: Object.values(stageCounts),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Propensia.ai Dashboard - Welcome, {userInfo.display_name}
      </h1>
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        <p>User ID: {userInfo.user_id}</p>
        <p>Username: {userInfo.username}</p>
        <p>Organization ID: {userInfo.organization_id}</p>
      </div>
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Opportunities by Stage</h2>
        <Bar data={barData} options={{ responsive: true }} />
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Opportunity Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-left">Owner Role</th>
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-left">Stage</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Expected Revenue</th>
                <th className="px-4 py-2 text-left">Lead Source</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Next Step</th>
                <th className="px-4 py-2 text-left">Age (Days)</th>
                <th className="px-4 py-2 text-left">Close Date</th>
                <th className="px-4 py-2 text-left">Created Date</th>
                <th className="px-4 py-2 text-left">Win Probability</th>
              </tr>
            </thead>
            <tbody>
              {opportunitiesWithAge.map(opp => (
                <tr key={opp.Id} className="border-t hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-2">{opp.Name}</td>
                  <td className="px-4 py-2">{opp.Owner?.Name}</td>
                  <td className="px-4 py-2">{opp.Owner?.UserRole?.Name || 'N/A'}</td>
                  <td className="px-4 py-2">{opp.Account?.Name || 'N/A'}</td>
                  <td className="px-4 py-2">{opp.StageName}</td>
                  <td className="px-4 py-2">${opp.Amount?.toLocaleString()}</td>
                  <td className="px-4 py-2">${opp.ExpectedRevenue?.toLocaleString()}</td>
                  <td className="px-4 py-2">{opp.LeadSource || 'N/A'}</td>
                  <td className="px-4 py-2">{opp.Type || 'N/A'}</td>
                  <td className="px-4 py-2">{opp.NextStep || 'N/A'}</td>
                  <td className="px-4 py-2">{opp.Age}</td>
                  <td className="px-4 py-2">{new Date(opp.CloseDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Date(opp.CreatedDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{opp.Probability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}