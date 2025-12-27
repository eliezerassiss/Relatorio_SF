const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let logsAcoes = [];

// Rota para receber as ações interceptadas
app.post('/api/acao', (req, res) => {
    const acao = {
        id: Date.now(),
        data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        detalhes: req.body // Payload bruto capturado do site
    };

    logsAcoes.unshift(acao);
    if (logsAcoes.length > 100) logsAcoes.pop();

    console.log(`[AÇÃO] Nova atividade capturada às ${acao.data}`);
    res.status(200).send("OK");
});

app.get('/api/historico', (req, res) => {
    res.json(logsAcoes);
});

app.listen(port, () => console.log(`Rodando em ${port}`));