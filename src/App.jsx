import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import CartBar from './components/CartBar'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'
import OfflineBanner from './components/OfflineBanner'
import Loader from './components/Loader'
import useUI from './hooks/useUI'

/** Native bridge sirf native shell mein chahiye — web bundle se bahar rehta hai. */
const NativeBridge = lazy(() => import('./components/NativeBridge'))

/** Route-level code splitting — har page apna JS chunk. */
const Home = lazy(() => import('./pages/Home'))
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'))
const AddressesPage = lazy(() => import('./pages/AddressesPage'))
const NotFoundPage = lazy(() => import('./pages/NotFound'))

export default function App() {
  const { isCartOpen, closeCart } = useUI()

  return (
    <>
      <Suspense fallback={null}>
        <NativeBridge />
      </Suspense>
      <OfflineBanner />
      <ScrollToTop />
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<Loader label="Page loading…" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <CartBar />
      <CartDrawer open={isCartOpen} onClose={closeCart} />

      <InstallPrompt />

      <footer className="site-footer">
        Built with React + Firebase · Swiggy-style clone (educational project) 🍔
      </footer>
    </>
  )
}
