import { useEffect, useState } from "react";
import api from "../api";

export default function Ranking() {
  const [jogadores, setJogadores] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.obterRanking().then(setJogadores).catch((error) => setErro(error.message));
  }, []);

  return (
    <section className="panel">
      <div className="section-heading">
        <div><span className="eyebrow">HALL DA FAMA</span><h2>Ranking</h2></div>
        <span className="muted">Ordenado por XP</span>
      </div>
      {erro && <div className="alert error">{erro}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Jogador</th><th>Nível</th><th>XP</th><th>Saldo</th></tr></thead>
          <tbody>
            {jogadores.map((jogador, index) => (
              <tr key={jogador.id}>
                <td><span className={`rank rank-${index + 1}`}>{index + 1}</span></td>
                <td>{jogador.nome}</td><td>{jogador.nivel}</td><td>{jogador.xp}</td><td>{jogador.saldo} moedas</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {jogadores.length === 0 && !erro && <p className="muted">O ranking ainda está vazio.</p>}
    </section>
  );
}
