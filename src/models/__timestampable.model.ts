import {Entity, model, property} from '@loopback/repository';

@model()
export class Timestampable extends Entity {
  @property({
    type: 'date',
    default: '$now',
  })
  _createdAt?: string;

  @property({
    type: 'date',
    default: '$now',
  })
  _updatedAt?: string;

  constructor(data?: Partial<Timestampable>) {
    super(data);
  }
}

export interface TimestampableRelations {
  // describe navigational properties here
}

export type TimestampableWithRelations = Timestampable & TimestampableRelations;
