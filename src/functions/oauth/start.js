module.exports.handler = async (event) => {
  console.log('Event: ', event);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: "OAUTH START",
    }),
  }
}
