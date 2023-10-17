import {Filter, repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {UserLog} from '../models';
import {UserRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {implementsAuthorization} from '../decorators/implements-authorization.decorator';

@implementsAuthorization()
export class UserUserLogController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
  ) {}

  @authenticate('jwt')
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
}
