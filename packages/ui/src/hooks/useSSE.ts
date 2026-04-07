import { useEffect, useRef, useCallback } from 'react'

export interface SSEEvent {
  type: 'agent_status_changed' | 'issue_updated' | 'department_updated' | 'heartbeat'
  payload: Record<string, unknown>
  timestamp: string
}

interface UseSSEOptions {
  companyId: string
  port?: number
  onEvent: (event: SSEEvent) => void
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000

export function useSSE({
  companyId,
  port = 8080,
  onEvent,
  onError,
  onConnect,
  onDisconnect,
}: UseSSEOptions): void {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const currentCompanyIdRef = useRef(companyId)

  // Keep ref in sync with latest companyId
  useEffect(() => {
    currentCompanyIdRef.current = companyId
  }, [companyId])

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const url = `http://localhost:${port}/api/events?company_id=${currentCompanyIdRef.current}`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      reconnectAttemptRef.current = 0
      onConnect?.()
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data)
        if (data.type !== 'heartbeat') {
          onEvent(data)
        }
      } catch {
        // Ignore parse errors (e.g., heartbeat comments)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      eventSourceRef.current = null
      onDisconnect?.()

      // Exponential backoff reconnect
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
        MAX_RECONNECT_DELAY
      )
      reconnectAttemptRef.current++

      onError?.(new Error(`SSE connection lost, reconnecting in ${delay}ms`))

      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, delay)
    }
  }, [port, onEvent, onError, onConnect, onDisconnect])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])
}
