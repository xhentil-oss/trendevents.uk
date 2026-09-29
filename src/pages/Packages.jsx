import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { HERO_IMAGES, PACKAGES, img, slug } from '../data'
import { CtaBanner, PageHero } from '../components/Blocks'

export default function Packages() {
  return (
    <>
      <PageHero
        image={HERO_IMAGES.packages}
        eyebrow="Packages"
        title="Curated Packages."
        italic="Effortless Planning."
        text="Choose a ready-made package or build your own — every package can be tailored to you."
      />

      <section className="section section--cream">
        <div className="container package-grid">
          {PACKAGES.map((p) => (
            <article key={p.name} id={slug(p.name)} className={`package ${p.featured ? 'package--featured' : ''}`}>
              {p.featured && <span className="package__badge">Most popular</span>}
              <img src={img(p.image, 700)} alt="" loading="lazy" style={{ objectPosition: p.position }} />
              <div className="package__body">
                <h3 className="h3">{p.name}</h3>
                <p>{p.text}</p>
                <ul>
                  {p.includes.map((x) => (
                    <li key={x}>
                      <Check size={14} /> {x}
                    </li>
                  ))}
                </ul>
                <div className="package__foot">
                  <span className="package__price">
                    {p.from ? (
                      <>
                        From <strong>£{p.from.toLocaleString('en-GB')}</strong>
                      </>
                    ) : (
                      <strong>Tailored price</strong>
                    )}
                  </span>
                  <Link
                    to={p.from ? `/quote?package=${slug(p.name)}` : '/build'}
                    className="btn btn--gold btn--sm"
                  >
                    {p.from ? 'Get a Quote' : 'Build Your Event'} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CtaBanner
        eyebrow="Not sure where to start?"
        title="Book a Consultation"
        text="Talk to one of our planners — we'll recommend the right package for your event and budget."
        button="Book a Consultation"
        to="/quote?request=consultation"
      />
    </>
  )
}
