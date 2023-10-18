import {Client, expect} from '@loopback/testlab';
import {MainApplication} from '../..';
import {setupApplication} from './test-helper';

const mockUser = {
  email: `mock+${new Date().getTime()}@email.com`,
  password: 'P@ssw0rd22!!11',
  firstName: 'Foo',
  lastName: 'Bar',
};

let createdUserId: string | number;
let token: string = '';

describe('UserController', () => {
  let app: MainApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('can sign-up as user', async () => {
    const response = await client.post('/sign-up').send(mockUser).expect(200);
    expect(response.body).to.have.property('email', mockUser.email);
    expect(response.body).to.have.property('firstName', mockUser.firstName);
    expect(response.body).to.have.property('lastName', mockUser.lastName);
    expect(response.body).to.have.property('_id');
    createdUserId = response.body._id;
  });

  it('can login as user', async () => {
    const response = await client
      .post('/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200);
    expect(response.body).to.have.property('token');
    token = response.body.token;
  });

  it('can call /me', async () => {
    const response = await client
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body).to.have.property('firstName', mockUser.firstName);
    expect(response.body).to.have.property('lastName', mockUser.lastName);
    expect(response.body).to.have.property('email', mockUser.email);
    expect(response.body).to.have.property('iat');
    expect(response.body).to.have.property('exp');
  });

  it('can query their own user', async () => {
    await client
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('can query their own roles', async () => {
    await client
      .get(`/users/${createdUserId}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('can update their own values', async () => {
    await client
      .patch(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Foo2',
        lastName: 'Bar2',
      })
      .expect(204);

    const response = await client
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body).to.have.property('firstName', 'Foo2');
    expect(response.body).to.have.property('lastName', 'Bar2');
  });

  it('cannot signup again with same email address, will get HTTP STATUS 400', async () => {
    await client.post('/sign-up').send(mockUser).expect(400);
  });

  it('cannot query their own user if not logged in, will get HTTP STATUS 403', async () => {
    const response = await client
      .post('/sign-up')
      .send({
        ...mockUser,
        email: `anotherEmailAddress+${new Date().getTime()}@email.com`,
      })
      .expect(200);
    expect(response.body).to.have.property('firstName', mockUser.firstName);
    expect(response.body).to.have.property('lastName', mockUser.lastName);
    expect(response.body).to.have.property('_id');

    const newUserId = response.body._id;
    await client
      .get(`/users/${newUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('cannot update other users` values, will get HTTP STATUS 403', async () => {
    const responseSignUp = await client
      .post('/sign-up')
      .send({
        ...mockUser,
        email: `anotherEmailAddress+${new Date().getTime()}@email.com`,
      })
      .expect(200);

    await client
      .patch(`/users/${responseSignUp.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Foooooo',
        lastName: 'Barrrrrr',
      })
      .expect(403);
  });
});
