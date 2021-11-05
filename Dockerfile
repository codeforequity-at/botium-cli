FROM node:15-alpine3.13

RUN RUN apk add --no-cache \
    coreutils \
    curl curl-dev \
    dos2unix \
    git \
    g++ \
    make \
    python2 \
    bash \
    krb5 krb5-dev  \
    libstdc++ \
    chromium \
    chromium-chromedriver \
    harfbuzz \
    nss \
    freetype \
    tini \
    ttf-freefont \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk
ENV CHROME_BIN=/usr/bin/chromium-browser CHROME_PATH=/usr/lib/chromium/ CHROMEDRIVER_FILEPATH=/usr/bin/chromedriver

RUN npm install -g chromedriver@81.0.0 json-merger

COPY ./package.json /app/botium-cli/package.json
COPY ./package-merge-use-botium-npm.json /app/botium-cli/package-merge-use-botium-npm.json
COPY ./report.js /app/botium-cli/report.js
RUN cd /app/botium-cli && npx json-merger -p package-merge-use-botium-npm.json > package-npm.json && mv package-npm.json package.json
RUN cd /app/botium-cli && BOTIUM_ANALYTICS=false npm install --production --no-optional
RUN apk del curl-dev g++ make python2 dos2unix
COPY . /app/botium-cli

WORKDIR /app/workdir
VOLUME /app/workdir
ENTRYPOINT ["node", "/app/botium-cli/bin/botium-cli.js"]