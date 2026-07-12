// Thin wrapper around the Resend API — plain fetch, no SDK dependency, same
// pattern as lib/gemini.ts. Requires RESEND_API_KEY and RESEND_FROM_EMAIL in
// the environment. Get a key at https://resend.com — sending to real
// student addresses requires verifying a sending domain there first (until
// then Resend only delivers to the account owner's own address).
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  if (!from) throw new Error('RESEND_FROM_EMAIL is not set')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Resend API error ${res.status}: ${errText}`)
  }
}
