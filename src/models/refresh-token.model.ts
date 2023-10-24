import {model, property, belongsTo} from '@loopback/repository';
import {Timestampable} from '.';
import {User} from './user.model';

@model()
export class RefreshToken extends Timestampable {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  _id?: string;

  @property({
    type: 'string',
    required: true,
  })
  value: string;

  @property({
    type: 'date',
  })
  expires?: Date;

  @belongsTo(() => User, {name: 'user'})
  userId: string;

  user: User;

  constructor(data?: Partial<RefreshToken>) {
    super(data);
  }
}

export interface RefreshTokenRelations {
  // describe navigational properties here
}

export type RefreshTokenWithRelations = RefreshToken & RefreshTokenRelations;
