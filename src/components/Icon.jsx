import {
  Baby, Briefcase, Cake, Camera, ClipboardList, Flower2, Gem, Headphones, Heart, Layers, Lightbulb,
  MapPin, Megaphone, Monitor, Music, Palette, PartyPopper, Presentation, Rocket, Sparkles, Speaker,
  Theater, Trophy, User, Users, UtensilsCrossed, Video, WandSparkles, Wine,
} from 'lucide-react'

const ICONS = {
  Baby, Briefcase, Cake, Camera, ClipboardList, Flower2, Gem, Headphones, Heart, Layers, Lightbulb,
  MapPin, Megaphone, Monitor, Music, Palette, PartyPopper, Presentation, Rocket, Sparkles, Speaker,
  Theater, Trophy, User, Users, UtensilsCrossed, Video, WandSparkles, Wine,
}

export default function Icon({ name, size = 24, strokeWidth = 1.4, ...rest }) {
  const Cmp = ICONS[name] || Sparkles
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />
}

// Brand icons (not included in lucide)
export const SocialIcons = {
  Instagram: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9z" />
    </svg>
  ),
  TikTok: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}>
      <path d="M16.6 3c.3 2 1.6 3.6 3.9 3.8v3a7 7 0 0 1-3.9-1.2v6.2a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3.1a2.8 2.8 0 1 0 1.9 2.6V3h3z" />
    </svg>
  ),
}
