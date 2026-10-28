import { useCallback, useEffect, useState } from "react";
import Login from "./Login";
import api from "./api";
import Apostas from "./components/Apostas";
import Inventario from "./components/Inventario";
import Loja from "./components/Loja";
import Ranking from "./components/Ranking";

const PAGINAS = [
  ["banco", "Banco"],
  ["loja", "Loja"],
  ["inventario", "Inventário"],
  ["apostas", "Apostas"],
  ["ranking", "Ranking"],
];

export default function App() {
  const [jogador, setJogador] = useState(null);
  const [pagina, setPagina] = useState("banco");
  const [erro, setErro] = useState("");
  const [nomeEditado, setNomeEditado] = useState("");

  const sair = useCallback(() => {
    window.localStorage.removeItem("banco-rpg-jogador-id");
    setJogador(null);
    setPagina("banco");
  }, []);

  const entrar = useCallback((novoJogador) => {
    setJogador(novoJogador);
    setNomeEditado(novoJogador.nome);
    setErro("");
    window.localStorage.setItem("banco-rpg-jogador-id", String(novoJogador.id));
  }, []);

  const atualizarJogador = useCallback(async () => {
    if (!jogador) return;
    const jogadores = await api.listarJogadores();
    const atualizado = jogadores.find((item) => item.id === jogador.id);
    if (!atualizado) {
      sair();
      return;
    }
    setJogador(atualizado);
    setNomeEditado(atualizado.nome);
  }, [jogador, sair]);

  useEffect(() => {
    const idSalvo = Number(window.localStorage.getItem("banco-rpg-jogador-id"));
    if (!idSalvo) return;
    api.listarJogadores()
      .then((jogadores) => jogadores.find((item) => item.id === idSalvo))
      .then((salvo) => { if (salvo) entrar(salvo); })
      .catch((error) => setErro(error.message));
  }, [entrar]);

  async function salvarNome(event) {
    event.preventDefault();
    setErro("");
    try {
      entrar(await api.atualizarJogador(jogador.id, { nome: nomeEditado }));
    } catch (error) {
      setErro(error.message);
    }
  }

  async function removerJogador() {
    if (!window.confirm("Excluir este jogador e todo o seu histórico?")) return;
    setErro("");
    try {
      await api.excluirJogador(jogador.id);
      sair();
    } catch (error) {
      setErro(error.message);
    }
  }

  if (!jogador) {
    return <><Login onLogin={entrar} />{erro && <div className="global-error">{erro}</div>}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#banco" onClick={() => setPagina("banco")}>
          <span className="brand-mark">◆</span><span>Banco <b>RPG</b></span>
        </a>
        <div className="sidebar-player">
          <span className="avatar">{jogador.nome.slice(0, 1).toUpperCase()}</span>
          <div><strong>{jogador.nome}</strong><small>Nível {jogador.nivel}</small></div>
        </div>
        <nav aria-label="Navegação principal">
          {PAGINAS.map(([id, titulo]) => (
            <button
              key={id}
              className={`nav-link ${pagina === id ? "active" : ""}`}
              onClick={() => { setPagina(id); setErro(""); }}
            >
              <span className="nav-dot" />{titulo}
            </button>
          ))}
        </nav>
        <button className="logout-button" onClick={sair}>Trocar jogador</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">SUA JORNADA RPG</span><h1>{PAGINAS.find(([id]) => id === pagina)?.[1]}</h1></div>
          <div className="topbar-stats">
            <span>◈ {jogador.saldo} moedas</span>
            <span>✦ {jogador.xp} XP</span>
            <span>LVL {jogador.nivel}</span>
          </div>
        </header>
        {erro && <div className="alert error">{erro}</div>}
        {pagina === "banco" && (
          <section className="dashboard">
            <div className="welcome-card">
              <span className="eyebrow">PAINEL DO AVENTUREIRO</span>
              <h2>Olá, {jogador.nome}!</h2>
              <p>Gerencie suas moedas, evolua seu personagem e conquiste o ranking.</p>
            </div>
            <div className="stat-grid">
              <article className="stat-card"><span>Saldo</span><strong>{jogador.saldo}</strong><small>moedas disponíveis</small></article>
              <article className="stat-card"><span>Experiência</span><strong>{jogador.xp}</strong><small>XP acumulado</small></article>
              <article className="stat-card"><span>Nível</span><strong>{jogador.nivel}</strong><small>{100 - (jogador.xp % 100)} XP até o próximo nível</small></article>
            </div>
            <section className="panel profile-panel">
              <span className="eyebrow">CONTA</span><h2>Perfil do jogador</h2>
              <form className="form-row" onSubmit={salvarNome}>
                <label className="sr-only" htmlFor="nome-perfil">Nome do jogador</label>
                <input id="nome-perfil" value={nomeEditado} maxLength="80" onChange={(event) => setNomeEditado(event.target.value)} required />
                <button>Salvar nome</button>
              </form>
              <button className="danger-button" onClick={removerJogador}>Excluir jogador</button>
            </section>
          </section>
        )}
        {pagina === "loja" && <Loja jogador={jogador} onAtualizar={atualizarJogador} />}
        {pagina === "inventario" && <Inventario jogador={jogador} />}
        {pagina === "apostas" && <Apostas jogador={jogador} onAtualizar={atualizarJogador} />}
        {pagina === "ranking" && <Ranking />}
      </main>
    </div>
  );
}
