import { Server } from 'socket.io'

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', (socket) => {
      socket.on('join-community', (communityId) => {
        socket.join(`community:${communityId}`)
      })

      socket.on('leave-community', (communityId) => {
        socket.leave(`community:${communityId}`)
      })
    })
  }
  res.end()
}

export { ioHandler as GET, ioHandler as POST }