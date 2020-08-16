FROM buildkite/puppeteer

# Copy the package.json to invalidate the docker cache
# COPY ./packages/cli/package.json /tmp/cache-key
# RUN npm i -g @browselang/cli


WORKDIR /browse
COPY . .
RUN yarn

ENTRYPOINT ["yarn", "browse"]