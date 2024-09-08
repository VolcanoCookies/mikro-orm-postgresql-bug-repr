import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin',
    dbName: 'testing',
    entities: [User],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });

  await orm.schema.refreshDatabase();
  await orm.em.execute(`DELETE FROM "user"`);
});

afterAll(async () => {
  await orm.close(true);
});


test('Failing multi-statement sql - "all"', async () => {
  const sql = `
    INSERT INTO "user" ("name", "email") VALUES ('All', 'all');
    SELECT * from "user";
  `;

  const res = await orm.em.execute(sql, [], 'all');
  expect(res).toBeDefined();
});

test('Failing multi-statement sql - "get"', async () => {
  const sql = `
    INSERT INTO "user" ("name", "email") VALUES ('Get', 'get');
    SELECT * from "user";
  `;

  // DriverException
  const res = await orm.em.execute(sql, [], 'get');
  expect(res).toBeDefined();
});

test('Failing multi-statement sql - "run"', async () => {
  const sql = `
    INSERT INTO "user" ("name", "email") VALUES ('Run', 'run');
    SELECT * from "user";
  `;

  // DriverException
  const res = await orm.em.execute(sql, [], 'run');
  expect(res).toBeDefined();
});

test('Working with raw knex', async () => {
  const sql = `
    INSERT INTO "user" ("name", "email") VALUES ('Knex', 'knex');
    SELECT * from "user";
  `;

  const knex = orm.em.getKnex();
  const query = knex.raw(sql);
  const res = await query;
  expect(res).toBeDefined();
  expect(res).toHaveLength(2);
})