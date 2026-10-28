const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

async function requisicao(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
      ...opcoes.headers,
    },
  });

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dados.erro || `Erro na requisição (${resposta.status}).`);
  }
  return dados;
}

const json = (metodo, corpo) => ({
  method: metodo,
  body: JSON.stringify(corpo),
});

const api = {
  listarJogadores: () => requisicao("/jogadores"),
  criarJogador: (dados) => requisicao("/jogadores", json("POST", dados)),
  atualizarJogador: (id, dados) =>
    requisicao(`/jogadores/${id}`, json("PUT", dados)),
  excluirJogador: (id) =>
    requisicao(`/jogadores/${id}`, { method: "DELETE" }),
  listarApostas: (jogadorId) =>
    requisicao(
      jogadorId ? `/apostas?jogador_id=${encodeURIComponent(jogadorId)}` : "/apostas"
    ),
  apostar: (dados) => requisicao("/apostar", json("POST", dados)),
  obterRanking: () => requisicao("/ranking"),
  obterInventario: (jogadorId) =>
    requisicao(`/inventario/${encodeURIComponent(jogadorId)}`),
  obterLoja: () => requisicao("/loja"),
  comprarItem: (dados) => requisicao("/comprar-item", json("POST", dados)),
};

export default api;
