import {useEffect, useState} from "react"

export const useRelativeTime = (dateString: string | null | undefined) => {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!dateString) return

    const targetDate = new Date(dateString)

    const scheduleNextUpdate = () => {
      const now = new Date()
      const diffMs = now.getTime() - targetDate.getTime()
      const absDiffMs = Math.abs(diffMs)
      const diffMins = Math.floor(absDiffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)

      let timeUntilNextUpdate: number

      if (diffMins < 1) {
        timeUntilNextUpdate = 1000
      } else if (diffMins < 60) {
        const secondsUntilNextMinute = 60 - new Date().getSeconds()
        timeUntilNextUpdate = secondsUntilNextMinute * 1000
      } else if (diffHours < 24) {
        const minutesUntilNextHour = 60 - new Date().getMinutes()
        timeUntilNextUpdate = minutesUntilNextHour * 60000
      } else {
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        timeUntilNextUpdate = tomorrow.getTime() - now.getTime()
      }

      const timeout = setTimeout(() => {
        setTick((t) => t + 1)
        scheduleNextUpdate()
      }, timeUntilNextUpdate)

      return timeout
    }

    const timeout = scheduleNextUpdate()

    return () => clearTimeout(timeout)
  }, [dateString])

  // return null if no date string provided
  if (!dateString) return null

  // calculate relative time
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const absDiffMs = Math.abs(diffMs)
  const isPast = diffMs > 0

  const diffMins = isPast ? Math.floor(absDiffMs / 60000) : Math.ceil(absDiffMs / 60000)

  if (diffMins < 1) return isPast ? "Just now" : "In a moment"
  if (diffMins < 60) return isPast ? `${diffMins} mins ago` : `In ${diffMins} mins`

  const diffHours = isPast ? Math.floor(diffMins / 60) : Math.ceil(diffMins / 60)
  if (diffHours < 24) return isPast ? `${diffHours} hours ago` : `In ${diffHours} hours`

  const diffDays = isPast ? Math.floor(diffHours / 24) : Math.ceil(diffHours / 24)
  if (diffDays < 7) return isPast ? `${diffDays} days ago` : `In ${diffDays} days`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
