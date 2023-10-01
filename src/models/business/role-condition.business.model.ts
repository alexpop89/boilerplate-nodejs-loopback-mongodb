import {Model, model, property} from '@loopback/repository';

@model()
export class RoleCondition extends Model {
  static get schema() {
    return {
      type: 'object',
      properties: {
        // ... define your properties with types, requirements, etc ...
      }
    };
  }

  @property({
    type: 'string',
    required: true,
  })
  modelName: string;

  @property({
    type: 'string',
    required: true,
  })
  ownershipField: string;

  @property({
    type: 'string',
    required: true,
    default: '$currentUserId'
  })
  value?: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
    jsonSchema: {
      items: {
        enum: ['read', 'write', 'update', 'delete', '*'], // Restrict to these permissions
      },
    },
  })
  permissions: string[];


  constructor(data?: Partial<RoleCondition>) {
    super(data);
  }
}

export interface RoleConditionRelations {
  // describe navigational properties here
}

export type RoleConditionWithRelations = RoleCondition & RoleConditionRelations;
