# WangiLoka

A website about parfume finder with the goals help user explore the wonderful world of indonesia parfumes also helps parfum brands make pressence to user who need parfumes.

# Project Setup

This project is built using [Express.js](https://expressjs.com/) a fast, unopinionated, and minimalist web framework for [Node.js](https://nodejs.org/en).

## Setup

### Dependencies

Use [yarn](https://yarnpkg.com/) to improve productivity and replace npm, so make
sure [yarn is installed](https://yarnpkg.com/getting-started/install):

```sh
corepack enable
```

To run the app locally, make sure the project's local dependencies are
installed:

```sh
yarn install
```

### Environment Variables

Create the `.env` file from `.env.example`.

```sh
cp -i .env.example .env
```

All env values are required, so make sure to get it from the authorised party. Without it, it will not be possible to run the project.

### Development

Before you can run the development script you will have to install [nodemon](https://www.npmjs.com/package/nodemon) and [concurrently](https://www.npmjs.com/package/concurrently). **Nodemon** will help us to auto restart if some changes is made in the codebase while **concurrently** is a automation tool that helps us to run multiple scripts at the same time.

```sh
yarn global add nodemon concurrently
```

Finally, develop the app while running the development server:

```sh
yarn dev
```

Wait for it to stop compiling the codebase, you can watch the log in the terminal, then it's ready!

### Creating production build

To ensure your application is ready for production, you need to change the env to the production env. The output will be placed in the **dist** directory located in the root of the project.

To create the production build, run:

```sh
yarn build
```

After building the project, you can start it using the following command:

```sh
yarn start
```
