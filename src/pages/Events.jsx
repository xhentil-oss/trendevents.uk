import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Users } from 'lucide-react'
import { EVENT_DETAILS, EVENT_TYPES, HERO_IMAGES, img, slug } from '../data'
import { useStore } from '../store'
import Icon from '../components/Icon'
import { CtaBanner, PageHero } from '../components/Blocks'

export default function Events() {
  const navigate = useNavigate()
  const { updatePlan } = useStore()

  const plan = (name) => {
    updatePlan({ eventType: name })
    navigate('/build')
  }

  return (
    <>
      <PageHero
        image={HERO_IMAGES.events}
        eyebrow="Events we create"
        title="Every Celebration."
        italic="Perfectly Planned."
        text="Whatever you're celebrating, our team designs and delivers it from start to finish."
      />

      <section className="section section--cream">
        <div className="container event-list">
          {EVENT_TYPES.map((e, i) => (
            <article key={e.name} id={slug(e.name)} className={`event-row ${i % 2 ? 'event-row--rev' : ''}`}>
              <img src={img(e.image, 900)} alt={e.name} loading="lazy" style={{ objectPosition: e.position }} />
              <div className="event-row__text">
                <Icon name={e.icon} size={30} strokeWidth={1.2} className="gold" />
                <h2 className="h2">{e.name}</h2>
                <p className="lead">{e.text}</p>
                {EVENT_DETAILS[e.name] && (
                  <>
                    <p>{EVENT_DETAILS[e.name].intro}</p>
                    <ul className="event-row__list">
                      {EVENT_DETAILS[e.name].includes.map((x) => (
                        <li key={x}>
                          <Check size={15} /> {x}
                        </li>
                      ))}
                    </ul>
                    <p className="event-row__guests">
                      <Users size={15} /> {EVENT_DETAILS[e.name].guests}
                    </p>
                  </>
                )}
                <button className="btn btn--gold" onClick={() => plan(e.name)}>
                  Plan My Event <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CtaBanner />
    </>
  )
}
