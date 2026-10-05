import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { ALL_SERVICES, FEATURED_SERVICES, img, slug } from '../data'
import { SERVICE_PAGES, servicePath } from '../servicePages'
import Icon from '../components/Icon'
import { CtaBanner, Eyebrow, PageHero } from '../components/Blocks'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug: key } = useParams()
  // Card services first, then the SERVICES-menu items
  const service = [...FEATURED_SERVICES, ...ALL_SERVICES].find((s) => slug(s.name) === key)
  const page = SERVICE_PAGES[key]

  if (!service || !page) return <NotFound />

  const others = FEATURED_SERVICES.filter((s) => slug(s.name) !== key && SERVICE_PAGES[slug(s.name)])

  return (
    <>
      <PageHero image={page.hero || page.gallery[0]} position={page.heroPosition} eyebrow="Our services" title={service.name} italic={page.tagline}>
        <Link to={`/quote?service=${key}`} className="btn btn--gold">
          Get a Quote <ArrowRight size={16} />
        </Link>
      </PageHero>

      <section className="section section--cream">
        <div className="container service-detail">
          <div>
            <Icon name={service.icon} size={30} strokeWidth={1.2} className="gold" />
            <h2 className="h2 mt-sm">About This Service</h2>
            {page.intro.map((p) => (
              <p key={p.slice(0, 20)} className="lead">
                {p}
              </p>
            ))}
            <div className="service-detail__actions">
              <Link to="/build" className="text-link">
                Build Your Event <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <aside className="card service-detail__includes">
            <Eyebrow>What's included</Eyebrow>
            <ul>
              {page.includes.map((x) => (
                <li key={x}>
                  <Check size={16} /> {x}
                </li>
              ))}
            </ul>
            <Link to={`/quote?service=${key}`} className="btn btn--gold btn--block">
              Request This Service <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <Eyebrow>Gallery</Eyebrow>
          <h2 className="h2">{service.name} in Action</h2>
          <div className="service-gallery">
            {page.gallery.map((g, i) => (
              <img key={g} src={img(g, 1200)} alt={`${service.name} ${i + 1}`} loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <div className="row-between">
            <div>
              <Eyebrow>Complete your event</Eyebrow>
              <h2 className="h2">More Services</h2>
            </div>
            <Link to="/services" className="text-link">
              All Services <ArrowRight size={14} />
            </Link>
          </div>
          <div className="service-cards service-cards--compact">
            {others.slice(0, 5).map((s) => (
              <Link key={s.name} to={servicePath(s.name)} className="service-card">
                <img src={img(s.image, 500)} alt="" loading="lazy" />
                <div className="service-card__body">
                  <Icon name={s.icon} size={18} strokeWidth={1.4} />
                  <div>
                    <h3>{s.name}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  )
}
