export const onRequestGet = async ({ params }: { params: { txid: string } }) => {
  const { txid } = params;
  return new Response(JSON.stringify({
    txid,
    status: 'pending',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
