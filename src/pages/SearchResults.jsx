import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { HERO_IMAGES } from '../data'
import { searchSite } from '../siteSearch'
import { PageHero } from '../components/Blocks'

export default function SearchResults() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const results = searchSite(q)

  return (
    <>
      <PageHero image={HERO_IMAGES.cta} eyebrow="Search" title="Search" italic="Results." />
      <section className="section section--cream">
        <div className="container narrow-wide">
          <form
            className="site-search__form site-search__form--page"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              setParams({ q: new FormData(e.currentTarget).get('q') })
            }}
          >
            <Search size={20} strokeWidth={1.5} />
            <input key={q} name="q" type="search" defaultValue={q} placeholder="Search services, events, venues…" aria-label="Search the site" />
            <button type="submit" className="btn btn--gold btn--sm">
              Search
            </button>
          </form>

          {q && (
            <p className="search-count">
              {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
            </p>
          )}

          <div className="search-list">
            {results.map((r) => (
              <Link key={r.to} to={r.to} className="search-result search-result--card">
                {r.thumb && <img src={r.thumb} alt="" />}
                <span>
                  <em>{r.type}</em>
                  <strong>{r.title}</strong>
                  {r.text}
                </span>
              </Link>
            ))}
          </div>

          {q && !results.length && (
            <div className="empty">
              <p>Nothing found. Try another word, or tell us what you need.</p>
              <Link to="/quote" className="btn btn--gold">Get a Quote</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
