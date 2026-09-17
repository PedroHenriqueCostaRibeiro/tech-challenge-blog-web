# Roteiro da apresentação gravada

Sugestão de roteiro para o vídeo de entrega (RE2). Duração alvo: **8 a 12 minutos**.

> Este arquivo é material de apoio para a gravação, não faz parte da aplicação.

---

## Antes de gravar

Deixe tudo no ar e a sessão limpa:

```bash
cd tech-challenge-blog-web && docker compose up --build -d
```

```bash
docker compose exec api node dist/database/seed.js
```

Confira que os três serviços estão saudáveis:

```bash
docker compose ps
```

Abra duas janelas: o navegador em http://localhost:8080 e um terminal para os comandos.
No navegador, limpe o `localStorage` para começar deslogado.

---

## 1. O problema e o objetivo · ~1 min

O que dizer:

- As fases anteriores entregaram o modelo de dados, as regras de negócio e os endpoints REST.
- **O que faltava era uma forma de um ser humano usar isso.** Até aqui, a única porta de entrada
  era a linha de comando — o que exclui exatamente o público-alvo: docentes e estudantes da rede
  pública.
- Esta fase entrega a interface, com uma assimetria central: **estudantes leem sem conta;
  docentes precisam de login para escrever.**

---

## 2. Arquitetura · ~1 min 30

Mostre o diagrama do README (seção *Arquitetura do sistema*).

Pontos a destacar:

- Três contêineres: banco, API e interface.
- A interface conversa com a API por um **proxy do Nginx**, não por CORS — o mesmo caminho que o
  proxy do Vite faz em desenvolvimento, então o código é idêntico nos dois ambientes.
- As camadas do front: páginas → hooks → serviços → cliente HTTP. **Componentes de UI não
  conhecem HTTP, e serviços não conhecem React.**

---

## 3. A experiência do estudante · ~1 min 30

No navegador, deslogado:

1. A home lista as postagens com **título, autor e resumo**.
2. Digite `cordel` na busca e mostre o filtro funcionando.
3. Abra a aba **Rede** do DevTools e digite de novo: mostre que **6 teclas geram 1 requisição**,
   não 6 — é o debounce.
4. Clique numa postagem e mostre a leitura completa.
5. **Recarregue a página (F5) nessa URL** e mostre que ela continua funcionando — é o `try_files`
   do Nginx. Sem ele, todo link compartilhado quebraria.

---

## 4. Autenticação · ~1 min 30

1. Clique em **Entrar**. Tente `maria@escola.edu.br` com uma senha errada.
   - Destaque: a mensagem é genérica de propósito. Dizer "e-mail não encontrado" entregaria a um
     atacante quais contas existem.
2. Entre com `senha123`. Você vai para a Administração.
3. **Aperte F5 na área restrita** e mostre que a sessão permanece.
   - Explique: logo após o F5, o token está guardado mas a aplicação ainda não sabe se é válido.
     Tratar esse instante como "anônimo" expulsaria o usuário a cada recarregamento. Por isso há
     **três estados**, não dois.

---

## 5. O ciclo de autoria · ~2 min

1. **Nova postagem** — mostre o autor já preenchido com o nome de quem está logado.
2. Tente publicar com campos vazios: a validação impede e **a API nem é chamada**.
3. Preencha e publique. Mostre a postagem aparecendo na home pública.
4. **Editar** — mostre que os dados atuais já vêm carregados no formulário.
5. **Excluir** — mostre que a confirmação **nomeia a postagem**. Confirmar sem saber qual é o
   mesmo que apagar a coisa errada.

---

## 6. Onde a segurança realmente mora · ~1 min 30

**Este é o ponto técnico mais importante da apresentação.**

Saia da conta e mostre que `/admin` redireciona para o login. Depois diga: *"mas isso é
experiência de uso, não segurança"* — e prove no terminal:

```bash
curl -i -X POST http://localhost:8080/api/posts -H "Content-Type: application/json" -d '{"title":"t","content":"c","author":"a"}'
```

Responde **401**. Explique: o navegador está sob controle de quem o usa, e o DevTools contorna
qualquer verificação no cliente. Quem de fato barra é o middleware da API.

Mostre também que a leitura continua pública:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/posts
```

---

## 7. Responsividade e acessibilidade · ~1 min

1. Abra o modo dispositivo do DevTools em **375px**: a grade vira uma coluna, sem rolagem
   horizontal.
2. Navegue **só com Tab** e mostre o contorno de foco sempre visível.
3. Mencione a auditoria: **zero violações do axe-core** em WCAG 2.1 A/AA, em dez estados
   diferentes — incluindo o diálogo de exclusão aberto e o formulário com erros.

---

## 8. Testes e pipeline · ~1 min 30

1. Rode os testes:

```bash
npm test
```

2. Mostre os **117 testes** e a cobertura de ~96%.
3. Abra o GitHub Actions e mostre o CI verde nos dois repositórios.
4. Destaque que o CI **sobe a imagem Docker sem a API ao lado** e exige que a interface responda
   mesmo assim — porque o blog é público e não deveria sair do ar junto com a API.

---

## 9. Desafios · ~1 min

Escolha **dois ou três** do README (seção *Relato de experiências e desafios*). Sugestões, por
impacto:

- **O teste verde que mentia** — a suíte aprovava um comportamento que o navegador real não
  tinha. Lição: teste verde é indício, não prova.
- **O Nginx que morria junto com a API** — funcionava no compose por acidente; só um cenário
  diferente expôs a fragilidade.
- **Variáveis congeladas no build** — um erro que só apareceria em produção.

---

## Checklist final

Antes de enviar, confirme que o vídeo mostra:

- [ ] Listagem com título, autor e resumo (RF1)
- [ ] Busca funcionando (RF1)
- [ ] Leitura completa de uma postagem (RF2)
- [ ] Criação de postagem (RF3)
- [ ] Edição carregando os dados atuais (RF4)
- [ ] Administração com editar e excluir (RF5)
- [ ] Login e bloqueio de rotas (RF6)
- [ ] A prova por `curl` de que a proteção é do servidor
- [ ] Responsividade em viewport mobile
- [ ] Testes e pipeline
