module.exports.handler = async (event) => {
  console.log('Event: ', event);

  const baseUrl = process.env.BASE_URL;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Hello Who? baseUrl: ${baseUrl}`,
    }),
  }
}
