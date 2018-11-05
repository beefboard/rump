# Build the typescript
FROM node:10 as build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm install

# Copy everything in, 
# excludes everything in dockerignore
COPY . .

# Build the server
RUN npm run build

# Copy build into production environemnt
FROM node:10
WORKDIR /beefboard-api

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm install

COPY --from=build /build/build build

ENTRYPOINT [ "node", "/beefboard-api/build/server.js" ]
