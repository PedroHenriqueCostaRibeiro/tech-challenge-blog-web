# ============================================================
# Estagio 1: BUILDER — instala as dependencias e compila
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia primeiro so os manifests: se package.json nao mudou, o Docker
# reaproveita a camada de instalacao em vez de baixar tudo de novo.
COPY package*.json ./
RUN npm ci

COPY . .

# ------------------------------------------------------------
# ATENCAO: as variaveis do Vite sao congeladas AQUI, no build.
#
# import.meta.env.VITE_API_URL nao e lido em tempo de execucao -- o Vite
# substitui o texto durante a compilacao. Passar VITE_API_URL no "environment"
# do compose ou do Render nao teria efeito algum: o valor ja estaria embutido
# no JavaScript gerado.
#
# Por isso ela entra como ARG e vira ENV antes do build. Em producao,
# sobrescreva com --build-arg (ou o campo de variavel DE BUILD do Render).
#
# O padrao "/api" serve ao cenario do compose, onde o Nginx faz o proxy.
# ------------------------------------------------------------
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ============================================================
# Estagio 2: RUNNER — Nginx servindo os arquivos estaticos
#
# A imagem final nao tem Node nem node_modules: sao poucas dezenas de MB em
# vez de centenas, e nao ha runtime de aplicacao exposto para servir
# arquivos estaticos.
# ============================================================
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# O healthcheck usa a propria pagina: se o Nginx responde, a SPA esta servida.
#
# 127.0.0.1 em vez de localhost, de proposito: o Nginx escuta apenas em IPv4
# (0.0.0.0:80), mas "localhost" resolve tambem para ::1 dentro do container e
# o wget do Alpine tenta o IPv6 primeiro -- recebendo "connection refused". O
# container ficava marcado como unhealthy enquanto servia tudo normalmente,
# o que faria um orquestrador reinicia-lo em laco.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
