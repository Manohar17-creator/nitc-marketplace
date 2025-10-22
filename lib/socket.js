import { Server } from 'socket.io'

let io

export function initSocket(server) {
  if (!io) {
    io = new Server(server, {
      path: '/api/socket',
      addTrailingSlash: false,
    })

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('join-community', (communityId) => {
        socket.join(`community:${communityId}`)
        console.log(`Socket ${socket.id} joined community ${communityId}`)
      })

      socket.on('leave-community', (communityId) => {
        socket.leave(`community:${communityId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }
  return io
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}