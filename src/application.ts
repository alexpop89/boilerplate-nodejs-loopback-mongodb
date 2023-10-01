import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {TokenService, UserService} from './services';
import {JWTAuthenticationStrategy} from './strategies';
import {TokenServiceBindings, UserServiceBindings} from './keys';
import {AuthorizationComponent} from '@loopback/authorization';

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

    // Set up authentication
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);
    this.bind(UserServiceBindings.USER_SERVICE).toClass(UserService);
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(TokenService);
    this.bind('authentication.jwt.secret').to(process.env.JWT_SECRET_KEY ?? 'Mdc6PVaq-q*sxFnFjvA@LhAs');
    this.bind('authentication.jwt.expiresIn').to(process.env.JWT_EXPIRATION_SECONDS ?? '600');
  }
}
