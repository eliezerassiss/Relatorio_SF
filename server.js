// server.js (Atualizado para CORS e POST)
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Importe a biblioteca CORS
const { HttpsProxyAgent } = require('http-proxy-agent');
const app = express();
const port = process.env.PORT || 3000;

// Configuração do Proxy Secundário (UPSTREAM PROXY)
const UPSTREAM_PROXY_URL = 'http://SEU_IP_PROXY_COLETOR:SUA_PORTA'; 
const agent = new HttpsProxyAgent(UPSTREAM_PROXY_URL);

// ----------------------------------------------------
// 1. Configuração CORS
// Permite requisições de qualquer origem (*). Para produção,
// você deve restringir isso ao domínio do seu front-end (ex: origin: 'https://seufrotend.com')
app.use(cors());

// Middleware para analisar o corpo da requisição em JSON (necessário para o POST)
app.use(express.json());
// ----------------------------------------------------

// --- Rota Única para Roteamento de Proxy ---
// Esta rota aceita qualquer método HTTP (GET, POST, etc.)
app.all('/proxy-route', async (req, res) => {
    // A URL de destino é enviada no corpo da requisição (JSON) ou na query
    const targetUrl = req.body.url || req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ status: 'error', message: 'A URL de destino deve ser fornecida.' });
    }

    console.log(`Recebida requisição ${req.method} para: ${targetUrl}`);
    console.log(`Redirecionando via Proxy Secundário: ${UPSTREAM_PROXY_URL}`);

    // Configuração do Axios
    const axiosConfig = {
        method: req.method, // Usa o método HTTP original (GET, POST, etc.)
        url: targetUrl,
        headers: {
            // Repassa os headers originais, exceto o 'host'
            ...req.headers,
            host: new URL(targetUrl).host,
            // (Opcional) Remove headers que podem causar problemas ou revelar o IP do Render
            'x-forwarded-for': undefined,
            'x-real-ip': undefined,
        },
        data: req.body, // Envia o corpo da requisição original (útil para POST)
        // Força o roteamento através do Proxy Secundário
        httpsAgent: agent, 
        httpAgent: agent,
    };
    
    try {
        const response = await axios(axiosConfig);

        // Repassa o status e os headers da resposta do destino
        res.status(response.status);
        Object.keys(response.headers).forEach(key => {
            // Evita erros ao tentar setar headers de status ou quebras de CORS
            if (key !== 'connection' && key !== 'content-encoding' && key !== 'content-length') {
                res.setHeader(key, response.headers[key]);
            }
        });

        // Envia os dados de volta para o cliente HTML
        res.send(response.data);

    } catch (error) {
        console.error('Erro ao fazer a requisição via proxy:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Falha ao rotear a requisição através do proxy secundário.',
            errorDetails: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.send('Servidor Proxy Genérico Rodando. Use a rota /proxy-route.');
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
1.2 Re-deploy no Render
Envie o código atualizado para o seu repositório Git e o Render fará o re-deploy automaticamente.

2. Criando o Front-end (HTML/JavaScript)
Crie um arquivo HTML simples (index.html) para testar.

2.1 Crie o index.html
Atenção: Você deve substituir SUA_URL_DO_RENDER pela URL pública do seu serviço web (ex: https://proxy-coletor-server.onrender.com).

HTML

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Teste de Requisição Via Proxy Secundário</title>
</head>
<body>
    <h1>Cliente HTML para Proxy no Render</h1>
    
    <label for="url">URL de Destino:</label>
    <input type="text" id="url" value="https://jsonplaceholder.typicode.com/posts/1" style="width: 400px;"><br><br>
    
    <button onclick="fazerRequisicao('GET')">Fazer GET</button>
    <button onclick="fazerRequisicao('POST')">Fazer POST (Exemplo)</button>
    
    <h2>Resultado:</h2>
    <pre id="resultado"></pre>

    <script>
        // Substitua pela URL pública do seu serviço no Render
        const RENDER_PROXY_URL = 'SUA_URL_DO_RENDER/proxy-route'; 

        async function fazerRequisicao(method) {
            const targetUrl = document.getElementById('url').value;
            const resultadoElement = document.getElementById('resultado');
            resultadoElement.textContent = 'Carregando...';

            // Dados que serão enviados no corpo da requisição POST (apenas exemplo)
            const postData = {
                url: targetUrl,
                userId: 10,
                title: "Novo Post de Teste",
                body: "Conteúdo do teste de proxy."
            };

            try {
                const response = await fetch(RENDER_PROXY_URL, {
                    method: 'POST', // Usamos POST para enviar a 'targetUrl' e os dados
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // O corpo da requisição será enviado para o seu servidor no Render,
                    // que o repassará ao destino.
                    body: JSON.stringify(postData)
                });

                const contentType = response.headers.get('content-type');
                let data;

                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }

                resultadoElement.textContent = 
                    `Status: ${response.status}\n\n` + 
                    JSON.stringify(data, null, 2);

            } catch (error) {
                resultadoElement.textContent = `Erro de rede/CORS: ${error.message}`;
                console.error('Fetch Error:', error);
            }
        }
    </script>
</body>
</html>
2.2 Hospedagem do HTML
Você pode hospedar este arquivo index.html em qualquer lugar:

Localmente: Basta abrir o arquivo no seu navegador (com algumas limitações).

Github Pages: Uma opção gratuita e rápida.

Outro Serviço Render: Crie um segundo serviço estático no Render.

Ao executar o index.html e clicar no botão, a requisição seguirá o fluxo:

Seu navegador envia POST /proxy-route para o Render.

O servidor no Render lê a targetUrl e usa o http-proxy-agent.

A requisição é enviada através do seu Proxy Secundário/Coletor.

O Proxy Secundário inspeciona e envia para o destino (jsonplaceholder.typicode.com).

O servidor Render recebe a resposta e a envia de volta para o seu navegador.