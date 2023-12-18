import {Socket} from 'socket.io';
import {ws} from '../decorators/websocket.decorator';

const debug = require('debug')('websockets:ChatsWebSocketController');

/**
 * A demo controller for websocket
 */
@ws(/^\/chats\/\d+$/)
export class ChatsWebSocketController {
  private roomId: string | null;

  constructor(@ws.socket() private socket: Socket) {
    this.roomId = this._getRoomIdFromNameSpace(this.socket.nsp.name);
  }

  private _getRoomIdFromNameSpace(namespace: string): string | null {
    const match = namespace.match(/^\/chats\/(\d+)$/);
    return match ? match[1] : null;
  }

  /**
   * The method is invoked when a client connects to the server
   * @param socket
   */
  @ws.connect()
  connect(socket: Socket) {
    debug('Client connected: %s to room %s', this.socket.id, this.roomId);
    if (this.roomId) {
      // eslint-disable-next-line no-void
      void socket.join(this.roomId);
    }
  }

  /**
   * Register a handler for 'chat message' events
   * @param message
   */
  @ws.subscribe('chat_message')
  // @ws.emit('namespace' | 'requestor' | 'broadcast')
  handleChatMessage(message: unknown) {
    if (this.roomId) {
      this.socket.to(this.roomId).emit('chat_message', message);
      debug('Chat message to room %s: %s', this.roomId, message);
    }
  }

  /**
   * Register a handler for all events
   * @param msg
   */
  @ws.subscribe(/.+/)
  logMessage(...args: unknown[]) {
    debug('Message: %s', args);
  }

  /**
   * The method is invoked when a client disconnects from the server
   * @param socket
   */
  @ws.disconnect()
  disconnect() {
    debug('Client disconnected: %s', this.socket.id);
  }
}
