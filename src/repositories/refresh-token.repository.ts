import {inject, Getter} from '@loopback/core';
import {DefaultDataSource} from '../datasources';
import {RefreshToken, RefreshTokenRelations, User} from '../models';
import {CustomCrudRepository} from './__custom-crud.repository.base';
import {repository, BelongsToAccessor} from '@loopback/repository';
import {UserRepository} from './user.repository';
import {DataObject, Options} from '@loopback/repository/src/common-types';
import addDays from 'date-fns/addDays';

export class RefreshTokenRepository extends CustomCrudRepository<
  RefreshToken,
  typeof RefreshToken.prototype._id,
  RefreshTokenRelations
> {
  public readonly user: BelongsToAccessor<
    User,
    typeof RefreshToken.prototype._id
  >;

  constructor(
    @inject('datasources.default') dataSource: DefaultDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
    @inject('authentication.refreshToken.expirationDays')
    private refreshTokenExpirationDays: number,
  ) {
    super(RefreshToken, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  async create(
    entity: DataObject<RefreshToken>,
    options?: Options,
  ): Promise<RefreshToken> {
    entity.expires =
      entity.expires ?? addDays(new Date(), this.refreshTokenExpirationDays);
    return super.create(entity, options);
  }
}
