FROM node:alpine AS build

COPY . /build

WORKDIR /build

RUN true \
  && yarn \
  && yarn build

FROM centos:centos8

ARG TZ
ARG PIA_SERVER

WORKDIR "/vpn"

ENV \
  HOME="/vpn" \
  DENO_INSTALL="/vpn/.deno" \
  PATH="/vpn/.deno/bin:${PATH}" \
  PS1="pia \w> "

RUN true \
  && groupadd -r vpn \
  && dnf install -y epel-release \
  && dnf install -y curl iptables openvpn transmission-daemon tzdata unzip \
  && dnf clean all \
  && rm -rf /tmp/*

RUN true \
  && curl -sL https://rpm.nodesource.com/setup_14.x | bash - \
  && curl https://bintray.com/ookla/rhel/rpm | tee /etc/yum.repos.d/ookla.repo \
  && curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo \
  && dnf install -y nodejs yarn speedtest \
  && dnf clean all \
  && rm -rf /tmp/*

RUN true \
  && curl -fsSL "https://deno.land/x/install/install.sh" | sh \
  && rm -f "${DENO_INSTALL}/bin/deno.zip"

ENV \
  TZ=${TZ:-America/Montreal} \
  PIA_SERVER=${PIA_SERVER}

COPY entrypoint.sh /
COPY vpn /vpn
COPY --from=build /build/vpn/pia.js /vpn/pia.js
RUN chmod -R go- /vpn

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "node", "/vpn/pia.js" ]
