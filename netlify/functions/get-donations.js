const { GoogleSpreadsheet } = require('google-spreadsheet');

exports.handler = async function () {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });

    await doc.loadInfo();

    const donationsSheet = doc.sheetsByTitle['donations_log'];
    const stateSheet = doc.sheetsByTitle['event_state'];

    const donationRows = await donationsSheet.getRows();
    const stateRows = await stateSheet.getRows();

    const donations = donationRows.map(row => ({
      external_id: row.external_id || '',
      created_at: row.created_at || '',
      donor_name: row.donor_name || '',
      display_name: row.display_name || '',
      amount: row.amount || '',
      source: row.source || '',
      status: row.status || '',
      notes: row.notes || ''
    }));

    const event_state = {};
    stateRows.forEach(row => {
      event_state[row.key] = row.value;
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
