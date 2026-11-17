/**
 * One-time Capacitor setup — platforms add + native config patch.
 *
 *   npm run app:setup
 *
 * Idempotent hai: dobara chalane par existing android/ios ko chhod deta hai.
 * Pehli baar chalane ke baad android/ aur ios/ ko git mein commit karo (source of truth).
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function run(command) {
  console.log(`\n$ ${command}`)
  execSync(command, { stdio: 'inherit', cwd: ROOT })
}

if (!existsSync(path.join(ROOT, 'capacitor.config.ts'))) {
  console.error('✗ capacitor.config.ts nahi mila.')
  process.exit(1)
}

// `cap add`/`cap sync` ko web assets chahiye.
if (!existsSync(path.join(ROOT, 'dist/index.html'))) {
  console.log('• dist/ nahi mila — pehle web build bana rahe hain.')
  run('npm run build')
}

const platforms = ['android', 'ios']
for (const platform of platforms) {
  if (existsSync(path.join(ROOT, platform))) {
    console.log(`✓ ${platform}/ pehle se hai — skip.`)
    continue
  }
  if (platform === 'ios' && process.platform !== 'darwin') {
    console.log('• iOS add sirf macOS par hota hai — skip.')
    continue
  }
  run(`npx cap add ${platform}`)
}

// Icons/splash (agar source assets generate kiye hain).
if (existsSync(path.join(ROOT, 'assets/icon.png'))) {
  run('npx capacitor-assets generate --assetPath assets --ios --android')
}

run('node scripts/patch-android-signing.mjs')
run('node scripts/generate-app-links.mjs')

console.log(`
✓ Setup complete.

Next:
  npm run app:icons     # icon/splash dobara generate karne ke liye
  npm run app:sync      # build + version + cap sync
  npx cap open android  # Android Studio
  npx cap open ios      # Xcode
  npm run app:android   # signed release AAB
`)
