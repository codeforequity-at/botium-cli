FROM node:11.10.1-alpine

ENV PHANTOMJS_VERSION 2.1.1
RUN apk --no-cache add curl curl-dev g++ make python bash alsa-lib-dev krb5 krb5-dev
RUN curl -Ls "https://github.com/dustinblackman/phantomized/releases/download/${PHANTOMJS_VERSION}/dockerized-phantomjs.tar.gz" | tar xz -C / && curl -k -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 | tar -jxvf - -C ./ && cp phantomjs-${PHANTOMJS_VERSION}-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs && rm -fR phantomjs-${PHANTOMJS_VERSION}-linux-x86_64
RUN npm set unsafe-perm true && BUILD_ONLY=true npm install --no-optional --production
RUN apk del curl g++ make python

WORKDIR /app/workdir
VOLUME /app/workdir
COPY . /app/botium-cli
RUN cd /app/botium-cli && npm install --production --no-optional

ENTRYPOINT ["node", "/app/botium-cli/bin/botium-cli.js"]