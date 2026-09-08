// Server-only helper for verifying a Firebase ID token from an API route.
//
// Routes like /api/upload need to know "is this request really coming from
// the account it claims to be acting as" before trusting a client-supplied
// uid — otherwise anyone can call the API with an arbitrary userId and
// read/write/delete that user's files. The project has no Firebase Admin
// SDK service-account credentials configured (see .env), so this uses the
// lightweight Identity Toolkit REST API instead: it verifies a token using
// only the same public Web API key the client already uses
// (NEXT_PUBLIC_FIREBASE_API_KEY), no extra secrets or dependencies needed.
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

// Returns the verified uid for a valid, non-expired ID token, or null if the
// token is missing, malformed, expired, or Firebase isn't configured.
export async function verifyIdToken(idToken: unknown): Promise<string | null> {
  if (!FIREBASE_API_KEY || typeof idToken !== 'string' || !idToken) return null
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    )
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    return data?.users?.[0]?.localId || null
  } catch {
    return null
  }
}
