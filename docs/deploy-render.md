# Publicando no Render

Passo a passo para colocar a aplicação no ar. Cobre os **dois repositórios**: o banco e a API
(`tech-challenge-blog-api`) e a interface (`tech-challenge-blog-web`).

Tempo estimado: **20 a 30 minutos**, a maior parte esperando builds.

---

## Como a arquitetura muda em produção

Vale entender isso antes de começar, porque muda uma configuração importante.

| | Local (Docker) | Render |
| --- | --- | --- |
| Interface | Nginx servindo os estáticos | **Static Site** |
| Chamada à API | Proxy do Nginx em `/api` | **Direto, via CORS** |
| `VITE_API_URL` | `/api` (caminho relativo) | **URL pública completa da API** |

No Render a interface vira um site estático, então **não há Nginx e não há proxy**. O navegador
chama a API diretamente, e quem permite isso é o CORS — que a API já habilita.

> ⚠️ A API usa CORS permissivo (aceita qualquer origem). Para um projeto acadêmico isso é
> aceitável, mas em um sistema real valeria restringir à origem da interface.

---

## Parte 1 — Banco de dados

1. No painel do Render: **New** → **PostgreSQL**.
2. Preencha:
   - **Name:** `blog-db`
   - **Database:** `blog`
   - **Region:** a mesma que você usará nos outros serviços (latência e custo)
   - **Plan:** Free
3. **Create Database** e aguarde ficar *Available*.
4. Na aba do banco, guarde **duas** URLs diferentes:

   | URL | Para quê |
   | --- | --- |
   | **Internal Database URL** | A API vai usar esta — tráfego interno, mais rápido |
   | **External Database URL** | Você vai usar esta para rodar o seed da sua máquina |

> 💡 O banco gratuito do Render **expira após 30 dias**. Anote a data se o projeto precisar ficar
> no ar até a avaliação.

---

## Parte 2 — API

1. **New** → **Web Service** → conecte o repositório `tech-challenge-blog-api`.
2. Configure:
   - **Name:** `blog-api`
   - **Branch:** `main`
   - **Region:** a mesma do banco
   - **Runtime:** **Docker** — o repositório já tem um `Dockerfile` testado
   - **Plan:** Free
3. Em **Environment**, adicione:

   | Chave | Valor |
   | --- | --- |
   | `DATABASE_URL` | a **Internal** Database URL da Parte 1 |
   | `DB_SSL` | `true` |
   | `DB_SYNCHRONIZE` | `true` |
   | `JWT_SECRET` | gere com o comando abaixo |
   | `JWT_EXPIRES_IN` | `8h` |

   Gerando o segredo:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   > ⛔ **Não defina `PORT`.** O Render injeta essa variável e a aplicação já a respeita
   > (`Number(process.env.PORT) || 3000`). Fixá-la manualmente faz o serviço não responder.

   > 🔑 **`JWT_SECRET` é a variável mais fácil de esquecer e a mais difícil de diagnosticar.**
   > Sem ela a API sobe normalmente, `GET /posts` funciona, e **só o login falha, com 500** — um
   > sintoma que não aponta para a causa. É de propósito: o código não tem valor padrão, porque
   > um segredo versionado permitiria a qualquer pessoa forjar um token de docente.

4. **Create Web Service** e aguarde o build.
5. Confirme que subiu:

   ```bash
   curl https://blog-api.onrender.com/health
   ```

   Deve responder `{"status":"ok",...}`. **Anote esta URL** — a interface vai precisar dela.

> ⏳ O plano gratuito hiberna após inatividade. A primeira requisição depois de um tempo parado
> pode levar ~50 segundos. A interface mostra um indicador de carregamento justamente por isso.

---

## Parte 3 — Docentes de demonstração

Sem eles não há como fazer login. O plano gratuito do Render não dá acesso a terminal, então o
seed roda **da sua máquina** contra o banco publicado.

Na pasta do repositório da API:

```bash
DATABASE_URL="<External Database URL>" DB_SSL=true DB_SYNCHRONIZE=true npm run seed
```

Deve imprimir os dois docentes criados. O script é idempotente — rodar de novo não duplica.

> 💡 As variáveis passadas na linha de comando têm precedência sobre o seu `.env` local, então
> isso **não** afeta o banco de desenvolvimento.

Confirme pela API:

```bash
curl -s -X POST https://blog-api.onrender.com/auth/login -H "Content-Type: application/json" -d '{"email":"maria@escola.edu.br","password":"senha123"}'
```

Deve devolver um `token`. Se responder `500`, o `JWT_SECRET` não foi configurado.

---

## Parte 4 — Interface

1. **New** → **Static Site** → conecte o repositório `tech-challenge-blog-web`.
2. Configure:
   - **Name:** `blog-web`
   - **Branch:** `main`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
3. Em **Environment**, adicione:

   | Chave | Valor |
   | --- | --- |
   | `VITE_API_URL` | `https://blog-api.onrender.com` — a URL da Parte 2, **sem barra no final** |

   > ⚠️ **Esta variável é lida durante o BUILD, não na execução.** O Vite substitui o texto no
   > JavaScript gerado. Se você alterá-la depois, **precisa disparar um novo deploy** — mudar o
   > valor sozinho não muda nada, porque o pacote já foi compilado com o valor antigo.

4. **Create Static Site** e aguarde o build.

### Passo indispensável: regra de reescrita

Sem isto, **todo F5 fora da home e todo link compartilhado respondem 404**.

Na aba **Redirects/Rewrites** do site estático, adicione:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | **Rewrite** |

Por quê: com roteamento no cliente, `/posts/abc-123` só existe dentro do JavaScript. Ao abrir
essa URL diretamente, o servidor procura um arquivo com esse nome e não encontra. A regra manda
servir o `index.html`, e o React resolve a rota.

> Escolha **Rewrite**, não Redirect. Redirect mudaria a URL na barra de endereços.

---

## Parte 5 — Verificação

Não basta abrir a home. O teste que importa é **fazer login de verdade**, porque é ele que
exercita o `JWT_SECRET`, o banco e a comunicação entre os dois serviços.

- [ ] A home abre e **lista as postagens** (prova que a interface alcança a API)
- [ ] A busca filtra
- [ ] Abrir uma postagem funciona
- [ ] **Recarregar a página (F5) na URL da postagem não dá 404** — valida a regra de reescrita
- [ ] **Login com `maria@escola.edu.br` / `senha123` funciona** — valida o `JWT_SECRET`
- [ ] Criar, editar e excluir uma postagem
- [ ] Sair encerra a sessão

E a verificação de segurança, pelo terminal:

```bash
curl -i -X POST https://blog-api.onrender.com/posts -H "Content-Type: application/json" -d '{"title":"t","content":"c","author":"a"}'
```

Deve responder **401**. Se responder `201`, a proteção não está ativa em produção.

---

## Depois de publicar

Atualize a URL nos dois READMEs, que hoje têm um marcador:

- `tech-challenge-blog-api/README.md` — linha "Aplicação publicada"
- `tech-challenge-blog-web/README.md` — acrescente a URL da interface

---

## Se algo der errado

| Sintoma | Causa provável |
| --- | --- |
| Login responde `500`, resto funciona | `JWT_SECRET` não configurado |
| API não responde, build passou | `PORT` foi definida manualmente |
| Erro de conexão com o banco | Faltou `DB_SSL=true` |
| Tabelas não existem | Faltou `DB_SYNCHRONIZE=true` |
| Login responde `401` com a senha certa | O seed não rodou, ou rodou contra outro banco |
| F5 numa postagem dá `404` | Falta a regra de reescrita `/*` → `/index.html` |
| Interface não alcança a API | `VITE_API_URL` errada, ou alterada sem novo deploy |
| Primeira requisição demora muito | Hibernação do plano gratuito — comportamento esperado |
