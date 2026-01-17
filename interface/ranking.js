document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = '/api';
    let currentSimulado = null;
    let currentRankingData = [];
    let currentTurma = null;
    let currentPage = 1;
    const itemsPerPage = 15;
    let totalPages = 1;

    // Verificar autenticação
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        window.location.href = 'login.html';
        return;
    }

    // Elementos DOM
    const userAvatarElement = document.getElementById('userAvatar');
    const userNameElement = document.getElementById('userName');
    const simuladoSelect = document.getElementById('simuladoSelect');
    const turmaSelect = document.getElementById('turmaSelect');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const rankingBody = document.getElementById('rankingBody');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const resultsCount = document.getElementById('resultsCount');
    const pageNumbers = document.getElementById('pageNumbers');
    const viewDetailsBtn = document.getElementById('viewDetailsBtn');

    // Estatísticas
    const totalStudentsElement = document.getElementById('totalStudents');
    const averageScoreElement = document.getElementById('averageScore');
    const totalQuestionsElement = document.getElementById('totalQuestions');

    // Informações do simulado
    const simuladoNameElement = document.getElementById('simuladoName');
    const simuladoDateElement = document.getElementById('simuladoDate');
    const simuladoQuestionsElement = document.getElementById('simuladoQuestions');
    const simuladoModelElement = document.getElementById('simuladoModel');
    const simuladoDescriptionElement = document.getElementById('simuladoDescription');
    const turmasListElement = document.getElementById('turmasList');

    // Medalhas
    const goldNameElement = document.getElementById('goldName');
    const goldScoreElement = document.getElementById('goldScore');
    const silverNameElement = document.getElementById('silverName');
    const silverScoreElement = document.getElementById('silverScore');
    const bronzeNameElement = document.getElementById('bronzeName');
    const bronzeScoreElement = document.getElementById('bronzeScore');

    // Desempenho do usuário
    const myPerformanceSection = document.getElementById('myPerformanceSection');
    const myRankElement = document.getElementById('myRank');
    const myScoreElement = document.getElementById('myScore');
    const myPercentElement = document.getElementById('myPercent');

    // Inicializar
    async function init() {
        updateUserInfo();
        await loadSimulados();
        setupEventListeners();
        addAdminItemToNavbar();
        
        // Carregar último simulado visto
        const lastSimuladoId = localStorage.getItem('lastViewedSimulado');
        if (lastSimuladoId) {
            simuladoSelect.value = lastSimuladoId;
            await loadSimuladoInfo(lastSimuladoId);
        }
    }

    // Atualizar informações do usuário
    function updateUserInfo() {
        if (userAvatarElement && user.profilePicture) {
            userAvatarElement.src = user.profilePicture;
        }
        if (userNameElement) {
            userNameElement.textContent = user.completename || 'Usuário';
        }
    }

    // Carregar lista de simulados
    async function loadSimulados() {
        try {
            const response = await fetch('/varsimulados');
            const simulados = await response.json();
            
            if (Array.isArray(simulados)) {
                populateSimuladoSelect(simulados);
            } else {
                throw new Error('Formato de dados inválido');
            }
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
            showError('Erro ao carregar lista de simulados');
            // Usar dados mockados como fallback
            useMockSimulados();
        }
    }

    function populateSimuladoSelect(simulados) {
        simuladoSelect.innerHTML = '<option value="">Escolha um simulado...</option>';
        
        // Ordenar por data (mais recentes primeiro)
        const sortedSimulados = simulados.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateB - dateA;
        });

        sortedSimulados.forEach(simulado => {
            const option = document.createElement('option');
            option.value = simulado.id;
            option.textContent = `${simulado.name} (${simulado.date.replace(/-/g, '/')})`;
            simuladoSelect.appendChild(option);
        });
    }

    function parseDate(dateString) {
        const [day, month, year] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Carregar informações do simulado selecionado
    async function loadSimuladoInfo(simuladoId) {
        try {
            // Buscar dados dos simulados
            const response = await fetch('/varsimulados');
            const simulados = await response.json();
            
            currentSimulado = simulados.find(s => s.id === simuladoId);
            
            if (!currentSimulado) {
                throw new Error('Simulado não encontrado');
            }

            updateSimuladoInfo(currentSimulado);
            updateTurmaSelect(currentSimulado.turmas);
            
            // Selecionar primeira turma por padrão
            if (currentSimulado.turmas && currentSimulado.turmas.length > 0) {
                turmaSelect.value = currentSimulado.turmas[0];
                currentTurma = currentSimulado.turmas[0];
                await loadRanking();
            }

        } catch (error) {
            console.error('Erro ao carregar informações do simulado:', error);
            showError('Erro ao carregar informações do simulado');
        }
    }

    function updateSimuladoInfo(simulado) {
        simuladoNameElement.textContent = simulado.name;
        simuladoDescriptionElement.textContent = simulado.description || '-';
        
        // Formatar data
        const dateParts = simulado.date.split('-');
        simuladoDateElement.innerHTML = `<i class="fas fa-calendar"></i> ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        
        // Modelo
        simuladoModelElement.innerHTML = `<i class="fas fa-university"></i> ${simulado.model}`;
        
        // Questões
        simuladoQuestionsElement.innerHTML = `<i class="fas fa-question-circle"></i> ${simulado.questions} questões`;
        totalQuestionsElement.textContent = simulado.questions;
        
        // Turmas disponíveis
        updateTurmasList(simulado.turmas);
    }

    function updateTurmaSelect(turmas) {
        turmaSelect.innerHTML = '<option value="">Escolha uma turma...</option>';
        
        turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma > 3 ? `${turma - 3}° ano (Faltosos)` : `${turma}° ano`;
            turmaSelect.appendChild(option);
        });
    }

    function updateTurmasList(turmas) {
        turmasListElement.innerHTML = '';
        
        turmas.forEach(turma => {
            const turmaBadge = document.createElement('div');
            turmaBadge.className = 'turma-badge';
            if (turma === currentTurma) {
                turmaBadge.classList.add('active');
            }
            turmaBadge.textContent = turma > 3 ? `${turma - 3}° (F)` : `${turma}°`;
            turmasListElement.appendChild(turmaBadge);
        });
    }

    // Carregar ranking
    async function loadRanking() {
        if (!currentSimulado || !currentTurma) {
            showError('Selecione um simulado e uma turma');
            return;
        }

        try {
            showLoading();
            
            // Buscar ranking da API (usando o endpoint existente)
            const response = await fetch(`/apiranking?id=${currentSimulado.id}&sel=${currentTurma}`);
            const rankingData = await response.json();

            currentRankingData = rankingData;
            currentPage = 1;
            
            updateStatistics(rankingData);
            updateMedals(rankingData);
            updateUserPerformance(rankingData);
            renderRankingTable();
            updatePagination();
            
            // Salvar último simulado visto
            localStorage.setItem('lastViewedSimulado', currentSimulado.id);

        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            showError('Erro ao carregar dados do ranking');
        } finally {
            hideLoading();
        }
    }

    function updateStatistics(rankingData) {
        totalStudentsElement.textContent = rankingData.length;
        
        if (rankingData.length > 0) {
            const totalScore = rankingData.reduce((sum, student) => sum + student.pont, 0);
            const totalPossible = rankingData.length * currentSimulado.questions;
            const averagePercent = rankingData.length > 0 
                ? Math.round((totalScore / (rankingData.length * currentSimulado.questions)) * 1000) / 10
                : 0;
            averageScoreElement.textContent = `${averagePercent}%`;
        } else {
            averageScoreElement.textContent = '0%';
        }
    }

    function updateMedals(rankingData) {
        if (rankingData.length >= 1) {
            goldNameElement.textContent = rankingData[0].name;
            goldScoreElement.textContent = `${rankingData[0].pont} acertos`;
        } else {
            goldNameElement.textContent = '-';
            goldScoreElement.textContent = '0 acertos';
        }

        if (rankingData.length >= 2) {
            silverNameElement.textContent = rankingData[1].name;
            silverScoreElement.textContent = `${rankingData[1].pont} acertos`;
        } else {
            silverNameElement.textContent = '-';
            silverScoreElement.textContent = '0 acertos';
        }

        if (rankingData.length >= 3) {
            bronzeNameElement.textContent = rankingData[2].name;
            bronzeScoreElement.textContent = `${rankingData[2].pont} acertos`;
        } else {
            bronzeNameElement.textContent = '-';
            bronzeScoreElement.textContent = '0 acertos';
        }
    }

    function updateUserPerformance(rankingData) {
        const userRank = rankingData.findIndex(student => 
            student.id === user.id || 
            student.completename === user.completename
        );

        if (userRank !== -1) {
            const userData = rankingData[userRank];
            myPerformanceSection.style.display = 'block';
            myRankElement.textContent = `#${userRank + 1}`;
            myScoreElement.textContent = userData.pont;
            myPercentElement.textContent = `${userData.percent}%`;
            
            // Adicionar classe de percentual
            myPercentElement.className = 'stat-value percent';
        } else {
            myPerformanceSection.style.display = 'none';
        }
    }

    function renderRankingTable() {
        rankingBody.innerHTML = '';

        if (currentRankingData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <h3>Nenhum participante</h3>
                        <p>Nenhum estudante encontrado para esta turma</p>
                    </div>
                </td>
            `;
            rankingBody.appendChild(emptyRow);
            return;
        }

        // Calcular índices para paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, currentRankingData.length);
        const pageData = currentRankingData.slice(startIndex, endIndex);

        pageData.forEach((student, index) => {
            const globalIndex = startIndex + index;
            const row = document.createElement('tr');
            row.classList.add('ranking-row', 'fade-in');
            
            // Adicionar classes para medalhas
            if (globalIndex === 0) {
                row.classList.add('gold');
            } else if (globalIndex === 1) {
                row.classList.add('silver');
            } else if (globalIndex === 2) {
                row.classList.add('bronze');
            }
            
            // Verificar se é o usuário atual
            if (student.id === user.id || student.completename === user.completename) {
                row.classList.add('user-row');
            }

            // Determinar turma para exibição
            let turmaDisplay = student.turma;
            if (currentTurma > 3) {
                turmaDisplay = `${student.turma}° (F)`;
            } else {
                turmaDisplay = `${student.turma}°`;
            }

            // Determinar classe do percentual
            let percentClass = 'low';
            if (student.percent >= 70) percentClass = 'high';
            else if (student.percent >= 50) percentClass = 'medium';

            row.innerHTML = `
                <td class="position-cell">${globalIndex + 1}</td>
                <td>
                    <div class="student-name">
                        <a href="desempenho.html?id=${student.id}&simulado=${currentSimulado.id}" 
                           title="Ver desempenho detalhado">
                            ${student.name}
                        </a>
                    </div>
                </td>
                <td>
                    <span class="class-badge">${turmaDisplay}</span>
                </td>
                <td>
                    <span class="score-value">${student.pont}</span>
                </td>
                <td>
                    <span class="percent-value ${percentClass}">${student.percent}%</span>
                </td>
                <td>
                    <button class="details-btn" onclick="viewStudentDetails('${student.id}', '${currentSimulado.id}')">
                        <i class="fas fa-chart-bar"></i>
                        <span>Detalhes</span>
                    </button>
                </td>
            `;

            rankingBody.appendChild(row);
        });
    }

    function updatePagination() {
        totalPages = Math.ceil(currentRankingData.length / itemsPerPage);
        
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        resultsCount.textContent = `${currentRankingData.length} participantes`;
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        updatePageNumbers();
    }

    function updatePageNumbers() {
        pageNumbers.innerHTML = '';
        
        // Mostrar até 5 números de página
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderRankingTable();
                updatePagination();
            });
            pageNumbers.appendChild(pageBtn);
        }
    }

    // Funções de utilidade
    function showLoading() {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 1rem; color: var(--azul);">Carregando ranking...</p>
                </td>
            </tr>
        `;
    }

    function hideLoading() {
        // A renderização do ranking já acontece
    }

    function showError(message) {
        showNotification(message, 'error');
    }

    function showSuccess(message) {
        showNotification(message, 'success');
    }

    function showNotification(message, type) {
        // Remover notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#f8d7da' : '#d4edda'};
            color: ${type === 'error' ? '#721c24' : '#155724'};
            padding: 1rem 1.5rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            max-width: 400px;
            border-left: 4px solid ${type === 'error' ? '#dc3545' : '#28a745'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    }

    // Dados mockados para fallback
    function useMockSimulados() {
        const mockSimulados = [
            {
                id: "052025",
                name: "14° Simulado - 2025",
                description: "14° Simulado - 2025",
                model: "SIS",
                date: "31-08-2025",
                questions: 60,
                turmas: [1, 2, 3]
            }
        ];

        populateSimuladoSelect(mockSimulados);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Quando selecionar um simulado
        simuladoSelect.addEventListener('change', async function() {
            const simuladoId = this.value;
            if (simuladoId) {
                await loadSimuladoInfo(simuladoId);
            } else {
                clearSimuladoInfo();
            }
        });

        // Quando selecionar uma turma
        turmaSelect.addEventListener('change', function() {
            currentTurma = this.value;
            updateTurmasList(currentSimulado.turmas);
            if (currentTurma) {
                loadRanking();
            }
        });

        // Aplicar filtros
        applyFiltersBtn.addEventListener('click', () => {
            if (simuladoSelect.value && turmaSelect.value) {
                loadRanking();
            } else {
                showError('Selecione um simulado e uma turma');
            }
        });

        // Atualizar
        refreshBtn.addEventListener('click', () => {
            if (currentSimulado && currentTurma) {
                loadRanking();
            } else {
                showError('Selecione um simulado e uma turma primeiro');
            }
        });

        // Exportar
        exportBtn.addEventListener('click', exportRanking);

        // Paginação
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderRankingTable();
                updatePagination();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderRankingTable();
                updatePagination();
            }
        });

        // Ver detalhes do usuário
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', function() {
                if (currentSimulado) {
                    window.location.href = `desempenho.html?id=${user.id}&simulado=${currentSimulado.id}`;
                } else {
                    showError('Selecione um simulado primeiro');
                }
            });
        }

        // Menu mobile
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', function () {
                this.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (confirm('Tem certeza que deseja sair?')) {
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // Limpar informações do simulado
    function clearSimuladoInfo() {
        simuladoNameElement.textContent = 'Selecione um simulado';
        simuladoDescriptionElement.textContent = '-';
        simuladoDateElement.innerHTML = '<i class="fas fa-calendar"></i> -';
        simuladoModelElement.innerHTML = '<i class="fas fa-university"></i> -';
        simuladoQuestionsElement.innerHTML = '<i class="fas fa-question-circle"></i> 0 questões';
        turmasListElement.innerHTML = '';
        totalQuestionsElement.textContent = '0';
        currentRankingData = [];
        renderRankingTable();
        updatePagination();
        myPerformanceSection.style.display = 'none';
    }

    // Exportar ranking
    function exportRanking() {
        if (currentRankingData.length === 0) {
            showError('Não há dados para exportar');
            return;
        }

        // Criar conteúdo CSV
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Cabeçalho
        const headers = ["Posição", "Nome", "Turma", "Acertos", "Percentual"];
        csvContent += headers.join(",") + "\n";

        // Dados
        currentRankingData.forEach((student, index) => {
            const row = [
                index + 1,
                student.name,
                student.turma,
                student.pont,
                student.percent + "%"
            ];

            csvContent += row.join(",") + "\n";
        });

        // Criar link de download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ranking_${currentSimulado.id}_turma${currentTurma}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess('Ranking exportado com sucesso!');
    }

    // Função global para visualizar detalhes do estudante
    window.viewStudentDetails = function(studentId, simuladoId) {
        window.location.href = `desempenho.html?id=${studentId}&simulado=${simuladoId}`;
    };

    // Adicionar item admin na navbar
    function addAdminItemToNavbar() {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        if (!userData || !userData.permissions || userData.permissions < 1) {
            return;
        }

        const navMenu = document.querySelector('.nav-menu');
        const logoutItem = document.querySelector('.nav-item .nav-link[href="#"]');

        if (!navMenu) {
            console.error('Menu de navegação não encontrado');
            return;
        }

        // Verificar se o item de admin já existe
        if (document.querySelector('.nav-item .nav-link[href="admin.html"]')) {
            return;
        }

        if (userData.permissions > 1) {
            const adminItem = document.createElement('li');
            adminItem.className = 'nav-item';
            adminItem.innerHTML = `
                <a href="admin.html" class="nav-link">
                    <div class="nav-icon">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <span class="nav-label">Administração</span>
                    <div class="nav-glow"></div>
                </a>
            `;

            if (logoutItem && logoutItem.closest('.nav-item')) {
                const logoutListItem = logoutItem.closest('.nav-item');
                navMenu.insertBefore(adminItem, logoutListItem);
            }
        }
    }

    // Adicionar estilos CSS para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { 
                transform: translateX(100%) translateY(20px); 
                opacity: 0; 
            }
            to { 
                transform: translateX(0) translateY(0); 
                opacity: 1; 
            }
        }
        
        @keyframes slideOut {
            from { 
                transform: translateX(0) translateY(0); 
                opacity: 1; 
            }
            to { 
                transform: translateX(100%) translateY(20px); 
                opacity: 0; 
            }
        }
        
        .ranking-row {
            animation: fadeIn 0.6s ease-out forwards;
            animation-delay: calc(var(--row-index, 0) * 0.05s);
        }
    `;
    document.head.appendChild(style);

    // Inicializar
    init();
});

document.getElementsByClassName("logo-text")[0].onclick = function () {
    window.location.href = "/index.html";
};