# Check out https://hub.docker.com/_/node to select a new base image
FROM docker.io/library/node:18-slim
RUN npm install nodemon -g

# Create app directory (with user `node`)
RUN mkdir -p /home/node/app

WORKDIR /home/node/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node package*.json ./
RUN yarn install

# Bundle app source code
COPY --chown=node . .

RUN yarn run build

EXPOSE ${PORT}
