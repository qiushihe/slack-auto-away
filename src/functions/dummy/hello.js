module.exports.handler = async (event) => {
  console.log('Event: ', event);

  const baseUrl = process.env.BASE_URL;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Hello Dummy! clientId: ${clientId}; clientSecret: ${clientSecret}; baseUrl: ${baseUrl}`,
    }),
  }
}
