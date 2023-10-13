import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const connectionURL = process.env.DATABASE_URL ??
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?retryWrites=true&w=majority&authSource=admin`;

const config = {
  name: 'default',
  connector: 'mongodb',
  url: connectionURL,
  useNewUrlParser: true,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class DefaultDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'default';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.default', {optional: true})
      dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
