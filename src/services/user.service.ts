import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {User} from '../models';
import {Credentials, UserProfile} from '../interfaces';
import {securityId} from '@loopback/security';
import {inject} from '@loopback/context';
import {UserRepository} from '../repositories';
import * as bcrypt from 'bcryptjs';
import {HttpErrors} from '@loopback/rest';

@injectable({scope: BindingScope.TRANSIENT})
export class UserService {
  constructor(
    @inject('repositories.UserRepository')
    public userRepository: UserRepository) {
  }

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
    const foundUser = await this.userRepository.findOne({where: {email: credentials.email}});

    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    // Compare provided password with stored password
    const passwordMatched = await bcrypt.compare(credentials.password, foundUser.password);

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

  async createUser(user: User): Promise<User> {
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
    return this.userRepository.create(user);
  }
}
