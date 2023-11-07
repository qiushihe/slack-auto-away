export const handler = async (event) => {
  console.log("Event: ", event);

  const baseUrl = process.env.BASE_URL;
  const clientId = process.env.CLIENT_ID;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Hello Dummy! clientId: ${clientId}; baseUrl: ${baseUrl}`
    })
  };
};
