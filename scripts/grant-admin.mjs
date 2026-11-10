/**
 * Admin custom claim grant/revoke — Firebase Admin SDK ki zaroorat nahi,
 * Firebase CLI ke login token se Identity Toolkit Admin API call karta hai.
 *
 *   npm run admin:grant -- email@example.com
 *   npm run admin:grant -- email@example.com --revoke
 *
 * Grant ke baad user ko app mein "Access dobara check karo" dabana hoga
 * (ya sign out → sign in), taaki naya token claim ke saath aaye.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'webufire'
const args = process.argv.slice(2)
const revoke = args.includes('--revoke')
const email = args.find((value) => !value.startsWith('--'))

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

if (!email) {
  console.log('Usage: npm run admin:grant -- email@example.com [--revoke]')
  process.exit(1)
}

const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json')
if (!fs.existsSync(configPath)) {
  fail('Firebase CLI login nahi hai. Pehle `firebase login` chalao.')
}

const token = JSON.parse(fs.readFileSync(configPath, 'utf8'))?.tokens?.access_token
if (!token) fail('Access token nahi mila. `firebase login --reauth` chalao.')

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const base = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}`

const lookupResponse = await fetch(`${base}/accounts:lookup`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email: [email] }),
})

if (lookupResponse.status === 401) {
  fail('Token expire ho gaya. `firebase login --reauth` chalao aur dobara try karo.')
}
if (!lookupResponse.ok) {
  fail(`User lookup fail (${lookupResponse.status}): ${await lookupResponse.text()}`)
}

const lookup = await lookupResponse.json()
const user = lookup.users?.[0]
if (!user) {
  fail(`"${email}" se koi Firebase Auth user nahi mila. Pehle app se Google sign-in karo.`)
}

const existingClaims = user.customAttributes ? JSON.parse(user.customAttributes) : {}
const nextClaims = { ...existingClaims }

if (revoke) {
  delete nextClaims.admin
} else {
  nextClaims.admin = true
}

const updateResponse = await fetch(`${base}/accounts:update`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    localId: user.localId,
    customAttributes: JSON.stringify(nextClaims),
  }),
})

if (!updateResponse.ok) {
  fail(`Claim update fail (${updateResponse.status}): ${await updateResponse.text()}`)
}

console.log(`✔ ${revoke ? 'Admin claim hata diya' : 'Admin claim set ho gaya'}`)
console.log(`  uid:      ${user.localId}`)
console.log(`  email:    ${user.email ?? email}`)
console.log(`  provider: ${user.providerUserInfo?.[0]?.providerId ?? 'unknown'}`)
console.log(`  claims:   ${JSON.stringify(nextClaims)}`)
if (!revoke) {
  console.log('\nAb app mein Admin page kholo aur "Access dobara check karo" dabao.')
}
