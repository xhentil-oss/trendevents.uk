import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HERO_IMAGES } from '../data'
import SearchBar from '../components/SearchBar'
import { CtaBanner, PageHero } from '../components/Blocks'
import { AllServicesSection, EventTypesSection, OurServicesSection, VenuesSection } from '../components/Sections'

export default function Services() {
  return (
    <>
      <PageHero
        image={HERO_IMAGES.services}
        eyebrow="Full event services"
        title="Every Detail."
        italic="One Team."
        text="From concept and planning to the final moment — we provide everything your event needs."
      >
        <Link to="/services#all-services" className="btn btn--gold">
          Explore Our Services <ArrowRight size={16} />
        </Link>
      </PageHero>

      <div className="overlap-band">
        <div className="container overlap">
          <SearchBar buttonLabel="Find My Event" />
        </div>
      </div>

      <OurServicesSection />
      <AllServicesSection />
      <VenuesSection />
      <EventTypesSection />
      <CtaBanner />
    </>
  )
}
