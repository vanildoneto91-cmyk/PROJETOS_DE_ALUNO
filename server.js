import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    inserirCurso,
    listarCursos,
    excluirCurso,
    inserirAluno,
    listarAlunos,
    listarAlunosDoCurso,
    buscarPorRa,
    atualizarAluno,
    excluirPorRa,
    listarAlunosPaginado // <--- 1. ADICIONAR ESTA IMPORTAÇÃO AQUI NO TOPO
} from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERRO_CHAVE_ESTRANGEIRA = '23503';
const app = express();

app.use(express.json());

// CONFIGURAÇÃO DOS FICHEIROS ESTÁTICOS (FRONTEND)
app.use(express.static(path.join(__dirname, 'frontend')));

// ===== ALUNOS =====
app.get('/alunos', async (req, res) => {
    try {
        const pagina = lerPagina(req.query);
        if (pagina && pagina.erro) {
            return res.status(400).json({ erro: pagina.erro });
        }

        if (pagina) {
            const dados = await listarAlunosPaginado(pagina.inicio, pagina.limite);
            return res.json({ ...dados, inicio: pagina.inicio, limite: pagina.limite });
        }

        const dados = await listarAlunos();
        res.json(dados);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.get('/alunos/:ra', async (req, res) => {
    try {
        const aluno = await buscarPorRa(req.params.ra);
        if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado' });
        res.json(aluno);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.post('/alunos', async (req, res) => {
    try {
        const { nome, ra, curso_id } = req.body;
        if (!nome || !ra || !curso_id) {
            return res.status(400).json({ erro: 'Campos obrigatórios: nome, ra e curso_id' });
        }
        const aluno = await inserirAluno(nome, ra, curso_id);
        res.status(201).json(aluno);
    } catch (e) {
        if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(400).json({ erro: 'O curso informado não existe' });
        }
        res.status(400).json({ erro: e.message });
    }
});

app.put('/alunos/:ra', async (req, res) => {
    try {
        const { nome, curso_id } = req.body;
        if (!nome && !curso_id) {
            return res.status(400).json({ erro: 'Informe nome e/ou curso_id para atualizar' });
        }
        const data = await atualizarAluno(req.params.ra, nome, curso_id);
        res.json(data);
    } catch (e) {
        if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(400).json({ erro: 'O curso informado não existe' });
        }
        res.status(400).json({ erro: e.message });
    }
});

app.delete('/alunos/:ra', async (req, res) => {
    try {
        const data = await excluirPorRa(req.params.ra);
        res.json(data);
    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
});

// ===== CURSOS =====
app.get('/cursos', async (req, res) => {
    try {
        res.json(await listarCursos());
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.post('/cursos', async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ erro: 'Campo obrigatório: nome' });
        res.status(201).json(await inserirCurso(nome));
    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
});

app.delete('/cursos/:id', async (req, res) => {
    try {
        res.json(await excluirCurso(req.params.id));
    } catch (e) {
        if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(409).json({ erro: 'Não é possível excluir: este curso ainda tem alunos' });
        }
        res.status(400).json({ erro: e.message });
    }
});

// 2. ADICIONAR A ROTA GET /cursos/:id/alunos COM PAGINAÇÃO:
app.get('/cursos/:id/alunos', async (req, res) => {
    try {
        const pagina = lerPagina(req.query);
        if (pagina && pagina.erro) {
            return res.status(400).json({ erro: pagina.erro });
        }

        if (pagina) {
            const dados = await listarAlunosPaginado(pagina.inicio, pagina.limite, req.params.id);
            return res.json({ ...dados, inicio: pagina.inicio, limite: pagina.limite });
        }

        res.json(await listarAlunosDoCurso(req.params.id));
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

function lerPagina(query) {
    if (query.limite === undefined && query.inicio === undefined) return null;
    const limite = Number(query.limite);
    const inicio = Number(query.inicio);

    if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
        return { erro: 'Informe limite entre 1 e 100' };
    }
    if (!Number.isInteger(inicio) || inicio < 0) {
        return { erro: 'Início inválido' };
    }
    return { inicio, limite };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});