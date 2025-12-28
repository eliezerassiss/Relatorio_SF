const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let database = [];

/* ===== RECEBE AÇÕES ===== */
app.post('/api/acao', (req, res) => {
    database.unshift(req.body);
        if (database.length > 50) database.pop();
            res.json({ status: 'ok' });
            });

            /* ===== HISTÓRICO ===== */
            app.get('/api/historico', (req, res) => {
                res.json(database);
                });

                /* ===== ESTATÍSTICAS ===== */
                function gerarEstatisticas() {
                    const stats = {
                            total: database.length,
                                    consultas: 0,
                                            lancamentos: 0,
                                                    mesas: {},
                                                            produtos: {},
                                                                    ultima: null
                                                                        };

                                                                            database.forEach(d => {
                                                                                    if (d.tipo === 'CONSULTA') stats.consultas++;
                                                                                            if (d.tipo === 'LANÇAMENTO') stats.lancamentos++;

                                                                                                    stats.mesas[d.mesa] = (stats.mesas[d.mesa] || 0) + 1;

                                                                                                            if (d.tipo === 'LANÇAMENTO' && typeof d.payload === 'string') {
                                                                                                                        d.payload.split('&').forEach(p => {
                                                                                                                                        const [k, v] = p.split('=');
                                                                                                                                                        if (k === 'nome_item') {
                                                                                                                                                                            const nome = decodeURIComponent(v || '');
                                                                                                                                                                                                stats.produtos[nome] = (stats.produtos[nome] || 0) + 1;
                                                                                                                                                                                                                }
                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                            if (!stats.ultima || d.timestamp > stats.ultima) {
                                                                                                                                                                                                                                                        stats.ultima = d.timestamp;
                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                        return stats;
                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                        app.get('/api/estatisticas', (req, res) => {
                                                                                                                                                                                                                                                                            res.json(gerarEstatisticas());
                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                            app.listen(PORT, () => {
                                                                                                                                                                                                                                                                                console.log('LeChef Monitor ativo na porta ' + PORT);
                                                                                                                                                                                                                                                                                });