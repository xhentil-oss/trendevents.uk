import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Services from './pages/Services'
import Venues from './pages/Venues'
import VenueDetail from './pages/VenueDetail'
import Events from './pages/Events'
import Packages from './pages/Packages'
import OurWork from './pages/OurWork'
import About from './pages/About'
import Build from './pages/Build'
import Quote from './pages/Quote'
import { Account, Saved } from './pages/Misc'
import NotFound from './pages/NotFound'

// Scroll to the #anchor if there is one, otherwise to the top on page change
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 110
        window.scrollTo({ top: y, behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
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
          <Route path="/packages" element={<Packages />} />
          <Route path="/our-work" element={<OurWork />} />
          <Route path="/about" element={<About />} />
          <Route path="/build" element={<Build />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
