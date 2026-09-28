import { Link } from 'react-router-dom'
import { HERO_IMAGES } from '../data'
import { PageHero } from '../components/Blocks'

export default function NotFound() {
  return (
    <PageHero image={HERO_IMAGES.cta} eyebrow="404" title="Page" italic="Not Found." text="The page you're looking for doesn't exist.">
      <Link to="/" className="btn btn--gold">Back to Home</Link>
    </PageHero>
  )
}
