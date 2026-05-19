const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async function () {
  try {
    const credsJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8');
    const creds = JSON.parse(credsJson);

    const serviceAccountAuth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
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
      first_name: row.get('first_name') || '',
      last_name: row.get('last_name') || '',
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
