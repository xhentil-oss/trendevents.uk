import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HERO_IMAGES, PROCESS, img } from '../data'
import Icon from '../components/Icon'
import { CtaBanner, Eyebrow, PageHero } from '../components/Blocks'

const STATS = [
  { value: '500+', label: 'Events delivered' },
  { value: '120+', label: 'Partner venues' },
  { value: '40+', label: 'In-house specialists' },
  { value: '4.9★', label: 'Client rating' },
]

export default function About() {
  return (
    <>
      <PageHero
        image={HERO_IMAGES.about}
        position="center 30%"
        eyebrow="About us"
        title="One Team."
        italic="Every Detail."
        text="Trend Events brings planners, designers, caterers and production crews together under one roof."
      />

      <section className="section section--cream">
        <div className="container about">
          <img src={img('1519225421980-715cb0215aed', 1000)} alt="A styled event table" loading="lazy" />
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="h2">We Create. You Celebrate.</h2>
            <p className="lead">
              We started Trend Events with a simple idea: planning an event should feel as good as the event itself.
              Instead of juggling a dozen suppliers, you work with one team that handles everything — from finding the
              perfect venue to the final light.
            </p>
            <p>
              Whether it's an intimate engagement dinner or a 600-guest conference, we bring the same care, creativity
              and attention to detail to every celebration.
            </p>
            <Link to="/quote?request=consultation" className="btn btn--gold mt">
              Book a Consultation <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <div className="stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <Eyebrow>How we work</Eyebrow>
          <h2 className="h2">From Idea to Celebration</h2>
          <div className="steps">
            {PROCESS.map((p, i) => (
              <div key={p.title} className="step">
                <span className="step__num">0{i + 1}</span>
                <Icon name={p.icon} size={28} strokeWidth={1.2} className="gold" />
                <h3 className="h3">{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  )
}
