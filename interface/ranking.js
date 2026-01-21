// ranking.js - VERSÃO CORRIGIDA
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

    // Inicializar
    async function init() {
        try {
            // Carregar simulados
            await loadSimulados();
            
            // Carregar última turma vista
            const lastTurma = localStorage.getItem('lastViewedTurma');
            if (lastTurma) {
                elements.turmaFilter.value = lastTurma;
                currentTurma = lastTurma;
            }
            
            // Configurar eventos
            setupEventListeners();
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            showToast('Erro ao carregar a página. Tente novamente.', 'error');
        }
    }

    // Carregar lista de simulados - VERSÃO CORRIGIDA
    async function loadSimulados() {
        try {
            console.log('Carregando simulados...');
            
            const response = await fetch('/varsimulados');
            console.log('Resposta da API:', response);
            
            if (!response.ok) {
                throw new Error(`Erro na resposta da API: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Dados recebidos:', data);
            
            if (Array.isArray(data)) {
                simulados = data;
                console.log(`${simulados.length} simulados carregados`);
                
                populateSimuladoFilter();
                
                // Tentar carregar último simulado visto
                const lastSimuladoId = localStorage.getItem('lastViewedSimulado');
                console.log('Último simulado visto:', lastSimuladoId);
                
                if (lastSimuladoId) {
                    const simuladoExiste = simulados.find(s => s.id === lastSimuladoId);
                    if (simuladoExiste) {
                        elements.simuladoFilter.value = lastSimuladoId;
                        await loadSimuladoInfo(lastSimuladoId);
                    } else {
                        console.log('Último simulado não encontrado na lista atual');
                        // Se não encontrou, selecionar o primeiro
                        if (simulados.length > 0) {
                            elements.simuladoFilter.value = simulados[0].id;
                            await loadSimuladoInfo(simulados[0].id);
                        }
                    }
                } else if (simulados.length > 0) {
                    // Selecionar o primeiro simulado por padrão
                    elements.simuladoFilter.value = simulados[0].id;
                    await loadSimuladoInfo(simulados[0].id);
                }
                
            } else if (data && Array.isArray(data.simulados)) {
                // Se a API retornar { simulados: [...] }
                simulados = data.simulados;
                console.log(`${simulados.length} simulados carregados (formato alternativo)`);
                
                populateSimuladoFilter();
                
                // Selecionar primeiro simulado por padrão
                if (simulados.length > 0) {
                    elements.simuladoFilter.value = simulados[0].id;
                    await loadSimuladoInfo(simulados[0].id);
                }
                
            } else {
                console.warn('Formato de dados inesperado:', data);
                showToast('Formato de dados inesperado da API', 'warning');
                useMockSimulados();
            }
            
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
            showToast('Erro ao carregar lista de simulados. Usando dados de exemplo.', 'error');
            useMockSimulados();
        }
    }

    function populateSimuladoFilter() {
        elements.simuladoFilter.innerHTML = '<option value="">Selecione um simulado...</option>';
        
        if (simulados.length === 0) {
            console.log('Nenhum simulado disponível');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum simulado disponível';
            option.disabled = true;
            elements.simuladoFilter.appendChild(option);
            return;
        }

        // Ordenar por data (mais recentes primeiro)
        const sortedSimulados = simulados.sort((a, b) => {
            const dateA = parseDate(a.date || a.data);
            const dateB = parseDate(b.date || b.data);
            return dateB - dateA;
        });

        console.log('Simulados ordenados:', sortedSimulados);

        sortedSimulados.forEach(simulado => {
            const option = document.createElement('option');
            option.value = simulado.id || simulado._id || simulado.codigo;
            
            // Tentar diferentes formatos de nome/data
            const nome = simulado.name || simulado.nome || simulado.titulo || 'Simulado sem nome';
            const data = simulado.date || simulado.data || simulado.createdAt;
            const dataFormatada = data ? formatDate(data) : 'Data não disponível';
            
            option.textContent = `${nome} (${dataFormatada})`;
            option.dataset.simulado = JSON.stringify(simulado);
            
            elements.simuladoFilter.appendChild(option);
            console.log(`Adicionado: ${nome} - ${dataFormatada}`);
        });
        
        console.log(`${sortedSimulados.length} simulados adicionados ao filtro`);
    }

    function parseDate(dateString) {
        if (!dateString) return new Date(0); // Data mínima
        try {
            // Tentar diferentes formatos de data
            if (dateString.includes('-')) {
                const [day, month, year] = dateString.split('-').map(Number);
                return new Date(year, month - 1, day);
            } else if (dateString.includes('/')) {
                const [day, month, year] = dateString.split('/').map(Number);
                return new Date(year, month - 1, day);
            } else if (!isNaN(new Date(dateString).getTime())) {
                // Se for uma data ISO
                return new Date(dateString);
            }
        } catch (e) {
            console.warn('Erro ao parsear data:', dateString, e);
        }
        return new Date(0);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/D';
        try {
            const date = parseDate(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            return dateString;
        }
    }

    // Carregar informações do simulado - VERSÃO MELHORADA
    async function loadSimuladoInfo(simuladoId) {
        try {
            console.log('Carregando informações do simulado:', simuladoId);
            
            // Buscar simulado na lista
            currentSimulado = simulados.find(s => 
                s.id === simuladoId || 
                s._id === simuladoId || 
                s.codigo === simuladoId
            );
            
            if (!currentSimulado) {
                // Tentar buscar do elemento option
                const selectedOption = elements.simuladoFilter.querySelector(`option[value="${simuladoId}"]`);
                if (selectedOption && selectedOption.dataset.simulado) {
                    currentSimulado = JSON.parse(selectedOption.dataset.simulado);
                } else {
                    throw new Error('Simulado não encontrado');
                }
            }

            console.log('Simulado carregado:', currentSimulado);
            
            // Atualizar UI com informações do simulado
            updateSimuladoInfo();
            
            // Se já tiver uma turma selecionada, carregar ranking automaticamente
            if (currentTurma) {
                console.log('Turma já selecionada, carregando ranking...');
                await loadRanking();
            } else {
                // Limpar dados anteriores
                currentRankingData = [];
                renderRankingTable();
                updatePagination();
            }
            
        } catch (error) {
            console.error('Erro ao carregar informações do simulado:', error);
            showToast('Erro ao carregar informações do simulado', 'error');
            currentSimulado = null;
            clearSimuladoInfo();
        }
    }

    function updateSimuladoInfo() {
        if (!currentSimulado) {
            clearSimuladoInfo();
            return;
        }

        // Nome
        const nome = currentSimulado.name || currentSimulado.nome || currentSimulado.titulo || 'Simulado sem nome';
        elements.simuladoName.textContent = nome;
        
        // Descrição
        const descricao = currentSimulado.description || currentSimulado.descricao || 'Sem descrição disponível';
        elements.simuladoDescription.textContent = descricao;
        
        // Data
        const dataStr = currentSimulado.date || currentSimulado.data || currentSimulado.createdAt;
        const dataFormatada = dataStr ? formatDate(dataStr) : 'N/D';
        elements.simuladoDate.innerHTML = `<i class="fas fa-calendar"></i> ${dataFormatada}`;
        
        // Modelo
        const modelo = currentSimulado.model || currentSimulado.modelo || currentSimulado.tipo || 'SIS';
        elements.simuladoModel.innerHTML = `<i class="fas fa-university"></i> ${modelo}`;
        
        // Questões
        const questions = currentSimulado.questions || currentSimulado.questoes || currentSimulado.numQuestoes || 0;
        elements.simuladoQuestionsCount.innerHTML = `<i class="fas fa-question-circle"></i> ${questions} questões`;
        elements.totalQuestions.textContent = questions;
        elements.sidebarQuestions.textContent = questions;
    }

    // Carregar ranking - VERSÃO MELHORADA
    async function loadRanking() {
        if (!currentSimulado) {
            showToast('Selecione um simulado primeiro', 'error');
            return;
        }

        if (!currentTurma) {
            showToast('Selecione uma turma primeiro', 'error');
            return;
        }

        console.log(`Carregando ranking: Simulado=${currentSimulado.id}, Turma=${currentTurma}`);
        
        showLoading();

        try {
            // Construir parâmetros
            const simuladoId = currentSimulado.id || currentSimulado._id || currentSimulado.codigo;
            const params = new URLSearchParams({
                id: simuladoId,
                sel: currentTurma
            });

            console.log(`Buscando: /apiranking?${params}`);
            
            const response = await fetch(`/apiranking?${params}`);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const rankingData = await response.json();
            console.log('Dados do ranking recebidos:', rankingData);
            
            if (Array.isArray(rankingData)) {
                currentRankingData = rankingData;
                currentPage = 1;
                
                console.log(`${currentRankingData.length} estudantes no ranking`);
                
                updateStatistics();
                updateMedals();
                renderRankingTable();
                updatePagination();
                
                // Salvar preferências
                localStorage.setItem('lastViewedSimulado', simuladoId);
                localStorage.setItem('lastViewedTurma', currentTurma);
                
                showToast('Ranking carregado com sucesso!', 'success');
                
            } else if (rankingData && Array.isArray(rankingData.ranking)) {
                // Se a API retornar { ranking: [...] }
                currentRankingData = rankingData.ranking;
                currentPage = 1;
                
                console.log(`${currentRankingData.length} estudantes no ranking (formato alternativo)`);
                
                updateStatistics();
                updateMedals();
                renderRankingTable();
                updatePagination();
                
                showToast('Ranking carregado com sucesso!', 'success');
                
            } else {
                throw new Error('Formato de dados inválido do ranking');
            }
            
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            showToast('Erro ao carregar dados do ranking. Verifique a conexão.', 'error');
            currentRankingData = [];
            renderRankingTable();
            updatePagination();
        } finally {
            hideLoading();
        }
    }

    function updateStatistics() {
        const totalStudents = currentRankingData.length;
        elements.totalStudents.textContent = totalStudents;
        elements.sidebarTotalStudents.textContent = totalStudents;
        
        if (totalStudents > 0 && currentSimulado) {
            // Calcular estatísticas
            const totalScore = currentRankingData.reduce((sum, student) => sum + (student.pont || student.score || 0), 0);
            const totalPossible = totalStudents * (currentSimulado.questions || currentSimulado.questoes || 1);
            const averagePercent = Math.round((totalScore / totalPossible) * 1000) / 10;
            
            elements.averageScore.textContent = `${averagePercent}%`;
            elements.sidebarAverage.textContent = `${averagePercent}%`;
            
            // Maior nota
            const topScore = Math.max(...currentRankingData.map(s => s.pont || s.score || 0));
            elements.sidebarTopScore.textContent = topScore;
            
            // Atualizar contagem de questões
            const questions = currentSimulado.questions || currentSimulado.questoes || 0;
            elements.totalQuestions.textContent = questions;
            elements.sidebarQuestions.textContent = questions;
            
        } else {
            elements.averageScore.textContent = '0%';
            elements.sidebarAverage.textContent = '0%';
            elements.sidebarTopScore.textContent = '0';
        }
    }

    function updateMedals() {
        // Resetar medalhas
        elements.goldName.textContent = '-';
        elements.goldScore.textContent = '0 acertos';
        elements.silverName.textContent = '-';
        elements.silverScore.textContent = '0 acertos';
        elements.bronzeName.textContent = '-';
        elements.bronzeScore.textContent = '0 acertos';

        if (currentRankingData.length >= 1) {
            const gold = currentRankingData[0];
            elements.goldName.textContent = gold.name || gold.completename || gold.nome || '-';
            elements.goldScore.textContent = `${gold.pont || gold.score || 0} acertos`;
        }

        if (currentRankingData.length >= 2) {
            const silver = currentRankingData[1];
            elements.silverName.textContent = silver.name || silver.completename || silver.nome || '-';
            elements.silverScore.textContent = `${silver.pont || silver.score || 0} acertos`;
        }

        if (currentRankingData.length >= 3) {
            const bronze = currentRankingData[2];
            elements.bronzeName.textContent = bronze.name || bronze.completename || bronze.nome || '-';
            elements.bronzeScore.textContent = `${bronze.pont || bronze.score || 0} acertos`;
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
                        <h3>Nenhum participante encontrado</h3>
                        <p>Não há estudantes para esta combinação de simulado e turma</p>
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

            // Determinar turma para exibição
            let turmaDisplay = student.turma || student.class || 0;
            if (currentTurma > 3) {
                // Turmas F (faltosos)
                turmaDisplay = `${turmaDisplay}° (F)`;
            } else {
                // Turmas regulares
                turmaDisplay = `${turmaDisplay}°`;
            }

            // Calcular percentual
            const score = student.pont || student.score || 0;
            const totalQuestions = currentSimulado?.questions || currentSimulado?.questoes || 1;
            const percent = Math.round((score / totalQuestions) * 1000) / 10;
            
            // Determinar classe do percentual
            let percentClass = 'low';
            if (percent >= 70) percentClass = 'high';
            else if (percent >= 50) percentClass = 'medium';

            // Formatar nome
            const displayName = student.name || student.completename || student.nome || 'Sem nome';

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
                    <span class="score-value">${score}</span>
                </td>
                <td>
                    <span class="percent-value ${percentClass}">${percent}%</span>
                </td>
                <td>
                    <button class="details-btn" onclick="viewStudentDetails('${student.id || student._id}', '${currentSimulado?.id || currentSimulado?._id || ''}')">
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

    // Dados mockados para fallback - MELHORADO
    function useMockSimulados() {
        console.log('Usando dados mockados de simulados');
        
        simulados = [
            {
                id: "052025",
                name: "14° Simulado - 2025",
                description: "14° Simulado SIS 2025 - Preparação para vestibulares",
                model: "SIS",
                date: "31-08-2025",
                questions: 60,
                turmas: [1, 2, 3, 4, 5, 6]
            },
            {
                id: "042025",
                name: "13° Simulado - 2025",
                description: "13° Simulado PSC 2025 - Fase única",
                model: "PSC",
                date: "15-07-2025",
                questions: 54,
                turmas: [1, 2, 3]
            },
            {
                id: "032025",
                name: "12° Simulado - 2025",
                description: "12° Simulado ENEM 2025 - Prova completa",
                model: "ENEM",
                date: "30-06-2025",
                questions: 180,
                turmas: [1, 2, 3, 4, 5, 6]
            }
        ];
        
        populateSimuladoFilter();
        
        // Selecionar primeiro simulado
        if (simulados.length > 0) {
            elements.simuladoFilter.value = simulados[0].id;
            loadSimuladoInfo(simulados[0].id);
        }
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
        
        // Desabilitar botões durante o carregamento
        elements.applyFilters.disabled = true;
        elements.applyFilters.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    }

    function hideLoading() {
        // Reabilitar botões
        elements.applyFilters.disabled = false;
        elements.applyFilters.innerHTML = '<i class="fas fa-filter"></i> Aplicar Filtros';
    }

    function showToast(message, type = 'info') {
        // Remover toasts antigos
        const oldToasts = document.querySelectorAll('.toast');
        oldToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);
        
        // Mostrar com animação
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
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
        const headers = ["Posição", "Nome", "Turma", "Acertos", "Percentual", "Simulado", "Data"];
        csvContent += headers.join(",") + "\n";

        // Dados
        currentRankingData.forEach((student, index) => {
            const score = student.pont || student.score || 0;
            const totalQuestions = currentSimulado?.questions || 1;
            const percent = Math.round((score / totalQuestions) * 1000) / 10;
            
            const row = [
                index + 1,
                `"${student.name || student.completename || student.nome || ''}"`,
                student.turma || student.class || 0,
                score,
                `${percent}%`,
                `"${currentSimulado?.name || currentSimulado?.nome || ''}"`,
                currentSimulado?.date || ''
            ];

            csvContent += row.join(",") + "\n";
        });

        // Criar link de download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ranking_${currentSimulado?.name || 'simulado'}_turma${currentTurma}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Ranking exportado com sucesso!', 'success');
    }

    // Função global para visualizar detalhes do estudante
    window.viewStudentDetails = function(studentId, simuladoId) {
        if (!simuladoId || !currentSimulado) {
            showToast('Selecione um simulado primeiro', 'error');
            return;
        }
        window.location.href = `desempenho.html?id=${studentId}&simulado=${simuladoId}`;
    };

    // Configurar eventos
    function setupEventListeners() {
        // Filtro de simulado
        elements.simuladoFilter.addEventListener('change', async function() {
            const simuladoId = this.value;
            if (simuladoId) {
                await loadSimuladoInfo(simuladoId);
            } else {
                currentSimulado = null;
                currentRankingData = [];
                clearSimuladoInfo();
                renderRankingTable();
                updatePagination();
            }
        });

        // Filtro de turma
        elements.turmaFilter.addEventListener('change', function() {
            currentTurma = this.value;
        });

        // Aplicar filtros
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

        // Limpar filtros
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
            
            // Limpar localStorage
            localStorage.removeItem('lastViewedSimulado');
            localStorage.removeItem('lastViewedTurma');
            
            showToast('Filtros limpos', 'info');
        });

        // Exportar ranking
        elements.exportRanking.addEventListener('click', exportRanking);

        // Logout
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Tem certeza que deseja sair?')) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('lastViewedSimulado');
                    localStorage.removeItem('lastViewedTurma');
                    window.location.href = '/login.html';
                }
            });
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
    }

    // Limpar informações do simulado
    function clearSimuladoInfo() {
        elements.simuladoName.textContent = 'Selecione um simulado';
        elements.simuladoDescription.textContent = 'Selecione um simulado para ver detalhes';
        elements.simuladoDate.innerHTML = '<i class="fas fa-calendar"></i> -';
        elements.simuladoModel.innerHTML = '<i class="fas fa-university"></i> -';
        elements.simuladoQuestionsCount.innerHTML = '<i class="fas fa-question-circle"></i> 0 questões';
        
        // Limpar estatísticas
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

    // Inicializar a aplicação
    init();
});