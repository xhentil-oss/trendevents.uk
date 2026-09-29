// Content for each service detail page (/services/:slug).
// The key is slug(service name) from FEATURED_SERVICES in data.js.
import { slug } from './data'

const S = (f) => `/images/services/${f}.jpg`

export const SERVICE_PAGES = {
  'event-planning': {
    tagline: 'From the first idea to the final goodbye.',
    intro: [
      'Planning an event means hundreds of decisions, dozens of suppliers and a timeline that has to run to the minute. Our planners take all of that off your shoulders. We start by understanding your vision, your guests and your budget, then build a clear plan and a creative concept around it.',
      'From venue visits and supplier contracts to seating plans and the running order on the day, one dedicated planner stays with you from start to finish — so you always know who to call.',
    ],
    includes: ['Initial consultation & creative brief', 'Budget planning & tracking', 'Venue sourcing & site visits', 'Supplier booking & contracts', 'Timeline, run-sheet & seating plan', 'On-the-day coordination team'],
    gallery: [S('event-planning'), S('event-planning-2'), S('event-planning-3'), S('event-planning-4')],
  },
  decoration: {
    tagline: 'Spaces transformed, down to the smallest detail.',
    intro: [
      'Décor is what guests remember first. Our design team creates bespoke concepts — from romantic white florals and candlelight to bold, modern themes — and brings them to life with floral installations, backdrops, table styling and lighting.',
      'Every piece is designed for your venue and your story. We handle the full build and the take-down, so the room looks perfect when the doors open.',
    ],
    includes: ['Concept & mood boards', 'Floral arches & installations', 'Stage & photo backdrops', 'Table styling & centrepieces', 'Candles & ambient lighting', 'Full setup & take-down'],
    gallery: ['/images/event-engagement.jpg', '/images/cover-trendevent.jpg', '/images/event-wedding.jpg', '/images/decor-event.avif'],
  },
  catering: {
    tagline: 'Exquisite menus for every occasion.',
    intro: [
      'Great food turns an event into an experience. Our chefs design menus around your taste, your guests and your theme — from elegant plated dinners and sharing feasts to canapés, food stations and late-night bites.',
      'We take care of tastings, dietary requirements, service staff and the bar, so every course arrives on time and looks as good as it tastes.',
    ],
    includes: ['Menu design & tasting', 'Plated, buffet or family-style service', 'Canapés & food stations', 'Dietary & allergen options', 'Bar & drinks packages', 'Professional waiting staff'],
    gallery: [S('catering'), S('catering-2'), S('catering-3'), S('catering-4')],
  },
  photography: {
    tagline: 'Every moment, beautifully captured.',
    intro: [
      'Your event lasts one day — the photographs last a lifetime. Our photographers work quietly in the background, capturing the natural moments, the details and the emotion, plus the portraits and group shots you will want to frame.',
      'You receive a professionally edited gallery, ready to share, print and treasure.',
    ],
    includes: ['Experienced event photographers', 'Candid & documentary coverage', 'Portraits & group photos', 'Detail & décor shots', 'Professionally edited gallery', 'Prints & albums on request'],
    gallery: [S('photography'), S('photography-2'), S('photography-3'), S('photography-4')],
  },
  videography: {
    tagline: 'Cinematic films of your celebration.',
    intro: [
      'Relive every speech, every dance and every smile. Our videographers film your event with cinema-grade cameras, gimbals and drones, then craft a film that tells the story of your day.',
      'Choose a short highlight film for social media, a full-length documentary edit, or both.',
    ],
    includes: ['Cinema-grade cameras & gimbals', 'Drone footage (where permitted)', 'Highlight film', 'Full-length edit', 'Social media reels', 'Live streaming on request'],
    gallery: [S('videography'), S('videography-2'), S('videography-3'), S('videography-4')],
  },
  'dj-and-entertainment': {
    tagline: 'Music and energy for every vibe.',
    intro: [
      'The right music keeps the dance floor full all night. Our DJs read the room and mix the perfect soundtrack — from elegant dinner playlists to peak-time party anthems — tailored to your requests.',
      'Add live musicians, singers, dancers or performers to create moments your guests will never forget.',
    ],
    includes: ['Professional DJs', 'Custom playlists & must-play lists', 'Live bands, singers & musicians', 'Dancers & performers', 'MC & host services', 'Dance floor lighting'],
    gallery: [S('dj'), S('dj-2'), S('dj-3'), S('dj-4')],
  },
  'sound-and-lighting': {
    tagline: 'Professional audio and lighting production.',
    intro: [
      'Crystal-clear sound and beautiful lighting transform any space. Our technical team designs and runs the full audio and lighting setup for your event — from speeches and live music to atmospheric uplighting and dynamic show lighting.',
      'We survey the venue in advance, bring professional equipment and stay on site to run everything on the night.',
    ],
    includes: ['PA systems & microphones', 'Uplighting & ambient lighting', 'Moving heads & show lighting', 'Lighting design & programming', 'Venue technical survey', 'On-site technicians'],
    gallery: [S('sound-lighting'), S('sound-lighting-2'), S('sound-lighting-3'), S('sound-lighting-4')],
  },
  'led-screens': {
    tagline: 'Stunning visuals for bigger impact.',
    intro: [
      'LED screens make your content impossible to miss. Whether it is a keynote presentation, a live camera feed, a brand reveal or a custom visual backdrop for the dance floor, we supply and operate high-resolution screens in any size.',
      'Our team handles content playback, live switching and timing, so every visual appears exactly when it should.',
    ],
    includes: ['Indoor & outdoor LED walls', 'Custom sizes & shapes', 'Live camera feeds', 'Presentation & video playback', 'Custom visual content', 'Screen operators on site'],
    gallery: [S('led-screens'), S('led-screens-2'), S('led-screens-3'), S('led-screens-4')],
  },
  stages: {
    tagline: 'Beautifully decorated stages, designed around you.',
    intro: [
      'The stage is the heart of the room — where the couple sits, the cake is cut and every photo is taken. We design and build decorated stages with floral backdrops, arches, draping, lighting and luxury seating, styled to match your theme.',
      'From a romantic sweetheart stage for a wedding to an elegant backdrop for an engagement or a branded stage for a corporate event, everything is built and dressed by our décor team.',
    ],
    includes: ['Wedding & engagement stages', 'Floral backdrops & arches', 'Draping & panel walls', 'Luxury sofas & seating', 'Stage lighting & candles', 'Setup & take-down'],
    gallery: [S('stage-decor'), S('stage-decor-2'), S('stage-decor-3'), S('stage-decor-4')],
  },
  'special-effects': {
    tagline: 'Create unforgettable moments.',
    intro: [
      'Some moments deserve a little magic. Cold spark fountains for the first dance, confetti blasts at midnight, low fog for a dreamy entrance or CO2 jets for a product reveal — our special effects are designed to make your guests gasp.',
      'All effects are indoor-safe where required and operated by trained technicians.',
    ],
    includes: ['Cold spark fountains', 'Confetti & streamer cannons', 'Low fog & dry ice', 'CO2 jets', 'Bubble & snow machines', 'Trained effects operators'],
    gallery: [S('special-effects'), S('special-effects-2'), S('special-effects-3'), S('special-effects-4')],
  },

  // ----- Services from the SERVICES menu -----
  'event-coordination': {
    tagline: 'Relax — we run the day.',
    intro: [
      'You have planned every detail; now you deserve to enjoy it. Our coordinators take over in the final weeks, confirm every supplier, build the running order and manage the event on the day — from the first delivery to the last guest leaving.',
      'While you celebrate, we handle timings, suppliers, guests and any surprises quietly behind the scenes.',
    ],
    includes: ['Final-month supplier confirmations', 'Detailed run-sheet & timeline', 'Venue walk-through & rehearsal', 'On-the-day coordination team', 'Supplier & guest management', 'Setup and take-down supervision'],
    gallery: ['/images/about-team.jpg', S('videography-3'), '/images/cover-trendevent.jpg', '/images/decor-event.avif'],
  },
  'event-concept-and-design': {
    tagline: 'A creative vision built around you.',
    intro: [
      'Every memorable event starts with a strong idea. Our designers turn your style, story and inspiration into a complete creative concept — colour palette, materials, florals, lighting and layout — presented in mood boards and 3D visuals.',
      'Once you love the concept, we bring it to life with our décor, floral and production teams.',
    ],
    includes: ['Creative consultation', 'Theme & colour palette', 'Mood boards & material samples', 'Floor plans & layout design', '3D visuals on request', 'Hand-over to the production team'],
    gallery: [S('concept'), S('concept-2'), S('concept-3'), S('event-planning')],
  },
  'venue-finding': {
    tagline: 'The perfect space, sourced for you.',
    intro: [
      'The venue sets the tone for everything else. Tell us your date, guest numbers, style and budget, and we will shortlist the best spaces — from grand ballrooms and rooftops to gardens, restaurants and unique hidden gems.',
      'We arrange the viewings, negotiate the terms and check every technical detail, so you book with confidence.',
    ],
    includes: ['Personal venue shortlist', 'Availability & price checks', 'Accompanied site visits', 'Contract negotiation', 'Capacity & technical checks', 'Exclusive partner venues'],
    gallery: ['1519167758481-83f550bb49b3', '1559339352-11d035aa65de', '1469371670807-013ccf25f16a', '1542314831-068cd1dbfeeb'],
  },
  'event-styling': {
    tagline: 'Every detail styled to your taste.',
    intro: [
      'Styling is where your event gets its personality. We choose and place every element — furniture, linens, tableware, candles, signage and décor accents — so the whole space feels cohesive, intentional and beautiful.',
      'From lounge areas and welcome points to photo corners, every angle is styled to look perfect in person and in photographs.',
    ],
    includes: ['Furniture & lounge areas', 'Linens, tableware & glassware', 'Welcome signage & stationery', 'Photo corners & backdrops', 'Candles & décor accents', 'On-site stylists'],
    gallery: [S('styling'), S('styling-2'), S('styling-3'), '/images/private-parties.avif'],
  },
  flowers: {
    tagline: 'Florals arranged by expert designers.',
    intro: [
      'Flowers bring life, colour and fragrance to every celebration. Our florists design everything from bridal bouquets and buttonholes to tall centrepieces, floral arches and ceiling installations — using fresh, seasonal blooms.',
      'We source the flowers, build the arrangements on site and make sure they look perfect from the first photo to the last dance.',
    ],
    includes: ['Bridal bouquets & buttonholes', 'Table centrepieces', 'Floral arches & backdrops', 'Hanging & ceiling installations', 'Seasonal & imported blooms', 'On-site installation'],
    gallery: [S('flowers'), S('flowers-2'), '/images/hero.jpg', '/images/event-wedding.jpg'],
  },
  'cakes-and-desserts': {
    tagline: 'Showstopping cakes and dessert tables.',
    intro: [
      'A beautiful cake is often the centrepiece of the celebration. Our pastry partners create custom cakes in any style — classic tiered wedding cakes, modern sculpted designs and birthday showstoppers — that taste as good as they look.',
      'Complete the experience with a styled dessert table full of macarons, mini desserts and sweet treats for your guests.',
    ],
    includes: ['Custom wedding & celebration cakes', 'Tasting session', 'Styled dessert tables', 'Macarons, cupcakes & mini desserts', 'Dietary options (vegan, gluten-free)', 'Delivery & setup'],
    gallery: [S('cakes'), S('cakes-2'), S('cakes-3'), S('cakes-4')],
  },
  'table-styling': {
    tagline: 'Tablescapes that set the mood.',
    intro: [
      'Your guests spend most of the event at the table, so every detail matters. We design tablescapes with the perfect linens, chargers, cutlery, glassware, candles, florals and place cards to match your theme.',
      'Whether you want romantic and soft, modern and minimal or bold and glamorous, every table is set by hand to perfection.',
    ],
    includes: ['Linens & napkin styling', 'Chargers, cutlery & glassware', 'Centrepieces & candles', 'Place cards & menus', 'Head & sweetheart tables', 'Full table setup on site'],
    gallery: [S('table'), S('table-2'), S('table-3'), S('table-4')],
  },
  'live-music': {
    tagline: 'Bands, singers and soloists.',
    intro: [
      'Nothing lifts the atmosphere like live music. We work with talented bands, singers, saxophonists, string quartets and pianists to create the soundtrack of your event — from the ceremony and drinks reception to a packed dance floor.',
      'We help you choose the right artists, plan the set list and handle all the technical requirements.',
    ],
    includes: ['Wedding & party bands', 'Solo singers & acoustic acts', 'Saxophone & DJ + sax sets', 'String quartets & pianists', 'Ceremony & reception music', 'Sound setup for performers'],
    gallery: [S('live-music'), S('live-music-2'), S('live-music-3'), S('live-music-4')],
  },
  entertainment: {
    tagline: 'Performers that wow your guests.',
    intro: [
      'Give your guests moments they will talk about for years. From fire performers and dancers to magicians, acrobats, hosts and themed characters, we book entertainment that fits your event and your audience.',
      'We coordinate timings, space and technical needs so every performance lands perfectly.',
    ],
    includes: ['Dancers & choreographed shows', 'Fire & LED performers', 'Magicians & roaming acts', 'Acrobats & aerial shows', 'Hosts & MCs', 'Themed & kids entertainment'],
    gallery: [S('entertainment'), S('entertainment-2'), S('stages-3'), S('special-effects-3')],
  },
  sound: {
    tagline: 'Professional audio for any space.',
    intro: [
      'Clear sound is essential — for vows, speeches, presentations and music. Our audio team designs a sound system for your venue and guest numbers, so every word is heard and every song sounds great.',
      'Experienced sound engineers run the system throughout the event, from the first sound check to the final track.',
    ],
    includes: ['PA systems for any size', 'Wireless & lapel microphones', 'Mixing desks & monitors', 'Sound check & rehearsal', 'Live sound engineers', 'Ceremony & outdoor audio'],
    gallery: [S('sound'), S('sound-2'), S('sound-3'), S('sound-lighting-3')],
  },
  lighting: {
    tagline: 'Lighting design that transforms a room.',
    intro: [
      'Lighting changes everything. Warm uplighting makes a room feel intimate, while moving heads and beams turn the dance floor into a show. Our lighting designers create the right mood for every moment of your event.',
      'We plan, install and operate the full lighting rig, including programmed scenes for the entrance, first dance and party.',
    ],
    includes: ['Uplighting & wall washing', 'Fairy lights & festoon', 'Moving heads & beams', 'Pin spots for tables & cake', 'Programmed lighting scenes', 'Lighting operators on site'],
    gallery: [S('sound-lighting'), S('sound-lighting-2'), S('stages'), S('sound-lighting-4')],
  },
  'technical-production': {
    tagline: 'End-to-end technical delivery.',
    intro: [
      'Large events need a technical team that brings everything together. We manage the full production — sound, lighting, LED screens, staging, power and rigging — as one coordinated project with a single point of contact.',
      'From technical drawings and site surveys to show calling on the day, our production managers make sure everything runs safely and on cue.',
    ],
    includes: ['Production management', 'Technical site surveys & drawings', 'Power & rigging', 'Show calling & cueing', 'Crew & health and safety', 'Full AV integration'],
    gallery: [S('led-screens-3'), S('stages-2'), S('stages-4'), S('led-screens')],
  },
}

// Menu items that share a page with one of the service cards
const PAGE_ALIASES = { 'Full Event Planning': 'event-planning', DJ: 'dj-and-entertainment', Staging: 'stages' }

// URL of the detail page for any service name (cards or menu)
export const servicePath = (name) => `/services/${PAGE_ALIASES[name] || slug(name)}`
