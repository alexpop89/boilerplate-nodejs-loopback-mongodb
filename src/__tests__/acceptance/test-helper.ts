import {MainApplication} from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';
import {io, Socket} from 'socket.io-client';
import {RestApplicationLike} from '@loopback/testlab/src/client';
import {HttpServer} from '@loopback/http-server';

export interface AppWithClientAndSocket {
  app: MainApplication;
  client: Client;
  socketClient: Socket;
}

function givenWebSocketServerConfig(
  customConfig?: Record<string, string | number>,
): Record<string, string | number> {
  const defaults: Record<string, string | number> = {
    host: '127.0.0.1',
    port: 1,
  };
  const config: Record<string, string | number> = {...customConfig};
  if (config.host == null) config.host = defaults.host;
  if (config.port == null) config.port = defaults.port;
  if (config.cleanupEmptyChildNamespaces == null)
    config.port = defaults.cleanupEmptyChildNamespaces;
  return config;
}

function createWebSocketClient(
  app: RestApplicationLike & {wsServer: {httpServer: HttpServer}},
  websocketNamespace?: string,
): Socket {
  const url = `${app.wsServer.httpServer.url}${websocketNamespace}`;
  return io(url, {path: '/socket.io'}); // Adjust options as needed
}

export async function setupApplication(
  websocketNamespace?: string,
): Promise<AppWithClientAndSocket> {
  const restConfig = givenHttpServerConfig({});
  const websocketConfig = givenWebSocketServerConfig({});

  const app = new MainApplication({
    rest: restConfig,
    websocket: websocketConfig,
  });

  await app.boot();
  await app.migrateSchema();
  await app.start();

  const client = createRestAppClient(app);
  const socketClient = createWebSocketClient(app, websocketNamespace);
  return {app, client, socketClient};
}

export interface AppWithClient {
  app: MainApplication;
  client: Client;
}
