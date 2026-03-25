export const config = { runtime: 'edge' }

const LS_PRODUCT_ID = 906004

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ valid: false }), { status: 405 })
  }

  let licenseKey: string
  try {
    const body = await req.json()
    licenseKey = body.licenseKey
    if (!licenseKey || typeof licenseKey !== 'string') throw new Error()
  } catch {
    return new Response(JSON.stringify({ valid: false, error: 'Invalid request' }), { status: 400 })
  }

  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey }),
    })

    const data = await res.json() as {
      valid?: boolean
      meta?: { product_id?: number }
    }

    const valid =
      data.valid === true &&
      data.meta?.product_id === LS_PRODUCT_ID

    return new Response(JSON.stringify({ valid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ valid: false, error: 'Upstream error' }), { status: 502 })
  }
}
