PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS jogadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 80),
    saldo INTEGER NOT NULL DEFAULT 1000 CHECK (saldo >= 0),
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    nivel INTEGER NOT NULL DEFAULT 1 CHECK (nivel >= 1)
);

CREATE TABLE IF NOT EXISTS itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jogador_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    raridade TEXT NOT NULL CHECK (raridade IN ('Comum', 'Rara', 'Lendária')),
    preco INTEGER NOT NULL CHECK (preco > 0),
    FOREIGN KEY (jogador_id) REFERENCES jogadores (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS apostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jogador_id INTEGER NOT NULL,
    valor INTEGER NOT NULL CHECK (valor > 0),
    resultado TEXT NOT NULL CHECK (resultado IN ('vitória', 'derrota')),
    premio INTEGER NOT NULL DEFAULT 0 CHECK (premio >= 0),
    data TEXT NOT NULL,
    FOREIGN KEY (jogador_id) REFERENCES jogadores (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_itens_jogador_id ON itens (jogador_id);
CREATE INDEX IF NOT EXISTS idx_apostas_jogador_id ON apostas (jogador_id);
