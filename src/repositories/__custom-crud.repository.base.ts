import {
  DefaultCrudRepository,
  juggler,
  Entity,
  EntityCrudRepository,
} from '@loopback/repository';

export class CustomCrudRepository<
    T extends Entity,
    ID,
    Relations extends object = {},
  >
  extends DefaultCrudRepository<T, ID, Relations>
  implements EntityCrudRepository<T, ID, Relations>
{
  constructor(
    entityClass: typeof Entity & {prototype: T},
    dataSource: juggler.DataSource,
  ) {
    super(entityClass, dataSource);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data._updatedAt = new Date();
    });
  }
}
