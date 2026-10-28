import os
import random
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATABASE_PATH = Path(
    os.environ.get("BANCO_RPG_DB", PROJECT_ROOT / "bd" / "banco_rpg.db")
)
SCHEMA_PATH = PROJECT_ROOT / "bd" / "script.sql"
XP_POR_VITORIA = 50
ORIGENS_FRONTEND = [
    origem.strip()
    for origem in os.environ.get(
        "BANCO_RPG_FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origem.strip()
]

ITENS_LOJA = [
    {"nome": "Espada Comum", "raridade": "Comum", "preco": 200, "xp": 20},
    {"nome": "Espada Rara", "raridade": "Rara", "preco": 500, "xp": 50},
    {"nome": "Espada Lendária", "raridade": "Lendária", "preco": 1000, "xp": 100},
    {"nome": "Poção Comum", "raridade": "Comum", "preco": 100, "xp": 10},
    {"nome": "Poção Rara", "raridade": "Rara", "preco": 250, "xp": 25},
    {"nome": "Escudo Comum", "raridade": "Comum", "preco": 150, "xp": 15},
    {"nome": "Escudo Lendário", "raridade": "Lendária", "preco": 800, "xp": 80},
]
ITENS_POR_NOME = {item["nome"]: item for item in ITENS_LOJA}

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ORIGENS_FRONTEND}})


@contextmanager
def conectar_banco():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conexao = sqlite3.connect(DATABASE_PATH, timeout=10)
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    try:
        yield conexao
        conexao.commit()
    except Exception:
        conexao.rollback()
        raise
    finally:
        conexao.close()


def inicializar_banco():
    with conectar_banco() as conexao:
        conexao.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))


def erro(mensagem, status):
    return jsonify({"erro": mensagem}), status


def obter_json():
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return None
    return dados


def validar_inteiro_positivo(valor, nome):
    if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
        return None, f"'{nome}' deve ser um número inteiro maior que zero."
    return valor, None


def calcular_nivel(xp):
    return xp // 100 + 1


def jogador_para_dict(jogador):
    return dict(jogador)


@app.get("/jogadores")
def listar_jogadores():
    with conectar_banco() as conexao:
        jogadores = conexao.execute(
            "SELECT id, nome, saldo, xp, nivel FROM jogadores ORDER BY id"
        ).fetchall()
    return jsonify([jogador_para_dict(jogador) for jogador in jogadores])


@app.post("/jogadores")
def criar_jogador():
    dados = obter_json()
    if dados is None:
        return erro("Envie um objeto JSON válido.", 400)
    nome = dados.get("nome")
    if not isinstance(nome, str) or not nome.strip():
        return erro("'nome' é obrigatório e deve ser um texto não vazio.", 400)
    nome = nome.strip()
    if len(nome) > 80:
        return erro("'nome' deve ter no máximo 80 caracteres.", 400)

    with conectar_banco() as conexao:
        cursor = conexao.execute(
            "INSERT INTO jogadores (nome) VALUES (?)", (nome,)
        )
        jogador = conexao.execute(
            "SELECT id, nome, saldo, xp, nivel FROM jogadores WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return jsonify(jogador_para_dict(jogador)), 201


@app.put("/jogadores/<int:jogador_id>")
def atualizar_jogador(jogador_id):
    dados = obter_json()
    if dados is None:
        return erro("Envie um objeto JSON válido.", 400)
    nome = dados.get("nome")
    if not isinstance(nome, str) or not nome.strip():
        return erro("'nome' é obrigatório e deve ser um texto não vazio.", 400)
    nome = nome.strip()
    if len(nome) > 80:
        return erro("'nome' deve ter no máximo 80 caracteres.", 400)

    with conectar_banco() as conexao:
        cursor = conexao.execute(
            "UPDATE jogadores SET nome = ? WHERE id = ?", (nome, jogador_id)
        )
        if cursor.rowcount == 0:
            return erro("Jogador não encontrado.", 404)
        jogador = conexao.execute(
            "SELECT id, nome, saldo, xp, nivel FROM jogadores WHERE id = ?",
            (jogador_id,),
        ).fetchone()
    return jsonify(jogador_para_dict(jogador))


@app.delete("/jogadores/<int:jogador_id>")
def excluir_jogador(jogador_id):
    with conectar_banco() as conexao:
        cursor = conexao.execute(
            "DELETE FROM jogadores WHERE id = ?", (jogador_id,)
        )
        if cursor.rowcount == 0:
            return erro("Jogador não encontrado.", 404)
    return jsonify({"mensagem": "Jogador removido com sucesso."})


@app.get("/apostas")
def listar_apostas():
    jogador_id = request.args.get("jogador_id", type=int)
    with conectar_banco() as conexao:
        if jogador_id is None:
            apostas = conexao.execute(
                """
                SELECT a.id, a.jogador_id, j.nome AS jogador, a.valor,
                       a.resultado, a.premio, a.data
                FROM apostas a
                JOIN jogadores j ON j.id = a.jogador_id
                ORDER BY a.id DESC
                """
            ).fetchall()
        else:
            apostas = conexao.execute(
                """
                SELECT a.id, a.jogador_id, j.nome AS jogador, a.valor,
                       a.resultado, a.premio, a.data
                FROM apostas a
                JOIN jogadores j ON j.id = a.jogador_id
                WHERE a.jogador_id = ?
                ORDER BY a.id DESC
                """,
                (jogador_id,),
            ).fetchall()
    return jsonify([dict(aposta) for aposta in apostas])


@app.post("/apostar")
def apostar():
    dados = obter_json()
    if dados is None:
        return erro("Envie um objeto JSON válido.", 400)
    jogador_id, erro_id = validar_inteiro_positivo(
        dados.get("jogador_id"), "jogador_id"
    )
    valor, erro_valor = validar_inteiro_positivo(dados.get("valor"), "valor")
    if erro_id:
        return erro(erro_id, 400)
    if erro_valor:
        return erro(erro_valor, 400)

    try:
        with conectar_banco() as conexao:
            conexao.execute("BEGIN IMMEDIATE")
            jogador = conexao.execute(
                "SELECT id, saldo, xp FROM jogadores WHERE id = ?", (jogador_id,)
            ).fetchone()
            if jogador is None:
                return erro("Jogador não encontrado.", 404)
            if jogador["saldo"] < valor:
                return erro("Saldo insuficiente para realizar essa aposta.", 400)

            venceu = random.SystemRandom().randrange(2) == 1
            resultado = "vitória" if venceu else "derrota"
            premio = valor * 2 if venceu else 0
            novo_xp = jogador["xp"] + (XP_POR_VITORIA if venceu else 0)
            novo_saldo = jogador["saldo"] - valor + premio
            conexao.execute(
                "UPDATE jogadores SET saldo = ?, xp = ?, nivel = ? WHERE id = ?",
                (novo_saldo, novo_xp, calcular_nivel(novo_xp), jogador_id),
            )
            cursor = conexao.execute(
                """
                INSERT INTO apostas (jogador_id, valor, resultado, premio, data)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    jogador_id,
                    valor,
                    resultado,
                    premio,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            aposta_id = cursor.lastrowid
        return jsonify(
            {
                "id": aposta_id,
                "jogador_id": jogador_id,
                "valor": valor,
                "resultado": resultado,
                "premio": premio,
                "saldo": novo_saldo,
                "xp": novo_xp,
                "nivel": calcular_nivel(novo_xp),
            }
        ), 201
    except sqlite3.Error:
        app.logger.exception("Falha ao processar aposta.")
        return erro("Não foi possível registrar a aposta.", 500)


@app.get("/ranking")
def obter_ranking():
    with conectar_banco() as conexao:
        jogadores = conexao.execute(
            """
            SELECT id, nome, saldo, xp, nivel
            FROM jogadores
            ORDER BY xp DESC, nivel DESC, saldo DESC, nome COLLATE NOCASE
            """
        ).fetchall()
    return jsonify([jogador_para_dict(jogador) for jogador in jogadores])


@app.get("/inventario/<int:jogador_id>")
def obter_inventario(jogador_id):
    with conectar_banco() as conexao:
        jogador = conexao.execute(
            "SELECT id FROM jogadores WHERE id = ?", (jogador_id,)
        ).fetchone()
        if jogador is None:
            return erro("Jogador não encontrado.", 404)
        itens = conexao.execute(
            """
            SELECT id, jogador_id, nome, raridade, preco
            FROM itens
            WHERE jogador_id = ?
            ORDER BY id DESC
            """,
            (jogador_id,),
        ).fetchall()
    return jsonify([dict(item) for item in itens])


@app.get("/loja")
def obter_loja():
    return jsonify(ITENS_LOJA)


@app.post("/comprar-item")
def comprar_item():
    dados = obter_json()
    if dados is None:
        return erro("Envie um objeto JSON válido.", 400)
    jogador_id, erro_id = validar_inteiro_positivo(
        dados.get("jogador_id"), "jogador_id"
    )
    nome = dados.get("nome")
    if erro_id:
        return erro(erro_id, 400)
    if not isinstance(nome, str) or nome not in ITENS_POR_NOME:
        return erro("Item inexistente na loja.", 400)
    item = ITENS_POR_NOME[nome]

    try:
        with conectar_banco() as conexao:
            conexao.execute("BEGIN IMMEDIATE")
            jogador = conexao.execute(
                "SELECT id, saldo, xp FROM jogadores WHERE id = ?", (jogador_id,)
            ).fetchone()
            if jogador is None:
                return erro("Jogador não encontrado.", 404)
            if jogador["saldo"] < item["preco"]:
                return erro("Saldo insuficiente para comprar esse item.", 400)

            novo_saldo = jogador["saldo"] - item["preco"]
            novo_xp = jogador["xp"] + item["xp"]
            cursor = conexao.execute(
                """
                INSERT INTO itens (jogador_id, nome, raridade, preco)
                VALUES (?, ?, ?, ?)
                """,
                (jogador_id, item["nome"], item["raridade"], item["preco"]),
            )
            conexao.execute(
                "UPDATE jogadores SET saldo = ?, xp = ?, nivel = ? WHERE id = ?",
                (novo_saldo, novo_xp, calcular_nivel(novo_xp), jogador_id),
            )
            item_id = cursor.lastrowid
        return jsonify(
            {
                "mensagem": "Item comprado com sucesso.",
                "item": {
                    "id": item_id,
                    "jogador_id": jogador_id,
                    "nome": item["nome"],
                    "raridade": item["raridade"],
                    "preco": item["preco"],
                },
                "saldo": novo_saldo,
                "xp": novo_xp,
                "nivel": calcular_nivel(novo_xp),
            }
        ), 201
    except sqlite3.Error:
        app.logger.exception("Falha ao processar compra.")
        return erro("Não foi possível concluir a compra.", 500)


inicializar_banco()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
