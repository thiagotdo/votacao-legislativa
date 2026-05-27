import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function useSocket(sessaoId, handlers = {}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!sessaoId) return

    if (!socketInstance || !socketInstance.connected) {
      socketInstance = io('/', { withCredentials: true })
    }

    socketInstance.emit('entrar:sessao', sessaoId)

    const eventos = [
      'sessao:status',
      'votacao:iniciada',
      'votacao:voto',
      'votacao:encerrada',
      'presenca:atualizada',
      'presenca:lote',
    ]

    const listeners = {}
    eventos.forEach(ev => {
      listeners[ev] = (data) => {
        if (handlersRef.current[ev]) handlersRef.current[ev](data)
      }
      socketInstance.on(ev, listeners[ev])
    })

    return () => {
      socketInstance.emit('sair:sessao', sessaoId)
      eventos.forEach(ev => socketInstance.off(ev, listeners[ev]))
    }
  }, [sessaoId])

  return socketInstance
}
