const jsforce = require('jsforce');

const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com',
});

async function getSalesforceOpportunities() {
  try {
    await conn.login('YOUR_VERIFIED_USERNAME', 'WhiteShark12!?gEdvFGZvqrs5B49Ungv675aWD');
    const result = await conn.query(
      'SELECT Id, Name, Amount, StageName, icp_fit__c, Engagement_Score__c, Intent_Data__c, ' +
      'Past_Success__c, Total_Sales_Touches__c, Number_of_Meetings__c, Contacts_Associated__c, ' +
      'Budget_Defined__c, Need_Defined__c, Timeline_Defined__c, Short_List_Defined__c, High_Intent__c, ' +
      'Propensity_Score__c, Win_Probability__c, Priority_Level__c ' +
      'FROM Opportunity LIMIT 10'
    );
    return result.records;
  } catch (err) {
    console.error('Salesforce Error:', err);
    return [];
  }
}

module.exports = { getSalesforceOpportunities };