# Rump

Beefboard's backend api gateway and auth service

## About
Sitting at the front of beefboard's backend API, rump is used as a gateway
and authentication service. This service can identifiy users based on the given
`x-access-token` provided in the request header in order to figure out their
permissions.

As a gateway, it allows users to make specific requests to backend api services
for example, the posts service without authentication. However if the user then
wishes to make a post, rump will block the request citing invalid permissions.

When a user makes a post, rump makes the required requests to the correct services
with the information. For example, it will tell the posts-api 
([beefstore](https://gitlab.com/beefboard/beefstore)) who made the post, and will 
send all image attachments to the post to the image store 
([snapstock](https://gitlab.com/beefboard/snapstock)).

Rump also allows for querying of information in its auth database, which allows
frontend applications to display information about users when requested.


## Development
Development of rump is to be completed in typescript. The project
is written for `node 10.x.x`

It is recommeded to install `nvm` on your system, so that this project
will automattically use the node version required

### Dependencies

`npm install` to install dependencies

### Linting

Airbnb tslinting style is applied to snapstock, and is enforced via
githooks. Builds will not succeed unless linting rules are conformed to.

### Testing

Tests are written in jest, and require 100% coverage
in order for build to succeed.

`npm test` to run tests

### Running

Running in developer mode is as simple as `npm start`.

This starts `ts-node`, which compiles typescript to javascript on
the fly for node.

### Building

Building can be completed with `npm run build`

### Deploying

Deployment is automatic with `gitlab-ci`. Pushing to `master` or `development`
will automatically run tests, build the project and push to the docker repo
