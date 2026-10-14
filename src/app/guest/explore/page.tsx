import { permanentRedirect } from 'next/navigation'

/** The attendee explore page is now the public /explore, which personalises for signed in guests. */
export default function GuestExploreRedirect() {
  permanentRedirect('/explore')
}
