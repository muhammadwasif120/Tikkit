// SEO copy for the programmatic city and category pages. Slugs here match the sitemap.

export const CITY_CONTENT: Record<string, { intro: string; categories: string[] }> = {
  lahore: {
    intro: `Lahore is Pakistan's cultural capital, and its events scene reflects it. From intimate jazz nights and rooftop parties in DHA and Gulberg, to sold-out tech conferences and fashion trunk shows, there's always something happening. Browse upcoming concerts, food festivals, corporate networking nights, art exhibitions, and private brand activations in Lahore. Whether you're looking for this weekend's best night out or planning ahead, Tikkit lists every verified event in the city with secure online ticketing, JazzCash and EasyPaisa payment support, and instant QR entry.`,
    categories: ['music', 'food', 'tech', 'art', 'business', 'fashion'],
  },
  karachi: {
    intro: `Karachi hosts Pakistan's largest events, by scale, by production value, and by audience. The city's business concentration makes it the natural home for national product launches, corporate conferences, and brand activations, while its coastline and DHA venues set the stage for rooftop nights and private parties. Browse upcoming events in Karachi: concerts at waterfront venues, startup summits in Clifton, corporate dinners in Saddar, and exclusive gatherings across the city. Tikkit lists verified events with secure ticketing, JazzCash and EasyPaisa payments, and real-time QR entry management.`,
    categories: ['business', 'music', 'tech', 'food', 'sports', 'art'],
  },
  islamabad: {
    intro: `Islamabad has a quieter but discerning events culture. The capital draws wellness retreats, diplomatic social events, high-end corporate dinners, and curated arts experiences unlike anywhere else in Pakistan. F-6, F-7, and the Blue Area host the city's most exclusive gatherings, from mindfulness and yoga retreats to government-sector networking events and private gallery openings. Browse upcoming events in Islamabad on Tikkit, with verified organizers, secure online ticketing, and QR-based entry. Find wellness workshops, tech meetups, cultural evenings, and more.`,
    categories: ['wellness', 'business', 'art', 'tech', 'food', 'music'],
  },
  rawalpindi: {
    intro: `Rawalpindi's events scene blends its close ties with Islamabad's professional crowd and its own strong local culture. From corporate networking nights and product launches to community gatherings and live performances, the twin-city region offers a growing calendar of verified events. Browse upcoming events in Rawalpindi on Tikkit, with secure ticketing and QR entry.`,
    categories: ['business', 'music', 'food', 'tech', 'art', 'sports'],
  },
  faisalabad: {
    intro: `Faisalabad's growing business and industrial community has built a dynamic local events scene. From corporate seminars and trade exhibitions to cultural festivals and community gatherings, the city's event calendar is expanding fast. Browse upcoming events in Faisalabad on Tikkit, with verified organizers and secure online ticketing.`,
    categories: ['business', 'food', 'music', 'tech', 'art', 'sports'],
  },
  peshawar: {
    intro: `Peshawar's rich cultural heritage shapes a unique local events landscape. Arts and heritage events, community gatherings, business conferences, and food festivals reflect the city's distinct identity. Browse upcoming events in Peshawar on Tikkit and secure your tickets online.`,
    categories: ['art', 'food', 'business', 'music', 'tech', 'sports'],
  },
  multan: {
    intro: `Multan's events calendar spans cultural festivals, religious celebrations, business seminars, and community gatherings. The City of Saints has a growing appetite for live events and experiences. Browse upcoming events in Multan on Tikkit, with online ticketing and secure QR entry.`,
    categories: ['food', 'art', 'business', 'music', 'sports', 'tech'],
  },
  quetta: {
    intro: `Quetta's events scene reflects its unique cultural mix and growing professional community. From business networking events and educational conferences to cultural exhibitions and community gatherings, Quetta is building a more active live-events calendar. Browse upcoming events in Quetta on Tikkit.`,
    categories: ['business', 'food', 'art', 'music', 'tech', 'sports'],
  },
}

export const CATEGORY_LABELS: Record<string, string> = {
  music:    'Concerts & Music',
  food:     'Food & Drink',
  tech:     'Tech & Startup',
  art:      'Art & Culture',
  business: 'Business & Networking',
  fashion:  'Fashion & Design',
  wellness: 'Wellness & Retreats',
  sports:   'Sports & Fitness',
  comedy:   'Comedy',
  film:     'Film & Cinema',
}

/** URL category slugs used by /explore/[city]/[category], mapped to event_categories.slug. */
export const CATEGORY_DB_SLUG: Record<string, string> = {
  music: 'music', tech: 'tech', art: 'art-culture', sports: 'sports', food: 'food-drink',
  wellness: 'health-wellness', business: 'business', comedy: 'comedy', fashion: 'fashion', networking: 'networking',
  education: 'education', gaming: 'gaming', social: 'social', charity: 'charity',
}

export const CITIES = ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'peshawar', 'multan', 'quetta'] as const
export const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
