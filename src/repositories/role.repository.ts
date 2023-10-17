import {inject} from '@loopback/core';
import {DefaultDataSource} from '../datasources';
import {Role, RoleRelations} from '../models';
import {CustomCrudRepository} from './__custom-crud.repository.base';

export class RoleRepository extends CustomCrudRepository<
  Role,
  typeof Role.prototype._id,
  RoleRelations
> {
  constructor(@inject('datasources.default') dataSource: DefaultDataSource) {
    super(Role, dataSource);
  }
}
