import SearchBar from '../components/SearchBar'
import { CtaBanner, Eyebrow } from '../components/Blocks'
import { EventTypesSection, OurServicesSection, VenuesSection } from '../components/Sections'

export default function Home() {
  return (
    <>
      <section className="hero hero--glam">
        {/* Cover photo lives in public/images — replace the file to change it */}
        <div className="hero__bg" style={{ backgroundImage: 'url(/images/cover-trendevent.jpg)' }} />
        <div className="container hero__inner">
          <Eyebrow light>Trend Events</Eyebrow>
          <h1 className="display display--xl">
            We Create.
            <br />
            <em>You Celebrate.</em>
          </h1>
          <p className="hero__text">From the perfect venue to the final light.</p>
          <div className="hero__search">
            <SearchBar />
          </div>
        </div>
      </section>

      <OurServicesSection />
      <VenuesSection />
      <EventTypesSection />
      <CtaBanner />
    </>
  )
}
