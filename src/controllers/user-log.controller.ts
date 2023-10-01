import {
  Count,
  CountSchema,
  repository,
  Where,
} from '@loopback/repository';
import {
  param,
  get,
  response,
} from '@loopback/rest';
import {UserLog} from '../models';
import {UserLogRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';

export class UserLogController {
  constructor(
    @repository(UserLogRepository)
    public userLogRepository : UserLogRepository,
  ) {}

  @authenticate('jwt')
  @get('/user-logs/count')
  @response(200, {
    description: 'UserLog model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(UserLog) where?: Where<UserLog>,
  ): Promise<Count> {
    return this.userLogRepository.count(where);
  }
}
