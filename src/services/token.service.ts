import {TokenService as LoopbackTokenService} from '@loopback/authentication';
import {BindingScope, injectable} from '@loopback/core';
import {UserProfile} from '../interfaces';
import {inject} from '@loopback/context';
import {HttpErrors} from '@loopback/rest';
import * as jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid';

@injectable({scope: BindingScope.TRANSIENT})
export class TokenService implements LoopbackTokenService {
  constructor(
    @inject('authentication.jwt.secret')
    private jwtSecret: string,
    @inject('authentication.jwt.expiresIn')
    private jwtExpiresIn: string,
  ) {}

  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token: 'token' is null`,
      );
    }

    try {
      const decryptedToken = jwt.verify(token, this.jwtSecret);
      return decryptedToken as UserProfile;
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token: ${error.message}`,
      );
    }
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        `Error generating token: 'userProfile' is null`,
      );
    }

    // Generate a JSON Web Token
    return jwt.sign(userProfile, this.jwtSecret, {
      expiresIn: Number(this.jwtExpiresIn),
    });
  }

  generateUniqueToken(): string {
    return uuidv4();
  }
}
