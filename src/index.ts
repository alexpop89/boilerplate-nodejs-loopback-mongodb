import 'dotenv/config';

import {ApplicationConfig, MainApplication} from './application';

export * from './application';

const ALLOWED_ORIGINS = process.env.CORS_ORIGIN ?? '*';

export async function main(options: ApplicationConfig = {}) {
  const app = new MainApplication(options);
  await app.boot();
  await app.migrateSchema();
  await app.start();

  const url = app.restServer.url ?? '';
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    expressSettings: {
      'x-powered-by': false,
      env: process.env.STAGE !== 'local' ? 'production' : 'development',
    },
    rest: {
      port: process.env.PORT ?? 3000,
      host: process.env.HOST,
      cors: {
        //https://loopback.io/doc/en/lb4/Customizing-server-configuration.html
        //https://github.com/expressjs/cors#configuration-options.
        origin: ALLOWED_ORIGINS?.includes(',')
          ? ALLOWED_ORIGINS?.replace(/ /gi, '').split(',')
          : ALLOWED_ORIGINS,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        maxAge: 86400,
        credentials: true,
      },
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
      apiExplorer: {
        disabled: process.env.STAGE === 'production',
      },
    },
    websocket: {
      port: process.env.WEBSOCKET_PORT ?? 3001,
      cleanupEmptyChildNamespaces: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: false,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}

process.once('SIGUSR2', function () {
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', function () {
  // this is only called on ctrl+c, not restart
  process.kill(process.pid, 'SIGINT');
});
