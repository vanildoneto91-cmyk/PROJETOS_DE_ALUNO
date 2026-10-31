import {
    inserirCurso, listarCursos,
    inserirAluno, listarAlunos, listarAlunosDoCurso,
    atualizarAluno
} from './supabase.js';

async function main() {
    try {
        for (const nome of ['ADS', 'Gestão Comercial']) {
            try {
                await inserirCurso(nome);
            } catch (e) {
                console.log(`Curso "${nome}" não inserido (talvez já exista)`);
            }
        }
        const cursos = await listarCursos();
        console.log('Cursos:', cursos);

        const ads = cursos.find((c) => c.nome === 'ADS');
        const gestao = cursos.find((c) => c.nome === 'Gestão Comercial');

        if (ads) {
            try {
                const novo = await inserirAluno('Maria Silva', '2026001', ads.id);
                console.log('Inserido com sucesso:', novo);
            } catch (e) {
                console.log('Não inseriu (talvez RA já exista):', e.message || e);
            }
        }

        const todos = await listarAlunos();
        console.log(`Total: ${todos.length}`, todos);

        if (gestao) {
            await atualizarAluno('2026001', 'Maria Silva', gestao.id);
            const daGestao = await listarAlunosDoCurso(gestao.id);
            console.log('Alunos de Gestão Comercial:', daGestao);
        }
    } catch (err) {
        console.error('ERRO GERAL:', err.message || err);
    }
}

main();