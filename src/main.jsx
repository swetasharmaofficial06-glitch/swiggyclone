import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

/** Firebase config missing ho toh blank screen ke bajah helpful setup screen. */
const missing = ENV_KEYS.filter((key) => !import.meta.env[key])

function renderSetupScreen() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <div style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '80px auto', padding: '0 20px', lineHeight: 1.65 }}>
        <h1 style={{ color: '#fc8019' }}>🍔 Firebase setup chahiye!</h1>
        <p><code>.env</code> mein ye variables missing hain:</p>
        <ul style={{ color: '#fc8019' }}>
          {missing.map((key) => (
            <li key={key}><code>{key}</code></li>
          ))}
        </ul>
        <p><strong>Steps:</strong></p>
        <ol>
          <li><code>cp .env.example .env</code></li>
          <li>Firebase Console → Project Settings → <em>Your apps</em> → Web app config copy karo</li>
          <li>Values <code>.env</code> mein paste karo (README mein detail hai)</li>
          <li>Dev server restart karo</li>
        </ol>
      </div>
    </StrictMode>,
  )
}

if (missing.length > 0) {
  renderSetupScreen()
} else {
  import('./App').then(async ({ default: App }) => {
    const [{ BrowserRouter }, { AuthProvider }, { CartProvider }, { UIProvider }] =
      await Promise.all([
        import('react-router-dom'),
        import('./context/AuthProvider'),
        import('./context/CartProvider'),
        import('./context/UIProvider'),
      ])
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <BrowserRouter>
          <UIProvider>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </UIProvider>
        </BrowserRouter>
      </StrictMode>,
    )
  })
}
