FROM node:20.10-alpine as base

RUN apk add --no-cache dumb-init python3 make g++

FROM base as installer
WORKDIR /app

ARG NPM_TOKEN

ARG build_SEM_VER
ARG build_BUILD_NUM
ARG build_GIT_SHA
ARG build_BUILD_URL

ENV SEM_VER=${build_SEM_VER}
ENV BUILD_NUM=${build_BUILD_NUM}
ENV GIT_SHA=${build_GIT_SHA}
ENV BUILD_URL=${build_BUILD_URL}

WORKDIR /app
COPY ./ ./
# COPY package.json ./
# COPY yarn.lock ./
# COPY .yarn/ ./.yarn/
# COPY .yarnrc.yml ./.yarnrc.yml

RUN rm -rf ./node_modules ./build ./.yarn/cache ./.yarn/install-state.gz

RUN yarn config set -H 'npmRegistries["https://registry.yarnpkg.com"].npmAuthToken' "${NPM_TOKEN#"//registry.npmjs.org/:_authToken="}" && \
  yarn && \
  yarn build && \
  yarn config unset -H npmRegistries && \
  yarn cache clean


# FROM base AS runner
# WORKDIR /usr/src/app
#
# COPY --from=installer /app/build .

ENTRYPOINT [ "dumb-init" ]
CMD ["node", "--no-node-snapshot", "./build/start.js"]
