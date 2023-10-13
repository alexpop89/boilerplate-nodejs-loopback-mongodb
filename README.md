# boilerplate-nodejs-loopback

This application is generated using [LoopBack 4 CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html) with the
[initial project layout](https://loopback.io/doc/en/lb4/Loopback-application-layout.html).

## Start Docker Services
```sh 
docker-compose up
```


## Or without docker...

## Install dependencies

By default, dependencies were installed when this application was generated.
Whenever dependencies in `package.json` are changed, run the following command:

```sh
yarn install
```

## Run the application

```sh
yarn start
```

You can also run `node .` to skip the build step.

Open http://127.0.0.1:3000 in your browser.

## Rebuild the project

To incrementally build the project:

```sh
yarn run build
```

To force a full build by cleaning up cached artifacts:

```sh
yarn run rebuild
```

## Fix code style and formatting issues

```sh
yarn run lint
```

To automatically fix such issues:

```sh
yarn run lint:fix
```

## Other useful commands

- `yarn run migrate`: Migrate database schemas for models
- `yarn run openapi-spec`: Generate OpenAPI spec into a file
- `yarn run docker:build`: Build a Docker image for this application
- `yarn run docker:run`: Run this application inside a Docker container

## Tests

```sh
yarn test
```

## What's next

Please check out [LoopBack 4 documentation](https://loopback.io/doc/en/lb4/) to
understand how you can continue to add features to this application.

[![LoopBack](https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

# LoopBack 4 Essential CLI Commands

## Table of Contents
1. [Model](#model)
2. [Controller](#controller)
3. [Service](#service)
4. [DataSource](#datasource)
5. [Repository](#repository)
6. [Relation](#relation)

---

<a name="model"></a>
## Model

- **Command**:
  ```bash
  lb4 model
  ```

- **Explanation**:  
  Generates a new model in the `src/models/` directory.

- **Example**:
  ```bash
  lb4 model MyModel
  ```

---

<a name="controller"></a>
## Controller

- **Command**:
  ```bash
  lb4 controller
  ```

- **Explanation**:  
  Creates a new controller in the `src/controllers/` directory.

- **Example**:
  ```bash
  lb4 controller MyController
  ```

---

<a name="service"></a>
## Service

- **Command**:
  ```bash
  lb4 service
  ```

- **Explanation**:  
  Generates a new service in the `src/services/` directory.

- **Example**:
  ```bash
  lb4 service MyService
  ```

---

<a name="datasource"></a>
## DataSource

- **Command**:
  ```bash
  lb4 datasource
  ```

- **Explanation**:  
  Creates a new DataSource configuration in the `src/datasources/` directory.

- **Example**:
  ```bash
  lb4 datasource MyDataSource
  ```

---

<a name="repository"></a>
## Repository

- **Command**:
  ```bash
  lb4 repository
  ```

- **Explanation**:  
  Creates a new repository in the `src/repositories/` directory.

- **Example**:
  ```bash
  lb4 repository MyRepository
  ```

---

<a name="relation"></a>
## Relation

- **Command**:
  ```bash
  lb4 relation
  ```

- **Explanation**:  
  Sets up a new relation between existing models.

- **Example**:
  ```bash
  lb4 relation
  ```
  This will guide you through a series of questions to establish a new relation.

---
