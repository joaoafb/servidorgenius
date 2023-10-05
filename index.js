const fs = require('fs');
const express = require('express');
const socketIO = require('socket.io');
const https = require('https'); // Use https instead of http
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
const uri = require('./mongodb.js');
const PORT = 8443; // Use a porta 443 para HTTPS
const jwt = require('jsonwebtoken');
const multer = require('multer');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase.json'); // Substitua pelo caminho correto do seu arquivo de configuração
const { calcularPrecoPrazo } = require('correios-brasil');



app.use(cors());



// Provide the paths to your SSL certificate and key
const options = {
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem'),
};

const server = https.createServer(options, app); // Create an HTTPS server
const io = socketIO(server);





function delay(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

app.use(express.json());






// Carregar os certificados SSL/TLS
const privateKey = fs.readFileSync('./private.key', 'utf8');
const certificate = fs.readFileSync('./certificate.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

async function main() {
    const client = new MongoClient(uri);

    try {
        // Conectar ao servidor MongoDB
        await client.connect();
        console.log('Conexão estabelecida com o servidor MongoDB');

        // Selecionar o banco de dados
        const db = client.db();

        // Faça algo com o banco de dados aqui, se desejar

        // Criar o servidor HTTPS com os certificados
        const httpsServer = https.createServer(credentials, app);

        // Iniciar o servidor Express após a conexão com o banco de dados
        httpsServer.listen(PORT, () => {
            console.log(`Servidor iniciado na porta ${PORT}`);
        });
    } catch (err) {
        console.error('Erro ao conectar ao servidor MongoDB', err);
    }
}

main().catch(console.error);

const publicWhats = path.join(__dirname, './GENIUSWHATS');
const publicPath = path.join(__dirname, './admin');
app.use(express.static(publicPath));

app.use(express.static(publicWhats));








// Rotas do Express
app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
});

// Rotas do Express
app.get('/home-marloscardoso', (req, res) => {
    res.sendFile(path.join(publicPath, 'home.html'));
});
app.get('/file-marloscardoso', (req, res) => {
    res.sendFile(path.join(publicPath, 'file.html'));
});




app.get('/rastreamento', (req, res) => {
    const externalUrl = 'https://linketrack.com/track';
    res.redirect(externalUrl);
});



// Rotas do Express

app.use(express.json());

function generateToken(user) {
    return jwt.sign({ username: user.username }, 'GeniusLeap', { expiresIn: '1h' });
}




app.post('/api/loginadmin', async(req, res) => {
    try {
        const { username, password } = req.body;

        // Conectar ao servidor MongoDB
        const client = new MongoClient(uri);
        await client.connect();


        // Selecionar o banco de dados
        const db = client.db('GeniusLeap');

        // Verificar se o usuário existe na coleção de usuários
        const user = await db.collection("Admin").findOne({ username, password });

        // Fechar a conexão com o MongoDB
        await client.close();
        // Gerar o token de autenticação

        if (user) {

            const tken = generateToken(user);
            const token = tken
            const loja = user.loja
            const nome = user.name
            const Estabelecimento = user.estabelecimento
            const codigo = user.codEstabelecimento
            const Permissao = user.permissao
            saveData(token);
            res.status(200).json({ message: "autorizado", token, loja, nome });
        } else {
            res.status(401).json({ message: 'negado' });
        }
    } catch (err) {
        console.error('Erro ao processar a solicitação', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
app.post('/api/marloscardoso/loginusuario', async(req, res) => {
    try {
        const { username, password } = req.body;

        // Conectar ao servidor MongoDB
        const client = new MongoClient(uri);
        await client.connect();


        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Verificar se o usuário existe na coleção de usuários
        const user = await db.collection("Clientes").findOne({ username, password });

        // Fechar a conexão com o MongoDB
        await client.close();
        // Gerar o token de autenticação

        if (user) {
            const tken = generateToken(user);
            const token = tken
            const cpf = user.cpf
            saveData(token, username, password);
            res.status(200).json({ message: 'Logado.', token, cpf });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas. Tente novamente.' });
        }
    } catch (err) {
        console.error('Erro ao processar a solicitação', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

async function saveData(token, username, password) {

    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db("MarlosCardoso");
    const collection = database.collection("Token");

    const newData = { usertoken: token, username: username, password: password };
    const result = await collection.insertOne(newData);

    console.log('Token Salvo', result.insertedId);

    await client.close();
}


app.post('/api/marloscardoso/token', async(req, res) => {
    try {
        const { token } = req.body;

        // Conectar ao servidor MongoDB
        const client = new MongoClient(uri);
        await client.connect();


        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Verificar se o usuário existe na coleção de usuários
        const user = await db.collection("Token").findOne({ usertoken: token });

        // Fechar a conexão com o MongoDB
        await client.close();
        // Gerar o token de autenticação

        if (user) {

            res.status(200).json({ message: 'Token Valido' });
        } else {
            res.status(401).json({ message: 'Token Invalido' });
        }
    } catch (err) {
        console.error('Erro ao processar a solicitação', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});




app.post('/api/marloscardoso/addproduto', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Produtos').insertOne(formData);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Produto Cadastrado' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
// Endpoint para receber os dados do formulário
app.post('/api/marloscardoso/pedidos', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Salvar os dados no MongoDB (coleção Pedidos)
        await db.collection('Pedidos').insertOne(formData);

        // Atualizar o estoque do produto associado
        const productId = formData.id; // Supondo que o campo _id no formData é o ID do produto
        const product = await db.collection('Produtos').findOne({ _id: productId });

        if (product) {
            // Se o produto for encontrado, diminuir 1 no estoque
            await db.collection('Produtos').updateOne({ _id: productId }, { $inc: { estoque: -1 } });
        }

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Pedido registrado e estoque atualizado' });

    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
// Endpoint para receber os dados do formulário




app.post('/api/marloscardoso/addpedidos', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente

        const precoDoProduto = formData.pricetotal // Valor em reais
        const descricaoDoProduto = JSON.stringify(formData.pedido.map(element => element.title));
        const currentUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const urlSucesso = 'https://marloscardoso.com/payment.html?id=' + formData.token;
        const urlCancelamento = 'https://marloscardoso.com/'

        // Chama a função para gerar o link de pagamento
        const linkPagamento = await gerarLinkPagamento(precoDoProduto, descricaoDoProduto, urlSucesso, urlCancelamento);

        // Verifica se o link de pagamento foi gerado com sucesso
        if (!linkPagamento) {
            console.error('Erro ao gerar o link de pagamento.');
            return res.status(500).json({ message: 'Erro no servidor.' });
        }

        // Adiciona o link de pagamento ao formData
        formData.linkPagamento = linkPagamento;

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Salvar os dados no MongoDB (coleção Pedidos)
        await db.collection('Pedidos').insertOne(formData);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Pedido Cadastrado' });




    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.post('/api/marloscardoso/alterarclientes', async(req, res) => {
    try {
        const Dados = req.body; // Dados enviados pelo cliente

        // Verificar se o ID do cliente é uma string válida
        if (!ObjectId.isValid(Dados.id)) {
            return res.status(400).json({ message: 'ID do cliente inválido.' });
        }

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Verificar se o documento já existe na coleção 'Clientes'
        const existingDocument = await db.collection('Clientes').findOne({ _id: new ObjectId(Dados.id) });

        if (existingDocument) {
            // Atualizar os dados no MongoDB (coleção Clientes)
            await db.collection('Clientes').updateOne({ _id: new ObjectId(Dados.id) }, { $set: Dados });

            // Fechar a conexão com o MongoDB
            await client.close();

            // Responder ao cliente com sucesso
            res.status(200).json({ message: 'Dados Alterados' });
        } else {
            // Caso o documento não exista, responda ao cliente com erro
            res.status(404).json({ message: 'Documento não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao atualizar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});





app.post('/api/marloscardoso/alterarprodutos', async(req, res) => {
    try {
        const Dados = req.body; // Dados enviados pelo cliente

        // Verificar se o ID do cliente é uma string válida
        if (!ObjectId.isValid(Dados.id)) {
            return res.status(400).json({ message: 'ID  inválido.' });
        }

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Verificar se o documento já existe na coleção 'Clientes'
        const existingDocument = await db.collection('Produtos').findOne({ _id: new ObjectId(Dados.id) });

        if (existingDocument) {
            // Atualizar os dados no MongoDB (coleção Clientes)
            await db.collection('Produtos').updateOne({ _id: new ObjectId(Dados.id) }, { $set: Dados });

            // Fechar a conexão com o MongoDB
            await client.close();

            // Responder ao cliente com sucesso
            res.status(200).json({ message: 'Dados Alterados' });
        } else {
            // Caso o documento não exista, responda ao cliente com erro
            res.status(404).json({ message: 'Documento não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao atualizar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});







// Endpoint para receber os dados do formulário
app.post('/api/marloscardoso/addcategoria', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Categorias').insertOne(formData);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Categoria Cadastrada' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


app.post('/api/marloscardoso/cadastrocliente', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Verificar se o usuário existe na coleção de usuários
        const { username, email, cpf } = formData;
        const usuarioExistente = await db.collection("Clientes").findOne({ username, email, cpf });

        if (usuarioExistente) {
            res.status(401).json({ message: 'Usuário/Email Indisponível!' });
        } else {
            // Salvar os dados no MongoDB (coleção Clientes)
            await db.collection('Clientes').insertOne(formData);


            res.status(200).json({ message: 'Cadastrado' });


        }

        // Fechar a conexão com o MongoDB
        await client.close();
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'geniusleap-2c33d.appspot.com', // Substitua pelo URL do seu bucket de armazenamento
});

const bucket = admin.storage().bucket();

// Configuração do multer para processar o upload da imagem
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite de 5 MB
    },
});

// Endpoint para receber o upload da imagem
app.post('/api/marloscardoso/imgproduto', upload.single('file'), async(req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            return;
        }

        const file = req.file;
        const fileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (error) => {
            console.error('Erro ao fazer o upload da imagem:', error);
            res.status(500).json({ error: 'Erro ao enviar a imagem.' });
        });


        blobStream.on('finish', () => {
            // Configuração da URL de download da imagem (expira em 1 hora)
            const config = {
                action: 'read',
                expires: '01-01-3000',
            };
            fileUpload.getSignedUrl(config, (err, url) => {
                if (err) {
                    console.error('Erro ao gerar a URL da imagem:', err);
                    res.status(500).json({ error: 'Erro ao enviar a imagem.' });
                } else {
                    console.log('Imagem enviada com sucesso.' + url);
                    res.status(200).json({ url });
                }
            });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});


// Endpoint para receber o upload da imagem
app.post('/api/marloscardoso/imgprodutomobile', upload.single('file'), async(req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            return;
        }

        const { token } = req.body; // Obtém o token enviado pelo cliente

        const file = req.file;
        const fileName = `${token}_${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (error) => {
            console.error('Erro ao fazer o upload da imagem:', error);
            res.status(500).json({ error: 'Erro ao enviar a imagem.' });
        });

        blobStream.on('finish', async() => {
            // Configuração da URL de download da imagem (expira em 1 hora)
            const config = {
                action: 'read',
                expires: '01-01-3000',
            };
            const [url] = await fileUpload.getSignedUrl(config);

            console.log('Imagem enviada com sucesso.', url);
            res.status(200).json({ url, token }); // Retorna o URL e o token
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

app.get('/api/marloscardoso/listprodutos', async(req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MarlosCardoso'); // Substitua pelo nome do seu banco de dados

        // Consulta os dados na coleção 'dados' (substitua pelo nome da sua coleção)
        const collection = db.collection('Produtos');
        // const dados = await collection.find({}, { projection: { id: 0, _id: 0 } }).toArray();
        const dados = await collection.find().toArray();
        await client.close();

        res.json(dados);


    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

app.get('/api/marloscardoso/listapedidos', async(req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MarlosCardoso'); // Substitua pelo nome do seu banco de dados

        // Consulta os dados na coleção 'dados' (substitua pelo nome da sua coleção)
        const collection = db.collection('Pedidos');
        const dados = await collection.find().toArray();

        await client.close();

        res.json(dados);
    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

app.get('/api/marloscardoso/listapedidosuser', async(req, res) => {
    try {
        const cpf = req.query.cpf; // Recupera o valor do parâmetro "cpf" da requisição
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MarlosCardoso'); // Substitua pelo nome do seu banco de dados

        // Consulta os dados na coleção 'Pedidos' filtrando pelo CPF
        const collection = db.collection('Pedidos');
        const dados = await collection.find({ cpf: cpf }).toArray();

        await client.close();

        res.json(dados);
    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

app.get('/api/marloscardoso/listcategorias', async(req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MarlosCardoso'); // Substitua pelo nome do seu banco de dados

        // Consulta os dados na coleção 'dados' (substitua pelo nome da sua coleção)
        const collection = db.collection('Categorias');
        const dados = await collection.find().toArray();

        await client.close();

        res.json(dados);
    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});
app.get('/api/marloscardoso/listclientes', async(req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MarlosCardoso'); // Substitua pelo nome do seu banco de dados

        // Consulta os dados na coleção 'dados' (substitua pelo nome da sua coleção)
        const collection = db.collection('Clientes');
        const clientes = await collection.find().toArray();
        const dados = clientes.map(cliente => ({
            _id: cliente._id,
            nome: cliente.nome,
            username: cliente.username,
            email: cliente.email
        })); // Extrai os campos desejados


        await client.close();

        res.json(dados);
        console.log(dados)
    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});
app.delete('/api/marloscardoso/produtos/:id', async(req, res) => {
    try {
        const idDoProdutoParaApagar = req.params.id;

        // Verifica se o ID fornecido é um ObjectId válido do MongoDB
        if (!ObjectId.isValid(idDoProdutoParaApagar)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }
        const client = new MongoClient(uri);

        await client.connect();
        const collection = client.db("MarlosCardoso").collection('Produtos');

        const result = await collection.deleteOne({ _id: new ObjectId(idDoProdutoParaApagar) });

        if (result.deletedCount === 1) {
            return res.json({ message: 'Produto apagado com sucesso.' });
        } else {
            return res.status(404).json({ message: 'Nenhum produto encontrado com o ID fornecido.' });
        }
    } catch (err) {
        console.error('Erro ao apagar produto:', err);
        res.status(500).json({ message: 'Erro ao apagar produto.' });
    } finally {

    }
});

app.delete('/api/marloscardoso/categorias/:id', async(req, res) => {
    try {
        const idDoProdutoParaApagar = req.params.id;

        // Verifica se o ID fornecido é um ObjectId válido do MongoDB
        if (!ObjectId.isValid(idDoProdutoParaApagar)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }
        const client = new MongoClient(uri);

        await client.connect();
        const collection = client.db("MarlosCardoso").collection('Categorias');

        const result = await collection.deleteOne({ _id: new ObjectId(idDoProdutoParaApagar) });

        if (result.deletedCount === 1) {
            return res.json({ message: 'Categoria apagada com sucesso.' });
        } else {
            return res.status(404).json({ message: 'Nenhuma categoria encontrado com o ID fornecido.' });
        }
    } catch (err) {
        console.error('Erro ao apagar produto:', err);
        res.status(500).json({ message: 'Erro ao apagar produto.' });
    } finally {

    }
});

// Endpoint para receber o upload da imagem
app.post('/api/marloscardoso/imgcategoria', upload.single('file'), async(req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            return;
        }

        const file = req.file;
        const fileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (error) => {
            console.error('Erro ao fazer o upload da imagem:', error);
            res.status(500).json({ error: 'Erro ao enviar a imagem.' });
        });


        blobStream.on('finish', () => {
            // Configuração da URL de download da imagem (expira em 1 hora)
            const config = {
                action: 'read',
                expires: '01-01-3000',
            };
            fileUpload.getSignedUrl(config, (err, url) => {
                if (err) {
                    console.error('Erro ao gerar a URL da imagem:', err);
                    res.status(500).json({ error: 'Erro ao enviar a imagem.' });
                } else {
                    console.log('Imagem enviada com sucesso.' + url);
                    res.status(200).json({ url });
                }
            });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});



// Endpoint para excluir um usuário
app.delete('/api/marloscardoso/excluirusuario/:id', async(req, res) => {
    try {
        const id = req.params.id; // ID do usuário a ser excluído

        // Verificar se o ID do usuário é uma string válida
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID do usuário inválido.' });
        }

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MarlosCardoso');

        // Verificar se o documento existe na coleção 'Usuarios'
        const existingDocument = await db.collection('Clientes').findOne({ _id: new ObjectId(id) });

        if (existingDocument) {
            // Excluir o usuário do MongoDB (coleção Usuarios)
            await db.collection('Clientes').deleteOne({ _id: new ObjectId(id) });

            // Fechar a conexão com o MongoDB
            await client.close();

            // Responder ao cliente com sucesso
            res.status(200).json({ message: 'Usuário excluído com sucesso.' });
        } else {
            // Caso o documento não exista, responda ao cliente com erro
            res.status(404).json({ message: 'Usuário não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao excluir o usuário no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripemarloscardoso = require('stripe')('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');
// Função para criar um link de pagamento com o Stripe
async function gerarLinkPagamento(preco, descricao, urlSucesso, urlCancelamento) {
    try {
        const session = await stripemarloscardoso.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'brl',
                    unit_amount: preco * 100, // O preço é passado em centavos
                    product_data: {
                        name: descricao,
                    },
                },
                quantity: 1,
            }, ],
            mode: 'payment',
            success_url: urlSucesso,
            cancel_url: urlCancelamento,
        });

        return session.url;
    } catch (error) {
        console.error('Erro ao gerar o link de pagamento:', error.message);
        return null;
    }
}


app.put('/api/marloscardoso/atualizar-status/:id', async(req, res) => {
    const pedidoId = req.params.id;

    try {
        // Conectar ao MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db('MarlosCardoso');

        // Procurar o pedido com o ID fornecido
        const collection = db.collection('Pedidos');
        const pedidoEncontrado = await collection.findOne({ token: pedidoId });

        if (!pedidoEncontrado) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        // Verificar se o status atual do pedido é diferente de "Compra Aprovada"
        if (pedidoEncontrado.status === 'Compra Aprovada') {


            return res.json({ message: 'O pedido já está com status de "Compra Aprovada".' });

        }

        // Atualizar o status do pedido para "Compra Aprovada"
        const updatedPedido = await collection.findOneAndUpdate({ token: pedidoId }, { $set: { status: 'Compra Aprovada' } }, { returnOriginal: false });

        // Fechar a conexão com o MongoDB
        client.close();

        return res.json({ message: 'Status do pedido atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar o status do pedido:', error);

        return res.status(500).json({ error: 'Erro ao atualizar o status do pedido.' });
    }
});



app.put('/api/marloscardoso/payment-failed/:id', async(req, res) => {
    const pedidoId = req.params.id;

    try {
        // Conectar ao MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db('MarlosCardoso');

        // Procurar o pedido com o ID fornecido
        const collection = db.collection('Pedidos');
        const pedidoEncontrado = await collection.findOne({ token: pedidoId });

        if (!pedidoEncontrado) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        // Verificar se o status atual do pedido é diferente de "Compra Aprovada"
        if (pedidoEncontrado.status === 'Erro no pagamento!') {
            return res.json({ message: 'O pedido já está com status de "Erro no pagamento".' });
        }

        // Atualizar o status do pedido para "Compra Aprovada"
        const updatedPedido = await collection.findOneAndUpdate({ token: pedidoId }, { $set: { status: 'Erro no pagamento' } }, { returnOriginal: false });

        // Fechar a conexão com o MongoDB
        client.close();

        return res.json({ message: 'Status do pedido atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar o status do pedido:', error);

        return res.status(500).json({ error: 'Erro ao atualizar o status do pedido.' });
    }
});


app.put('/api/marloscardoso/pedido-postado/:id/:cod', async(req, res) => {
    const pedidoId = req.params.id;
    const pedidoCod = req.params.cod;

    try {
        // Conectar ao MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db('MarlosCardoso');

        // Procurar o pedido com o ID fornecido
        const collection = db.collection('Pedidos');
        const pedidoEncontrado = await collection.findOne({ token: pedidoId });


        if (!pedidoEncontrado) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        // Verificar se o status atual do pedido é diferente de "Compra Aprovada"
        if (pedidoEncontrado.status === 'Erro no pagamento!') {
            return res.json({ message: 'O pedido já está com status de "Erro no pagamento".' });
        }

        // Atualizar o status do pedido para "Compra Aprovada"
        const updatedPedido = await collection.findOneAndUpdate({ token: pedidoId }, { $set: { status: 'Pedido Postado', codRastreio: pedidoCod } }, { returnOriginal: false });

        // Fechar a conexão com o MongoDB
        client.close();

        return res.json({ message: 'Status do pedido atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar o status do pedido:', error);

        return res.status(500).json({ error: 'Erro ao atualizar o status do pedido.' });
    }
});



app.put('/api/marloscardoso/pagamento-combinar/:id', async(req, res) => {
    const pedidoId = req.params.id;
    console.log(pedidoId)

    try {
        // Conectar ao MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db('MarlosCardoso');

        // Procurar o pedido com o ID fornecido
        const collection = db.collection('Pedidos');
        const pedidoEncontrado = await collection.findOne({ token: pedidoId });



        if (!pedidoEncontrado) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        // Verificar se o status atual do pedido é diferente de "Compra Aprovada"
        if (pedidoEncontrado.status === 'Erro no pagamento!') {
            return res.json({ message: 'O pedido já está com status de "Erro no pagamento".' });
        }

        // Atualizar o status do pedido para "Compra Aprovada"
        const updatedPedido = await collection.findOneAndUpdate({ token: pedidoId }, { $set: { status: 'Pedido Postado', codRastreio: pedidoCod } }, { returnOriginal: false });

        // Fechar a conexão com o MongoDB
        client.close();

        return res.json({ message: 'Status do pedido atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar o status do pedido:', error);

        return res.status(500).json({ error: 'Erro ao atualizar o status do pedido.' });
    }
});



app.put('/api/marloscardoso/pedido-finalizado/:id', async(req, res) => {
    const pedidoId = req.params.id;


    try {
        // Conectar ao MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db('MarlosCardoso');

        // Procurar o pedido com o ID fornecido
        const collection = db.collection('Pedidos');
        const pedidoEncontrado = await collection.findOne({ token: pedidoId });


        if (!pedidoEncontrado) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }



        // Atualizar o status do pedido para "Compra Aprovada"
        const updatedPedido = await collection.findOneAndUpdate({ token: pedidoId }, { $set: { status: 'Pedido Finalizado' } }, { returnOriginal: false });

        // Fechar a conexão com o MongoDB
        client.close();

        return res.json({ message: 'Status do pedido atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar o status do pedido:', error);

        return res.status(500).json({ error: 'Erro ao atualizar o status do pedido.' });
    }
});

app.put('/api/marloscardoso/pedido-cancelado/:id', async(req, res) => {
    const pedidoId = req.params.id;


    try {
        // Conectar ao MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db('MarlosCardoso');

        // Procurar o pedido com o ID fornecido
        const collection = db.collection('Pedidos');
        const pedidoEncontrado = await collection.findOne({ token: pedidoId });



        if (!pedidoEncontrado) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }



        // Atualizar o status do pedido para "Compra Aprovada"
        const updatedPedido = await collection.findOneAndUpdate({ token: pedidoId }, { $set: { status: 'Pedido Cancelado' } }, { returnOriginal: false });

        // Fechar a conexão com o MongoDB
        client.close();

        return res.json({ message: 'Status do pedido atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar o status do pedido:', error);

        return res.status(500).json({ error: 'Erro ao atualizar o status do pedido.' });
    }
});
app.put('/api/marloscardoso/pedido-aprovado/:id', async(req, res) => {
    const pedidoId = req.params.id;


    try {
        // Conectar ao MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db('MarlosCardoso');

        // Procurar o pedido com o ID fornecido
        const collection = db.collection('Pedidos');
        const pedidoEncontrado = await collection.findOne({ token: pedidoId });



        if (!pedidoEncontrado) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }



        // Atualizar o status do pedido para "Compra Aprovada"
        const updatedPedido = await collection.findOneAndUpdate({ token: pedidoId }, { $set: { status: 'Compra Aprovada' } }, { returnOriginal: false });

        // Fechar a conexão com o MongoDB
        client.close();

        return res.json({ message: 'Status do pedido atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar o status do pedido:', error);

        return res.status(500).json({ error: 'Erro ao atualizar o status do pedido.' });
    }
});



app.post('/calcularFrete', (req, res) => {
    const args = req.body;

    calcularPrecoPrazo(args).then(response => {
            console.log(response);
            res.json(response);
        }).then(response => {

        })
        .catch(error => {
            console.error('Erro ao calcular frete:', error);
            res.status(500).json({ error: 'Erro ao calcular frete' });
        });
});


app.get('/api/marloscardoso/pedidos-client', async(req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MarlosCardoso'); // Substitua pelo nome do seu banco de dados

        // Consulta os dados na coleção 'Pedidos' (substitua pelo nome da sua coleção)
        const collection = db.collection('Pedidos');
        const dados = await collection.find().project({ _id: 0, token: 1, linkPagamento: 1 }).toArray();

        await client.close();

        res.json(dados);
    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});


//GENIUS

app.get('/genius/usuarios', async(req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db("GeniusLeap");

        const collection = db.collection('Admin');
        const adminData = await collection.find().project({ password: 0 }).toArray();

        client.close();

        res.json(adminData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar os dados do admin.' });
    }
});


app.post('/genius/adduser', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('GeniusLeap');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Admin').insertOne(formData);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Usuario Cadastrado' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.delete('/genius/deleteuser/', async(req, res) => {
    try {
        const { iduser } = req.body
        console.log(iduser)

        // Verifica se o ID fornecido é um ObjectId válido do MongoDB
        if (!ObjectId.isValid(iduser)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }
        const client = new MongoClient(uri);

        await client.connect();
        const collection = client.db("GeniusLeap").collection('Admin');

        const result = await collection.deleteOne({ _id: new ObjectId(iduser) });

        if (result.deletedCount === 1) {
            return res.json({ message: 'Apagado' });
        } else {
            return res.status(404).json({ message: 'Inexistente' });
        }
    } catch (err) {
        console.error('Erro ao apagar produto:', err);
        res.status(500).json({ message: 'Erro ao apagar produto.' });
    } finally {

    }
});



app.post('/api/gestaogl/addproduto', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('GestãoGL');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Produtos').insertOne(formData);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Produto Cadastrado' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.get('/api/gestaogl/getprodutos', async(req, res) => {
    try {
        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('GestãoGL');

        // Selecionar a coleção de Produtos e buscar os dados
        const produtos = await db.collection('Produtos').find({}).toArray();

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com os dados obtidos
        res.status(200).json(produtos);
    } catch (err) {
        console.error('Erro ao buscar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});



app.post('/menugenius/login', async(req, res) => {
    try {
        const { username, password } = req.body;

        // Conectar ao servidor MongoDB
        const client = new MongoClient(uri);
        await client.connect();


        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Verificar se o usuário existe na coleção de usuários
        const user = await db.collection("Admin").findOne({ username, password });


        // Fechar a conexão com o MongoDB
        await client.close();
        // Gerar o token de autenticação

        if (user) {

            const tken = generateToken(user);
            const token = tken
            const nome = user.nome
            const username = user.username
            const Estabelecimento = user.estabelecimento
            const codigo = user.codEstabelecimento
            const Permissao = user.permissao
            saveData(token);

            res.status(200).json({ message: "autorizado", token, nome, username, Estabelecimento, codigo, Permissao });


        } else {
            res.status(401).json({ message: 'negado' });
        }
    } catch (err) {
        console.error('Erro ao processar a solicitação', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.get('/menugenius/estabelecimentos/:estabelecimento', async(req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MenuGenius'); // Substitua pelo nome do seu banco de dados

        const collection = db.collection('Estabelecimentos');

        // Obtém o valor do parâmetro 'estabelecimento' da URL
        const estabelecimentoParam = req.params.estabelecimento;

        // Consulta os estabelecimentos com base no valor do parâmetro
        const dados = await collection.find({ codEstabelecimento: estabelecimentoParam }).toArray();
        await client.close();

        res.json(dados);
    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});



app.post('/menugenius/add/categoria/:estabelecimento/', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente
        const codigo = req.params.estabelecimento
            // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Categorias' + codigo).insertOne(formData);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Cadastrado' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.get('/menugenius/list/categorias/:estabelecimento', async(req, res) => {

    try {
        const codigo = req.params.estabelecimento
            // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Selecionar a coleção de Produtos e buscar os dados
        const categorias = await db.collection('Categorias' + codigo).find({}).toArray();

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com os dados obtidos
        res.status(200).json(categorias);
    } catch (err) {
        console.error('Erro ao buscar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
app.get('/menugenius/list/produtos/:estabelecimento', async(req, res) => {

    try {
        const codigo = req.params.estabelecimento
            // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Selecionar a coleção de Produtos e buscar os dados
        const categorias = await db.collection('Produtos' + codigo).find({}).toArray();

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com os dados obtidos
        res.status(200).json(categorias);
    } catch (err) {
        console.error('Erro ao buscar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
app.delete('/menugenius/list/categorias/excluir/:estabelecimento/:categoria', async(req, res) => {
    try {
        const { estabelecimento, categoria } = req.params;
        const client = new MongoClient(uri);
        await client.connect();
        const collection = client.db("MenuGenius").collection('Categorias' + estabelecimento);

        const result = await collection.deleteOne({ titulo: categoria });

        if (result.deletedCount === 1) {
            return res.json({ message: 'Excluído' });
        } else {
            return res.status(404).json({ message: 'Nenhuma categoria encontrada para exclusão.' });
        }
    } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        res.status(500).json({ message: 'Erro ao excluir categoria.' });
    } finally {

    }
});


// Endpoint para receber o upload da imagem
app.post('/menugenius/add/imagem', upload.single('file'), async(req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            return;
        }

        const file = req.file;
        const fileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (error) => {
            console.error('Erro ao fazer o upload da imagem:', error);
            res.status(500).json({ error: 'Erro ao enviar a imagem.' });
        });


        blobStream.on('finish', () => {
            // Configuração da URL de download da imagem (expira em 1 hora)
            const config = {
                action: 'read',
                expires: '01-01-3000',
            };
            fileUpload.getSignedUrl(config, (err, url) => {
                if (err) {
                    console.error('Erro ao gerar a URL da imagem:', err);
                    res.status(500).json({ error: 'Erro ao enviar a imagem.' });
                } else {
                    console.log('Imagem enviada com sucesso.' + url);
                    res.status(200).json({ url });
                }
            });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
})


app.post('/menugenius/add/produto/:estabelecimento/', async(req, res) => {
    try {
        const formData = req.body; // Dados enviados pelo cliente
        const codigo = req.params.estabelecimento
            // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Produtos' + codigo).insertOne(formData);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Cadastrado' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
})

app.delete('/menugenius/excluir/produtos/:estabelecimento/:id', async(req, res) => {
    try {
        const idDoProdutoParaApagar = req.params.id;
        const estabelecimento = req.params.estabelecimento;

        // Verifica se o ID fornecido é um ObjectId válido do MongoDB
        if (!ObjectId.isValid(idDoProdutoParaApagar)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }
        const client = new MongoClient(uri);

        await client.connect();
        const collection = client.db("MenuGenius").collection('Produtos' + estabelecimento);

        const result = await collection.deleteOne({ _id: new ObjectId(idDoProdutoParaApagar) });

        if (result.deletedCount === 1) {
            return res.json({ message: 'Excluido' });
        } else {
            return res.status(404).json({ message: 'Nenhum produto encontrado com o ID fornecido.' });
        }
    } catch (err) {
        console.error('Erro ao apagar produto:', err);
        res.status(500).json({ message: 'Erro ao apagar produto.' });
    } finally {

    }
});

app.post('/menugenius/alterar/produtos', async(req, res) => {
    try {
        const Dados = req.body; // Dados enviados pelo cliente

        // Verificar se o ID do cliente é uma string válida
        if (!ObjectId.isValid(Dados.id)) {
            return res.status(400).json({ message: 'ID  inválido.' });
        }

        // Conectar ao MongoDB 
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Verificar se o documento já existe na coleção 'Clientes'
        const existingDocument = await db.collection('Produtos' + Dados.estabelecimento).findOne({ _id: new ObjectId(Dados.id) });

        if (existingDocument) {
            // Atualizar os dados no MongoDB (coleção Clientes)
            await db.collection('Produtos' + Dados.estabelecimento).updateOne({ _id: new ObjectId(Dados.id) }, { $set: Dados });

            // Fechar a conexão com o MongoDB
            await client.close();

            // Responder ao cliente com sucesso
            res.status(200).json({ message: 'Dados Alterados' });
        } else {
            // Caso o documento não exista, responda ao cliente com erro
            res.status(404).json({ message: 'Documento não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao atualizar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


app.get('/menugenius/list/pedidos/:estabelecimento', async(req, res) => {
    try {
        const codigo = req.params.estabelecimento;

        // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Selecionar a coleção de Pedidos e buscar os dados filtrando por status 'Disponível'
        const categorias = await db.collection('Pedidos' + codigo)
            .find({ status: 'Disponível' })
            .toArray();

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com os dados filtrados
        res.status(200).json(categorias);
    } catch (err) {
        console.error('Erro ao buscar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});




app.post('/menugenius/alterar/status/:estabelecimento/:produto', async(req, res) => {
    const pedidoId = req.params.produto;
    const estabelecimentoId = req.params.estabelecimento;
    const collectionName = 'Produtos' + estabelecimentoId;
    const notFoundMessage = 'Documento não encontrado.';

    try {
        // Conectar ao MongoDB 
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Verificar se o documento já existe na coleção
        const existingDocument = await db.collection(collectionName).findOne({ _id: new ObjectId(pedidoId) });

        if (existingDocument) {
            // Alternar entre "Disponível" e "Esgotado"
            const newStatus = existingDocument.status === 'Disponível' ? 'Esgotado' : 'Disponível';

            // Atualizar o status no MongoDB
            await db.collection(collectionName).updateOne({ _id: new ObjectId(pedidoId) }, { $set: { status: newStatus } });

            // Fechar a conexão com o MongoDB
            await client.close();

            // Responder ao cliente com sucesso e o novo status
            res.status(200).json({ message: 'Dados Alterados', novoStatus: newStatus });
        } else {
            // Caso o documento não exista, responda ao cliente com erro
            res.status(404).json({ message: notFoundMessage });
        }
    } catch (error) {
        console.error('Erro ao alterar o status do pedido:', error);
        res.status(500).json({ error: 'Erro ao alterar o status do pedido.' });
    }
});

async function atualizarStatusPedido(req, res) {
    const { pedido, estabelecimento, status } = req.params;
    const collectionName = 'Pedidos' + estabelecimento;
    const successMessage = 'Dados Alterados';
    const notFoundMessage = 'Documento não encontrado.';

    try {
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MenuGenius');
        const existingDocument = await db.collection(collectionName).findOne({ _id: new ObjectId(pedido) });

        if (existingDocument) {
            await db.collection(collectionName).updateOne({ _id: new ObjectId(pedido) }, { $set: { status } });
            await client.close();
            res.status(200).json({ message: successMessage });
        } else {
            res.status(404).json({ message: notFoundMessage });
        }
    } catch (error) {
        console.error('Erro ao alterar o status do pedido:', error);
        res.status(500).json({ error: 'Erro ao alterar o status do pedido.' });
    }
}

// Rota para atualizar o status do pedido
app.post('/menugenius/alterar/status-pedido/:estabelecimento/:pedido/:status', atualizarStatusPedido);



app.post('/menugenius/add/cart/:estabelecimento/:token/', async(req, res) => {
    try {
        const Data = req.body; // Dados enviados pelo cliente

        const cliente = req.params.token

        const client = new MongoClient(uri);
        await client.connect();



        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Carrinho' + cliente).insertOne(Data);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Cadastrado' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
})

app.get('/menugenius/list/cart/:cliente', async(req, res) => {

    try {
        const cliente = req.params.cliente
            // Conectar ao MongoDB
        const client = new MongoClient(uri);
        await client.connect();

        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Selecionar a coleção de Produtos e buscar os dados
        const carrinho = await db.collection('Carrinho' + cliente).find({}).toArray();

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com os dados obtidos
        res.status(200).json(carrinho);
    } catch (err) {
        console.error('Erro ao buscar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.delete('/menugenius/excluir/cart/:cliente/:id', async(req, res) => {
    try {
        const idDoProdutoParaApagar = req.params.id;
        const cliente = req.params.cliente;

        // Verifica se o ID fornecido é um ObjectId válido do MongoDB
        if (!ObjectId.isValid(idDoProdutoParaApagar)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }
        const client = new MongoClient(uri);

        await client.connect();
        const collection = client.db("MenuGenius").collection('Carrinho' + cliente);

        const result = await collection.deleteOne({ _id: new ObjectId(idDoProdutoParaApagar) });

        if (result.deletedCount === 1) {
            return res.json({ message: 'Excluido' });
        } else {
            return res.status(404).json({ message: 'Nenhum produto encontrado com o ID fornecido.' });
        }
    } catch (err) {
        console.error('Erro ao apagar produto:', err);
        res.status(500).json({ message: 'Erro ao apagar produto.' });
    } finally {

    }
});

app.post('/menugenius/add/pedidos/:estabelecimento/', async(req, res) => {
    try {
        const Data = req.body; // Dados enviados pelo cliente


        const client = new MongoClient(uri);
        await client.connect();



        // Selecionar o banco de dados
        const db = client.db('MenuGenius');

        // Salvar os dados no MongoDB (coleção Produtos)
        await db.collection('Pedidos' + req.params.estabelecimento).insertOne(Data);

        // Fechar a conexão com o MongoDB
        await client.close();

        // Responder ao cliente com sucesso
        res.status(200).json({ message: 'Cadastrado' });
    } catch (err) {
        console.error('Erro ao salvar os dados no MongoDB', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
})

app.get('/menugenius/pedidos/:estabelecimento/:token', async(req, res) => {
    try {
        const token = req.params.token;
        const estabelecimento = req.params.estabelecimento // Recupera o valor do parâmetro "cpf" da requisição
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('MenuGenius'); // Substitua pelo nome do seu banco de dados

        // Consulta os dados na coleção 'Pedidos' filtrando pelo CPF
        const collection = db.collection('Pedidos' + estabelecimento);
        const dados = await collection.find({ token: token }).toArray();

        await client.close();

        res.json(dados);
    } catch (err) {
        console.error('Erro ao consultar os dados:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});