export interface CountdownResult {
  remaining: number
  deadline: Date
  isExpired: boolean
  text: string
}

export function calculateDeadline(createdAt: Date, timingDays: number, timingType: 'days' | 'weeks'): Date {
  const deadline = new Date(createdAt)
  if (timingType === 'weeks') {
    deadline.setDate(deadline.getDate() + timingDays * 7)
  } else {
    deadline.setDate(deadline.getDate() + timingDays)
  }
  return deadline
}

export function getCountdown(createdAt: Date, timingDays: number | undefined, timingType: 'days' | 'weeks' | undefined): CountdownResult {
  if (!timingDays || !timingType) {
    return {
      remaining: 0,
      deadline: new Date(),
      isExpired: true,
      text: ''
    }
  }

  const deadline = calculateDeadline(createdAt, timingDays, timingType)
  const now = new Date()
  const remaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (remaining <= 0) {
    return {
      remaining: 0,
      deadline,
      isExpired: true,
      text: 'Window closed — time for a fresh draw'
    }
  }

  const formattedDate = deadline.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return {
    remaining,
    deadline,
    isExpired: false,
    text: `Watch for this by ${formattedDate} (in ${remaining} day${remaining !== 1 ? 's' : ''})`
  }
}

export function roundToMilestone(date: Date): string {
  const day = date.getDay()
  const dayOfMonth = date.getDate()

  if (day === 5) return 'Friday'
  if (day === 6) return 'Saturday'
  if (day === 0) return 'Sunday'

  if (dayOfMonth === 1) return 'month-start'
  if (dayOfMonth === 15) return 'mid-month'

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}
