import {Client, expect, sinon} from '@loopback/testlab';
import {MainApplication} from '../..';
import {setupApplication} from './test-helper';

const mockUser = {
  email: `mock+${new Date().getTime()}@email.com`,
  password: 'P@ssw0rd22!!11',
  firstName: 'Foo',
  lastName: 'Bar',
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('UserController', () => {
  let app: MainApplication;
  let client: Client;
  let createdUserId: string | number;
  let token: string = '';
  let refreshToken: string = '';

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
    expect(response.body).to.have.property('refreshToken');
    token = response.body.token;
    refreshToken = response.body.refreshToken;
  });

  it('will receive the correct status code (401) for invalid credentials', async () => {
    await client
      .post('/login')
      .send({
        email: 'some_email@test.com',
        password: 'super-duper-dumm!-P4ssword',
      })
      .expect(401);

    await client
      .post('/login')
      .send({
        email: mockUser.email,
        password: 'super-duper-dumm!-P4ssword',
      })
      .expect(401);

    await client
      .post('/login')
      .send({
        email: 'some_email@test.com',
        password: mockUser.password,
      })
      .expect(401);
  });

  it('can generate a refresh token in UUID format', async () => {
    const response = await client
      .post('/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200);
    refreshToken = response.body.refreshToken;
    expect(refreshToken).to.match(uuidRegex);
  });

  it('can call /me if logged in', async () => {
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

  it('can request a refresh token if logged in', async () => {
    await client
      .post('/refresh-token')
      .send({refreshToken: refreshToken})
      .expect(401);

    const response = await client
      .post('/refresh-token')
      .send({refreshToken: refreshToken})
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).to.have.property('token');
  });

  it('can query their own user if logged in', async () => {
    await client
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('can query their own roles if logged in', async () => {
    await client
      .get(`/users/${createdUserId}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('can update their own values if logged in', async () => {
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

  it('can logout', async () => {
    await client
      .post('/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('cannot use an old refresh token after logout, will get HTTP STATUS 401', async () => {
    const response = await client
      .post('/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200);
    token = response.body.token;

    await client
      .post('/refresh-token')
      .send({refreshToken: refreshToken})
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('cannot use refresh token after more than 7 days, will get HTTP STATUS 401', async () => {
    const clock = sinon.useFakeTimers({
      now: new Date().getTime(),
      shouldClearNativeTimers: true,
    });

    const response = await client
      .post('/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(200);
    token = response.body.token;
    refreshToken = response.body.refreshToken;

    clock.tick(7 * 24 * 60 * 60 * 1000); // Simulate 7 days
    clock.tick(1000); // ... and 1 more second

    await client
      .post('/refresh-token')
      .send({refreshToken: refreshToken})
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    clock.restore();
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
