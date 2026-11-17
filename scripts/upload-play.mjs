/**
 * Play Store upload — signed AAB ko internal track par bhejta hai.
 *
 *   npm run app:android:play
 *
 * Zero extra dependency: service account JWT `node:crypto` se sign hota hai,
 * phir Google Play Developer API (androidpublisher v3) se bundle upload.
 *
 * Env:
 *   PLAY_SERVICE_ACCOUNT_JSON  service account JSON ka path | raw JSON | base64
 *   PLAY_TRACK                 default: internal
 *   AAB_PATH                   default: android/app/build/outputs/bundle/release/app-release.aab
 *   ANDROID_PACKAGE_NAME       default: capacitor.config.ts ka appId
 *
 * Note: naye app ka **pehla** AAB Google policy ki wajah se Play Console se
 * manually upload karna padta hai. Uske baad ye script har release automate karti hai.
 */
import { createSign } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher'

function die(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function signJwt(credentials) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  const signature = signer.sign(credentials.private_key).toString('base64url')
  return `${header}.${payload}.${signature}`
}

async function assertOk(response, action) {
  if (response.ok) return response
  const body = await response.text()
  die(`${action} fail (${response.status}): ${body.slice(0, 600)}`)
}

async function readCredentials() {
  const raw = process.env.PLAY_SERVICE_ACCOUNT_JSON
  if (!raw) {
    die(
      'PLAY_SERVICE_ACCOUNT_JSON set nahi hai. Play Console → Setup → API access se\n' +
        '  service account JSON download karo aur path/JSON/base64 env mein do.',
    )
  }

  let content = raw
  if (existsSync(raw)) {
    content = await readFile(raw, 'utf8')
  } else if (!raw.trim().startsWith('{')) {
    // CI secrets base64 mein store hote hain.
    content = Buffer.from(raw, 'base64').toString('utf8')
  }

  try {
    const credentials = JSON.parse(content)
    if (!credentials.client_email || !credentials.private_key) {
      die('Service account JSON mein client_email / private_key missing hai.')
    }
    return credentials
  } catch (error) {
    die(`Service account JSON parse nahi hua: ${error.message}`)
  }
}

async function packageName() {
  if (process.env.ANDROID_PACKAGE_NAME) return process.env.ANDROID_PACKAGE_NAME
  const configPath = path.join(ROOT, 'capacitor.config.ts')
  if (existsSync(configPath)) {
    const config = await readFile(configPath, 'utf8')
    const match = config.match(/appId:\s*['"]([^'"]+)['"]/)
    if (match) return match[1]
  }
  die('Package name nahi mila — ANDROID_PACKAGE_NAME env do.')
}

async function main() {
  const aabPath = path.resolve(
    process.env.AAB_PATH || 'android/app/build/outputs/bundle/release/app-release.aab',
  )
  if (!existsSync(aabPath)) {
    die(`${aabPath} nahi mila. Pehle \`npm run app:android\` chalao.`)
  }

  const bundle = await readFile(aabPath)
  const pkg = await packageName()
  const track = process.env.PLAY_TRACK || 'internal'
  const credentials = await readCredentials()

  console.log(`→ Play upload: ${pkg} → ${track} (${(bundle.length / 1024 / 1024).toFixed(1)} MB)`)

  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signJwt(credentials),
    }),
  })
  await assertOk(tokenResponse, 'OAuth token')
  const { access_token: token } = await tokenResponse.json()

  const headers = { authorization: `Bearer ${token}` }
  const jsonHeaders = { ...headers, 'content-type': 'application/json' }

  const editResponse = await fetch(`${API_BASE}/${encodeURIComponent(pkg)}/edits`, {
    method: 'POST',
    headers: jsonHeaders,
    body: '{}',
  })
  await assertOk(editResponse, 'Edit create')
  const { id: editId } = await editResponse.json()

  const uploadResponse = await fetch(
    `${API_BASE}/${encodeURIComponent(pkg)}/edits/${editId}/bundles?uploadType=media`,
    {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/octet-stream' },
      body: bundle,
    },
  )
  await assertOk(uploadResponse, 'AAB upload')
  const { versionCode } = await uploadResponse.json()
  console.log(`✓ AAB upload ho gaya — versionCode ${versionCode}`)

  const trackResponse = await fetch(
    `${API_BASE}/${encodeURIComponent(pkg)}/edits/${editId}/tracks/${encodeURIComponent(track)}`,
    {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({
        track,
        releases: [{ versionCodes: [String(versionCode)], status: 'completed' }],
      }),
    },
  )
  await assertOk(trackResponse, `${track} track update`)

  const commitResponse = await fetch(
    `${API_BASE}/${encodeURIComponent(pkg)}/edits/${editId}:commit`,
    { method: 'POST', headers: headers },
  )
  await assertOk(commitResponse, 'Edit commit')

  console.log(`✓ Release live on "${track}" track — versionCode ${versionCode}`)
  console.log(`  https://play.google.com/console/u/0/developers/app/${pkg}/tracks/${track}`)
}

main().catch((error) => die(error?.stack || String(error)))
