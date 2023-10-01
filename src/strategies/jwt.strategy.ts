import {inject} from '@loopback/context';
import {HttpErrors, Request} from '@loopback/rest';
import {AuthenticationStrategy} from '@loopback/authentication';
import {TokenService} from '../services';
import {UserProfile} from '../interfaces';
import {TokenServiceBindings} from '../keys';

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
  ) {}

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token: string = this.extractCredentials(request);
    const userProfile = await this.tokenService.verifyToken(token);

    if (!userProfile) {
      throw new HttpErrors.Unauthorized(`Error verifying token'`);
    }

    return userProfile;
  }

  extractCredentials(request: Request): string {
    const authHeaderValue = request.headers.authorization;

    // Check if the header value exists
    if (!authHeaderValue) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    // Split the header value by space
    const [type, token] = authHeaderValue.split(' ');

    // Check if the header's type is 'Bearer'
    if (type !== 'Bearer') {
      throw new HttpErrors.Unauthorized(`Authorization header is not of type 'Bearer'.`);
    }

    // Check if the token exists after the 'Bearer'
    if (!token) {
      throw new HttpErrors.Unauthorized(`Token not found in Authorization header.`);
    }

    return token;
  }
}