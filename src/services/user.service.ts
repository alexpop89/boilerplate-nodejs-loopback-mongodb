import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Role, User} from '../models';
import {Credentials, UserProfile} from '../interfaces';
import {securityId} from '@loopback/security';
import {inject} from '@loopback/context';
import {RefreshTokenRepository, UserRepository} from '../repositories';
import * as bcrypt from 'bcryptjs';
import {HttpErrors} from '@loopback/rest';
import {TokenServiceBindings} from '../keys';
import {TokenService} from './token.service';

@injectable({scope: BindingScope.TRANSIENT})
export class UserService {
  constructor(
    @inject('repositories.UserRepository')
    public userRepository: UserRepository,
    @inject('repositories.RefreshTokenRepository')
    public refreshTokenRepository: RefreshTokenRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
  ) {}

  convertToUserProfile(user: User): UserProfile {
    return {
      [securityId]: user._id!,
      _id: user._id!,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
    };
  }

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const invalidCredentialsError = 'Invalid email or password.';

    // Fetch user by email from database
    const foundUser = await this.userRepository.findOne({
      where: {email: credentials.email},
    });

    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    // Compare provided password with stored password
    const passwordMatched = await bcrypt.compare(
      credentials.password,
      foundUser.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

  async createUser(user: User, roles?: Role[]): Promise<User> {
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
    const createdUser = await this.userRepository.create(user);

    if (roles) {
      for (const role of roles) {
        await this.userRepository.roles(createdUser._id).create(role);
      }
    }

    return createdUser;
  }

  async generateAccessToken(userProfile: UserProfile): Promise<string> {
    return this.tokenService.generateToken(userProfile);
  }

  async regenerateAccessTokenFromRefreshTokenForUser(
    refreshToken: string,
    userId: string,
  ): Promise<string> {
    const token = await this.refreshTokenRepository.findOne({
      where: {
        value: refreshToken,
        expires: {gt: new Date()}, // Check if expiration is in the future
      },
      include: [{relation: 'user'}],
    });

    if (!token || token.user._id !== userId) {
      throw new HttpErrors.Unauthorized('Invalid or expired refresh token');
    }

    const userProfile = this.convertToUserProfile(token.user);
    return this.generateAccessToken(userProfile);
  }

  async generateRefreshTokenForUser(user: User): Promise<string> {
    const token = await this.refreshTokenRepository.create({
      value: this.tokenService.generateUniqueToken(),
      userId: user._id,
    });

    return token.value;
  }

  async invalidateAllRefreshTokensForUser(user: User): Promise<void> {
    await this.refreshTokenRepository.deleteAll({userId: user._id});
  }
}
