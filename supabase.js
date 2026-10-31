import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY no ficheiro .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COLUNAS_ALUNO = 'id, nome, ra, curso_id, criado_em, curso:cursos(id, nome)';

export async function inserirCurso(nome) {
    const { data, error } = await supabase
        .from('cursos')
        .insert([{ nome }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function listarCursos() {
    const { data, error } = await supabase
        .from('cursos')
        .select('id, nome, alunos:aluno(count)')
        .order('nome', { ascending: true });

    if (error) throw error;

    return data.map((curso) => ({
        id: curso.id,
        nome: curso.nome,
        total_alunos: curso.alunos?.[0]?.count ?? 0,
    }));
}

export async function excluirCurso(id) {
    const { data, error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
}

export async function inserirAluno(nome, ra, cursoId) {
    const { data, error } = await supabase
        .from('aluno')
        .insert([{ nome, ra, curso_id: cursoId }])
        .select(COLUNAS_ALUNO)
        .single();

    if (error) throw error;
    return data;
}

export async function listarAlunos() {
    const { data, error } = await supabase
        .from('aluno')
        .select(COLUNAS_ALUNO)
        .order('nome', { ascending: true });

    if (error) throw error;
    return data;
}

export async function listarAlunosDoCurso(cursoId) {
    const { data, error } = await supabase
        .from('aluno')
        .select(COLUNAS_ALUNO)
        .eq('curso_id', cursoId)
        .order('nome', { ascending: true });

    if (error) throw error;
    return data;
}

export async function buscarPorRa(ra) {
    const { data, error } = await supabase
        .from('aluno')
        .select(COLUNAS_ALUNO)
        .eq('ra', ra)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function atualizarAluno(ra, nome, cursoId) {
    const campos = {};
    if (nome) campos.nome = nome;
    if (cursoId) campos.curso_id = cursoId;

    if (Object.keys(campos).length === 0) {
        throw new Error('Informe nome e/ou curso_id para atualizar');
    }

    const { data, error } = await supabase
        .from('aluno')
        .update(campos)
        .eq('ra', ra)
        .select(COLUNAS_ALUNO);

    if (error) throw error;
    return data;
}

export async function excluirPorRa(ra) {
    const { data, error } = await supabase
        .from('aluno')
        .delete()
        .eq('ra', ra)
        .select();

    if (error) throw error;
    return data;
}