import {model, property, hasMany, hasOne} from '@loopback/repository';
import {UserLog} from './user-log.model';
import {Timestampable} from './__timestampable.model';
import {Role} from './role.model';
import {RefreshToken} from './refresh-token.model';

@model()
export class User extends Timestampable {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  _id?: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
    jsonSchema: {
      minLength: 5,
      maxLength: 255,
      format: 'email',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', // Regex for email validation
      transform: ['toLowerCase'],
    },
  })
  email: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 8, // At least 8 characters
      pattern:
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', // At least one uppercase, one lowercase, one number, and one special character
    },
  })
  password: string;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 2, // At least 2 characters
      maxLength: 50, // Up to 50 characters
    },
  })
  firstName?: string;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 2, // At least 2 characters
      maxLength: 50, // Up to 50 characters
    },
  })
  lastName?: string;

  @hasMany(() => UserLog)
  userLogs: UserLog[];

  @hasMany(() => Role)
  roles: Role[];

  @hasOne(() => RefreshToken)
  refreshToken: RefreshToken;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
