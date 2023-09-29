import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  User,
  UserLog,
} from '../models';
import {UserRepository} from '../repositories';

export class UserUserLogController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
  ) { }

  @get('/users/{id}/user-logs', {
    responses: {
      '200': {
        description: 'Array of User has many UserLog',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(UserLog)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<UserLog>,
  ): Promise<UserLog[]> {
    return this.userRepository.userLogs(id).find(filter);
  }

  @post('/users/{id}/user-logs', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(UserLog)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof User.prototype._id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserLog, {
            title: 'NewUserLogInUser',
            exclude: ['_id', '_createdAt', '_updatedAt'],
            optional: ['userId']
          }),
        },
      },
    }) userLog: Omit<UserLog, '_id'>,
  ): Promise<UserLog> {
    return this.userRepository.userLogs(id).create(userLog);
  }

  @patch('/users/{id}/user-logs', {
    responses: {
      '200': {
        description: 'User.UserLog PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserLog, {partial: true}),
        },
      },
    })
    userLog: Partial<UserLog>,
    @param.query.object('where', getWhereSchemaFor(UserLog)) where?: Where<UserLog>,
  ): Promise<Count> {
    return this.userRepository.userLogs(id).patch(userLog, where);
  }

  @del('/users/{id}/user-logs', {
    responses: {
      '200': {
        description: 'User.UserLog DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(UserLog)) where?: Where<UserLog>,
  ): Promise<Count> {
    return this.userRepository.userLogs(id).delete(where);
  }
}
