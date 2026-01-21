// ranking.js
document.addEventListener('DOMContentLoaded', function () {
    let currentUser = null;
    let simulados = [];
    let currentRankingData = [];
    let currentSimulado = null;
    let currentTurma = '';
    let currentPage = 1;
    const itemsPerPage = 15;
    let totalPages = 1;

    // Elementos DOM
    const elements = {
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),
        logoutBtn: document.getElementById('logoutBtn'),
        totalStudents: document.getElementById('totalStudents'),
        totalQuestions: document.getElementById('totalQuestions'),
        averageScore: document.getElementById('averageScore'),
        simuladoFilter: document.getElementById('simuladoFilter'),
        turmaFilter: document.getElementById('turmaFilter'),
        subjectFilter: document.getElementById('subjectFilter'),
        applyFilters: document.getElementById('applyFilters'),
        clearFilters: document.getElementById('clearFilters'),
        exportRanking: document.getElementById('exportRanking'),
        simuladoName: document.getElementById('simuladoName'),
        simuladoDate: document.getElementById('simuladoDate'),
        simuladoModel: document.getElementById('simuladoModel'),
        simuladoQuestionsCount: document.getElementById('simuladoQuestionsCount'),
        simuladoDescription: document.getElementById('simuladoDescription'),
        goldName: document.getElementById('goldName'),
        goldScore: document.getElementById('goldScore'),
        silverName: document.getElementById('silverName'),
        silverScore: document.getElementById('silverScore'),
        bronzeName: document.getElementById('bronzeName'),
        bronzeScore: document.getElementById('bronzeScore'),
        rankingBody: document.getElementById('rankingBody'),
        rankingPagination: document.getElementById('rankingPagination'),
        sidebarTotalStudents: document.getElementById('sidebarTotalStudents'),
        sidebarQuestions: document.getElementById('sidebarQuestions'),
        sidebarAverage: document.getElementById('sidebarAverage'),
        sidebarTopScore: document.getElementById('sidebarTopScore')
    };


    // Carregar lista de simulados
    async function loadSimulados() {
        try {
            const response = await fetch('/varsimulados');
            if (!response.ok) throw new Error('Erro na resposta da API');
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                simulados = data;
                populateSimuladoFilter();
                
                // Carregar último simulado visto
                const lastSimuladoId = localStorage.getItem('lastViewedSimulado');
                if (lastSimuladoId) {
                    elements.simuladoFilter.value = lastSimuladoId;
                    await loadSimuladoInfo(lastSimuladoId);
                }
            } else {
                console.warn('Formato de dados inválido, usando dados mockados');
                useMockSimulados();
            }
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
            showToast('Erro ao carregar lista de simulados', 'error');
            useMockSimulados();
        }
    }

    function populateSimuladoFilter() {
        elements.simuladoFilter.innerHTML = '<option value="">Selecione um simulado...</option>';
        
        // Ordenar por data (mais recentes primeiro)
        const sortedSimulados = simulados.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateB - dateA;
        });

        sortedSimulados.forEach(simulado => {
            const option = document.createElement('option');
            option.value = simulado.id;
            option.textContent = `${simulado.name} (${formatDate(simulado.date)})`;
            elements.simuladoFilter.appendChild(option);
        });
    }

    function parseDate(dateString) {
        if (!dateString) return new Date();
        const [day, month, year] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const [day, month, year] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Carregar informações do simulado
    async function loadSimuladoInfo(simuladoId) {
        try {
            currentSimulado = simulados.find(s => s.id === simuladoId);
            
            if (!currentSimulado) {
                throw new Error('Simulado não encontrado');
            }

            updateSimuladoInfo();
            
            // Limpar turma selecionada quando trocar de simulado
            elements.turmaFilter.value = '';
            currentTurma = '';
            
        } catch (error) {
            console.error('Erro ao carregar informações do simulado:', error);
            showToast('Erro ao carregar informações do simulado', 'error');
        }
    }

    function updateSimuladoInfo() {
        elements.simuladoName.textContent = currentSimulado.name || 'Simulado';
        elements.simuladoDescription.textContent = currentSimulado.description || 'Sem descrição disponível';
        
        // Formatar data
        const dateStr = currentSimulado.date ? formatDate(currentSimulado.date) : '-';
        elements.simuladoDate.innerHTML = `<i class="fas fa-calendar"></i> ${dateStr}`;
        
        // Modelo
        elements.simuladoModel.innerHTML = `<i class="fas fa-university"></i> ${currentSimulado.model || 'SIS'}`;
        
        // Questões
        const questions = currentSimulado.questions || 0;
        elements.simuladoQuestionsCount.innerHTML = `<i class="fas fa-question-circle"></i> ${questions} questões`;
        elements.totalQuestions.textContent = questions;
        elements.sidebarQuestions.textContent = questions;
    }

    // Carregar ranking - USANDO A API CORRETA
    async function loadRanking() {
        if (!currentSimulado) {
            showToast('Selecione um simulado primeiro', 'error');
            return;
        }

        if (!currentTurma) {
            showToast('Selecione uma turma primeiro', 'error');
            return;
        }

        showLoading();

        try {
            // Usar a API que você mostrou: /apiranking?id=ID&sel=TURMA
            const params = new URLSearchParams({
                id: currentSimulado.id,
                sel: currentTurma
            });

            const response = await fetch(`/apiranking?${params}`);
            if (!response.ok) throw new Error('Erro ao carregar ranking');
            
            const rankingData = await response.json();
            
            if (Array.isArray(rankingData)) {
                currentRankingData = rankingData;
                currentPage = 1;
                
                updateStatistics();
                updateMedals();
                renderRankingTable();
                updatePagination();
                
                // Salvar último simulado visto
                localStorage.setItem('lastViewedSimulado', currentSimulado.id);
                localStorage.setItem('lastViewedTurma', currentTurma);
                
            } else {
                throw new Error('Formato de dados inválido');
            }
            
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            showToast('Erro ao carregar dados do ranking', 'error');
            currentRankingData = [];
            renderRankingTable();
        } finally {
            hideLoading();
        }
    }

    function updateStatistics() {
        const totalStudents = currentRankingData.length;
        elements.totalStudents.textContent = totalStudents;
        elements.sidebarTotalStudents.textContent = totalStudents;
        
        if (totalStudents > 0) {
            const totalScore = currentRankingData.reduce((sum, student) => sum + (student.pont || 0), 0);
            const totalPossible = totalStudents * (currentSimulado.questions || 1);
            const averagePercent = Math.round((totalScore / totalPossible) * 1000) / 10;
            
            elements.averageScore.textContent = `${averagePercent}%`;
            elements.sidebarAverage.textContent = `${averagePercent}%`;
            
            // Maior nota
            const topScore = Math.max(...currentRankingData.map(s => s.pont || 0));
            elements.sidebarTopScore.textContent = topScore;
            
        } else {
            elements.averageScore.textContent = '0%';
            elements.sidebarAverage.textContent = '0%';
            elements.sidebarTopScore.textContent = '0';
        }
    }

    function updateMedals() {
        // Limpar medalhas primeiro
        elements.goldName.textContent = '-';
        elements.goldScore.textContent = '0 acertos';
        elements.silverName.textContent = '-';
        elements.silverScore.textContent = '0 acertos';
        elements.bronzeName.textContent = '-';
        elements.bronzeScore.textContent = '0 acertos';

        if (currentRankingData.length >= 1) {
            elements.goldName.textContent = currentRankingData[0].name || '-';
            elements.goldScore.textContent = `${currentRankingData[0].pont || 0} acertos`;
        }

        if (currentRankingData.length >= 2) {
            elements.silverName.textContent = currentRankingData[1].name || '-';
            elements.silverScore.textContent = `${currentRankingData[1].pont || 0} acertos`;
        }

        if (currentRankingData.length >= 3) {
            elements.bronzeName.textContent = currentRankingData[2].name || '-';
            elements.bronzeScore.textContent = `${currentRankingData[2].pont || 0} acertos`;
        }
    }

    function renderRankingTable() {
        elements.rankingBody.innerHTML = '';

        if (currentRankingData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <h3>Nenhum participante</h3>
                        <p>Nenhum estudante encontrado para esta turma</p>
                    </div>
                </td>
            `;
            elements.rankingBody.appendChild(emptyRow);
            return;
        }

        // Calcular índices para paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, currentRankingData.length);
        const pageData = currentRankingData.slice(startIndex, endIndex);

        pageData.forEach((student, index) => {
            const globalIndex = startIndex + index;
            const row = document.createElement('tr');
            row.classList.add('fade-in');
            
            // Adicionar classes para medalhas
            if (globalIndex === 0) {
                row.classList.add('gold-row');
            } else if (globalIndex === 1) {
                row.classList.add('silver-row');
            } else if (globalIndex === 2) {
                row.classList.add('bronze-row');
            }
            
            // Verificar se é o usuário atual
            const isCurrentUser = student.id === currentUser._id || 
                                 student.completename === currentUser.completename;
            if (isCurrentUser) {
                row.classList.add('user-row');
            }

            // Determinar turma para exibição (baseado na lógica da API)
            let turmaDisplay = student.turma || 0;
            if (currentTurma > 3) {
                // Turmas F (faltosos)
                turmaDisplay = `${turmaDisplay}° (F)`;
            } else {
                // Turmas regulares
                turmaDisplay = `${turmaDisplay}°`;
            }

            // Determinar classe do percentual
            let percentClass = 'low';
            const percent = student.percent || 0;
            if (percent >= 70) percentClass = 'high';
            else if (percent >= 50) percentClass = 'medium';

            // Formatar nome (usar nome curto da API)
            const displayName = student.name || student.completename || 'Sem nome';

            row.innerHTML = `
                <td class="position-cell">${globalIndex + 1}</td>
                <td>
                    <div class="student-name">
                        ${displayName}
                    </div>
                </td>
                <td>
                    <span class="class-badge">${turmaDisplay}</span>
                </td>
                <td>
                    <span class="score-value">${student.pont || 0}</span>
                </td>
                <td>
                    <span class="percent-value ${percentClass}">${percent}%</span>
                </td>
                <td>
                    <button class="details-btn" onclick="viewStudentDetails('${student.id}', '${currentSimulado?.id || ''}')">
                        <i class="fas fa-chart-bar"></i>
                        <span>Detalhes</span>
                    </button>
                </td>
            `;

            elements.rankingBody.appendChild(row);
        });
    }

    function updatePagination() {
        totalPages = Math.ceil(currentRankingData.length / itemsPerPage);
        
        elements.rankingPagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Botão anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderRankingTable();
                updatePagination();
            }
        });
        elements.rankingPagination.appendChild(prevBtn);
        
        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderRankingTable();
                updatePagination();
            });
            elements.rankingPagination.appendChild(pageBtn);
        }
        
        // Botão próximo
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderRankingTable();
                updatePagination();
            }
        });
        elements.rankingPagination.appendChild(nextBtn);
    }

    // Dados mockados para fallback
    function useMockSimulados() {
        simulados = [
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
        
        populateSimuladoFilter();
    }

    function showLoading() {
        elements.rankingBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando ranking...</p>
                    </div>
                </td>
            </tr>
        `;
        
        // Limpar medalhas enquanto carrega
        updateMedals();
    }

    function hideLoading() {
        // A renderização do ranking já acontece
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Exportar ranking
    function exportRanking() {
        if (currentRankingData.length === 0) {
            showToast('Não há dados para exportar', 'error');
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
                student.name || student.completename || '',
                student.turma || 0,
                student.pont || 0,
                (student.percent || 0) + "%"
            ];

            csvContent += row.join(",") + "\n";
        });

        // Criar link de download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ranking_${currentSimulado?.id}_turma${currentTurma}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Ranking exportado com sucesso!', 'success');
    }

    // Função global para visualizar detalhes do estudante
    window.viewStudentDetails = function(studentId, simuladoId) {
        if (!simuladoId) {
            showToast('Selecione um simulado primeiro', 'error');
            return;
        }
        window.location.href = `desempenho.html?id=${studentId}&simulado=${simuladoId}`;
    };

    // Event Listeners
    elements.simuladoFilter.addEventListener('change', async function() {
        const simuladoId = this.value;
        if (simuladoId) {
            await loadSimuladoInfo(simuladoId);
        } else {
            clearSimuladoInfo();
        }
    });

    elements.turmaFilter.addEventListener('change', function() {
        currentTurma = this.value;
    });

    elements.applyFilters.addEventListener('click', async () => {
        if (!elements.simuladoFilter.value) {
            showToast('Selecione um simulado', 'error');
            return;
        }
        
        if (!elements.turmaFilter.value) {
            showToast('Selecione uma turma', 'error');
            return;
        }
        
        await loadRanking();
    });

    elements.clearFilters.addEventListener('click', () => {
        elements.simuladoFilter.value = '';
        elements.turmaFilter.value = '';
        elements.subjectFilter.value = '';
        currentSimulado = null;
        currentTurma = '';
        currentRankingData = [];
        clearSimuladoInfo();
        renderRankingTable();
        updatePagination();
    });

    elements.exportRanking.addEventListener('click', exportRanking);

    // Logout
    elements.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Tem certeza que deseja sair?')) {
            localStorage.removeItem('user');
            localStorage.removeItem('lastViewedSimulado');
            localStorage.removeItem('lastViewedTurma');
            window.location.href = 'login.html';
        }
    });

    // Limpar informações do simulado
    function clearSimuladoInfo() {
        elements.simuladoName.textContent = 'Selecione um simulado';
        elements.simuladoDescription.textContent = '-';
        elements.simuladoDate.innerHTML = '<i class="fas fa-calendar"></i> -';
        elements.simuladoModel.innerHTML = '<i class="fas fa-university"></i> -';
        elements.simuladoQuestionsCount.innerHTML = '<i class="fas fa-question-circle"></i> 0 questões';
        elements.totalQuestions.textContent = '0';
        elements.totalStudents.textContent = '0';
        elements.averageScore.textContent = '0%';
        elements.sidebarQuestions.textContent = '0';
        elements.sidebarTotalStudents.textContent = '0';
        elements.sidebarAverage.textContent = '0%';
        elements.sidebarTopScore.textContent = '0';
        
        // Limpar medalhas
        updateMedals();
    }

    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const navMobile = document.getElementById('navMobile');
    
    if (menuToggle && navMobile) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMobile.classList.toggle('active');
        });
    }
});