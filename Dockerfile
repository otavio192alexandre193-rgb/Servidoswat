# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Instala ferramentas necessárias para construir pacotes nativos se necessário
RUN apk add --no-cache python3 make g++

# Copia arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies necessárias para o build)
RUN npm ci

# Copia o restante do código fonte
COPY . .

# Executa o build de produção (Vite cria static assets em dist/ e esbuild compila o server em dist/server.cjs)
RUN npm run build

# Stage 2: Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Define o ambiente como de produção
ENV NODE_ENV=production
ENV PORT=8080

# Cria um usuário não-root por motivos de segurança e boas práticas de nuvem
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Copia apenas as dependências de produção necessárias
COPY package*.json ./
RUN npm ci --only=production

# Copia os artefatos compilados da etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Exponha a porta do Cloud Run
EXPOSE 8080

# Comando de inicialização direta do servidor compilado para máxima performance
CMD ["node", "dist/server.cjs"]
