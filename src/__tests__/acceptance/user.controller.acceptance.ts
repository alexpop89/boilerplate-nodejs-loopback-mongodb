import {Client, expect} from '@loopback/testlab';
import {MainApplication} from '../..';
import {setupApplication} from './test-helper';

const mockUser = {
  email: `mock+${new Date().getTime()}@email.com`,
  password: 'P@ssw0rd22!!11',
  firstName: 'Foo',
  lastName: 'Bar',
};

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

  it('cannot signup again with same email address', async () => {
    await client.post('/sign-up').send(mockUser).expect(400);
  });
});
