const tabelaCursos = document.getElementById('tabela-cursos');
const tabela = document.getElementById('tabela-alunos');
const msg = document.getElementById('msg');
const modal = document.getElementById('modal');
const modalFundo = document.getElementById('modal-fundo');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-aluno');
const inputNome = document.getElementById('nome');
const inputRa = document.getElementById('ra');
const selectCurso = document.getElementById('curso');
const filtroCurso = document.getElementById('filtro-curso');
const formCurso = document.getElementById('form-curso');
const inputNovoCurso = document.getElementById('novo-curso');
const alunosStatus = document.getElementById('alunos-status');
const sentinelaAlunos = document.getElementById('sentinela-alunos');
const formBusca = document.getElementById('form-busca');
const inputBusca = document.getElementById('busca-aluno');
const criterioPesquisa = document.getElementById('criterio-pesquisa');

let modo = 'criar';
let raEditando = '';

// Variáveis de estado para a paginação e pesquisa
const ALUNOS_POR_PAGINA = 5;
let alunosInicio = 0;
let alunosTotal = 0;
let alunosTemMais = false;
let alunosCarregando = false;
let alunosErro = false;
let alunosPedido = 0;
let alunosBusca = '';

function mostrarMsg(texto, tipo = '') {
    msg.hidden = false;
    msg.textContent = texto;
    msg.className = 'msg ' + (tipo ? tipo : '');
}

// ===== CURSOS =====
async function listarCursos() {
    try {
        const resposta = await fetch('/cursos');
        const cursos = await resposta.json();
        if (!resposta.ok) {
            mostrarMsg(cursos.erro || 'Erro ao listar cursos', 'erro');
            return;
        }
        montarTabelaCursos(cursos);
        preencherSelects(cursos);
    } catch (e) {
        mostrarMsg('Erro ao ligar ao servidor para listar cursos', 'erro');
    }
}

function montarTabelaCursos(cursos) {
    if (!cursos.length) {
        tabelaCursos.innerHTML = '<tr><td colspan="3" class="vazio">Nenhum curso cadastrado ainda.</td></tr>';
        return;
    }
    tabelaCursos.innerHTML = '';
    for (const curso of cursos) {
        const tr = document.createElement('tr');

        const tdNome = document.createElement('td');
        tdNome.textContent = curso.nome;

        const tdTotal = document.createElement('td');
        tdTotal.textContent = curso.total_alunos;

        const tdAcoes = document.createElement('td');
        tdAcoes.className = 'acoes';

        const btnVer = document.createElement('button');
        btnVer.textContent = 'Ver alunos';
        btnVer.className = 'btn btn-secundario btn-pequeno';
        btnVer.onclick = () => {
            filtroCurso.value = curso.id;
            listarAlunos(false);
        };

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.className = 'btn btn-perigo btn-pequeno';
        btnExcluir.onclick = () => excluirCurso(curso.id, curso.nome);

        tdAcoes.appendChild(btnVer);
        tdAcoes.appendChild(btnExcluir);

        tr.appendChild(tdNome);
        tr.appendChild(tdTotal);
        tr.appendChild(tdAcoes);
        tabelaCursos.appendChild(tr);
    }
}

function preencherSelects(cursos) {
    const filtroAtual = filtroCurso.value;
    const cursoAtual = selectCurso.value;

    filtroCurso.innerHTML = '<option value="">Todos os cursos</option>';
    selectCurso.innerHTML = '<option value="">Selecione um curso</option>';

    for (const curso of cursos) {
        filtroCurso.appendChild(new Option(curso.nome, curso.id));
        selectCurso.appendChild(new Option(curso.nome, curso.id));
    }

    filtroCurso.value = filtroAtual;
    selectCurso.value = cursoAtual;

    if (filtroCurso.selectedIndex === -1) filtroCurso.value = '';
    if (selectCurso.selectedIndex === -1) selectCurso.value = '';
}

async function adicionarCurso(evento) {
    evento.preventDefault();
    const nome = inputNovoCurso.value.trim();
    if (!nome) return;

    try {
        const resposta = await fetch('/cursos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome }),
        });
        const dados = await resposta.json();
        if (!resposta.ok) {
            mostrarMsg(dados.erro || 'Erro ao cadastrar curso', 'erro');
            return;
        }
        inputNovoCurso.value = '';
        mostrarMsg(`Curso "${dados.nome}" cadastrado!`, 'ok');
        listarCursos();
    } catch (e) {
        mostrarMsg('Erro de rede ao adicionar curso', 'erro');
    }
}

async function excluirCurso(id, nome) {
    if (!confirm(`Excluir o curso "${nome}"?`)) return;
    try {
        const resposta = await fetch('/cursos/' + id, { method: 'DELETE' });
        const dados = await resposta.json();
        if (!resposta.ok) {
            mostrarMsg(dados.erro || 'Erro ao excluir curso', 'erro');
            return;
        }
        mostrarMsg('Curso excluído.', 'ok');
        atualizarTudo();
    } catch (e) {
        mostrarMsg('Erro de rede ao excluir curso', 'erro');
    }
}

// ===== ALUNOS =====
function abrirModalCriar() {
    if (selectCurso.options.length <= 1) {
        mostrarMsg('Cadastre um curso antes de incluir alunos.', 'erro');
        return;
    }
    modo = 'criar';
    raEditando = '';
    modalTitulo.textContent = 'Novo aluno';
    form.reset();
    selectCurso.value = filtroCurso.value || '';
    inputRa.disabled = false;
    modal.hidden = false;
    inputNome.focus();
}

function abrirModalEditar(aluno) {
    modo = 'editar';
    raEditando = aluno.ra;
    modalTitulo.textContent = 'Editar aluno';
    inputNome.value = aluno.nome || '';
    inputRa.value = aluno.ra || '';
    selectCurso.value = aluno.curso_id;
    inputRa.disabled = true;
    modal.hidden = false;
    inputNome.focus();
}

function fecharModal() {
    modal.hidden = true;
    form.reset();
    inputRa.disabled = false;
}

function linhaAluno(aluno) {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.textContent = aluno.nome;

    const tdRa = document.createElement('td');
    tdRa.textContent = aluno.ra;

    const tdCurso = document.createElement('td');
    tdCurso.textContent = aluno.curso ? aluno.curso.nome : '';

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';

    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.className = 'btn btn-secundario btn-pequeno';
    btnEditar.onclick = () => abrirModalEditar(aluno);

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.className = 'btn btn-perigo btn-pequeno';
    btnExcluir.onclick = () => excluirAluno(aluno.ra, aluno.nome);

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnExcluir);

    tr.appendChild(tdNome);
    tr.appendChild(tdRa);
    tr.appendChild(tdCurso);
    tr.appendChild(tdAcoes);
    return tr;
}

async function listarAlunos(acrescentar = false) {
    if (acrescentar && (alunosCarregando || !alunosTemMais)) return;

    const pedido = ++alunosPedido;
    const inicio = acrescentar ? alunosInicio : 0;

    if (!acrescentar) {
        tabela.innerHTML = '';
        alunosInicio = 0;
    }

    alunosCarregando = true;
    atualizarStatus();

    try {
        const cursoId = filtroCurso.value;
        const base = cursoId ? `/cursos/${cursoId}/alunos` : '/alunos';
        
        // Constrói os parâmetros da query string incluindo a busca se existir[cite: 48]
        const params = new URLSearchParams({
            inicio: String(inicio),
            limite: String(ALUNOS_POR_PAGINA),
        });
        if (alunosBusca) params.set('busca', alunosBusca);

        const resposta = await fetch(`${base}?${params.toString()}`);
        const dados = await resposta.json();

        if (pedido !== alunosPedido) return;

        if (!resposta.ok) {
            mostrarMsg(dados.erro || 'Erro ao listar alunos', 'erro');
            alunosErro = true;
            atualizarStatus();
            return;
        }

        const alunos = dados.alunos || [];
        const total = dados.total || 0;

        if (!acrescentar) {
            tabela.innerHTML = '';
        }

        if (!alunos.length && !inicio) {
            tabela.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum aluno encontrado.</td></tr>';
            alunosTemMais = false;
            alunosTotal = 0;
            alunosInicio = 0;
            atualizarStatus();
            return;
        }

        for (const aluno of alunos) {
            tabela.appendChild(linhaAluno(aluno));
        }

        alunosInicio = inicio + alunos.length;
        alunosTotal = total;
        alunosTemMais = alunosInicio < alunosTotal;
        alunosErro = false;

    } catch (e) {
        if (pedido === alunosPedido) {
            alunosErro = true;
            mostrarMsg('Erro de rede ao carregar alunos', 'erro');
        }
    } finally {
        if (pedido === alunosPedido) {
            alunosCarregando = false;
            atualizarStatus();
            pedirMaisSeVisivel();
        }
    }
}

// Deteta quando o utilizador chega ao fim da página para carregar mais
function pedirMaisSeVisivel() {
    if (!alunosTemMais || alunosCarregando) return;
    const topo = sentinelaAlunos.getBoundingClientRect().top;
    if (topo < window.innerHeight + 160) {
        listarAlunos(true);
    }
}

// Atualiza a frase informativa no rodapé
function atualizarStatus() {
    if (alunosCarregando && alunosInicio === 0) {
        alunosStatus.textContent = 'Carregando...';
        return;
    }
    if (alunosErro) {
        alunosStatus.textContent = 'A lista não carregou. Use Atualizar lista para tentar de novo.';
        return;
    }
    if (!alunosTotal) {
        alunosStatus.textContent = 'Nenhum aluno para mostrar.';
        return;
    }
    if (alunosTemMais) {
        alunosStatus.textContent = `Mostrando ${alunosInicio} de ${alunosTotal}. Role a tela para carregar mais...`;
    } else {
        alunosStatus.textContent = `Mostrando ${alunosTotal} de ${alunosTotal}. Fim da lista.`;
    }
}

async function salvarAluno(evento) {
    evento.preventDefault();
    const nome = inputNome.value.trim();
    const ra = inputRa.value.trim();
    const curso_id = parseInt(selectCurso.value, 10);

    if (!nome || !ra || !curso_id || isNaN(curso_id)) {
        mostrarMsg('Preencha todos os campos obrigatórios e selecione um curso válido', 'erro');
        return;
    }

    try {
        if (modo === 'criar') {
            const resposta = await fetch('/alunos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, ra, curso_id }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                mostrarMsg(dados.erro || 'Erro ao cadastrar aluno', 'erro');
                return;
            }
            mostrarMsg('Aluno cadastrado com sucesso!', 'ok');
        } else {
            const resposta = await fetch('/alunos/' + encodeURIComponent(raEditando), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, curso_id }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                mostrarMsg(dados.erro || 'Erro ao atualizar aluno', 'erro');
                return;
            }
            mostrarMsg('Aluno atualizado com sucesso!', 'ok');
        }
        fecharModal();
        atualizarTudo();
    } catch (e) {
        mostrarMsg('Erro de rede ao salvar aluno', 'erro');
    }
}

async function excluirAluno(ra, nome) {
    if (!confirm(`Excluir o aluno "${nome}" (RA ${ra})?`)) return;
    try {
        const resposta = await fetch('/alunos/' + encodeURIComponent(ra), {
            method: 'DELETE',
        });
        const dados = await resposta.json();
        if (!resposta.ok) {
            mostrarMsg(dados.erro || 'Erro ao excluir aluno', 'erro');
            return;
        }
        mostrarMsg('Aluno excluído.', 'ok');
        atualizarTudo();
    } catch (e) {
        mostrarMsg('Erro de rede ao excluir aluno', 'erro');
    }
}

// Funções para gerir a nuvem de critério e pesquisa
function atualizarCriterioPesquisa() {
    criterioPesquisa.innerHTML = '';
    if (!alunosBusca) { 
        criterioPesquisa.hidden = true; 
        return; 
    }
    const rotulo = document.createElement('span');
    rotulo.className = 'criterio-rotulo';
    rotulo.textContent = 'Critério de pesquisa:';
    
    const nuvem = document.createElement('span');
    nuvem.className = 'nuvem-filtro';
    
    const texto = document.createElement('span');
    texto.className = 'nuvem-filtro-texto';
    texto.textContent = alunosBusca;
    
    const btnLimpar = document.createElement('button');
    btnLimpar.type = 'button';
    btnLimpar.className = 'nuvem-filtro-limpar';
    btnLimpar.textContent = '×';
    btnLimpar.addEventListener('click', limparBusca);
    
    nuvem.appendChild(texto);
    nuvem.appendChild(btnLimpar);
    criterioPesquisa.appendChild(rotulo);
    criterioPesquisa.appendChild(nuvem);
    criterioPesquisa.hidden = false;
}

function limparBusca() {
    inputBusca.value = '';
    alunosBusca = '';
    atualizarCriterioPesquisa(); // some a nuvem
    listarAlunos(false); // lista de novo, sem o parâmetro ?busca=
}

async function atualizarTudo() {
    await listarCursos();
    await listarAlunos(false);
}

// Event Listeners
document.getElementById('btn-novo').addEventListener('click', abrirModalCriar);
document.getElementById('btn-atualizar').addEventListener('click', atualizarTudo);
document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
modalFundo.addEventListener('click', fecharModal);
form.addEventListener('submit', salvarAluno);
formCurso.addEventListener('submit', adicionarCurso);
formBusca.addEventListener('submit', (evento) => {
    evento.preventDefault();
    alunosBusca = inputBusca.value.trim();
    atualizarCriterioPesquisa();
    listarAlunos(false);
});
filtroCurso.addEventListener('change', () => listarAlunos(false));
window.addEventListener('scroll', pedirMaisSeVisivel);
window.addEventListener('resize', pedirMaisSeVisivel);

// Arranque inicial
atualizarTudo();