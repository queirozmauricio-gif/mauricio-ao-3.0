import { useEffect, useState } from "react";
import api from "../api";

export default function Loja({ jogador, onAtualizar }) {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [comprando, setComprando] = useState("");

  useEffect(() => {
    api.obterLoja().then(setItens).catch((error) => setErro(error.message));
  }, []);

  async function comprar(item) {
    setErro("");
    setMensagem("");
    setComprando(item.nome);
    try {
      await api.comprarItem({ jogador_id: jogador.id, nome: item.nome });
      setMensagem(`${item.nome} foi adicionado ao inventário.`);
      await onAtualizar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setComprando("");
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div><span className="eyebrow">PREPARE SUA JORNADA</span><h2>Loja</h2></div>
        <span className="pill">Saldo: {jogador.saldo} moedas</span>
      </div>
      {erro && <div className="alert error">{erro}</div>}
      {mensagem && <div className="alert success">{mensagem}</div>}
      <div className="card-grid">
        {itens.map((item) => (
          <article className="item-card shop-card" key={item.nome}>
            <span className={`rarity rarity-${item.raridade.toLowerCase()}`}>{item.raridade}</span>
            <h3>{item.nome}</h3>
            <p className="item-price">{item.preco} moedas</p>
            <p className="xp-reward">+{item.xp} XP</p>
            <button
              onClick={() => comprar(item)}
              disabled={comprando !== "" || jogador.saldo < item.preco}
            >
              {comprando === item.nome ? "Comprando..." : "Comprar"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
