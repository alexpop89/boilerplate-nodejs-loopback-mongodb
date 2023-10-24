import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import {defaultUserRole, Role, User} from '../models';
import {UserRepository} from '../repositories';
import {inject} from '@loopback/context';
import {TokenService, UserService} from '../services';
import {TokenServiceBindings, UserServiceBindings} from '../keys';
import {Credentials, UserProfile} from '../interfaces';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings} from '@loopback/security';
import {implementsAuthorization} from '../decorators/implements-authorization.decorator';

export class UserController {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(UserServiceBindings.USER_SERVICE) public userService: UserService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
  ) {}

  @post('/sign-up')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['_id', '_createdAt', '_updatedAt'],
          }),
        },
      },
    })
    user: Omit<User, '_id'>,
  ): Promise<User> {
    try {
      const userRoles = [new Role(defaultUserRole)];
      return await this.userService.createUser(user, userRoles);
    } catch (error) {
      throw new HttpErrors.BadRequest();
    }
  }

  @post('/login')
  async login(
    @requestBody() credentials: Credentials,
  ): Promise<{token: string; refreshToken: string}> {
    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.userService.generateAccessToken(userProfile);
    const refreshToken =
      await this.userService.generateRefreshTokenForUser(user);
    return {token, refreshToken};
  }

  @authenticate('jwt')
  @post('/logout')
  async logout(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @inject(RestBindings.Http.RESPONSE) logoutResponse: Response,
  ): Promise<void> {
    const user = await this.userRepository.findById(currentUserProfile._id);
    await this.userService.invalidateAllRefreshTokensForUser(user);
    logoutResponse.status(204).send();
  }

  @authenticate('jwt')
  @post('/refresh-token', {
    responses: {
      '200': {
        description: 'Access Token Response', // A description for the response
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {type: 'string'}, // The response should contain a 'token' property of type string
              },
            },
          },
        },
      },
    },
  })
  async refreshToken(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              refreshToken: {type: 'string'},
            },
            required: ['refreshToken'],
          },
        },
      },
    })
    payload: {refreshToken: string},
  ): Promise<{token: string}> {
    if (!payload.refreshToken) {
      throw new HttpErrors.BadRequest('Refresh token is required');
    }

    const newAccessToken =
      await this.userService.regenerateAccessTokenFromRefreshTokenForUser(
        payload.refreshToken,
        currentUserProfile._id,
      );
    return {token: newAccessToken};
  }

  @authenticate('jwt')
  @get('/me', {
    responses: {
      '200': {
        description: 'Who am I',
        content: {
          'application/json': {},
        },
      },
    },
  })
  async me(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<UserProfile> {
    return currentUserProfile;
  }

  @authenticate({strategy: 'jwt'})
  @implementsAuthorization()
  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(User) where?: Where<User>): Promise<Count> {
    return this.userRepository.count(where);
  }

  @authenticate('jwt')
  @implementsAuthorization()
  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(User) filter?: Filter<User>): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @authenticate('jwt')
  @implementsAuthorization()
  @patch('/users')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.updateAll(user, where);
  }

  @authenticate('jwt')
  @implementsAuthorization()
  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>,
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @implementsAuthorization()
  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @authenticate('jwt')
  @implementsAuthorization()
  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @authenticate('jwt')
  @implementsAuthorization()
  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.userRepository.deleteById(id);
  }
}
