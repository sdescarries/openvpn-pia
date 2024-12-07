FROM node:alpine AS build

LABEL org.opencontainers.image.source https://github.com/sdescarries/openvpn-pia

COPY . /build

WORKDIR /build

RUN true \
  && npm install \
  && npm run build

FROM fedora:latest

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
  && dnf install -y curl iproute iptables openvpn transmission-daemon tzdata unzip \
  && dnf clean all \
  && rm -rf /tmp/*

RUN true \
  && curl -fsSL https://rpm.nodesource.com/setup_22.x | bash \
  && curl -fsSL https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.rpm.sh | bash \
  && dnf install -y nodejs speedtest \
  && dnf clean all \
  && rm -rf /tmp/*

ENV \
  TZ=${TZ:-America/Montreal} \
  PIA_SERVER=${PIA_SERVER}

COPY entrypoint.sh /
COPY vpn /vpn
COPY --from=build /build/vpn/pia.js /vpn/pia.js
RUN chmod -R go- /vpn

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "node", "/vpn/pia.js" ]
