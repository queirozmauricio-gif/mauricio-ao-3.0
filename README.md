# Banco RPG - Sistema de Apostas e RPG

Projeto Integrador acadêmico: uma aplicação bancária gamificada com Flask, SQLite e React. As moedas e apostas são apenas simuladas dentro do jogo; não há dinheiro real nem autenticação por senha.

## Estrutura

```text
banco-rpg/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── bd/
│   ├── script.sql
│   └── banco_rpg.db       # Criado automaticamente ao iniciar a API
├── frontend/
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── Login.js
│   │   ├── api.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── components/
│   │       ├── Apostas.jsx
│   │       ├── Inventario.jsx
│   │       ├── Loja.jsx
│   │       └── Ranking.jsx
│   ├── package-lock.json
│   └── package.json
├── .gitignore
└── README.md
```

## Requisitos

- Python 3.10 ou superior
- Node.js 18 ou superior e npm

## Instalação e execução

### API Flask

No terminal, a partir da pasta `banco-rpg`:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

No Linux/macOS, ative o ambiente com `source .venv/bin/activate`. A API inicia em `http://127.0.0.1:5000`. O arquivo `bd/banco_rpg.db` e as tabelas são criados automaticamente a partir de `bd/script.sql` na primeira inicialização.

### Front-end React

Em outro terminal, a partir da pasta `banco-rpg`:

```powershell
cd frontend
npm install
npm start
```

O React inicia em `http://localhost:3000`. Para apontar a interface a outra URL da API, configure `VITE_API_URL` no arquivo `frontend/.env` (por exemplo, `VITE_API_URL=http://127.0.0.1:5000`). Se o front-end for servido de outra origem, defina `BANCO_RPG_FRONTEND_ORIGINS` no backend com as origens permitidas separadas por vírgulas.

## Regras do jogo

- Um novo jogador inicia com 1000 moedas, 0 XP e nível 1.
- Nível é calculado por `xp // 100 + 1`.
- Cada aposta válida tem chance de vitória de 50%. O valor é debitado; em vitória, o prêmio de 2× o valor apostado é creditado (ganho líquido igual ao valor apostado). Em derrota, o jogador perde o valor.
- Uma vitória concede 50 XP. Derrotas não concedem XP.
- Compras debitam o preço e concedem o XP indicado no catálogo.
- Compras e apostas são processadas em transações SQLite para impedir saldo negativo por operações simultâneas.

## Endpoints da API

Todos os corpos de requisição e respostas usam JSON. Erros usam o formato `{"erro":"mensagem"}`. Valores de moeda e XP são inteiros.

### GET `/jogadores`

Lista todos os jogadores.

Resposta `200`:

```json
[
  {
    "id": 1,
    "nome": "Mauricio",
    "saldo": 1000,
    "xp": 0,
    "nivel": 1
  }
]
```

### POST `/jogadores`

Cria jogador com saldo inicial de 1000, 0 XP e nível 1.

Requisição:

```json
{
  "nome": "Mauricio"
}
```

Resposta `201`:

```json
{
  "id": 1,
  "nome": "Mauricio",
  "saldo": 1000,
  "xp": 0,
  "nivel": 1
}
```

### PUT `/jogadores/<id>`

Atualiza o nome do jogador. Saldo, XP e nível são mantidos pelas regras do jogo.

Requisição:

```json
{
  "nome": "Mauricio Atualizado"
}
```

Resposta `200`:

```json
{
  "id": 1,
  "nome": "Mauricio Atualizado",
  "saldo": 1000,
  "xp": 0,
  "nivel": 1
}
```

### DELETE `/jogadores/<id>`

Exclui o jogador e, devido à chave estrangeira com exclusão em cascata, seu inventário e histórico de apostas.

Resposta `200`:

```json
{
  "mensagem": "Jogador removido com sucesso."
}
```

### GET `/apostas`

Lista apostas com o nome do jogador. Pode receber `?jogador_id=1` para filtrar.

Resposta `200`:

```json
[
  {
    "id": 1,
    "jogador_id": 1,
    "jogador": "Mauricio",
    "valor": 100,
    "resultado": "vitória",
    "premio": 200,
    "data": "2026-10-02T20:00:00+00:00"
  }
]
```

### POST `/apostar`

Realiza aposta se o jogador existir e tiver saldo suficiente. `valor` deve ser inteiro positivo.

Requisição:

```json
{
  "jogador_id": 1,
  "valor": 100
}
```

Resposta `201` de vitória (ou `"derrota"`, prêmio `0` e XP inalterado):

```json
{
  "id": 1,
  "jogador_id": 1,
  "valor": 100,
  "resultado": "vitória",
  "premio": 200,
  "saldo": 1100,
  "xp": 50,
  "nivel": 1
}
```

### GET `/ranking`

Lista jogadores por XP decrescente, depois nível e saldo.

Resposta `200`:

```json
[
  {
    "id": 1,
    "nome": "Mauricio",
    "saldo": 1100,
    "xp": 50,
    "nivel": 1
  }
]
```

### GET `/inventario/<jogador_id>`

Lista os itens comprados pelo jogador.

Resposta `200`:

```json
[
  {
    "id": 1,
    "jogador_id": 1,
    "nome": "Espada Comum",
    "raridade": "Comum",
    "preco": 200
  }
]
```

### GET `/loja`

Lista o catálogo de itens e os respectivos ganhos de XP.

Resposta `200`:

```json
[
  {
    "nome": "Espada Comum",
    "raridade": "Comum",
    "preco": 200,
    "xp": 20
  }
]
```

### POST `/comprar-item`

Compra um item pelo nome do catálogo; requer jogador existente e saldo suficiente.

Requisição:

```json
{
  "jogador_id": 1,
  "nome": "Espada Comum"
}
```

Resposta `201`:

```json
{
  "mensagem": "Item comprado com sucesso.",
  "item": {
    "id": 1,
    "jogador_id": 1,
    "nome": "Espada Comum",
    "raridade": "Comum",
    "preco": 200
  },
  "saldo": 800,
  "xp": 20,
  "nivel": 1
}
```

## Notas

- O login acadêmico seleciona ou cria um jogador; não há senhas, sessões autenticadas ou proteção para publicação na internet.
- A API aceita requisições do front-end local em `localhost:3000` e `127.0.0.1:3000`.
- Os valores iniciais e catálogo ficam definidos no código da API. Ajuste-os apenas conforme as regras acordadas para o projeto.
