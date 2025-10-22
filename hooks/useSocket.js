import { useEffect, useState } from 'react'
import io from 'socket.io-client'

export function useSocket(communityId) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!communityId) return

    const socketInstance = io({
      path: '/api/socket',
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
      socketInstance.emit('join-community', communityId)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.emit('leave-community', communityId)
      socketInstance.disconnect()
    }
  }, [communityId])

  return { socket, isConnected }
}