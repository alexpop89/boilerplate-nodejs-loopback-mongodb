import {expect} from '@loopback/testlab';
import {Socket} from 'socket.io-client';

import {MainApplication} from '../..';
import {setupApplication} from './test-helper';

describe('ChatsWebSocketController', () => {
  let app: MainApplication;
  let socketClient: Socket;

  before('setupApplication', async () => {
    ({app, socketClient} = await setupApplication('/chats/123'));
  });

  after(async () => {
    socketClient.close();
    await app.stop();
  });

  it('can connect to socket', done => {
    socketClient.on('connect', () => {
      expect(socketClient.connected).to.be.true();
      done();
    });
  });

  it('can emit a message', async () => {
    const message = 'Hello from client';
    await new Promise<void>((resolve, reject) => {
      socketClient.emit('chat_message', message);
      resolve();
      setTimeout(() => reject(new Error('No response from server')), 5000);
    });
  });

  it('can disconnect from socket', done => {
    // Listen for the 'disconnect' event
    socketClient.on('disconnect', () => {
      // Perform your assertions here
      expect(socketClient.connected).to.be.false();
      done();
    });

    // Trigger the disconnection
    socketClient.disconnect();
  });
});
