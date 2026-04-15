export type UserRole = 'owner' | 'crew'

export interface YachtJob {
  id: string
  vesselName: string
  vesselType: 'motor' | 'sailing'
  vesselLength: number // meters
  route: { from: string; to: string }
  dates: { start: string; end: string }
  rolesNeeded: string[]
  urgent?: boolean
  ownerName: string
  description: string
  location: string
}

export interface CrewMember {
  id: string
  name: string
  primaryRole: string
  roles: string[]
  experience: number // years
  voyages: number
  rating: number
  certifications: string[]
  availability: { start: string; end: string }
  nationality: string
  bio: string
  available: boolean
}

export type TabType = 'jobs' | 'crew'
