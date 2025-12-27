const express = require('express');
const cors = require('cors');
const app = express();

// A porta é definida pelo Render automaticamente
const port = process.env.PORT || 3000;

// Configurações
app.use(cors()); // Permite receber dados de qualquer origem (inclusive do seu IP local)
app.use(express.json());
app.use(express.static('public')); // Serve o site que estará na pasta 'public'

// Banco de Dados em Memória (Volátil)
let historico = [];

// Rota de Teste
app.get('/', (req, res) => {
    res.send('O Servidor está funcionando! Acesse /index.html');
    });

    // Rota 1: RECEBE os dados do Tampermonkey
    app.post('/api/coletar', (req, res) => {
        const { mesa, link_origem, detalhes } = req.body;

            if (!mesa) {
                    return res.status(400).json({ erro: 'Mesa não informada' });
                        }

                            const novoLancamento = {
                                    id: Date.now(),
                                            mesa: mesa,
                                                    // Garante que detalhes seja um array, mesmo se der erro na coleta
                                                            detalhes: Array.isArray(detalhes) ? detalhes : [],
                                                                    link_origem: link_origem,
                                                                            data_hora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                                                                                    timestamp: new Date().toISOString()
                                                                                        };

                                                                                            // Adiciona no topo da lista
                                                                                                historico.unshift(novoLancamento);

                                                                                                    // Mantém apenas os últimos 150 registros para economizar memória
                                                                                                        if (historico.length > 150) {
                                                                                                                historico = historico.slice(0, 150);
                                                                                                                    }

                                                                                                                        console.log(`[Nova Coleta] Mesa: ${mesa} | Itens: ${novoLancamento.detalhes.length}`);
                                                                                                                            res.status(200).json({ status: 'sucesso', id: novoLancamento.id });
                                                                                                                            });

                                                                                                                            // Rota 2: ENTREGA os dados para o Frontend
                                                                                                                            app.get('/api/historico', (req, res) => {
                                                                                                                                const { mesa } = req.query;
                                                                                                                                    let resultado = historico;

                                                                                                                                        // Filtro de mesa (se solicitado)
                                                                                                                                            if (mesa) {
                                                                                                                                                    resultado = historico.filter(item => 
                                                                                                                                                                item.mesa.toString().toLowerCase().includes(mesa.toString().toLowerCase())
                                                                                                                                                                        );
                                                                                                                                                                            }

                                                                                                                                                                                res.json(resultado);
                                                                                                                                                                                });

                                                                                                                                                                                // Inicia o servidor
                                                                                                                                                                                app.listen(port, () => {
                                                                                                                                                                                    console.log(`Servidor rodando na porta ${port}`);
                                                                                                                                                                                    });
                                                                                                                                                                                    