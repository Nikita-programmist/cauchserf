import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false
  }
};

async function collectRequestBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.API_URL) {
    res.status(500).send('API_URL environment variable is not configured');
    return;
  }

  const targetUrl = new URL(req.url || '', process.env.API_URL);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || key.toLowerCase() === 'host' || key.toLowerCase() === 'content-length') continue;

    const normalizedValue = Array.isArray(value) ? value.join(',') : value;
    headers.set(key, normalizedValue);
  }

  const method = req.method || 'GET';
  const bodyBuffer = ['GET', 'HEAD'].includes(method) ? undefined : await collectRequestBody(req);
  const body = bodyBuffer ? new Uint8Array(bodyBuffer) : undefined;

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'manual'
    });

    response.headers.forEach((value, name) => {
      if (name.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(name, value);
    });

    const responseBuffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(responseBuffer);
  } catch (error) {
    res.status(500).send('Failed to reach the API backend');
  }
}
