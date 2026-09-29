import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { searchSite } from '../siteSearch'

// Search box shown under the header when the search icon is clicked
export default function SiteSearch() {
  const navigate = useNavigate()
  const input = useRef(null)
  const [q, setQ] = useState('')
  const results = searchSite(q, 6)

  useEffect(() => input.current?.focus(), [])

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="site-search">
      <form className="site-search__form" onSubmit={submit} role="search">
        <Search size={20} strokeWidth={1.5} />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search services, events, venues…"
          aria-label="Search the site"
        />
        <button type="submit" className="btn btn--gold btn--sm">
          Search
        </button>
      </form>

      {q.trim() && (
        <div className="site-search__results">
          {results.length ? (
            <>
              {results.map((r) => (
                <Link key={r.to} to={r.to} className="search-result">
                  {r.thumb && <img src={r.thumb} alt="" />}
                  <span>
                    <em>{r.type}</em>
                    <strong>{r.title}</strong>
                    {r.text}
                  </span>
                </Link>
              ))}
              <Link to={`/search?q=${encodeURIComponent(q.trim())}`} className="text-link site-search__all">
                See all results <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <p className="site-search__empty">No results for “{q}”. Try “wedding”, “flowers” or “London”.</p>
          )}
        </div>
      )}
    </div>
  )
}
