// @ts-ignore
export async function onRequest(context: any) {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await request.json();
  
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.VITE_NVIDIA_NIM_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
