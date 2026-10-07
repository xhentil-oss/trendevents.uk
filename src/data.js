// Default site content. On the live site src/content.js replaces it with the content
// from the database (edited in /admin); this copy is the fallback when the API is unavailable.

// Site paths ("/images/…", "/uploads/…") and full URLs are used as-is; anything else is an Unsplash photo id
export const img = (id, w = 1200) =>
  !id ? '' : id.startsWith('/') || id.startsWith('http') ? id : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

export const slug = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const HERO_IMAGES = {
  home: '1519167758481-83f550bb49b3',
  services: '/images/cover-trendevent.jpg',
  celebrate: '/images/hero.jpg',
  venues: '1519167758481-83f550bb49b3',
  events: '1606216794074-735e91aa2c92',
  packages: '1464366400600-7168b8af9bc3',
  work: '1583939003579-730e3918a45a',
  about: '/images/decor-event.avif',
  quote: '1522413452208-996ff3f3e740',
  build: '/images/cover-trendevent.jpg',
  cta: '/images/cta-candles.jpg',
}

// Search bar "Event Type" dropdown
export const SEARCH_EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Engagement',
  'Baby Shower',
  'Private Party',
  'Corporate Event',
  'Conference',
  'Product Launch',
  'Christmas Party',
  'Other Event',
]

export const LOCATIONS = ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Edinburgh']

export const GUEST_OPTIONS = ['Up to 50 guests', '50–100 guests', '100–200 guests', '200–400 guests', '400+ guests']

// Minimum capacity implied by each guest option (used for filtering venues)
export const GUEST_MIN = {
  'Up to 50 guests': 0,
  '50–100 guests': 50,
  '100–200 guests': 100,
  '200–400 guests': 200,
  '400+ guests': 400,
}

// VENUES menu
export const VENUE_CATEGORIES = [
  'Wedding Venues',
  'Birthday Venues',
  'Party Venues',
  'Corporate Venues',
  'Conference Venues',
  'Luxury Venues',
  'Outdoor Venues',
  'Hotels',
  'Banqueting Halls',
  'Restaurants',
  'Rooftops',
  'Unique Venues',
]

// EVENTS menu
export const EVENT_TYPES = [
  { name: 'Weddings', icon: 'Gem', image: '/images/event-wedding.jpg', text: 'From intimate ceremonies to grand receptions, designed around your love story.' },
  { name: 'Birthdays', icon: 'Cake', image: '/images/event-birthday.jpg', position: 'center top', text: 'Milestone birthdays and surprise parties styled to perfection.' },
  { name: 'Engagements', icon: 'Heart', image: '/images/engagment-1.avif', text: 'Proposals and engagement parties worth remembering forever.' },
  { name: 'Baby Showers', icon: 'Baby', image: '/images/event-baby-shower.jpg', position: 'center 20%', text: 'Soft, beautiful celebrations to welcome the newest arrival.' },
  { name: 'Private Parties', icon: 'Wine', image: '/images/private-parties.avif', text: 'Anniversaries, dinners and soirées hosted with effortless style.' },
  { name: 'Corporate Events', icon: 'Briefcase', image: '1511578314322-379afb476865', text: 'Company celebrations, team events and client evenings.' },
  { name: 'Conferences', icon: 'Presentation', image: '/images/conference.avif', position: 'center 40%', text: 'Seamless conferences with full technical production.' },
  { name: 'Product Launches', icon: 'Rocket', image: '/images/event-product-launch.jpg', position: '65% center', text: 'Launches that make an entrance and get people talking.' },
  { name: 'Award Nights', icon: 'Trophy', image: '/images/event-award-night.jpg', text: 'Red-carpet evenings with staging, lighting and entertainment.' },
  { name: 'Christmas Parties', icon: 'Sparkles', image: '/images/event-christmas-party.jpg', text: 'Festive parties for teams, families and friends.' },
  { name: 'Brand Events', icon: 'Megaphone', image: '/images/event-brand-event.jpg', text: 'Immersive brand experiences that bring your story to life.' },
]

// Longer copy for each event type on the Events page
export const EVENT_DETAILS = {
  Weddings: {
    intro:
      'Your wedding day deserves a team that sweats every detail so you never have to. From the first venue visit to the last dance, we design a celebration that feels unmistakably yours — elegant florals, candlelit tablescapes, flawless timing and a guest experience people talk about for years.',
    includes: ['Venue sourcing & site visits', 'Concept, styling & floral design', 'Catering, cake & bar', 'Photography, videography & entertainment', 'Full planning & on-the-day coordination'],
    guests: '50 – 500 guests',
  },
  Birthdays: {
    intro:
      'Whether it is a first birthday, a sweet sixteen or a glamorous 50th, we turn your milestone into a party to remember. Choose a theme, a colour palette and a vibe — we bring it to life with styling, balloons, cakes and entertainment.',
    includes: ['Themed décor & balloon installations', 'Custom cakes & dessert tables', 'DJ, live music or entertainers', 'Venue, catering & drinks', 'Photography & photo booths'],
    guests: '20 – 250 guests',
  },
  Engagements: {
    intro:
      'From a secret proposal to an engagement party for all your loved ones, we create romantic moments with soft lighting, white florals and beautiful details. We handle the logistics quietly, so the only thing you need to focus on is the question — and the celebration afterwards.',
    includes: ['Surprise proposal planning', 'Sweetheart tables & floral backdrops', 'Candlelight & ambient lighting', 'Private dining or party venues', 'Photographer to capture the moment'],
    guests: '2 – 200 guests',
  },
  'Baby Showers': {
    intro:
      'Celebrate the newest arrival with a soft, beautifully styled baby shower or gender reveal. We design pastel palettes, dreamy balloon arches and sweet treats, so the parents-to-be can simply relax and enjoy the day with family and friends.',
    includes: ['Pastel styling & balloon arches', 'Gender reveal moments', 'Cakes, cupcakes & dessert tables', 'Games, favours & décor', 'Venue or at-home setup'],
    guests: '15 – 100 guests',
  },
  'Private Parties': {
    intro:
      'Anniversaries, family dinners, cocktail evenings or just because — our private parties are hosted with effortless style. We find the right space, curate the menu and set the mood, so you can be a guest at your own party.',
    includes: ['Private venues & dining rooms', 'Curated menus & cocktail bars', 'Table styling & florals', 'Music & entertainment', 'Hosting & guest management'],
    guests: '10 – 300 guests',
  },
  'Corporate Events': {
    intro:
      'Team celebrations, client evenings, summer parties and company milestones — delivered on time, on budget and on brand. We work with your team to create events that strengthen relationships and reflect the quality of your business.',
    includes: ['Venue sourcing & negotiation', 'Branding & event design', 'Catering & drinks packages', 'AV, staging & lighting', 'Guest registration & management'],
    guests: '30 – 1,000 guests',
  },
  Conferences: {
    intro:
      'We plan conferences that run seamlessly from registration to the closing keynote. Our production team takes care of the stage, screens and sound, while our planners manage speakers, schedules and guests.',
    includes: ['Auditoriums & breakout rooms', 'Full technical production & LED screens', 'Speaker & agenda management', 'Registration, badges & signage', 'Catering & networking breaks'],
    guests: '50 – 2,000 guests',
  },
  'Product Launches': {
    intro:
      'Make an entrance. We create launch events with dramatic reveals, immersive design and content-ready moments that get your product seen and shared — by press, partners and customers alike.',
    includes: ['Creative concept & reveal moments', 'Staging, lighting & special effects', 'Press & influencer management', 'Brand activations', 'Photo & video content'],
    guests: '50 – 800 guests',
  },
  'Award Nights': {
    intro:
      'Red carpets, glittering stages and perfectly timed ceremonies. We produce award nights that honour achievement in style — from the welcome drinks to the final standing ovation.',
    includes: ['Red carpet & welcome experience', 'Stage design, lighting & screens', 'Show running & hosts', 'Gala dinner & drinks', 'Live entertainment'],
    guests: '100 – 1,000 guests',
  },
  'Christmas Parties': {
    intro:
      'Festive parties that bring teams, friends and families together. From elegant winter dinners to full-on themed parties, we take care of the décor, food, music and fun, so everyone can celebrate the season.',
    includes: ['Festive themes & winter styling', 'Christmas dinner menus', 'DJs, bands & entertainment', 'Exclusive or shared party venues', 'Photo booths & favours'],
    guests: '20 – 1,000 guests',
  },
  'Brand Events': {
    intro:
      'Pop-ups, activations and immersive brand experiences that bring your story to life. We combine creative design with smart production to create spaces people want to step into, photograph and remember.',
    includes: ['Experiential concepts', 'Set build & bespoke installations', 'Lighting, sound & LED', 'Staffing & hosts', 'Social content capture'],
    guests: 'Any size',
  },
}

// SERVICES menu — four groups
export const SERVICE_GROUPS = [
  {
    name: 'Planning & Design',
    services: [
      { name: 'Full Event Planning', icon: 'ClipboardList', image: '1522413452208-996ff3f3e740', text: 'Full planning, coordination & concept design' },
      { name: 'Event Coordination', icon: 'Users', image: '1519225421980-715cb0215aed', text: 'On-the-day management so you can relax' },
      { name: 'Event Concept & Design', icon: 'Palette', image: '1511795409834-ef04bbd61622', text: 'A creative vision built around you' },
      { name: 'Venue Finding', icon: 'MapPin', image: '1519167758481-83f550bb49b3', text: 'The perfect space, sourced for you' },
      { name: 'Event Styling', icon: 'Sparkles', image: '1469371670807-013ccf25f16a', text: 'Every detail styled to your taste' },
    ],
  },
  {
    name: 'Food & Décor',
    services: [
      { name: 'Catering', icon: 'UtensilsCrossed', image: '1555244162-803834f70033', text: 'Exquisite menus for every occasion' },
      { name: 'Decoration', icon: 'Flower2', image: '1464366400600-7168b8af9bc3', text: 'Bespoke styling & floral designs' },
      { name: 'Flowers', icon: 'Flower2', image: '1487530811176-3780de880c2d', text: 'Florals arranged by expert designers' },
      { name: 'Cakes & Desserts', icon: 'Cake', image: '1464349095431-e9a21285b5f3', text: 'Showstopping cakes and dessert tables' },
      { name: 'Table Styling', icon: 'Wine', image: '1522413452208-996ff3f3e740', text: 'Tablescapes that set the mood' },
    ],
  },
  {
    name: 'Photo & Entertainment',
    services: [
      { name: 'Photography', icon: 'Camera', image: '1502920917128-1aa500764cbd', text: 'Capture every moment' },
      { name: 'Videography', icon: 'Video', image: '1583939003579-730e3918a45a', text: 'Cinematic event films' },
      { name: 'DJ', icon: 'Headphones', image: '1470225620780-dba8ba36b745', text: 'Music and energy for every vibe' },
      { name: 'Live Music', icon: 'Music', image: '1516450360452-9312f5e86fc7', text: 'Bands, singers and soloists' },
      { name: 'Entertainment', icon: 'PartyPopper', image: '1496337589254-7e19d01cec44', text: 'Performers that wow your guests' },
    ],
  },
  {
    name: 'Event Production',
    services: [
      { name: 'Sound', icon: 'Speaker', image: '1514525253161-7a46d19cd819', text: 'Professional audio for any space' },
      { name: 'Lighting', icon: 'Lightbulb', image: '1566737236500-c8ac43014a67', text: 'Lighting design that transforms a room' },
      { name: 'LED Screens', icon: 'Monitor', image: '1505373877841-8d25f7d46678', text: 'Stunning visuals for bigger impact' },
      { name: 'Staging', icon: 'Theater', image: '1459749411175-04bf5292ceea', text: 'Custom stage solutions' },
      { name: 'Special Effects', icon: 'WandSparkles', image: '1533174072545-7a4b6ad7a6c3', text: 'Create unforgettable moments' },
      { name: 'Technical Production', icon: 'Layers', image: '1531058020387-3be344556be6', text: 'End-to-end technical delivery' },
    ],
  },
]

export const ALL_SERVICES = SERVICE_GROUPS.flatMap((g) => g.services.map((s) => ({ ...s, group: g.name })))

// Services highlighted in the home page strip and the services page grid
export const FEATURED_SERVICES = [
  { name: 'Event Planning', icon: 'ClipboardList', image: '/images/services/event-planning.jpg', text: 'Full planning, coordination & concept design' },
  { name: 'Venue Finding', icon: 'MapPin', image: '1519167758481-83f550bb49b3', text: 'The perfect space, sourced for you' },
  { name: 'Catering', icon: 'UtensilsCrossed', image: '/images/services/catering.jpg', text: 'Exquisite menus for every occasion' },
  { name: 'Decoration', icon: 'Flower2', image: '/images/event-engagement.jpg', text: 'Bespoke styling & floral designs' },
  { name: 'Photography', icon: 'Camera', image: '/images/services/photography.jpg', text: 'Capture every moment' },
  { name: 'Videography', icon: 'Video', image: '/images/services/videography.jpg', text: 'Cinematic event films' },
  { name: 'DJ & Entertainment', icon: 'Headphones', image: '/images/services/dj.jpg', text: 'Music and entertainment for every vibe' },
  { name: 'Sound & Lighting', icon: 'Speaker', image: '/images/services/sound-lighting.jpg', text: 'Professional audio and lighting production' },
  { name: 'LED Screens', icon: 'Monitor', image: '/images/services/led-screens.jpg', text: 'Stunning visuals for bigger impact' },
  { name: 'Stages', icon: 'Theater', image: '/images/services/stage-decor.jpg', text: 'Decorated stages & backdrops' },
  { name: 'Special Effects', icon: 'WandSparkles', image: '/images/services/special-effects.jpg', text: 'Create unforgettable moments' },
]

export const VENUES = [
  {
    id: 'the-grand-hall',
    name: 'The Grand Hall',
    location: 'London',
    capacity: 350,
    price: 2500,
    image: '1519167758481-83f550bb49b3',
    gallery: ['1519167758481-83f550bb49b3', '1519225421980-715cb0215aed', '1511795409834-ef04bbd61622'],
    categories: ['Wedding Venues', 'Banqueting Halls', 'Luxury Venues', 'Corporate Venues', 'Party Venues'],
    description: 'A timeless ballroom with crystal chandeliers, soaring ceilings and a sprung dance floor — made for grand weddings and gala dinners.',
  },
  {
    id: 'riverside-terrace',
    name: 'Riverside Terrace',
    location: 'London',
    capacity: 200,
    price: 2000,
    image: '1559339352-11d035aa65de',
    gallery: ['1559339352-11d035aa65de', '1513635269975-59663e0ac1ad', '1519671482749-fd09be7ccebf'],
    categories: ['Outdoor Venues', 'Party Venues', 'Birthday Venues', 'Wedding Venues', 'Rooftops'],
    description: 'An open-air terrace on the water with sunset views over the city skyline — perfect for summer receptions and cocktail parties.',
  },
  {
    id: 'the-crystal-room',
    name: 'The Crystal Room',
    location: 'Birmingham',
    capacity: 400,
    price: 3000,
    image: '1519225421980-715cb0215aed',
    gallery: ['1519225421980-715cb0215aed', '/images/event-wedding.jpg', '1522413452208-996ff3f3e740'],
    categories: ['Wedding Venues', 'Luxury Venues', 'Banqueting Halls', 'Hotels'],
    description: 'Golden light, mirrored walls and a statement chandelier. The Crystal Room turns every celebration into an occasion.',
  },
  {
    id: 'skyline-view',
    name: 'Skyline View',
    location: 'Manchester',
    capacity: 250,
    price: 2200,
    image: '1477959858617-67f85cf4f1df',
    gallery: ['1477959858617-67f85cf4f1df', '1566737236500-c8ac43014a67', '1527529482837-4698179dc6ce'],
    categories: ['Rooftops', 'Corporate Venues', 'Party Venues', 'Unique Venues', 'Birthday Venues'],
    description: 'A glass-walled rooftop space high above the city, ideal for launches, corporate evenings and after-dark parties.',
  },
  {
    id: 'the-garden-estate',
    name: 'The Garden Estate',
    location: 'Liverpool',
    capacity: 300,
    price: 2800,
    image: '1469371670807-013ccf25f16a',
    gallery: ['1469371670807-013ccf25f16a', '1522673607200-164d1b6ce486', '1465495976277-4387d4b0b4c6'],
    categories: ['Wedding Venues', 'Outdoor Venues', 'Unique Venues', 'Luxury Venues'],
    description: 'Manicured lawns, rose gardens and a floral aisle — a romantic countryside setting just outside the city.',
  },
  {
    id: 'the-summit-centre',
    name: 'The Summit Centre',
    location: 'London',
    capacity: 600,
    price: 3500,
    image: '1511578314322-379afb476865',
    gallery: ['1511578314322-379afb476865', '1540575467063-178a50c2df87', '1560439513-74b037a25d84'],
    categories: ['Conference Venues', 'Corporate Venues', 'Hotels'],
    description: 'A flexible conference venue with built-in AV, breakout rooms and a 600-seat auditorium.',
  },
  {
    id: 'the-loft-kitchen',
    name: 'The Loft Kitchen',
    location: 'Edinburgh',
    capacity: 90,
    price: 1200,
    image: '1517248135467-4c7edcad34c4',
    gallery: ['1517248135467-4c7edcad34c4', '1414235077428-338989a2e8c0', '1528605248644-14dd04022da1'],
    categories: ['Restaurants', 'Birthday Venues', 'Party Venues', 'Unique Venues'],
    description: 'An industrial-chic restaurant with a private dining room — great for birthday dinners and intimate parties.',
  },
  {
    id: 'azure-bay-resort',
    name: 'Azure Bay Resort',
    location: 'Edinburgh',
    capacity: 220,
    price: 3200,
    image: '1542314831-068cd1dbfeeb',
    gallery: ['1542314831-068cd1dbfeeb', '1566073771259-6a8506099945', '1544078751-58fee2d8a03b'],
    categories: ['Hotels', 'Luxury Venues', 'Wedding Venues', 'Outdoor Venues'],
    description: 'A luxury resort hotel with poolside terraces and elegant suites for destination-style weddings and retreats.',
  },
]

export const PACKAGES = [
  {
    name: 'Wedding Packages',
    image: '/images/event-wedding.jpg',
    from: 8500,
    text: 'Everything for your big day, from venue to the final dance.',
    includes: ['Venue sourcing', 'Full planning & coordination', 'Floral & décor styling', 'Catering', 'Photography'],
  },
  {
    name: 'Birthday Packages',
    image: '/images/event-birthday.jpg',
    position: 'center 62%',
    from: 1500,
    text: 'Milestone birthdays with styling, cake and entertainment.',
    includes: ['Venue', 'Themed decoration', 'Cake & desserts', 'DJ'],
  },
  {
    name: 'Corporate Packages',
    image: '1511578314322-379afb476865',
    from: 4000,
    text: 'Professional events delivered on time and on brand.',
    includes: ['Venue', 'Event coordination', 'Catering', 'Sound, lighting & LED screens'],
  },
  {
    name: 'Venue + Catering',
    image: '1555244162-803834f70033',
    from: 3000,
    text: 'The perfect space paired with an exquisite menu.',
    includes: ['Venue hire', 'Menu tasting', 'Catering & service staff'],
  },
  {
    name: 'Venue + Décor',
    image: '1464366400600-7168b8af9bc3',
    from: 3200,
    text: 'A beautiful room, styled from floor to ceiling.',
    includes: ['Venue hire', 'Concept & styling', 'Flowers', 'Table styling'],
  },
  {
    name: 'Full Event Package',
    image: '/images/cover-trendevent.jpg',
    from: 12000,
    text: 'One team handles everything — you simply arrive and celebrate.',
    includes: ['Venue', 'Full planning', 'Catering & décor', 'Photo & video', 'Entertainment', 'Technical production'],
    featured: true,
  },
  {
    name: 'Custom Package',
    image: '1522413452208-996ff3f3e740',
    from: null,
    text: 'Pick exactly the services you need and we will tailor a proposal.',
    includes: ['Choose any venue', 'Choose any services', 'Tailored proposal'],
  },
]

// Our Work gallery — each category uses its photo from the Events page (EVENT_TYPES)
const eventImage = (type) => EVENT_TYPES.find((e) => e.name === type).image

export const PORTFOLIO = [
  { title: 'A White Rose Reception', type: 'Weddings', image: eventImage('Weddings') },
  { title: 'Candlelight by the River', type: 'Weddings', image: '/images/cover-trendevent.jpg' },
  { title: 'Tech Summit 2026', type: 'Conferences', image: eventImage('Conferences') },
  { title: 'Sunset Floral Birthday', type: 'Birthdays', image: eventImage('Birthdays') },
  { title: 'The Grand Reveal', type: 'Product Launches', image: eventImage('Product Launches') },
  { title: 'A Champagne Engagement', type: 'Engagements', image: eventImage('Engagements') },
  { title: 'Red Carpet Awards Gala', type: 'Award Nights', image: eventImage('Award Nights') },
  { title: 'Poolside Summer Party', type: 'Private Parties', image: eventImage('Private Parties') },
  { title: 'Festive Team Celebration', type: 'Christmas Parties', image: eventImage('Christmas Parties') },
  { title: 'Orchids & Champagne Reception', type: 'Weddings', image: '/images/decor-event.avif' },
  { title: 'Garden Brand Soirée', type: 'Brand Events', image: eventImage('Brand Events') },
  { title: 'Sunset Baby Shower', type: 'Baby Showers', image: eventImage('Baby Showers') },
]

export const PROCESS = [
  { icon: 'Palette', title: 'Plan', text: 'Design your vision' },
  { icon: 'Layers', title: 'Customise', text: 'Choose your services' },
  { icon: 'User', title: 'One Team', text: 'We handle everything' },
  { icon: 'Heart', title: 'Celebrate', text: 'Unforgettable moments' },
]

export const CONTACT = {
  phone: '+44 7308 214398',
  email: 'Trendeventsuk@gmail.com',
  address: 'London, United Kingdom',
  instagram: 'https://www.instagram.com/trendevents.uk/',
  hours: 'Mon–Sat, 9:00–19:00',
}
