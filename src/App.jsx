import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Venues from './pages/Venues'
import VenueDetail from './pages/VenueDetail'
import Events from './pages/Events'
import Packages from './pages/Packages'
import OurWork from './pages/OurWork'
import About from './pages/About'
import Build from './pages/Build'
import Quote from './pages/Quote'
import { Account, ResetPassword, Saved } from './pages/Misc'
import NotFound from './pages/NotFound'
import SearchResults from './pages/SearchResults'
import Admin from './pages/Admin'

// Scroll to the #anchor if there is one, otherwise to the top on page change
function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    // Wait for the new page to render, then retry once images above the target have shifted the layout
    const scrollToTarget = () => {
      const el = document.getElementById(hash.slice(1))
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'instant' })
    }
    const frame = requestAnimationFrame(scrollToTarget)
    const retry = setTimeout(scrollToTarget, 400)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(retry)
    }
    // key changes on every click, so the same link works twice in a row
  }, [pathname, hash, key])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  // The admin dashboard has its own layout (no site header/footer)
  if (pathname.startsWith('/admin')) return <Admin />

  return (
    <>
      <ScrollManager />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id" element={<VenueDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/our-work" element={<OurWork />} />
          <Route path="/about" element={<About />} />
          <Route path="/build" element={<Build />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/account" element={<Account />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
