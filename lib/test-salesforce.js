const { getSalesforceOpportunities } = require('./salesforce');

async function test() {
  const opportunities = await getSalesforceOpportunities();
  console.log('Opportunities:', opportunities);
}

test();