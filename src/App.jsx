import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import CartBar from './components/CartBar'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import Loader from './components/Loader'
import useUI from './hooks/useUI'

/** Route-level code splitting — har page apna JS chunk. */
const Home = lazy(() => import('./pages/Home'))
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'))
const NotFoundPage = lazy(() => import('./pages/NotFound'))

export default function App() {
  const { isCartOpen, closeCart } = useUI()

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<Loader label="Page loading…" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <CartBar />
      <CartDrawer open={isCartOpen} onClose={closeCart} />

      <footer className="site-footer">
        Built with React + Firebase · Swiggy-style clone (educational project) 🍔
      </footer>
    </>
  )
}
