import {inject, Getter} from '@loopback/core';
import {
  repository,
  HasManyRepositoryFactory,
  HasOneRepositoryFactory,
} from '@loopback/repository';
import {DefaultDataSource} from '../datasources';
import {User, UserRelations, UserLog, Role, RefreshToken} from '../models';
import {UserLogRepository} from './user-log.repository';
import {RoleRepository} from './role.repository';
import {CustomCrudRepository} from './__custom-crud.repository.base';
import {RefreshTokenRepository} from './refresh-token.repository';

export class UserRepository extends CustomCrudRepository<
  User,
  typeof User.prototype._id,
  UserRelations
> {
  public readonly userLogs: HasManyRepositoryFactory<
    UserLog,
    typeof User.prototype._id
  >;

  public readonly roles: HasManyRepositoryFactory<
    Role,
    typeof User.prototype._id
  >;

  public readonly refreshToken: HasOneRepositoryFactory<
    RefreshToken,
    typeof User.prototype._id
  >;

  constructor(
    @inject('datasources.default') dataSource: DefaultDataSource,
    @repository.getter('UserLogRepository')
    protected userLogRepositoryGetter: Getter<UserLogRepository>,
    @repository.getter('RoleRepository')
    protected roleRepositoryGetter: Getter<RoleRepository>,
    @repository.getter('RefreshTokenRepository')
    protected refreshTokenRepositoryGetter: Getter<RefreshTokenRepository>,
  ) {
    super(User, dataSource);
    this.refreshToken = this.createHasOneRepositoryFactoryFor(
      'refreshToken',
      refreshTokenRepositoryGetter,
    );
    this.registerInclusionResolver(
      'refreshToken',
      this.refreshToken.inclusionResolver,
    );
    this.roles = this.createHasManyRepositoryFactoryFor(
      'roles',
      roleRepositoryGetter,
    );
    this.registerInclusionResolver('roles', this.roles.inclusionResolver);
    this.userLogs = this.createHasManyRepositoryFactoryFor(
      'userLogs',
      userLogRepositoryGetter,
    );
    this.registerInclusionResolver('userLogs', this.userLogs.inclusionResolver);
  }
}
