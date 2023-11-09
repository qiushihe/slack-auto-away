export const jsonResponse = (body: Record<string, any>, code?: number) => ({
  statusCode: code ?? 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

export const redirectResponse = (destinationUrl: string, code?: number) => ({
  statusCode: code ?? 302,
  headers: { Location: destinationUrl }
});
