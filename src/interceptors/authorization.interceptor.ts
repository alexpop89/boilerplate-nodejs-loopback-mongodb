import {
  Constructor,
  Context,
  CoreBindings,
  inject,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {Role} from '../models';
import {AUTHORIZATION_KEY} from '../decorators/implements-authorization.decorator';
import {UserProfile} from '../interfaces';
import {TokenService} from '../services';
import {TokenServiceBindings} from '../keys';
import {RoleRepository} from '../repositories';
import {repository} from '@loopback/repository';
import {OwnershipCheckerUtil} from './utils';

/**
 * Provides the authorization interceptor functionality by extending the `OwnershipCheckerUtil` class.
 * Implements the `Provider<Interceptor>` interface from Loopback.
 * @extends OwnershipCheckerUtil
 * @implements Provider<Interceptor>
 */
export class AuthorizationInterceptorProvider
  extends OwnershipCheckerUtil
  implements Provider<Interceptor>
{
  /**
   * Constructs an instance of the AuthorizationInterceptorProvider.
   * @param {TokenService} tokenService - The token service for verifying tokens.
   * @param {Constructor<{}>} _controllerClass - The controller class to intercept.
   * @param {string} _methodName - The method name to intercept within the controller.
   * @param {RoleRepository} roleRepository - Repository for fetching role information.
   * @param {Context} ctx - The Loopback application context.
   */
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
    @inject(CoreBindings.CONTROLLER_CLASS, {optional: false})
    protected _controllerClass: Constructor<{}>,
    @inject(CoreBindings.CONTROLLER_METHOD_NAME, {optional: false})
    protected _methodName: string,
    @repository(RoleRepository) public roleRepository: RoleRepository,
    @inject(CoreBindings.APPLICATION_INSTANCE) protected ctx: Context,
  ) {
    super(ctx);
  }

  /**
   * Value method required for Loopback's Provider interface.
   * @returns {Interceptor} - The bound intercept method.
   */
  value(): Interceptor {
    return this.intercept.bind(this);
  }

  /**
   * Main interceptor method.
   * @async
   * @param {InvocationContext} invocationCtx - The Loopback invocation context.
   * @param {() => ValueOrPromise<InvocationResult>} next - The next function in the interceptor chain.
   * @returns {Promise<InvocationResult>} - The result after executing the intercept logic.
   */
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<InvocationResult> {
    const usesAuthorization = Reflect.hasMetadata(
      AUTHORIZATION_KEY,
      this._controllerClass.prototype,
      this._methodName,
    );

    // Detect if method uses the @implementsAuthorization(() decorator or not
    if (!usesAuthorization) {
      return next();
    }

    // Inject the request object to get the user details
    // This part will depend on how you've implemented your authentication
    const request = this.getRequestObjectSomehow(invocationCtx);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const user = await this.getCurrentUser(request);
    const roles = (await this.getRolesForUser(user)) ?? [];
    const modelName = this.getModelName(this._controllerClass);
    const httpMethod = this.getHttpMethod(this._methodName);

    let allowed = false;
    for (const role of roles) {
      if (
        await this.isPermissionAllowed(
          role,
          modelName,
          httpMethod,
          user._id,
          this._methodName,
          invocationCtx,
        )
      ) {
        allowed = true;
      }
    }

    if (!allowed) {
      throw new HttpErrors.Forbidden('Invalid access permissions');
    }

    // Continue with the invocation
    return next();
  }

  /**
   * Retrieves the request object from the invocation context.
   * @param {InvocationContext} invocationCtx - The Loopback invocation context.
   * @returns {Request | undefined} - The request object.
   */
  private getRequestObjectSomehow(
    invocationCtx: InvocationContext,
  ): Request | undefined {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return invocationCtx.parent.request;
  }

  /**
   * Fetches and returns the current user.
   * @async
   * @param {Request} request - The incoming request object.
   * @returns {Promise<UserProfile>} - The profile of the current user.
   */
  private async getCurrentUser(request: Request): Promise<UserProfile> {
    const authHeaderValue = request.headers.authorization ?? '';
    const [, token] = authHeaderValue.split(' ');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.tokenService.verifyToken(token);
  }

  /**
   * Fetches the roles for a given user.
   * @async
   * @param {UserProfile} user - The user profile object.
   * @returns {Promise<Role[] | undefined>} - An array of roles or undefined.
   */
  private getRolesForUser(user: UserProfile): Promise<Role[] | undefined> {
    // Fetch the role based on the user, possibly from a database
    return this.roleRepository.find({where: {userId: user._id}});
  }

  /**
   * Retrieves the model name from a controller class.
   * @param {Function} controllerClass - The controller class.
   * @returns {string} - The model name.
   */
  private getModelName(controllerClass: Function): string {
    // Assume controller name is something like "MyModelController"
    const controllerName = controllerClass.name;
    return controllerName.replace('Controller', ''); // results in model name
  }

  /**
   * Maps controller method names to HTTP methods.
   * @param {string} methodName - The method name in the controller.
   * @returns {string} - The HTTP method.
   */
  private getHttpMethod(methodName: string): string {
    switch (methodName) {
      case 'create':
        return 'write';
      case 'find':
      case 'findById':
      case 'count':
        return 'read';
      case 'updateById':
      case 'replaceById':
        return 'update';
      case 'deleteById':
        return 'delete';
      default:
        return '*';
    }
  }

  /**
   * Checks if a given permission is allowed for a role, model, and method.
   * @async
   * @param {Role} role - The role object.
   * @param {string} modelName - The model name.
   * @param {string} httpMethod - The HTTP method.
   * @param {string} currentUserId - The current user's ID.
   * @param {string} methodName - The method name in the controller.
   * @param {InvocationContext} invocationContext - The Loopback invocation context.
   * @returns {Promise<boolean>} - True if permission is allowed, false otherwise.
   */
  protected async isPermissionAllowed(
    role: Role,
    modelName: string,
    httpMethod: string,
    currentUserId: string,
    methodName: string,
    invocationContext: InvocationContext,
  ): Promise<boolean> {
    let allowed = false;
    for (const condition of role.conditions) {
      if (
        (modelName.endsWith(condition.modelName) ||
          condition.modelName === '*') &&
        (condition.permissions.includes(httpMethod) ||
          condition.permissions.includes('*'))
      ) {
        allowed =
          allowed ||
          (await super.isPermissionAllowedByIdOwnership(
            role,
            modelName,
            httpMethod,
            currentUserId,
            methodName,
            invocationContext,
          ));
        allowed =
          allowed ||
          (await super.isPermissionAllowedByOtherOwnership(
            role,
            modelName,
            currentUserId,
            invocationContext,
          ));
      }
    }
    return allowed;
  }
}
