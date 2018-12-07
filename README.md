# Rump

Beefboard's backend api gateway and auth service

## Specifcation

>Build a local news site where users can log in an post local news and events (including photos). As the items are added an email is sent to the site admin to approve them. Once approved they are displayed in a chronological list for people to browse. Users can then rate the items/journalist. Admin can flag/pin posts to force them to be displayed in a prominent location.


- User login
- Make post including photos
- Posts require admin approval
- Posts displayed in chronological order
- Posts can be up/downvoted
- Admin can pin posts to top

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

Airbnb tslinting style is applied to rump, and is enforced via
git-hooks. Builds will not succeed unless linting rules are conformed to.

I decided to use `airbnb-config-tslint` rules after reading their justifications in
https://github.com/airbnb/javascript. I liked their stance on semi-colons, const/let, and 
indentation. 

I also think that airbnb rules have been developed and justified by
a strong set of engineer's and I trust their judgement for how code should
be formatted.

Turned off rules:

- object-literal-shorthand: Object shorthand is confusing
- trailing-comma: also looks confusing

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
