import {model, property} from '@loopback/repository';
import {Timestampable} from '.';
import {RoleCondition} from './business/role-condition.business.model';

@model()
export class Role extends Timestampable {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  _id?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: ['admin', 'user'], // Only allow 'admin' or 'user'
    },
  })
  name: string;

  @property({
    type: 'array',
    itemType: RoleCondition,
    required: true,
    jsonSchema: {
      type: 'array',
      items: RoleCondition.definition.properties,
    },
  })
  conditions: RoleCondition[];

  @property({
    type: 'string',
  })
  userId?: string;

  constructor(data?: Partial<Role>) {
    super(data);
  }
}

export interface RoleRelations {
  // describe navigational properties here
}

export type RoleWithRelations = Role & RoleRelations;

export const defaultUserRole = {
  name: 'user',
  conditions: [
    new RoleCondition({
      modelName: 'User',
      ownershipField: '_id',
      value: '$currentUserId',
      permissions: ['read', 'write', 'update'],
    }),
    new RoleCondition({
      modelName: 'Role',
      ownershipField: 'userId',
      value: '$currentUserId',
      permissions: ['read'],
    }),
  ],
};

export const defaultSuperAdminRole = {
  name: 'super admin',
  conditions: [
    new RoleCondition({
      modelName: '*',
      ownershipField: '*',
      value: '*',
      permissions: ['*'],
    }),
  ],
};
