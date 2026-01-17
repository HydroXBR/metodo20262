

/// ========== SISTEMA DE AUTENTICAÇÃO ==========
let currentUser = null;
let todosAlunos = [];
let currentAlunoId = null;

// Debug: verificar localStorage
console.log('LocalStorage conteúdo:', localStorage);
console.log('Chave "user" no localStorage:', localStorage.getItem('user'));

// Verificar autenticação
async function verificarAutenticacao() {
    const userDataStr = localStorage.getItem('user');

    if (!userDataStr) {
        console.log('Nenhum usuário no localStorage, redirecionando para login');
        return false;
    }

    try {
        const userData = JSON.parse(userDataStr);
        console.log('Usuário encontrado:', userData);

        // Estruturar o currentUser
        currentUser = {
            _id: userData.id,
            completename: userData.name || userData.completename,
            email: userData.email,
            turma: userData.turma,
            profilePicture: userData.profilePicture || userData.profilepicture,
            permissions: userData.permissions
        };

        console.log('CurrentUser estruturado:', currentUser);

        // Verificar se o usuário tem dados mínimos
        if (!currentUser._id || currentUser.permissions === undefined) {
            console.log('Dados do usuário incompletos');
            return false;
        }

        return true;

    } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
        return false;
    }
}
// Verificar permissões (nível 1 ou superior para admin)
function temPermissaoAdmin() {
    if (!currentUser) {
        console.log('currentUser não definido');
        return false;
    }

    console.log('Verificando permissões:', {
        permissions: currentUser.permissions,
        type: typeof currentUser.permissions,
        hasPermission: currentUser.permissions >= 1
    });

    return currentUser.permissions >= 1;
}

// Fazer logout
function fazerLogout() {
    localStorage.removeItem('user');
    currentUser = null;
    window.location.href = '/login';
}

// ========== FUNÇÕES DA API ==========
async function fetchAlunos() {
    try {
        const response = await fetch('/alunos');
        if (!response.ok) throw new Error('Erro ao buscar alunos');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao carregar alunos', 'error');
        return [];
    }
}

async function getAlunoById(id) {
    try {
        const response = await fetch(`/getalunobyid?id=${id}`);
        if (!response.ok) throw new Error('Erro ao buscar aluno');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao carregar dados do aluno', 'error');
        return null;
    }
}

async function setPagamento(id, mes, status) {
    try {
        const response = await fetch(`/setpago?id=${id}&mes=${mes}&set=${status}`);
        if (!response.ok) throw new Error('Erro ao atualizar pagamento');
        const result = await response.json();
        showNotification(result.reason || 'Pagamento atualizado com sucesso!', 'success');
        return result;
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao atualizar pagamento', 'error');
        return null;
    }
}

// ========== FUNÇÕES AUXILIARES ==========
function formatarData(dataStr) {
    if (!dataStr) return 'Não informado';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
}

function formatarTelefone(tel) {
    if (!tel) return 'Não informado';
    return tel.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

function formatarNome(fullName) {
    if (!fullName) return '';
    const words = fullName.trim().split(/\s+/);
    const firstName = words[0];
    const secondName = words[1];

    if (!secondName) return firstName;

    if (["de", "da", "dos", "das", "do", "henrique", "pedro", "eduarda", "luiza"].includes(secondName.toLowerCase())) {
        if (words[2] && ["de", "da", "dos", "das", "do"].includes(words[2].toLowerCase())) {
            return `${firstName} ${secondName} ${words[2]} ${words[3]}`;
        } else {
            return `${firstName} ${secondName} ${words[2]}`;
        }
    }
    return `${firstName} ${secondName}`;
}

function formatarDataHoje() {
    const data = new Date();
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    return `${dia} de ${mes} de ${ano}`;
}

function showNotification(message, type = 'info') {
    // Remover notificações antigas
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? 'var(--vermelho)' : type === 'success' ? 'var(--verde)' : 'var(--azul)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

function atualizarDataHora() {
    const now = new Date();
    const dataElement = document.getElementById('currentDate');
    const horaElement = document.getElementById('currentTime');

    if (dataElement) {
        dataElement.textContent = formatarDataHoje();
    }

    if (horaElement) {
        horaElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}

function formatarLinkWhatsapp(telefone, nomeAluno) {
    if (!telefone) return '#';
    let formatted = telefone.replace(/[()\-\s]/g, "");

    if (formatted.length === 8) {
        formatted = "92" + formatted;
    }

    if (formatted.length === 11 && formatted[2] === "9") {
        formatted = formatted.slice(0, 2) + formatted.slice(3);
    }

    const hoje = new Date();
    const text = `*📌 MENSALIDADE*\n❗️Boa tarde, senhor(a) responsável!\n⚠️ Lembrando que sua mensalidade vence HOJE dia ${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')} do aluno:\n${nomeAluno}\n\n✅ Estamos aguardando o pagamento.\n\n🔑 *Chave Pix (CNPJ)*\n53.579.716/0001-51\n> Método Centro de Estudos LTDA\n> Caso pagamento em PIX, enviar comprovante, por favor.\n\n📍 Agradecemos a compreensão 😉👍🏻\n\n*MENSAGEM AUTOMÁTICA*`;
    return `https://api.whatsapp.com/send/?phone=55${formatted}&text=${encodeURIComponent(text)}`;
}

// ========== FUNÇÕES DE UI ==========
function carregarEstatisticas(alunos) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    const totalAlunos = alunos.length;
    const alunosHoje = alunos.filter(a => a.dia === new Date().getDate()).length;

    const mesAtual = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const pagamentosPendentes = alunos.filter(a => {
        const pagamento = a.pgto?.find(p => p.mes === mesAtual);
        return !pagamento?.pago;
    }).length;

    const turmas = {
        1: alunos.filter(a => a.turma === 1).length,
        2: alunos.filter(a => a.turma === 2).length,
        3: alunos.filter(a => a.turma === 3).length,
        4: alunos.filter(a => a.turma === 4).length
    };

    statsGrid.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-users"></i>
            <h4>Total de Alunos</h4>
            <div class="value">${totalAlunos}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-calendar-day"></i>
            <h4>Pagamentos Hoje</h4>
            <div class="value">${alunosHoje}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Pendentes</h4>
            <div class="value">${pagamentosPendentes}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-chart-pie"></i>
            <h4>Turmas</h4>
            <div class="value">${Object.keys(turmas).filter(t => turmas[t] > 0).length}</div>
        </div>
    `;

    // Atualizar sidebar
    const activeStudents = document.getElementById('activeStudents');
    const monthPayments = document.getElementById('monthPayments');
    const defaultRate = document.getElementById('defaultRate');
    const avgPerClass = document.getElementById('avgPerClass');

    if (activeStudents) activeStudents.textContent = totalAlunos;
    if (monthPayments) monthPayments.textContent = totalAlunos - pagamentosPendentes;
    if (defaultRate) {
        defaultRate.textContent = totalAlunos > 0 ?
            `${Math.round((pagamentosPendentes / totalAlunos) * 100)}%` : '0%';
    }

    const turmasComAlunos = Object.values(turmas).filter(t => t > 0);
    const mediaTurma = turmasComAlunos.length > 0 ?
        Math.round(turmasComAlunos.reduce((a, b) => a + b) / turmasComAlunos.length) : 0;

    if (avgPerClass) avgPerClass.textContent = mediaTurma;
}

function carregarMeses() {
    const meses = [
        { num: '01', nome: 'Jan' }, { num: '02', nome: 'Fev' }, { num: '03', nome: 'Mar' },
        { num: '04', nome: 'Abr' }, { num: '05', nome: 'Mai' }, { num: '06', nome: 'Jun' },
        { num: '07', nome: 'Jul' }, { num: '08', nome: 'Ago' }, { num: '09', nome: 'Set' },
        { num: '10', nome: 'Out' }, { num: '11', nome: 'Nov' }, { num: '12', nome: 'Dez' }
    ];

    const monthsGrid = document.getElementById('monthsGrid');
    if (!monthsGrid) return;

    monthsGrid.innerHTML = meses.map(mes => `
        <div class="mes-card mes-pendente" data-mes="${mes.num}" title="${mes.nome} - ${mes.num}">
            ${mes.nome}
        </div>
    `).join('');
}

function carregarAlunosUI(alunosParaMostrar) {
    const tableBody = document.getElementById('alunosTableBody');
    const hojeList = document.getElementById('hojeList');
    const hoje = new Date().getDate();

    // Filtrar alunos de hoje (turma diferente de 4)
    const alunosHoje = alunosParaMostrar.filter(a => a.dia === hoje && a.turma !== 4);

    // Limpar tabela
    if (tableBody) {
        tableBody.innerHTML = '';

        // Preencher tabela
        alunosParaMostrar.forEach(aluno => {
            const mesAtual = (new Date().getMonth() + 1).toString().padStart(2, '0');
            const pagamento = aluno.pgto?.find(p => p.mes === mesAtual);
            const statusPagamento = pagamento?.pago ? 'Pago' : 'Pendente';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="aluno-info">
                        <span class="aluno-nome">${formatarNome(aluno.completename)}</span>
                        <span class="aluno-extra">${aluno.email || 'Sem email'}</span>
                    </div>
                </td>
                <td>
                    <span class="turma-badge turma-${aluno.turma}">${aluno.turma}º Turma</span>
                </td>
                <td>
                    <div class="aluno-info">
                        <span>${formatarTelefone(aluno.telresp)}</span>
                        <span class="aluno-extra">${aluno.responsavel || 'Sem responsável'}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${pagamento?.pago ? 'pago' : 'pendente'}">
                        ${statusPagamento}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" data-id="${aluno._id}" title="Editar aluno">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-pagamento" data-id="${aluno._id}" title="Gerenciar pagamentos">
                            <i class="fas fa-money-bill"></i>
                        </button>
                        <button class="btn-action btn-recibo" data-id="${aluno._id}" title="Gerar recibo" onclick="abrirModalReciboAluno('${aluno._id}')">
                            <i class="fas fa-receipt"></i>
                        </button>
                        <button class="btn-action btn-message" data-id="${aluno._id}" title="Enviar mensagem" onclick="enviarMensagemWhatsapp('${aluno._id}')">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Preencher lista de hoje
    if (hojeList) {
        hojeList.innerHTML = '';
        if (alunosHoje.length === 0) {
            hojeList.innerHTML = '<p style="text-align: center; color: var(--cinza-escuro); opacity: 0.7; padding: 1rem;">Nenhum pagamento para hoje.</p>';
        } else {
            alunosHoje.forEach(aluno => {
                const card = document.createElement('div');
                card.className = 'hoje-card';
                card.innerHTML = `
                    <div class="hoje-header">
                        <span class="hoje-nome">${formatarNome(aluno.completename)}</span>
                        <span class="hoje-turma">${aluno.turma}º Turma</span>
                    </div>
                    <div class="hoje-info">
                        Responsável: ${aluno.responsavel || 'Não informado'}<br>
                        Telefone: ${formatarTelefone(aluno.telresp)}
                    </div>
                    <a href="${formatarLinkWhatsapp(aluno.telresp, aluno.completename)}" target="_blank" class="btn-message">
                        <i class="fab fa-whatsapp"></i> Enviar Mensagem
                    </a>
                `;
                hojeList.appendChild(card);
            });
        }
    }

    // Atualizar estatísticas - sempre com todosAlunos
    carregarEstatisticas(todosAlunos);
}

// ========== FUNÇÕES DE MODAL ==========
function openAlunoModal(alunoId) {
    getAlunoById(alunoId).then(aluno => {
        if (!aluno) return;

        currentAlunoId = alunoId;

        // Preencher modal
        document.getElementById('modalTitle').textContent = `Editar: ${formatarNome(aluno.completename)}`;
        document.getElementById('modalNome').value = aluno.completename;
        document.getElementById('modalNascimento').value = formatarData(aluno.nascimento);
        document.getElementById('modalTurma').value = `${aluno.turma}º Turma`;
        document.getElementById('modalResponsavel').value = aluno.responsavel;
        document.getElementById('modalTelResp').value = formatarTelefone(aluno.telresp);
        document.getElementById('modalTelAl').value = formatarTelefone(aluno.telal);
        document.getElementById('modalEmail').value = aluno.email;
        document.getElementById('modalEndereco').value = aluno.endereco;
        document.getElementById('modalBairro').value = aluno.bairro;
        document.getElementById('modalUserId').value = aluno.userId || '';

        // Preencher meses de pagamento
        const meses = [
            '01', '02', '03', '04', '05', '06',
            '07', '08', '09', '10', '11', '12'
        ];

        const modalMonthsGrid = document.getElementById('modalMonthsGrid');
        if (modalMonthsGrid) {
            modalMonthsGrid.innerHTML = meses.map(mesNum => {
                const pagamento = aluno.pgto?.find(p => p.mes === mesNum);
                const status = pagamento?.pago ? 'pago' : 'pendente';
                return `
                    <div class="mes-card mes-${status}" data-mes="${mesNum}">
                        ${mesNum}
                    </div>
                `;
            }).join('');
        }

        // Mostrar modal
        document.getElementById('alunoModal').style.display = 'flex';
    });
}

function openPagamentoModal(alunoId) {
    getAlunoById(alunoId).then(aluno => {
        if (!aluno) return;

        currentAlunoId = alunoId;
        document.getElementById('pagamentoAluno').value = formatarNome(aluno.completename);
        document.getElementById('pagamentoModalTitle').textContent = `Pagamento: ${formatarNome(aluno.completename)}`;

        // Definir data atual
        const hoje = new Date();
        document.getElementById('pagamentoData').value = hoje.toISOString().split('T')[0];

        // Definir mês atual como padrão
        const mesAtual = (hoje.getMonth() + 1).toString().padStart(2, '0');
        document.getElementById('pagamentoMes').value = mesAtual;

        document.getElementById('pagamentoModal').style.display = 'flex';
    });
}

// ========== CONFIGURAÇÃO DE EVENT LISTENERS ==========
function configurarEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fazerLogout();
        });
    }

    // Event listeners para busca e filtros
    const searchInput = document.getElementById('searchAluno');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarAlunos);
    }

    const filterTurma = document.getElementById('filterTurma');
    if (filterTurma) {
        filterTurma.addEventListener('change', filtrarAlunos);
    }

    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', filtrarAlunos);
    }

    // Modais
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('alunoModal').style.display = 'none';
        });
    }

    const btnCloseModal = document.getElementById('btnCloseModal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            document.getElementById('alunoModal').style.display = 'none';
        });
    }

    const closePagamentoModal = document.getElementById('closePagamentoModal');
    if (closePagamentoModal) {
        closePagamentoModal.addEventListener('click', () => {
            document.getElementById('pagamentoModal').style.display = 'none';
        });
    }

    const btnCancelPagamento = document.getElementById('btnCancelPagamento');
    if (btnCancelPagamento) {
        btnCancelPagamento.addEventListener('click', () => {
            document.getElementById('pagamentoModal').style.display = 'none';
        });
    }

    // Event delegation para botões de ação na tabela
    const alunosTableBody = document.getElementById('alunosTableBody');
    if (alunosTableBody) {
        alunosTableBody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const pagamentoBtn = e.target.closest('.btn-pagamento');

            if (editBtn) {
                const alunoId = editBtn.dataset.id;
                openAlunoModal(alunoId);
            }

            if (pagamentoBtn) {
                const alunoId = pagamentoBtn.dataset.id;
                abrirGestaoPagamentos(alunoId); // ← NOVA FUNÇÃO
            }
        });
    }
    // Salvar aluno
    const btnSaveAluno = document.getElementById('btnSaveAluno');
    if (btnSaveAluno) {
        btnSaveAluno.addEventListener('click', async () => {
            const userId = document.getElementById('modalUserId').value;
            showNotification('Funcionalidade de salvar em desenvolvimento', 'info');
            // Aqui você implementaria a API para salvar o userId
        });
    }

    // Salvar pagamento
    const btnSavePagamento = document.getElementById('btnSavePagamento');
    if (btnSavePagamento) {
        btnSavePagamento.addEventListener('click', async () => {
            const mes = document.getElementById('pagamentoMes').value;
            const status = document.getElementById('pagamentoStatus').value === 'true';

            const result = await setPagamento(currentAlunoId, mes, status);
            if (result) {
                document.getElementById('pagamentoModal').style.display = 'none';
                // Recarregar dados
                const alunos = await fetchAlunos();
                carregarAlunos(alunos);
            }
        });
    }

    // Ações rápidas
    const btnGerarRelatorio = document.getElementById('btnGerarRelatorio');
    if (btnGerarRelatorio) {
        btnGerarRelatorio.addEventListener('click', gerarRelatorioAnualAluno)
    }

    const btnMensagens = document.getElementById('btnMensagens');
    if (btnMensagens) {
        btnMensagens.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Funcionalidade de mensagens em desenvolvimento', 'info');
        });
    }

    const btnConfig = document.getElementById('btnConfig');
    if (btnConfig) {
        btnConfig.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Funcionalidade de configurações em desenvolvimento', 'info');
        });
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Event listeners para meses na sidebar
    const monthsGrid = document.getElementById('monthsGrid');
    if (monthsGrid) {
        monthsGrid.addEventListener('click', (e) => {
            const mesCard = e.target.closest('.mes-card');
            if (mesCard) {
                const mes = mesCard.dataset.mes;
                filtrarPorMes(mes);
            }
        });
    }
}

// ========== FUNÇÕES DE FILTRO ==========
function filtrarAlunos() {
    console.log('=== FILTRANDO ALUNOS ===');
    console.log('Total alunos no banco:', todosAlunos.length);

    const searchInput = document.getElementById('searchAluno');
    const filterTurma = document.getElementById('filterTurma');
    const filterStatus = document.getElementById('filterStatus');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const turmaFilter = filterTurma ? filterTurma.value : '';
    const statusFilter = filterStatus ? filterStatus.value : '';

    console.log('Filtros ativos:', {
        searchTerm,
        turmaFilter,
        statusFilter
    });

    // Se não há nenhum filtro ativo, mostrar todos
    if (!searchTerm && !turmaFilter && !statusFilter) {
        console.log('Nenhum filtro ativo, mostrando todos os alunos');
        alunosFiltrados = [...todosAlunos]; // Cópia de todos os alunos
        carregarAlunosUI(alunosFiltrados);
        return;
    }

    // Filtrar SEMPRE a partir de todosAlunos (não do resultado anterior)
    const filtered = todosAlunos.filter(aluno => {
        // Inicialmente assume que o aluno passa em todos os filtros
        let passaBusca = true;
        let passaTurma = true;
        let passaStatus = true;

        // Aplicar filtro de busca (se houver)
        if (searchTerm) {
            passaBusca = (
                (aluno.completename && aluno.completename.toLowerCase().includes(searchTerm)) ||
                (aluno.email && aluno.email.toLowerCase().includes(searchTerm)) ||
                (aluno.responsavel && aluno.responsavel.toLowerCase().includes(searchTerm))
            );
        }

        // Aplicar filtro de turma (se houver)
        if (turmaFilter) {
            passaTurma = aluno.turma.toString() === turmaFilter;
        }

        // Aplicar filtro de status (se houver)
        if (statusFilter) {
            const mesAtual = (new Date().getMonth() + 1).toString().padStart(2, '0');
            const pagamento = aluno.pgto?.find(p => p.mes === mesAtual);

            if (statusFilter === 'pago') {
                passaStatus = pagamento?.pago === true;
            } else if (statusFilter === 'pendente') {
                passaStatus = !pagamento || pagamento.pago === false;
            }
        }

        // O aluno deve passar em TODOS os filtros que estão ativos
        return passaBusca && passaTurma && passaStatus;
    });

    // Atualizar a variável de alunos filtrados
    alunosFiltrados = filtered;
    
    console.log('Resultado do filtro:', alunosFiltrados.length, 'alunos');
    
    if (alunosFiltrados.length === 0) {
        showNotification('Nenhum aluno encontrado com os filtros selecionados', 'warning');
    }
    
    carregarAlunosUI(alunosFiltrados);
}

// Adicione também esta função para limpar filtros:
function adicionarBotaoLimparFiltros() {
    const filterControls = document.querySelector('.filter-controls');
    if (!filterControls) return;

    // Verificar se o botão já existe
    if (document.getElementById('btnLimparFiltros')) return;

    const btnLimpar = document.createElement('button');
    btnLimpar.id = 'btnLimparFiltros';
    btnLimpar.className = 'btn btn-secondary';
    btnLimpar.innerHTML = '<i class="fas fa-times"></i> Limpar Filtros';
    btnLimpar.style.marginLeft = '10px';

    btnLimpar.addEventListener('click', function() {
        const searchInput = document.getElementById('searchAluno');
        const filterTurma = document.getElementById('filterTurma');
        const filterStatus = document.getElementById('filterStatus');

        if (searchInput) searchInput.value = '';
        if (filterTurma) filterTurma.value = '';
        if (filterStatus) filterStatus.value = '';

        // Resetar alunos filtrados para todos os alunos
        alunosFiltrados = [...todosAlunos];
        carregarAlunosUI(alunosFiltrados);
        showNotification('Filtros limpos', 'success');
    });

    filterControls.appendChild(btnLimpar);
}

function filtrarPorMes(mes) {
    showNotification(`Filtrando por mês ${mes}`, 'info');
    // Implementar filtro específico por mês se necessário
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM Carregado - Iniciando verificação de autenticação');
    // Verificar se está na página de admin
    if (!window.location.pathname.includes('admin')) {
        return; // Não verificar se não é admin
    }


    // Verificar autenticação
    const autenticado = await verificarAutenticacao();
    console.log('Usuário autenticado?', autenticado);

    if (!autenticado) {
        console.log('Usuário não autenticado, redirecionando para login');
        window.location.href = '/login.html';
        return;
    }


    console.log('CurrentUser após autenticação:', currentUser);

    // Verificar permissões (nível 1+ para acessar admin)
    const temPermissao = temPermissaoAdmin();
    console.log('Tem permissão de admin?', temPermissao);

    if (!temPermissao) {
        console.log('Usuário não tem permissão de admin');
        // Mostrar mensagem de acesso negado
        document.body.innerHTML = `
            <div class="access-denied">
                <div class="denied-content">
                    <i class="fas fa-lock" style="font-size: 4rem; color: var(--vermelho); margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--vermelho); margin-bottom: 1rem;">Acesso Restrito</h2>
                    <p style="margin-bottom: 1.5rem; color: var(--cinza-escuro); max-width: 400px; text-align: center;">
                        Você precisa de permissões de administrador (nível 1 ou superior) para acessar esta página.
                    </p>
                    <p style="margin-bottom: 1.5rem; color: var(--cinza-escuro); font-size: 0.9rem;">
                        Nome: <strong>${currentUser?.completename || 'Não identificado'}</strong><br>
                        Permissões atuais: <strong>${currentUser?.permissions || 0}</strong>
                    </p>
                    <button onclick="window.location.href='/'" class="btn btn-primary">
                        <i class="fas fa-home"></i> Voltar para o Início
                    </button>
                </div>
            </div>
        `;

        // Adicionar estilo para a mensagem
        const style = document.createElement('style');
        style.textContent = `
            .access-denied {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: linear-gradient(135deg, var(--azul), var(--azul-claro));
            }
            .denied-content {
                background: white;
                padding: 3rem;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                max-width: 500px;
                width: 90%;
            }
            .btn {
                padding: 0.7rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .btn-primary {
                background: var(--vermelho);
                color: var(--branco);
            }
            .btn-primary:hover {
                background: #e60000;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(254, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(style);
        return;
    }

    console.log('Usuário tem permissão, carregando interface...');

    // ========== USUÁRIO AUTENTICADO E COM PERMISSÃO ==========

    // Atualizar informações do usuário na interface
    document.getElementById('adminName').textContent = currentUser.completename.split(" ")[0] || 'Administrador';
    document.getElementById('userName').textContent = currentUser.completename.split(" ")[0] || 'Admin';
    document.getElementById('sidebarAdmin').textContent = currentUser.completename.split(" ")[0] || 'Admin';

    if (currentUser.profilePicture && currentUser.profilePicture !== "" && currentUser.profilePicture !== "null") {
        document.getElementById('userAvatar').src = currentUser.profilePicture;
    } else {
        // Imagem padrão
        document.getElementById('userAvatar').src = "https://cdn-icons-png.flaticon.com/512/12225/12225881.png";
    }

    // Atualizar nível de permissão na sidebar
    let nivelTexto = 'Usuário';
    if (currentUser.permissions === 1) {
        nivelTexto = 'Administrador';
    } else if (currentUser.permissions === 2) {
        nivelTexto = 'Supervisor';
    } else if (currentUser.permissions >= 3) {
        nivelTexto = 'Super Administrador';
    }

    document.getElementById('sidebarLevel').textContent = nivelTexto;

    // Configurar data/hora
    atualizarDataHora();
    setInterval(atualizarDataHora, 60000);

    // Carregar meses
    carregarMeses();

    // Carregar alunos
    try {
        const alunos = await fetchAlunos();
        todosAlunos = alunos; // Salvar todos os alunos
        alunosFiltrados = [...alunos]; // Inicializar filtrados com todos
        carregarAlunosUI(alunosFiltrados); // Mostrar todos inicialmente
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        showNotification('Erro ao carregar lista de alunos', 'error');
    }

    // Configurar todos os event listeners
    configurarEventListeners();
    configurarEventListenersPagamentos();


    // ========== VERIFICAÇÃO DE SESSÃO ==========
    // Verificar se a sessão expirou (verificação a cada 5 minutos)
    setInterval(async () => {
        const aindaAutenticado = await verificarAutenticacao();
        if (!aindaAutenticado) {
            mostrarAlertaSessaoExpirada();
        }
    }, 300000); // 5 minutos

    function mostrarAlertaSessaoExpirada() {
        if (!document.querySelector('.session-alert')) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'session-alert';
            alertDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--vermelho);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 5px 20px rgba(254, 0, 0, 0.3);
                z-index: 2000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
            `;

            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Sessão expirada</strong>
                    <p style="margin: 0; font-size: 0.9rem;">Redirecionando para o login...</p>
                </div>
            `;

            document.body.appendChild(alertDiv);

            setTimeout(() => {
                fazerLogout();
            }, 3000);
        }
    }

    // Atualizar última atividade
    function updateLastActivity() {
        localStorage.setItem('lastActivity', Date.now().toString());
    }

    document.addEventListener('click', updateLastActivity);
    document.addEventListener('keypress', updateLastActivity);
    updateLastActivity();
    adicionarBotaoLimparFiltros();

});

// ========== VARIÁVEIS PARA GESTÃO DE PAGAMENTOS ==========
let alunoGestaoAtual = null;
let pagamentosTemporarios = [];

// ========== FUNÇÕES PARA GESTÃO DE PAGAMENTOS ==========

function abrirGestaoPagamentos(alunoId) {
    getAlunoById(alunoId).then(aluno => {
        if (!aluno) return;

        alunoGestaoAtual = aluno;
        currentAlunoId = alunoId;

        // Atualizar informações do aluno no modal
        document.getElementById('gestaoPagamentosTitle').textContent = `Pagamentos: ${formatarNome(aluno.completename)}`;
        document.getElementById('alunoPagamentoNome').textContent = aluno.completename;
        document.getElementById('alunoPagamentoTurma').textContent = `${aluno.turma}º Turma`;
        document.getElementById('alunoPagamentoResponsavel').textContent = aluno.responsavel || 'Sem responsável';

        // Calcular status geral
        const mesesPagos = calcularMesesPagos(aluno);
        const statusGeral = mesesPagos === 12 ? 'Em dia' : mesesPagos === 0 ? 'Inadimplente' : 'Parcial';
        document.getElementById('alunoPagamentoStatus').textContent = `Status: ${statusGeral}`;

        // Carregar tabela de meses
        carregarTabelaMeses(aluno);

        // Carregar resumo anual
        carregarResumoAnual(aluno);

        // Mostrar modal
        document.getElementById('gestaoPagamentosModal').style.display = 'flex';
    });
}

function carregarTabelaMeses(aluno) {
    const tabelaBody = document.getElementById('tabelaMesesBody');
    if (!tabelaBody) return;

    tabelaBody.innerHTML = '';
    pagamentosTemporarios = [];

    const meses = [
        { num: '01', nome: 'Janeiro', valor: '300.00' },
        { num: '02', nome: 'Fevereiro', valor: '300.00' },
        { num: '03', nome: 'Março', valor: '300.00' },
        { num: '04', nome: 'Abril', valor: '300.00' },
        { num: '05', nome: 'Maio', valor: '300.00' },
        { num: '06', nome: 'Junho', valor: '300.00' },
        { num: '07', nome: 'Julho', valor: '300.00' },
        { num: '08', nome: 'Agosto', valor: '300.00' },
        { num: '09', nome: 'Setembro', valor: '300.00' },
        { num: '10', nome: 'Outubro', valor: '300.00' },
        { num: '11', nome: 'Novembro', valor: '300.00' },
        { num: '12', nome: 'Dezembro', valor: '300.00' }
    ];

    meses.forEach(mes => {
        const pagamentoExistente = aluno.pgto?.find(p => p.mes === mes.num);
        const estaPago = pagamentoExistente?.pago === true;

        // Usar os dados salvos se existirem, senão usar padrão
        const valor = pagamentoExistente?.valor || mes.valor;
        const dataPagamento = pagamentoExistente?.dataPagamento || '';
        const formaPagamento = pagamentoExistente?.forma || 'PIX';
        const observacoes = pagamentoExistente?.observacoes || '';

        const pagamentoTemp = {
            mes: mes.num,
            nome: mes.nome,
            pago: estaPago,
            valor: valor,
            dataPagamento: dataPagamento,
            formaPagamento: formaPagamento,
            observacoes: observacoes,
            originalPago: estaPago,
            originalValor: valor,
            originalData: dataPagamento,
            originalForma: formaPagamento
        };

        pagamentosTemporarios.push(pagamentoTemp);

        // ... resto do código da criação da linha da tabela permanece igual
        // Mas adicione um campo para observações se quiser:
        const row = document.createElement('tr');
        row.className = 'mes-row';
        row.innerHTML = `
            <td style="font-weight: 500; color: var(--azul);">${mes.nome}</td>
            <td class="status-cell">
                <label class="status-toggle">
                    <input type="checkbox" ${estaPago ? 'checked' : ''} data-mes="${mes.num}">
                    <span class="status-slider"></span>
                </label>
                <span class="status-text ${estaPago ? 'status-pago' : 'status-pendente'}">
                    ${estaPago ? 'PAGO' : 'PENDENTE'}
                </span>
            </td>
            <td>
                <input type="number" 
                       class="form-input" 
                       style="width: 100px; padding: 0.3rem; text-align: center;" 
                       value="${valor}" 
                       step="0.01" 
                       min="0"
                       data-mes="${mes.num}">
            </td>
            <td>
                <input type="date" 
                       class="form-input" 
                       style="padding: 0.3rem;" 
                       value="${dataPagamento}"
                       data-mes="${mes.num}"
                       ${!estaPago ? 'disabled' : ''}>
            </td>
            <td>
                <select class="form-input" 
                        style="padding: 0.3rem; font-size: 0.85rem;" 
                        data-mes="${mes.num}"
                        ${!estaPago ? 'disabled' : ''}>
                    <option value="PIX" ${formaPagamento === 'PIX' ? 'selected' : ''}>PIX</option>
                    <option value="Dinheiro" ${formaPagamento === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
                    <option value="Cartão" ${formaPagamento === 'Cartão' ? 'selected' : ''}>Cartão</option>
                    <option value="Transferência" ${formaPagamento === 'Transferência' ? 'selected' : ''}>Transferência</option>
                </select>
            </td>
            <td style="text-align: center;">
                <button class="btn-action btn-recibo-mes" 
                        data-mes="${mes.num}"
                        title="Gerar recibo deste mês"
                        ${!estaPago ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    <i class="fas fa-receipt"></i>
                </button>
            </td>
        `;

        tabelaBody.appendChild(row);
    });

    configurarEventListenersMeses();
}

function configurarEventListenersMeses() {
    // Toggle de status
    document.querySelectorAll('.status-toggle input').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const mes = this.dataset.mes;
            const estaPago = this.checked;
            const pagamento = pagamentosTemporarios.find(p => p.mes === mes);

            if (pagamento) {
                pagamento.pago = estaPago;

                // Atualizar status text
                const statusText = this.parentElement.nextElementSibling;
                if (statusText) {
                    statusText.textContent = estaPago ? 'PAGO' : 'PENDENTE';
                    statusText.className = `status-text ${estaPago ? 'status-pago' : 'status-pendente'}`;
                }

                // Habilitar/desabilitar campos relacionados
                const row = this.closest('tr');
                if (row) {
                    const dataInput = row.querySelector('input[type="date"]');
                    const formaSelect = row.querySelector('select');

                    if (dataInput) dataInput.disabled = !estaPago;
                    if (formaSelect) formaSelect.disabled = !estaPago;

                    // Se não está pago, limpar data
                    if (!estaPago && dataInput) {
                        dataInput.value = '';
                    }
                }
            }
        });
    });

    // Inputs de valor
    document.querySelectorAll('.meses-table input[type="number"]').forEach(input => {
        input.addEventListener('change', function () {
            const mes = this.dataset.mes;
            const pagamento = pagamentosTemporarios.find(p => p.mes === mes);
            if (pagamento) {
                pagamento.valor = this.value;
            }
        });
    });

    // Inputs de data
    document.querySelectorAll('.meses-table input[type="date"]').forEach(input => {
        input.addEventListener('change', function () {
            const mes = this.dataset.mes;
            const pagamento = pagamentosTemporarios.find(p => p.mes === mes);
            if (pagamento) {
                pagamento.dataPagamento = this.value;
            }
        });
    });

    // Selects de forma de pagamento
    document.querySelectorAll('.meses-table select').forEach(select => {
        select.addEventListener('change', function () {
            const mes = this.dataset.mes;
            const pagamento = pagamentosTemporarios.find(p => p.mes === mes);
            if (pagamento) {
                pagamento.formaPagamento = this.value;
            }
        });
    });

    // Botões de recibo por mês
    document.querySelectorAll('.btn-recibo-mes').forEach(btn => {
        btn.addEventListener('click', function () {
            if (!this.disabled) {
                const mes = this.dataset.mes;
                abrirModalRecibo(mes);
            }
        });
    });
}

function carregarResumoAnual(aluno) {
    const resumoDiv = document.getElementById('resumoAnual');
    if (!resumoDiv) return;

    const mesesPagos = calcularMesesPagos(aluno);
    const valorTotal = mesesPagos * 300; // Valor fixo por mês
    const mesesRestantes = 12 - mesesPagos;

    resumoDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--verde);">${mesesPagos}/12</div>
            <div style="font-size: 0.85rem; color: var(--cinza-escuro);">Meses Pagos</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--azul);">R$ ${valorTotal.toFixed(2)}</div>
            <div style="font-size: 0.85rem; color: var(--cinza-escuro);">Valor Total</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: ${mesesRestantes > 0 ? 'var(--vermelho)' : 'var(--verde)'};">${mesesRestantes}</div>
            <div style="font-size: 0.85rem; color: var(--cinza-escuro);">Meses Restantes</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: ${mesesPagos === 12 ? 'var(--verde)' : mesesPagos === 0 ? 'var(--vermelho)' : 'var(--laranja)'};">${Math.round((mesesPagos / 12) * 100)}%</div>
            <div style="font-size: 0.85rem; color: var(--cinza-escuro);">Porcentagem</div>
        </div>
    `;
}

function calcularMesesPagos(aluno) {
    if (!aluno.pgto || aluno.pgto.length === 0) return 0;
    return aluno.pgto.filter(p => p.pago === true).length;
}

// Substitua a função salvarPagamentos por esta versão melhorada:

async function salvarPagamentos() {
    if (!alunoGestaoAtual) {
        showNotification('Erro: Aluno não encontrado', 'error');
        return;
    }

    let alteracoes = 0;
    let promises = [];

    // Atualize a lógica de verificação de alterações:

    pagamentosTemporarios.forEach(pagamento => {
        // Verificar se houve alteração em qualquer campo
        const houveAlteracao =
            pagamento.pago !== pagamento.originalPago ||
            pagamento.valor !== pagamento.originalValor ||
            pagamento.dataPagamento !== pagamento.originalData ||
            pagamento.formaPagamento !== pagamento.originalForma;

        if (houveAlteracao) {
            alteracoes++;

            // Se mudou o status, usar endpoint setpago
            if (pagamento.pago !== pagamento.originalPago) {
                promises.push(
                    setPagamento(currentAlunoId, pagamento.mes, pagamento.pago)
                );
            }

            // Se está pago, salvar detalhes (mesmo se já estava pago mas mudou valor/forma/data)
            if (pagamento.pago) {
                promises.push(
                    salvarDetalhesPagamento(
                        currentAlunoId,
                        pagamento.mes,
                        pagamento.valor,
                        pagamento.formaPagamento,
                        pagamento.dataPagamento
                    )
                );
            }
        }
    });

    if (alteracoes === 0) {
        showNotification('Nenhuma alteração para salvar', 'info');
        return;
    }

    // Mostrar loading
    showNotification('Salvando pagamentos...', 'info');

    Promise.all(promises).then((results) => {
        // Verificar se todos foram bem sucedidos
        const sucessos = results.filter(r => r && r.success).length;

        showNotification(`${sucessos} pagamento(s) atualizado(s) com sucesso!`, 'success');

        // Fechar modal
        document.getElementById('gestaoPagamentosModal').style.display = 'none';

        // Recarregar dados da página principal
        fetchAlunos().then(alunos => {
            carregarAlunos(alunos);
        });
    }).catch(error => {
        console.error('Erro ao salvar pagamentos:', error);
        showNotification('Erro ao salvar alguns pagamentos', 'error');
    });

    fetchAlunos().then(alunos => {
        todosAlunos = alunos; // Atualizar todosAlunos
        alunosFiltrados = [...alunos]; // Resetar filtrados
        carregarAlunosUI(alunosFiltrados); // Mostrar todos
        aplicarFiltrosAtuais(); // Reaplicar filtros se houver
    });
}

// Adicione esta nova função para salvar detalhes:
async function salvarDetalhesPagamento(id, mes, valor, forma, dataPagamento) {
    try {
        const response = await fetch(`/setpagamentodetalhes?id=${id}&mes=${mes}&valor=${valor}&forma=${forma}&dataPagamento=${dataPagamento}`);
        if (!response.ok) throw new Error('Erro ao salvar detalhes');
        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar detalhes:', error);
        return { success: false, reason: 'Erro ao salvar detalhes' };
    }
}

function abrirModalRecibo(mes) {
    const pagamento = pagamentosTemporarios.find(p => p.mes === mes);
    if (!pagamento || !pagamento.pago) {
        showNotification('Este mês não está marcado como pago', 'warning');
        return;
    }

    // Preencher valores padrão
    document.getElementById('mesRecibo').value = mes;
    document.getElementById('valorRecibo').value = pagamento.valor || '300.00';
    document.getElementById('formaRecibo').value = pagamento.formaPagamento || 'PIX';
    document.getElementById('dataRecibo').value = pagamento.dataPagamento || new Date().toISOString().split('T')[0];

    document.getElementById('reciboModal').style.display = 'flex';
}

function gerarRecibo() {
    if (!alunoGestaoAtual) return;

    const mes = document.getElementById('mesRecibo').value;
    const valor = document.getElementById('valorRecibo').value;
    const forma = document.getElementById('formaRecibo').value;
    const data = document.getElementById('dataRecibo').value;
    const obs = document.getElementById('obsRecibo').value;

    const dadosRecibo = {
        aluno: alunoGestaoAtual,
        mes: mes,
        valor: valor,
        forma: forma,
        data: data,
        observacoes: obs
    };

    const reciboHTML = criarReciboHTML(dadosRecibo);

    // Abrir recibo em nova janela
    const janelaRecibo = window.open('', '_blank');
    janelaRecibo.document.write(reciboHTML);
    janelaRecibo.document.close();

    // Fechar modal
    document.getElementById('reciboModal').style.display = 'none';
    showNotification('Recibo gerado com sucesso!', 'success');
}

function criarReciboHTML(dados) {
    const meses = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };

    const dataFormatada = new Date(dados.data).toLocaleDateString('pt-BR');
    const valorExtenso = converterValorExtenso(dados.valor);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Recibo de Pagamento - Método Pré-Vestibular</title>
            <meta charset="UTF-8">
            <style>
                @page { margin: 0; }
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 40px; 
                    color: #333;
                }
                .recibo-container {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 2px solid #000;
                    padding: 40px;
                    position: relative;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #070738;
                    margin: 0 0 10px 0;
                    font-size: 28px;
                }
                .header h2 {
                    color: #FE0000;
                    margin: 0 0 5px 0;
                    font-size: 22px;
                }
                .header p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .content {
                    margin: 30px 0;
                }
                .info-section {
                    margin-bottom: 25px;
                }
                .info-section h3 {
                    color: #070738;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                    font-size: 18px;
                }
                .info-row {
                    display: flex;
                    margin-bottom: 10px;
                    padding: 0 10px;
                }
                .info-label {
                    font-weight: bold;
                    min-width: 180px;
                    color: #555;
                }
                .info-value {
                    flex: 1;
                }
                .assinatura {
                    margin-top: 60px;
                    text-align: center;
                }
                .linha-assinatura {
                    width: 300px;
                    border-top: 1px solid #000;
                    margin: 0 auto 10px;
                    padding-top: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
                .valor-destaque {
                    font-size: 20px;
                    font-weight: bold;
                    color: #070738;
                    text-align: center;
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .extenso {
                    font-style: italic;
                    color: #555;
                    text-align: center;
                    margin-bottom: 20px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    .recibo-container { border: none; padding: 20px; }
                }
                img {
                    height: 100px;
                    width: 100px;
                }
            </style>
        </head>
        <body>
            <div class="recibo-container">
                <div class="header">
                    <img src="https://i.ibb.co/jryH3q8/Min-Branca.png"></img>
                    <h1>MÉTODO PRÉ-VESTIBULAR</h1>
                    <h2>RECIBO DE PAGAMENTO</h2>
                    <p>CNPJ: 53.579.716/0001-51</p>
                    <p>Rua Elisa Lispector, s/n, bairro Tarumã - Manaus/AM</p>
                    <p>Telefone: (92) 99486-0365</p>
                </div>
                
                <div class="content">
                    <div class="info-section">
                        <h3>DADOS DO PAGADOR</h3>
                        <div class="info-row">
                            <span class="info-label">Nome:</span>
                            <span class="info-value">${dados.aluno.responsavel || dados.aluno.completename}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">CPF/CNPJ:</span>
                            <span class="info-value">${dados.aluno.cpfresp || 'Não informado'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Aluno:</span>
                            <span class="info-value">${dados.aluno.completename} - ${dados.aluno.turma}º Turma</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>DADOS DO PAGAMENTO</h3>
                        <div class="info-row">
                            <span class="info-label">Referente a:</span>
                            <span class="info-value">Mensalidade do mês de ${meses[dados.mes]} - ${new Date().getFullYear()}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Forma de Pagamento:</span>
                            <span class="info-value">${dados.forma}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Data do Pagamento:</span>
                            <span class="info-value">${dataFormatada}</span>
                        </div>
                        ${dados.observacoes ? `
                        <div class="info-row">
                            <span class="info-label">Observações:</span>
                            <span class="info-value">${dados.observacoes}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="valor-destaque">
                        VALOR PAGO: R$ ${parseFloat(dados.valor).toFixed(2)}
                    </div>
                    
                    <div class="extenso">
                        ${valorExtenso}
                    </div>
                </div>
                
                <div class="assinatura">
                    <div class="linha-assinatura"></div>
                    <div style="font-weight: bold;">Método Pré-Vestibular</div>
                </div>
                
                <div class="footer">
                    <p>Este recibo foi gerado por ${currentUser.completename.split(" ")[0] + " " + currentUser.completename.split(" ")[1] || 'Administrador'}</p>
                </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="
                    padding: 12px 30px;
                    background: #070738;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-right: 10px;
                ">
                    🖨️ Imprimir Recibo
                </button>
                <button onclick="window.close()" style="
                    padding: 12px 30px;
                    background: #FE0000;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">
                    ✖️ Fechar Janela
                </button>
            </div>
            
            <script>
                // Auto-print ao carregar
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;
}

function converterValorExtenso(valor) {
    // Função simplificada para converter valor para extenso
    const num = parseFloat(valor);
    const inteiro = Math.floor(num);
    const centavos = Math.round((num - inteiro) * 100);

    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const especiais = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];

    let extenso = "";

    if (inteiro === 0) {
        extenso = "zero";
    } else if (inteiro < 10) {
        extenso = unidades[inteiro];
    } else if (inteiro < 20) {
        extenso = especiais[inteiro - 10];
    } else if (inteiro < 100) {
        const dez = Math.floor(inteiro / 10);
        const uni = inteiro % 10;
        extenso = dezenas[dez];
        if (uni > 0) extenso += " e " + unidades[uni];
    } else {
        extenso = inteiro.toString();
    }

    extenso += " rea" + (inteiro !== 1 ? "is" : "l");

    if (centavos > 0) {
        if (inteiro > 0) extenso += " e ";

        if (centavos < 10) {
            extenso += unidades[centavos];
        } else if (centavos < 20) {
            extenso += especiais[centavos - 10];
        } else {
            const dezCent = Math.floor(centavos / 10);
            const uniCent = centavos % 10;
            extenso += dezenas[dezCent];
            if (uniCent > 0) extenso += " e " + unidades[uniCent];
        }

        extenso += " centavo" + (centavos !== 1 ? "s" : "");
    }

    return extenso.charAt(0).toUpperCase() + extenso.slice(1);
}

function gerarRelatorioAnual() {
    if (!alunoGestaoAtual) return;

    // Aqui você implementaria a geração de relatório anual
    showNotification('Funcionalidade de relatório anual em desenvolvimento', 'info');
}

// ========== CONFIGURAR EVENT LISTENERS ADICIONAIS ==========

function configurarEventListenersPagamentos() {
    // Botão para marcar todos como pagos
    const btnMarcarTodosPagos = document.getElementById('btnMarcarTodosPagos');
    if (btnMarcarTodosPagos) {
        btnMarcarTodosPagos.addEventListener('click', function () {
            document.querySelectorAll('.status-toggle input').forEach(toggle => {
                toggle.checked = true;
                toggle.dispatchEvent(new Event('change'));
            });
            showNotification('Todos os meses marcados como pagos', 'success');
        });
    }

    // Botão para marcar todos como pendentes
    const btnMarcarTodosPendentes = document.getElementById('btnMarcarTodosPendentes');
    if (btnMarcarTodosPendentes) {
        btnMarcarTodosPendentes.addEventListener('click', function () {
            document.querySelectorAll('.status-toggle input').forEach(toggle => {
                toggle.checked = false;
                toggle.dispatchEvent(new Event('change'));
            });
            showNotification('Todos os meses marcados como pendentes', 'warning');
        });
    }

    // Botão para salvar pagamentos
    const btnSalvarPagamentos = document.getElementById('btnSalvarPagamentos');
    if (btnSalvarPagamentos) {
        btnSalvarPagamentos.addEventListener('click', salvarPagamentos);
    }

    // Botão para gerar recibo mensal
    const btnGerarReciboMensal = document.getElementById('btnGerarReciboMensal');
    if (btnGerarReciboMensal) {
        btnGerarReciboMensal.addEventListener('click', function () {
            // Abrir modal para selecionar mês
            abrirModalRecibo('01'); // Janeiro por padrão
        });
    }

    // Botão para gerar relatório anual
    const btnGerarRelatorioAnual = document.getElementById('btnGerarRelatorioAnual');
    if (btnGerarRelatorioAnual) {
        btnGerarRelatorioAnual.addEventListener('click', gerarRelatorioAnual);
    }

    // Fechar modal de gestão
    const btnFecharGestao = document.getElementById('btnFecharGestao');
    if (btnFecharGestao) {
        btnFecharGestao.addEventListener('click', function () {
            document.getElementById('gestaoPagamentosModal').style.display = 'none';
        });
    }

    const closeGestaoPagamentos = document.getElementById('closeGestaoPagamentos');
    if (closeGestaoPagamentos) {
        closeGestaoPagamentos.addEventListener('click', function () {
            document.getElementById('gestaoPagamentosModal').style.display = 'none';
        });
    }

    // Modal de recibo
    const btnCancelarRecibo = document.getElementById('btnCancelarRecibo');
    if (btnCancelarRecibo) {
        btnCancelarRecibo.addEventListener('click', function () {
            document.getElementById('reciboModal').style.display = 'none';
        });
    }

    const closeReciboModal = document.getElementById('closeReciboModal');
    if (closeReciboModal) {
        closeReciboModal.addEventListener('click', function () {
            document.getElementById('reciboModal').style.display = 'none';
        });
    }

    const btnGerarReciboConfirmar = document.getElementById('btnGerarReciboConfirmar');
    if (btnGerarReciboConfirmar) {
        btnGerarReciboConfirmar.addEventListener('click', gerarRecibo);
    }
}

function abrirModalReciboAluno(alunoId) {
    getAlunoById(alunoId).then(aluno => {
        if (!aluno) return;

        alunoGestaoAtual = aluno;
        currentAlunoId = alunoId;
        abrirModalRecibo('01'); // Abre o modal de recibo
    });
}

function enviarMensagemWhatsapp(alunoId) {
    getAlunoById(alunoId).then(aluno => {
        if (!aluno || !aluno.telresp) {
            showNotification('Telefone do responsável não encontrado', 'warning');
            return;
        }

        const link = formatarLinkWhatsapp(aluno.telresp, aluno.completename);
        window.open(link, '_blank');
    });
}

// Função para limpar filtros (adicione ao botão Limpar Filtros)
function limparTodosFiltros() {
    // Limpar inputs
    const searchInput = document.getElementById('searchAluno');
    const filterTurma = document.getElementById('filterTurma');
    const filterStatus = document.getElementById('filterStatus');

    if (searchInput) searchInput.value = '';
    if (filterTurma) filterTurma.value = '';
    if (filterStatus) filterStatus.value = '';

    // Limpar filtros ativos
    filtrosAtivos = {
        busca: '',
        turma: '',
        status: '',
        mes: ''
    };

    // Recarregar todos os alunos
    carregarAlunos(todosAlunos);
    showNotification('Filtros limpos', 'info');
}

function aplicarFiltrosAtuais() {
    const searchInput = document.getElementById('searchAluno');
    const filterTurma = document.getElementById('filterTurma');
    const filterStatus = document.getElementById('filterStatus');

    // Se há algum filtro ativo, reaplicar
    if ((searchInput && searchInput.value) || 
        (filterTurma && filterTurma.value) || 
        (filterStatus && filterStatus.value)) {
        filtrarAlunos();
    }
}

async function gerarRelatorioAnualAluno() {
    if (!alunoGestaoAtual) {
        showNotification('Nenhum aluno selecionado', 'warning');
        return;
    }

    // Atualizar dados do aluno se necessário
    const alunoAtualizado = await getAlunoById(currentAlunoId);
    if (!alunoAtualizado) {
        showNotification('Erro ao carregar dados do aluno', 'error');
        return;
    }

    alunoGestaoAtual = alunoAtualizado;

    // Criar HTML do relatório anual
    const relatorioHTML = criarRelatorioAnualHTML(alunoAtualizado);

    // Abrir relatório em nova janela
    const janelaRelatorio = window.open('', '_blank');
    janelaRelatorio.document.write(relatorioHTML);
    janelaRelatorio.document.close();

    showNotification('Relatório anual gerado com sucesso!', 'success');
}

function criarRelatorioAnualHTML(aluno) {
    const meses = [
        { num: '01', nome: 'Janeiro', valor: '300.00' },
        { num: '02', nome: 'Fevereiro', valor: '300.00' },
        { num: '03', nome: 'Março', valor: '300.00' },
        { num: '04', nome: 'Abril', valor: '300.00' },
        { num: '05', nome: 'Maio', valor: '300.00' },
        { num: '06', nome: 'Junho', valor: '300.00' },
        { num: '07', nome: 'Julho', valor: '300.00' },
        { num: '08', nome: 'Agosto', valor: '300.00' },
        { num: '09', nome: 'Setembro', valor: '300.00' },
        { num: '10', nome: 'Outubro', valor: '300.00' },
        { num: '11', nome: 'Novembro', valor: '300.00' },
        { num: '12', nome: 'Dezembro', valor: '300.00' }
    ];

    // Calcular estatísticas
    let mesesPagos = 0;
    let valorTotalPago = 0;
    let valorTotalDevido = 0;
    const anoAtual = new Date().getFullYear();

    // Preencher dados dos meses
    const mesesComDados = meses.map(mes => {
        const pagamento = aluno.pgto?.find(p => p.mes === mes.num);
        const estaPago = pagamento?.pago === true;
        const valor = pagamento?.valor || mes.valor;
        const dataPagamento = pagamento?.dataPagamento ? 
            new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR') : 'Não pago';
        const formaPagamento = pagamento?.forma || 'Não pago';

        if (estaPago) {
            mesesPagos++;
            valorTotalPago += parseFloat(valor);
        }
        valorTotalDevido += parseFloat(valor);

        return {
            ...mes,
            pago: estaPago,
            valor: valor,
            dataPagamento: dataPagamento,
            formaPagamento: formaPagamento,
            observacoes: pagamento?.observacoes || ''
        };
    });

    // Calcular saldo
    const saldo = valorTotalDevido - valorTotalPago;
    const porcentagem = mesesPagos > 0 ? Math.round((mesesPagos / 12) * 100) : 0;
    const statusGeral = mesesPagos === 12 ? 'QUITADO' : mesesPagos === 0 ? 'INADIMPLENTE' : 'PARCELADO';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Anual - ${aluno.completename} - ${anoAtual}</title>
            <meta charset="UTF-8">
            <style>
                @page { margin: 0; }
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 40px; 
                    color: #333;
                }
                .relatorio-container {
                    max-width: 1000px;
                    margin: 0 auto;
                }
                
                /* Cabeçalho do Relatório */
                .header-relatorio {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 3px solid #070738;
                    padding-bottom: 25px;
                }
                .header-relatorio h1 {
                    color: #070738;
                    margin: 0 0 10px 0;
                    font-size: 28px;
                }
                .header-relatorio h2 {
                    color: #FE0000;
                    margin: 0 0 20px 0;
                    font-size: 22px;
                }
                .header-relatorio p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .logo-header {
                    height: 80px;
                    width: 80px;
                    margin-bottom: 15px;
                }
                
                /* Informações do Aluno */
                .info-aluno {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    border-left: 5px solid #070738;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .info-item {
                    margin-bottom: 10px;
                }
                .info-label {
                    font-weight: bold;
                    color: #555;
                    display: inline-block;
                    min-width: 180px;
                }
                
                /* Resumo Financeiro */
                .resumo-financeiro {
                    background: linear-gradient(135deg, #070738, #1a1a6e);
                    color: white;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                }
                .resumo-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    text-align: center;
                }
                .resumo-item {
                    padding: 15px;
                }
                .resumo-valor {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 5px;
                }
                .resumo-label {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                /* Tabela de Meses */
                .tabela-meses {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 30px 0;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .tabela-meses th {
                    background: #070738;
                    color: white;
                    padding: 15px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                }
                .tabela-meses td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #ddd;
                }
                .tabela-meses tr:nth-child(even) {
                    background: #f9f9f9;
                }
                .tabela-meses tr:hover {
                    background: #f0f0f0;
                }
                
                /* Status Badges */
                .status-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                }
                .status-pago {
                    background: #d4edda;
                    color: #155724;
                }
                .status-pendente {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                /* Observações e Rodapé */
                .observacoes {
                    background: #fff8e1;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 30px 0;
                    border-left: 4px solid #ffc107;
                }
                .observacoes h3 {
                    color: #856404;
                    margin-top: 0;
                }
                
                .footer-relatorio {
                    text-align: center;
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                
                .assinatura {
                    margin-top: 60px;
                    text-align: right;
                }
                .linha-assinatura {
                    width: 300px;
                    border-top: 1px solid #000;
                    margin: 40px auto 10px;
                    padding-top: 20px;
                }
                
                /* Estilos para impressão */
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    .header-relatorio {
                        page-break-after: avoid;
                    }
                    .tabela-meses {
                        page-break-inside: avoid;
                    }
                    .resumo-financeiro {
                        page-break-inside: avoid;
                    }
                }
                
                /* Gráfico de progresso */
                .progress-container {
                    width: 100%;
                    background: #e9ecef;
                    height: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    overflow: hidden;
                }
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #28a745, #20c997);
                    border-radius: 10px;
                    transition: width 0.5s ease;
                    position: relative;
                }
                .progress-text {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="relatorio-container">
                <!-- Cabeçalho -->
                <div class="header-relatorio">
                    <img src="https://i.ibb.co/jryH3q8/Min-Branca.png" class="logo-header">
                    <h1>MÉTODO PRÉ-VESTIBULAR</h1>
                    <h2>RELATÓRIO ANUAL DE PAGAMENTOS - ${anoAtual}</h2>
                    <p>CNPJ: 53.579.716/0001-51 | Rua Elisa Lispector, s/n, Tarumã - Manaus/AM</p>
                    <p>Telefone: (92) 99486-0365 | Email: metodoprevest@gmail.com</p>
                    <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                
                <!-- Informações do Aluno -->
                <div class="info-aluno">
                    <h3 style="color: #070738; margin-top: 0; border-bottom: 2px solid #070738; padding-bottom: 10px;">INFORMAÇÕES DO ALUNO</h3>
                    <div class="info-grid">
                        <div>
                            <div class="info-item">
                                <span class="info-label">Nome completo:</span>
                                <span>${aluno.completename}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Responsável:</span>
                                <span>${aluno.responsavel || 'Não informado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Turma:</span>
                                <span>${aluno.turma}º Turma</span>
                            </div>
                        </div>
                        <div>
                            <div class="info-item">
                                <span class="info-label">Telefone:</span>
                                <span>${formatarTelefone(aluno.telresp) || 'Não informado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email:</span>
                                <span>${aluno.email || 'Não informado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Data de Nascimento:</span>
                                <span>${formatarData(aluno.nascimento)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Resumo Financeiro -->
                <div class="resumo-financeiro">
                    <h3 style="color: white; margin-top: 0; text-align: center;">RESUMO FINANCEIRO - ${anoAtual}</h3>
                    
                    <div style="margin: 20px 0; text-align: center;">
                        <span style="background: ${statusGeral === 'QUITADO' ? '#28a745' : statusGeral === 'INADIMPLENTE' ? '#dc3545' : '#ffc107'}; 
                               color: white; 
                               padding: 10px 30px; 
                               border-radius: 25px;
                               font-weight: bold;
                               font-size: 16px;">
                            SITUAÇÃO: ${statusGeral}
                        </span>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${porcentagem}%;">
                            <span class="progress-text">${porcentagem}%</span>
                        </div>
                    </div>
                    
                    <div class="resumo-grid">
                        <div class="resumo-item">
                            <div class="resumo-valor">${mesesPagos}/12</div>
                            <div class="resumo-label">Meses Pagos</div>
                        </div>
                        <div class="resumo-item">
                            <div class="resumo-valor">R$ ${valorTotalPago.toFixed(2)}</div>
                            <div class="resumo-label">Total Pago</div>
                        </div>
                        <div class="resumo-item">
                            <div class="resumo-valor">R$ ${saldo.toFixed(2)}</div>
                            <div class="resumo-label">Saldo Devido</div>
                        </div>
                        <div class="resumo-item">
                            <div class="resumo-valor">${porcentagem}%</div>
                            <div class="resumo-label">Porcentagem</div>
                        </div>
                    </div>
                </div>
                
                <!-- Tabela de Meses -->
                <h3 style="color: #070738; margin: 40px 0 20px 0; border-bottom: 2px solid #070738; padding-bottom: 10px;">DETALHAMENTO POR MÊS</h3>
                <table class="tabela-meses">
                    <thead>
                        <tr>
                            <th>Mês</th>
                            <th>Status</th>
                            <th>Valor (R$)</th>
                            <th>Data Pagamento</th>
                            <th>Forma de Pagamento</th>
                            <th>Observações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mesesComDados.map(mes => `
                            <tr>
                                <td style="font-weight: 500;">${mes.nome}</td>
                                <td>
                                    <span class="status-badge ${mes.pago ? 'status-pago' : 'status-pendente'}">
                                        ${mes.pago ? 'PAGO' : 'PENDENTE'}
                                    </span>
                                </td>
                                <td>${parseFloat(mes.valor).toFixed(2)}</td>
                                <td>${mes.dataPagamento}</td>
                                <td>${mes.formaPagamento}</td>
                                <td style="font-size: 12px;">${mes.observacoes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <!-- Totais -->
                <div style="display: flex; justify-content: space-between; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 14px; color: #666;">Valor Total do Ano</div>
                        <div style="font-size: 22px; font-weight: bold; color: #070738;">R$ ${valorTotalDevido.toFixed(2)}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 14px; color: #666;">Total Pago</div>
                        <div style="font-size: 22px; font-weight: bold; color: #28a745;">R$ ${valorTotalPago.toFixed(2)}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 14px; color: #666;">Saldo Devido</div>
                        <div style="font-size: 22px; font-weight: bold; color: ${saldo > 0 ? '#dc3545' : '#28a745'};">R$ ${saldo.toFixed(2)}</div>
                    </div>
                </div>
                
                <!-- Observações -->
                ${aluno.observacoes ? `
                <div class="observacoes">
                    <h3>OBSERVAÇÕES</h3>
                    <p>${aluno.observacoes}</p>
                </div>
                ` : ''}
                
                <!-- Rodapé e Assinatura -->
                <div class="assinatura">
                    <div class="linha-assinatura"></div>
                    <div style="text-align: center;">
                        <div style="font-weight: bold;">Método Pré-Vestibular</div>
                        <div style="font-size: 12px; color: #666;">Responsável Financeiro</div>
                    </div>
                </div>
                
                <div class="footer-relatorio">
                    <p>Este relatório foi gerado automaticamente por ${currentUser?.completename?.split(" ")[0] || 'Administrador'}</p>
                    <p>© ${anoAtual} Método Pré-Vestibular. Todos os direitos reservados.</p>
                    <p>Documento para fins de controle financeiro interno</p>
                </div>
            </div>
            
            <!-- Botões de Ação -->
            <div class="no-print" style="text-align: center; margin-top: 40px; padding: 30px; background: #f8f9fa; border-radius: 10px;">
                <h3 style="color: #070738; margin-bottom: 20px;">Ações do Relatório</h3>
                <button onclick="window.print()" style="
                    padding: 12px 35px;
                    background: #070738;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin: 0 10px 10px 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                ">
                    🖨️ Imprimir Relatório
                </button>
                <button onclick="window.close()" style="
                    padding: 12px 35px;
                    background: #FE0000;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin: 0 10px 10px 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                ">
                    ✖️ Fechar Janela
                </button>
                <button onclick="salvarComoPDF()" style="
                    padding: 12px 35px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin: 0 10px 10px 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                ">
                    📄 Salvar como PDF
                </button>
            </div>
            
            <script>
                // Funções auxiliares para formatação
                function formatarTelefone(tel) {
                    if (!tel) return 'Não informado';
                    return tel.replace(/(\\d{2})(\\d{4,5})(\\d{4})/, '($1) $2-$3');
                }
                
                function formatarData(dataStr) {
                    if (!dataStr) return 'Não informado';
                    return new Date(dataStr).toLocaleDateString('pt-BR');
                }
                
                // Auto-print e outras funções
                window.onload = function() {
                    // Auto-imprimir se configurado
                    // window.print();
                };
                
                function salvarComoPDF() {
                    alert('Para salvar como PDF, use a opção "Salvar como PDF" na impressão.');
                    window.print();
                }
            </script>
        </body>
        </html>
    `;
}

// Atualize a função gerarRelatorioAnual para usar a nova função:
function gerarRelatorioAnual() {
    if (!alunoGestaoAtual) {
        showNotification('Nenhum aluno selecionado', 'warning');
        return;
    }
    gerarRelatorioAnualAluno();
}

// Funções auxiliares que precisam estar disponíveis globalmente
function formatarTelefone(tel) {
    if (!tel) return 'Não informado';
    return tel.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

function formatarData(dataStr) {
    if (!dataStr) return 'Não informado';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
}

document.getElementsByClassName("logo-text")[0].onclick = function () {
    window.location.href = "/index.html";
};