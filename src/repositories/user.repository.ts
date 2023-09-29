import {inject, Getter} from '@loopback/core';
import {repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DefaultDataSource} from '../datasources';
import {User, UserRelations, UserLog} from '../models';
import {UserLogRepository} from './user-log.repository';
import {CustomCrudRepository} from './__custom-crud.repository';

export class UserRepository extends CustomCrudRepository<
  User,
  typeof User.prototype._id,
  UserRelations
> {

  public readonly userLogs: HasManyRepositoryFactory<UserLog, typeof User.prototype._id>;

  constructor(
    @inject('datasources.default') dataSource: DefaultDataSource, @repository.getter('UserLogRepository') protected userLogRepositoryGetter: Getter<UserLogRepository>,
  ) {
    super(User, dataSource);
    this.userLogs = this.createHasManyRepositoryFactoryFor('userLogs', userLogRepositoryGetter,);
    this.registerInclusionResolver('userLogs', this.userLogs.inclusionResolver);
  }
}
