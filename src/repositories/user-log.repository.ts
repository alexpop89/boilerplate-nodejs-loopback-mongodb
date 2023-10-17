import {inject, Getter} from '@loopback/core';
import {repository, BelongsToAccessor} from '@loopback/repository';
import {DefaultDataSource} from '../datasources';
import {UserLog, UserLogRelations, User} from '../models';
import {UserRepository} from './user.repository';
import {CustomCrudRepository} from './__custom-crud.repository.base';

export class UserLogRepository extends CustomCrudRepository<
  UserLog,
  typeof UserLog.prototype._id,
  UserLogRelations
> {
  public readonly user: BelongsToAccessor<User, typeof UserLog.prototype._id>;

  constructor(
    @inject('datasources.default') dataSource: DefaultDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(UserLog, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
