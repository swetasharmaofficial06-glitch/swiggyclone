/**
 * iOS archive + TestFlight upload.
 *
 *   npm run app:ios                 # archive + export .ipa
 *   IOS_UPLOAD=true npm run app:ios # + TestFlight par upload
 *
 * Env:
 *   IOS_TEAM_ID        Apple Developer Team ID (Xcode mein configured ho to optional)
 *   IOS_SCHEME         default: App
 *   IOS_EXPORT_METHOD  default: app-store-connect
 *   IOS_UPLOAD         'true' par TestFlight upload
 *   ASC_KEY_ID         App Store Connect API key id
 *   ASC_ISSUER_ID      App Store Connect issuer id
 *
 * Key file yahan honi chahiye: ~/.appstoreconnect/private_keys/AuthKey_<ASC_KEY_ID>.p8
 * (App Store Connect → Users and Access → Integrations → App Store Connect API)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SCHEME = process.env.IOS_SCHEME || 'App'
const EXPORT_METHOD = process.env.IOS_EXPORT_METHOD || 'app-store-connect'
const BUILD_DIR = path.join(ROOT, 'build/ios')
const ARCHIVE_PATH = path.join(BUILD_DIR, 'App.xcarchive')
const EXPORT_PATH = path.join(BUILD_DIR, 'export')

function die(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function run(command, args, extraEnv = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`)
  execFileSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    cwd: ROOT,
  })
}

if (process.platform !== 'darwin') {
  die('iOS build sirf macOS par hota hai (Xcode chahiye).')
}

const workspace = path.join(ROOT, 'ios/App/App.xcworkspace')
if (!existsSync(workspace)) {
  die('ios/App/App.xcworkspace nahi mila. Pehle `npm run app:setup` chalao.')
}

if (!existsSync(path.join(ROOT, 'dist/index.html'))) {
  die('dist/ nahi hai. Pehle `npm run build` chalao (ya `npm run app:sync`).')
}

mkdirSync(BUILD_DIR, { recursive: true })

const team = process.env.IOS_TEAM_ID
const archiveArgs = [
  '-workspace',
  workspace,
  '-scheme',
  SCHEME,
  '-configuration',
  'Release',
  '-sdk',
  'iphoneos',
  '-archivePath',
  ARCHIVE_PATH,
  'archive',
  'CODE_SIGN_STYLE=Automatic',
]
if (team) archiveArgs.push(`DEVELOPMENT_TEAM=${team}`)

run('xcodebuild', archiveArgs)

const exportOptionsPath = path.join(BUILD_DIR, 'ExportOptions.plist')
writeFileSync(
  exportOptionsPath,
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>${EXPORT_METHOD}</string>
  <key>signingStyle</key>
  <string>automatic</string>
  ${team ? `<key>teamID</key>\n  <string>${team}</string>` : ''}
  <key>uploadSymbols</key>
  <true/>
  <key>destination</key>
  <string>export</string>
</dict>
</plist>
`,
)

run('xcodebuild', [
  '-exportArchive',
  '-archivePath',
  ARCHIVE_PATH,
  '-exportOptionsPlist',
  exportOptionsPath,
  '-exportPath',
  EXPORT_PATH,
])

const ipa = path.join(EXPORT_PATH, `${SCHEME}.ipa`)
if (!existsSync(ipa)) {
  die(`${ipa} generate nahi hua — export step ka log dekho.`)
}
console.log(`\n✓ IPA ready: ${ipa}`)

const upload = String(process.env.IOS_UPLOAD || '').toLowerCase() === 'true'
if (!upload) {
  console.log('  TestFlight upload ke liye: IOS_UPLOAD=true npm run app:ios')
  console.log('  Ya Xcode → Window → Organizer se manually upload karo.')
  process.exit(0)
}

const keyId = process.env.ASC_KEY_ID
const issuerId = process.env.ASC_ISSUER_ID
if (!keyId || !issuerId) {
  die('TestFlight upload ke liye ASC_KEY_ID aur ASC_ISSUER_ID env chahiye.')
}

const keyPath = path.join(
  process.env.HOME || '',
  '.appstoreconnect/private_keys',
  `AuthKey_${keyId}.p8`,
)
if (!existsSync(keyPath)) {
  die(`API key file nahi mili: ${keyPath}`)
}

run('xcrun', [
  'altool',
  '--upload-app',
  '-f',
  ipa,
  '-t',
  'ios',
  '--apiKey',
  keyId,
  '--apiIssuer',
  issuerId,
])

console.log('✓ TestFlight par upload ho gaya. Processing 10–30 min leti hai.')
