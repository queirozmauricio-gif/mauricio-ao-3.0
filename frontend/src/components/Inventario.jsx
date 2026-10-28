import { useEffect, useState } from "react";
import api from "../api";

export default function Inventario({ jogador }) {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.obterInventario(jogador.id).then(setItens).catch((error) => setErro(error.message));
  }, [jogador.id]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div><span className="eyebrow">SEUS EQUIPAMENTOS</span><h2>Inventário</h2></div>
        <span className="pill">{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
      </div>
      {erro && <div className="alert error">{erro}</div>}
      {itens.length === 0 && !erro ? (
        <div className="empty-state"><span className="empty-icon">◇</span><p>Seu inventário está vazio. Visite a loja para adquirir itens.</p></div>
      ) : (
        <div className="card-grid">
          {itens.map((item) => (
            <article className="item-card" key={item.id}>
              <span className={`rarity rarity-${item.raridade.toLowerCase()}`}>{item.raridade}</span>
              <h3>{item.nome}</h3>
              <p>Comprado por {item.preco} moedas</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
