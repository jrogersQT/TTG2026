const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async function () {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const donationsSheet = doc.sheetsByTitle['donations_log'];
    const stateSheet = doc.sheetsByTitle['event_state'];

    const donationRows = await donationsSheet.getRows();
    const stateRows = await stateSheet.getRows();

    const donations = donationRows.map(row => ({
      external_id: row.get('external_id') || '',
      created_at: row.get('created_at') || '',
      donor_name: row.get('donor_name') || '',
      display_name: row.get('display_name') || '',
      amount: row.get('amount') || '',
      source: row.get('source') || '',
      status: row.get('status') || '',
      notes: row.get('notes') || ''
    }));

    const event_state = {};
    stateRows.forEach(row => {
      const key = row.get('key');
      const value = row.get('value');
      if (key) event_state[key] = value;
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({ donations, event_state })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
