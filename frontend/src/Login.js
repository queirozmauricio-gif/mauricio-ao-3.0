import { useEffect, useState } from "react";
import api from "./api";

export default function Login({ onLogin }) {
  const [jogadores, setJogadores] = useState([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarJogadores() {
    setErro("");
    try {
      setJogadores(await api.listarJogadores());
    } catch (error) {
      setErro(error.message);
    }
  }

  useEffect(() => {
    carregarJogadores();
  }, []);

  async function criarJogador(event) {
    event.preventDefault();
    setCarregando(true);
    setErro("");
    try {
      const jogador = await api.criarJogador({ nome });
      onLogin(jogador);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <span className="eyebrow">AVENTUREIRO, BEM-VINDO</span>
        <h1>Banco RPG</h1>
        <p>Entre com um jogador existente ou crie sua conta para começar.</p>
        {erro && <div className="alert error">{erro}</div>}
        <form onSubmit={criarJogador} className="stack">
          <label htmlFor="novo-jogador">Criar jogador</label>
          <div className="form-row">
            <input
              id="novo-jogador"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              maxLength="80"
              placeholder="Nome do aventureiro"
              required
            />
            <button disabled={carregando}>
              {carregando ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
        <div className="divider"><span>ou escolha um jogador</span></div>
        {jogadores.length === 0 ? (
          <p className="muted">Nenhum jogador cadastrado ainda.</p>
        ) : (
          <ul className="player-list">
            {jogadores.map((jogador) => (
              <li key={jogador.id}>
                <button
                  className="player-choice"
                  onClick={() => onLogin(jogador)}
                >
                  <span>{jogador.nome}</span>
                  <small>Nível {jogador.nivel} · {jogador.saldo} moedas</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="button-secondary full-width" onClick={carregarJogadores}>
          Atualizar lista
        </button>
      </section>
    </main>
  );
}
