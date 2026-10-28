import { useCallback, useEffect, useState } from "react";
import api from "../api";

export default function Apostas({ jogador, onAtualizar }) {
  const [valor, setValor] = useState("");
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [apostando, setApostando] = useState(false);

  const carregarHistorico = useCallback(async () => {
    setHistorico(await api.listarApostas(jogador.id));
  }, [jogador.id]);

  useEffect(() => {
    carregarHistorico().catch((error) => setErro(error.message));
  }, [carregarHistorico]);

  async function realizarAposta(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");
    setApostando(true);
    try {
      const resultado = await api.apostar({
        jogador_id: jogador.id,
        valor: Number(valor),
      });
      setMensagem(
        resultado.resultado === "vitória"
          ? `Vitória! Prêmio: ${resultado.premio} moedas e +50 XP.`
          : "Derrota. O valor apostado foi perdido."
      );
      setValor("");
      await Promise.all([carregarHistorico(), onAtualizar()]);
    } catch (error) {
      setErro(error.message);
    } finally {
      setApostando(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div><span className="eyebrow">ARRISQUE COM SABEDORIA</span><h2>Apostas</h2></div>
        <span className="pill">Saldo: {jogador.saldo} moedas</span>
      </div>
      <div className="bet-notice">Chance de vitória: 50%. Na vitória, receba 2× o valor apostado e ganhe 50 XP. Na derrota, perca o valor apostado.</div>
      {erro && <div className="alert error">{erro}</div>}
      {mensagem && <div className="alert success">{mensagem}</div>}
      <form className="bet-form" onSubmit={realizarAposta}>
        <label htmlFor="valor-aposta">Valor da aposta</label>
        <div className="form-row">
          <input
            id="valor-aposta"
            type="number"
            min="1"
            max={jogador.saldo}
            step="1"
            required
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            placeholder="Ex.: 100"
          />
          <button disabled={apostando || jogador.saldo < 1}>
            {apostando ? "Sorteando..." : "Apostar"}
          </button>
        </div>
      </form>
      <h3 className="subheading">Seu histórico</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Data</th><th>Valor</th><th>Resultado</th><th>Prêmio</th></tr></thead>
          <tbody>
            {historico.map((aposta) => (
              <tr key={aposta.id}>
                <td>{new Date(aposta.data).toLocaleString("pt-BR")}</td>
                <td>{aposta.valor} moedas</td>
                <td><span className={`result ${aposta.resultado === "vitória" ? "won" : "lost"}`}>{aposta.resultado}</span></td>
                <td>{aposta.premio} moedas</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {historico.length === 0 && !erro && <p className="muted">Você ainda não realizou apostas.</p>}
    </section>
  );
}
