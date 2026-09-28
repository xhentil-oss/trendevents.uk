import { useState } from 'react'
import { HERO_IMAGES, PORTFOLIO, img } from '../data'
import { CtaBanner, PageHero } from '../components/Blocks'

export default function OurWork() {
  const types = ['All', ...new Set(PORTFOLIO.map((p) => p.type))]
  const [filter, setFilter] = useState('All')
  const items = filter === 'All' ? PORTFOLIO : PORTFOLIO.filter((p) => p.type === filter)

  return (
    <>
      <PageHero
        image={HERO_IMAGES.work}
        eyebrow="Our work"
        title="Moments We've"
        italic="Brought to Life."
        text="A glimpse at the weddings, parties and brand events our team has created."
      />
      <section className="section section--cream">
        <div className="container">
          <div className="chips">
            {types.map((t) => (
              <button key={t} className={`chip ${filter === t ? 'is-active' : ''}`} onClick={() => setFilter(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="gallery">
            {items.map((p) => (
              <figure key={p.title} className="gallery__item">
                <img src={img(p.image, 800)} alt={p.title} loading="lazy" />
                <figcaption>
                  <span>{p.type}</span>
                  {p.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  )
}
