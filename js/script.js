// Configuração do IndexedDB
const DB_NAME = 'JobTrackDB';
const DB_VERSION = 1;
const STORE_CANDIDATURAS = 'candidaturas';
const STORE_METAS = 'metas';

// Variáveis globais
let db;
let candidaturas = [];
let metas = {
    diaria: 5,
    mensal: 100
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar o banco de dados
    inicializarDB();
    
    // Configurar data atual
    atualizarDataAtual();
    
    // Configurar ano no footer
    document.getElementById('ano-atual').textContent = new Date().getFullYear();
    
    // Configurar eventos
    configurarEventos();

    console.log("Metas carregadas:", metas);
    console.log("Candidaturas carregadas:", candidaturas);

});

// Função para inicializar o banco de dados IndexedDB
function inicializarDB() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
        mostrarNotificacao('Erro ao acessar o banco de dados.', 'erro');
        console.error('Erro ao abrir o banco de dados:', event.target.error);
    };
    
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Criar store para candidaturas se não existir
        if (!db.objectStoreNames.contains(STORE_CANDIDATURAS)) {
            const candidaturasStore = db.createObjectStore(STORE_CANDIDATURAS, { keyPath: 'id', autoIncrement: true });
            candidaturasStore.createIndex('data', 'data', { unique: false });
            candidaturasStore.createIndex('empresa', 'empresa', { unique: false });
            candidaturasStore.createIndex('status', 'status', { unique: false });
        }
        
        // Criar store para metas se não existir
        if (!db.objectStoreNames.contains(STORE_METAS)) {
            db.createObjectStore(STORE_METAS, { keyPath: 'id' });
        }
    };
    
    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Banco de dados inicializado com sucesso.');
        
        // Carregar dados iniciais
        carregarCandidaturas();
        carregarMetas();
    };
}

// Função para carregar candidaturas do banco de dados
function carregarCandidaturas() {
    const transaction = db.transaction([STORE_CANDIDATURAS], 'readonly');
    const store = transaction.objectStore(STORE_CANDIDATURAS);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
        candidaturas = event.target.result;
        atualizarTabelaCandidaturas();
        atualizarEstatisticas();
        atualizarGraficos();
    };
    
    request.onerror = (event) => {
        console.error('Erro ao carregar candidaturas:', event.target.error);
    };
}

// Função para carregar metas do banco de dados
function carregarMetas() {
    const transaction = db.transaction([STORE_METAS], 'readonly');
    const store = transaction.objectStore(STORE_METAS);
    const request = store.get('metas');
    
    request.onsuccess = (event) => {
        if (event.target.result) {
            metas = event.target.result;
            document.getElementById('meta-diaria').value = metas.diaria;
            document.getElementById('meta-mensal').value = metas.mensal;
        } else {
            // Salvar metas padrão se não existirem
            salvarMetas();
        }
    };
    
    request.onerror = (event) => {
        console.error('Erro ao carregar metas:', event.target.error);
    };
}

// Função para salvar metas no banco de dados
function salvarMetas() {
    const metasDiaria = parseInt(document.getElementById('meta-diaria').value) || 5;
    const metasMensal = parseInt(document.getElementById('meta-mensal').value) || 100;

    metas = {
        id: 'metas',
        diaria: metasDiaria,
        mensal: metasMensal
    };

    const transaction = db.transaction([STORE_METAS], 'readwrite');
    const store = transaction.objectStore(STORE_METAS);
    const request = store.put(metas);

    request.onsuccess = () => {
        mostrarNotificacao('Metas salvas com sucesso!', 'sucesso');
        localStorage.setItem('jobtrack_metas', JSON.stringify(metas)); // Salva no localStorage também
        atualizarGraficos();
    };

    request.onerror = (event) => {
        mostrarNotificacao('Erro ao salvar metas.', 'erro');
        console.error('Erro ao salvar metas:', event.target.error);
    };
}

// Função para adicionar nova candidatura
function adicionarCandidatura(candidatura) {
    const transaction = db.transaction([STORE_CANDIDATURAS], 'readwrite');
    const store = transaction.objectStore(STORE_CANDIDATURAS);
    
    // Adicionar data atual se não for fornecida
    if (!candidatura.data) {
        candidatura.data = new Date().toISOString().split('T')[0];
    }
    
    const request = store.add(candidatura);
    
    request.onsuccess = () => {
        mostrarNotificacao('Candidatura adicionada com sucesso!', 'sucesso');
        carregarCandidaturas();
    };
    
    request.onerror = (event) => {
        mostrarNotificacao('Erro ao adicionar candidatura.', 'erro');
        console.error('Erro ao adicionar candidatura:', event.target.error);
    };
}

// Função para atualizar candidatura existente
function atualizarCandidatura(candidatura) {
    const transaction = db.transaction([STORE_CANDIDATURAS], 'readwrite');
    const store = transaction.objectStore(STORE_CANDIDATURAS);
    const request = store.put(candidatura);
    
    request.onsuccess = () => {
        mostrarNotificacao('Candidatura atualizada com sucesso!', 'sucesso');
        carregarCandidaturas();
    };
    
    request.onerror = (event) => {
        mostrarNotificacao('Erro ao atualizar candidatura.', 'erro');
        console.error('Erro ao atualizar candidatura:', event.target.error);
    };
}

// Função para excluir candidatura
function excluirCandidatura(id) {
    const transaction = db.transaction([STORE_CANDIDATURAS], 'readwrite');
    const store = transaction.objectStore(STORE_CANDIDATURAS);
    const request = store.delete(id);
    
    request.onsuccess = () => {
        mostrarNotificacao('Candidatura excluída com sucesso!', 'sucesso');
        carregarCandidaturas();
    };
    
    request.onerror = (event) => {
        mostrarNotificacao('Erro ao excluir candidatura.', 'erro');
        console.error('Erro ao excluir candidatura:', event.target.error);
    };
}

// Função para atualizar a tabela de candidaturas
function atualizarTabelaCandidaturas() {
    const tbody = document.getElementById('corpo-tabela');
    tbody.innerHTML = '';
    
    if (candidaturas.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">Nenhuma candidatura encontrada.</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Ordenar candidaturas por data (mais recentes primeiro)
    candidaturas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    candidaturas.forEach(candidatura => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        
        // Formatar a data para o padrão brasileiro
        const data = new Date(candidatura.data);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        
        // Criar classe para o status
        const statusClass = `status-${candidatura.status.toLowerCase().replace(' ', '-')}`;
        
        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${candidatura.empresa}</td>
            <td>${candidatura.cargo}</td>
            <td>${candidatura.plataforma || '-'}</td>
            <td><span class="status-badge ${statusClass}">${candidatura.status}</span></td>
            <td>${candidatura.retorno}</td>
            <td>
                <div class="acoes-tabela">
                    <button class="btn btn-icon btn-secondary editar-candidatura" data-id="${candidatura.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-danger excluir-candidatura" data-id="${candidatura.id}" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${candidatura.link ? `<a href="${candidatura.link}" target="_blank" class="btn btn-icon btn-primary" title="Abrir Link"><i class="fas fa-external-link-alt"></i></a>` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Adicionar eventos aos botões da tabela
    document.querySelectorAll('.editar-candidatura').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            editarCandidatura(id);
        });
    });
    
    document.querySelectorAll('.excluir-candidatura').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            confirmarExclusao(id);
        });
    });
}

// Função para atualizar estatísticas
function atualizarEstatisticas() {
    const totalCandidaturas = candidaturas.length;
    const totalRetornos = candidaturas.filter(c => c.retorno === 'Sim').length;
    const taxaRetorno = totalCandidaturas > 0 ? ((totalRetornos / totalCandidaturas) * 100).toFixed(1) : '0';
    
    document.getElementById('total-candidaturas').textContent = totalCandidaturas;
    document.getElementById('total-retornos').textContent = totalRetornos;
    document.getElementById('taxa-retorno').textContent = `${taxaRetorno}%`;
}

// Função para atualizar gráficos
function atualizarGraficos() {
    atualizarGraficoCandidaturas();
    atualizarGraficoStatus();
}

// Função para atualizar gráfico de candidaturas
function atualizarGraficoCandidaturas() {
    const ctx = document.getElementById('grafico-candidaturas').getContext('2d');
    
    // Obter dados dos últimos 7 dias
    const hoje = new Date();
    const ultimos7Dias = [];
    const dadosCandidaturas = [];
    
    for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        const dataFormatada = data.toISOString().split('T')[0];
        ultimos7Dias.push(dataFormatada);
        
        const candidaturasNoDia = candidaturas.filter(c => c.data === dataFormatada).length;
        dadosCandidaturas.push(candidaturasNoDia);
    }
    
    // Formatar datas para exibição
    const datasFormatadas = ultimos7Dias.map(data => {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}`;
    });
    
    // Verificar se já existe um gráfico e destruí-lo
    if (window.graficoCandidaturas) {
        window.graficoCandidaturas.destroy();
    }
    
    // Criar novo gráfico
    window.graficoCandidaturas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datasFormatadas,
            datasets: [
                {
                    label: 'Candidaturas',
                    data: dadosCandidaturas,
                    backgroundColor: 'rgba(74, 111, 165, 0.7)',
                    borderColor: 'rgba(74, 111, 165, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Meta Diária',
                    data: Array(7).fill(metas.diaria),
                    type: 'line',
                    borderColor: 'rgba(220, 53, 69, 0.8)',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Candidaturas nos Últimos 7 Dias'
                }
            }
        }
    });
}

// Função para atualizar gráfico de status
function atualizarGraficoStatus() {
    const ctx = document.getElementById('grafico-status').getContext('2d');
    
    // Contar candidaturas por status
    const statusCount = {};
    candidaturas.forEach(c => {
        statusCount[c.status] = (statusCount[c.status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCount);
    const data = Object.values(statusCount);
    
    // Cores para cada status
    const cores = {
        'Enviada': 'rgba(0, 123, 255, 0.7)',
        'Em Análise': 'rgba(255, 193, 7, 0.7)',
        'Entrevista': 'rgba(40, 167, 69, 0.7)',
        'Teste': 'rgba(23, 162, 184, 0.7)',
        'Finalizada': 'rgba(220, 53, 69, 0.7)'
    };
    
    const backgroundColor = labels.map(label => cores[label] || 'rgba(108, 117, 125, 0.7)');
    
    // Verificar se já existe um gráfico e destruí-lo
    if (window.graficoStatus) {
        window.graficoStatus.destroy();
    }
    
    // Criar novo gráfico
    window.graficoStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Distribuição por Status'
                }
            }
        }
    });
}

// Função para configurar eventos
function configurarEventos() {
    // Botão Nova Candidatura
    document.getElementById('nova-candidatura').addEventListener('click', () => {
        abrirModal('Nova Candidatura');
    });
    
    // Botão Salvar Metas
    document.getElementById('salvar-metas').addEventListener('click', () => {
        salvarMetas();
    });
    
    // Botão Exportar Backup
    document.getElementById('exportar-backup').addEventListener('click', () => {
        exportarBackup();
    });
    
    // Botão Importar Backup
    document.getElementById('importar-backup').addEventListener('click', () => {
        document.getElementById('arquivo-backup').click();
    });
    
    // Input de arquivo para importar backup
    document.getElementById('arquivo-backup').addEventListener('change', (e) => {
        const arquivo = e.target.files[0];
        if (arquivo) {
            importarBackup(arquivo);
        }
    });
    
    // Formulário de candidatura
    document.getElementById('form-candidatura').addEventListener('submit', (e) => {
        e.preventDefault();
        salvarFormulario();
    });
    
    // Botões para fechar modal
    document.querySelectorAll('.fechar, .cancelar').forEach(btn => {
        btn.addEventListener('click', () => {
            fecharModal();
        });
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modal');
        if (e.target === modal) {
            fecharModal();
        }
    });
}

// Função para abrir modal
function abrirModal(titulo, candidatura = null) {
    document.getElementById('modal-titulo').textContent = titulo;
    const form = document.getElementById('form-candidatura');
    form.reset();
    
    // Preencher formulário se for edição
    if (candidatura) {
        document.getElementById('id-candidatura').value = candidatura.id;
        document.getElementById('empresa').value = candidatura.empresa;
        document.getElementById('cargo').value = candidatura.cargo;
        document.getElementById('link').value = candidatura.link || '';
        document.getElementById('plataforma').value = candidatura.plataforma || '';
        document.getElementById('status').value = candidatura.status;
        document.getElementById('retorno').value = candidatura.retorno;
        document.getElementById('observacoes').value = candidatura.observacoes || '';
    } else {
        document.getElementById('id-candidatura').value = '';
    }
    
    document.getElementById('modal').style.display = 'block';
}

// Função para fechar modal
function fecharModal() {
    document.getElementById('modal').style.display = 'none';
}

// Função para salvar formulário
function salvarFormulario() {
    const id = document.getElementById('id-candidatura').value;
    const candidatura = {
        empresa: document.getElementById('empresa').value,
        cargo: document.getElementById('cargo').value,
        link: document.getElementById('link').value,
        plataforma: document.getElementById('plataforma').value,
        status: document.getElementById('status').value,
        retorno: document.getElementById('retorno').value,
        observacoes: document.getElementById('observacoes').value
    };

    if (id) {
        candidatura.id = parseInt(id);
        const original = candidaturas.find(c => c.id === candidatura.id);
        candidatura.data = original ? original.data : new Date().toISOString().split('T')[0];
        atualizarCandidatura(candidatura);
    } else {
        candidatura.data = new Date().toISOString().split('T')[0];
        adicionarCandidatura(candidatura);
    }

    fecharModal();
}

// Função para editar candidatura
function editarCandidatura(id) {
    const candidatura = candidaturas.find(c => c.id === id);
    if (candidatura) {
        abrirModal('Editar Candidatura', candidatura);
    }
}

// Função para confirmar exclusão
function confirmarExclusao(id) {
    if (confirm('Tem certeza que deseja excluir esta candidatura?')) {
        excluirCandidatura(id);
    }
}

// Função para exportar backup
function exportarBackup() {
    const backup = {
        candidaturas: candidaturas,
        metas: metas,
        versao: DB_VERSION,
        data: new Date().toISOString()
    };
    
    const json = JSON.stringify(backup);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacao('Backup exportado com sucesso!', 'sucesso');
}

// Função para importar backup
function importarBackup(arquivo) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.candidaturas || !backup.metas) {
                throw new Error('Formato de backup inválido.');
            }
            
            // Limpar banco de dados atual
            const transaction = db.transaction([STORE_CANDIDATURAS, STORE_METAS], 'readwrite');
            const candidaturasStore = transaction.objectStore(STORE_CANDIDATURAS);
            const metasStore = transaction.objectStore(STORE_METAS);
            
            // Limpar candidaturas
            candidaturasStore.clear();
            
            // Adicionar candidaturas do backup
            backup.candidaturas.forEach(candidatura => {
                candidaturasStore.add(candidatura);
            });
            
            // Atualizar metas
            metasStore.put(backup.metas);
            
            transaction.oncomplete = () => {
                mostrarNotificacao('Backup importado com sucesso!', 'sucesso');
                carregarCandidaturas();
                carregarMetas();
            };
            
            transaction.onerror = (event) => {
                mostrarNotificacao('Erro ao importar backup.', 'erro');
                console.error('Erro ao importar backup:', event.target.error);
            };
            
        } catch (error) {
            mostrarNotificacao('Erro ao processar arquivo de backup.', 'erro');
            console.error('Erro ao processar backup:', error);
        }
    };
    
    reader.readAsText(arquivo);
}

// Função para salvar no localStorage
function salvarLocalStorage() {
    try {
        localStorage.setItem('jobtrack_candidaturas', JSON.stringify(candidaturas));
        localStorage.setItem('jobtrack_metas', JSON.stringify(metas));
        return true;
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        return false;
    }
}

// Função para carregar do localStorage
function carregarLocalStorage() {
    try {
        const candidaturasLS = localStorage.getItem('jobtrack_candidaturas');
        const metasLS = localStorage.getItem('jobtrack_metas');
        
        if (candidaturasLS) {
            candidaturas = JSON.parse(candidaturasLS);
        }
        
        if (metasLS) {
            metas = JSON.parse(metasLS);
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
        return false;
    }
}

// Função para atualizar data atual
function atualizarDataAtual() {
    console.log("Atualizando data atual...");
    const dataAtual = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', options);
    document.getElementById('data-atual').textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem, tipo) {
    // Remover notificações existentes
    const notificacoesExistentes = document.querySelectorAll('.notificacao');
    notificacoesExistentes.forEach(notif => {
        document.body.removeChild(notif);
    });
    
    // Criar nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (document.body.contains(notificacao)) {
            document.body.removeChild(notificacao);
        }
    }, 3000);
}

// Função de fallback para usar localStorage se IndexedDB falhar
window.addEventListener('error', (event) => {
    if (event.target instanceof XMLHttpRequest || event.target instanceof HTMLImageElement || event.target instanceof HTMLScriptElement) {
        return;
    }
    
    if (event.message && event.message.includes('IndexedDB')) {
        console.warn('Erro no IndexedDB, usando localStorage como fallback');
        
        // Tentar carregar do localStorage
        if (carregarLocalStorage()) {
            atualizarTabelaCandidaturas();
            atualizarEstatisticas();
            atualizarGraficos();
            
            // Sobrescrever funções de banco de dados
            window.adicionarCandidatura = (candidatura) => {
                if (!candidatura.id) {
                    candidatura.id = Date.now();
                }
                if (!candidatura.data) {
                    candidatura.data = new Date().toISOString().split('T')[0];
                }
                candidaturas.push(candidatura);
                salvarLocalStorage();
                mostrarNotificacao('Candidatura adicionada com sucesso!', 'sucesso');
                atualizarTabelaCandidaturas();
                atualizarEstatisticas();
                atualizarGraficos();
            };
            
            window.atualizarCandidatura = (candidatura) => {
                const index = candidaturas.findIndex(c => c.id === candidatura.id);
                if (index !== -1) {
                    candidaturas[index] = candidatura;
                    salvarLocalStorage();
                    mostrarNotificacao('Candidatura atualizada com sucesso!', 'sucesso');
                    atualizarTabelaCandidaturas();
                    atualizarEstatisticas();
                    atualizarGraficos();
                }
            };
            
            window.excluirCandidatura = (id) => {
                const index = candidaturas.findIndex(c => c.id === id);
                if (index !== -1) {
                    candidaturas.splice(index, 1);
                    salvarLocalStorage();
                    mostrarNotificacao('Candidatura excluída com sucesso!', 'sucesso');
                    atualizarTabelaCandidaturas();
                    atualizarEstatisticas();
                    atualizarGraficos();
                }
            };
            
            window.salvarMetas = () => {
                metas.diaria = parseInt(document.getElementById('meta-diaria').value) || 5;
                metas.mensal = parseInt(document.getElementById('meta-mensal').value) || 100;
                salvarLocalStorage();
                mostrarNotificacao('Metas salvas com sucesso!', 'sucesso');
                atualizarGraficos();
            };
        }
    }
});
