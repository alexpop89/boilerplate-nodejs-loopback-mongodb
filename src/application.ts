/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as winston from 'winston';

import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, asGlobalInterceptor, extensionFor} from '@loopback/core';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {
  AUTHENTICATION_METADATA_KEY,
  AuthenticationComponent,
  registerAuthenticationStrategy,
} from '@loopback/authentication';
import {TokenService, UserService} from './services';
import {JWTAuthenticationStrategy} from './strategies';
import {TokenServiceBindings, UserServiceBindings} from './keys';
import {AuthorizationComponent} from '@loopback/authorization';
import {JWTAuthenticationComponent} from '@loopback/authentication-jwt';
import {AuthorizationInterceptorProvider} from './interceptors/authorization.interceptor';
import {
  LoggingBindings,
  LoggingComponent,
  WINSTON_FORMAT,
  WINSTON_TRANSPORT,
  WinstonTransports,
} from '@loopback/logging';

export {ApplicationConfig};

export class MainApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    if (process.env.STAGE !== 'production') {
      this.configure(RestExplorerBindings.COMPONENT).to({
        path: '/explorer',
      });
      this.component(RestExplorerComponent);
    }

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Set up logging
    this.setupLogging()
    // Set up authentication
    this.setupAuthentication()
  }

  setupLogging() {
    // https://loopback.io/doc/en/lb4/Logging.html
    this.configure(LoggingBindings.COMPONENT).to({
      enableFluent: false, // set to true if using Fluentd
      enableHttpAccessLog: process.env.STAGE !== 'production' // enable HTTP access log
    });
    this.component(LoggingComponent);
    this.bind('logging.winston.transports.console').to(
      new WinstonTransports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        level: process.env.STAGE === 'production' ? 'info' : 'debug',
      }),
    ).apply(extensionFor(WINSTON_TRANSPORT));
    this.bind('logging.winston.formats.colorize').to(winston.format.colorize()).apply(extensionFor(WINSTON_FORMAT));
  }

  setupAuthentication() {
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);
    this.component(JWTAuthenticationComponent);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    this.bind(UserServiceBindings.USER_SERVICE).toClass(UserService);
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(TokenService);

    this.bind('authentication.jwt.secret').to(
      process.env.JWT_SECRET_KEY ?? 'Mdc6PVaq-q*sxFnFjvA@LhAs',
    );
    this.bind('authentication.jwt.expiresIn').to(
      process.env.JWT_EXPIRATION_SECONDS ?? '600',
    );
    this.bind('authentication.refreshToken.expirationDays').to(
      parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS ?? '7', 10),
    );

    this.bind('metadata.AUTHENTICATION_METADATA_KEY').to(
      AUTHENTICATION_METADATA_KEY,
    );
    this.bind('interceptors.AuthorizationInterceptor')
      .toProvider(AuthorizationInterceptorProvider)
      .apply(asGlobalInterceptor());
  }
}