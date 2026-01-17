// questoes.js
document.addEventListener('DOMContentLoaded', function () {
    let currentUser = null;
    let questions = [];
    let filteredQuestions = [];
    let performanceChart = null;
    let selectedAlternative = null;
    let currentQuestion = null;

    // Elementos DOM
    const elements = {
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),
        logoutBtn: document.getElementById('logoutBtn'),
        totalQuestions: document.getElementById('totalQuestions'),
        userCorrect: document.getElementById('userCorrect'),
        userAccuracy: document.getElementById('userAccuracy'),
        subjectFilter: document.getElementById('subjectFilter'),
        originFilter: document.getElementById('originFilter'),
        yearFilter: document.getElementById('yearFilter'),
        difficultyFilter: document.getElementById('difficultyFilter'),
        applyFilters: document.getElementById('applyFilters'),
        clearFilters: document.getElementById('clearFilters'),
        practiceModeBtn: document.getElementById('practiceModeBtn'),
        questionsList: document.getElementById('questionsList'),
        statsTotal: document.getElementById('statsTotal'),
        statsCorrect: document.getElementById('statsCorrect'),
        statsWrong: document.getElementById('statsWrong'),
        statsAccuracy: document.getElementById('statsAccuracy'),
        questionModal: document.getElementById('questionModal'),
        modalQuestionContent: document.getElementById('modalQuestionContent')
    };

    async function checkAuth() {
        const userData = localStorage.getItem('user');

        if (!userData) {
            console.log('Nenhum usuário no localStorage, redirecionando para login');
            window.location.href = 'login.html';
            return;
        }

        try {
            const user = JSON.parse(userData);
            console.log('Usuário encontrado:', user);

            currentUser = {
                _id: user.id,
                completename: user.name,
                email: user.email,
                turma: user.turma,
                profilePicture: user.profilePicture,
                permissions: user.permissions
            };

            // Atualizar UI
            elements.userName.textContent = currentUser.completename.split(" ")[0];
            if (currentUser.profilePicture && elements.userAvatar) {
                elements.userAvatar.src = currentUser.profilePicture;
            }

            if (currentUser.permissions === 1 || currentUser.permissions === 3) {
                // Mostrar botões de admin se existirem
                const adminBtns = document.querySelectorAll('.admin-only');
                adminBtns.forEach(btn => btn.style.display = 'block');
            }

            // Carregar dados
            loadQuestions();
            loadUserStats();

        } catch (error) {
            console.error('Erro ao processar dados do usuário:', error);
            window.location.href = 'login.html';
        }
    }

    // Carregar questões
    async function loadQuestions() {
        showLoading();

        try {
            const response = await fetch('/api/questoes');
            const data = await response.json();

            if (data.success) {
                questions = data.questoes || [];
                filteredQuestions = [...questions];
                elements.totalQuestions.textContent = questions.length;
                populateYearFilter();
                renderQuestions();
                updateStatsSidebar();
            } else {
                showError('Erro ao carregar questões');
            }
        } catch (error) {
            console.error('Erro ao carregar questões:', error);
            showError('Erro ao carregar questões. Tente novamente.');
        }
    }

    // Carregar estatísticas do usuário
    async function loadUserStats() {
        try {
            const userId = currentUser?._id;
            if (!userId) return;

            const response = await fetch(`/api/dashboard?userId=${userId}`);
            const data = await response.json();

            if (data.success) {
                const stats = data.data.estatisticas;
                elements.userCorrect.textContent = stats.questoesCorretas || 0;
                elements.userAccuracy.textContent = `${stats.taxaAcerto || 0}%`;

                // Atualizar estatísticas laterais
                elements.statsTotal.textContent = stats.totalQuestoes || 0;
                elements.statsCorrect.textContent = stats.questoesCorretas || 0;
                elements.statsWrong.textContent = (stats.totalQuestoes - stats.questoesCorretas) || 0;
                elements.statsAccuracy.textContent = `${stats.taxaAcerto || 0}%`;

                // Atualizar gráfico se houver dados
                if (data.data.questoesPorDia) {
                    updatePerformanceChart(data.data.questoesPorDia);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            // Se der erro, mostrar zeros
            elements.userCorrect.textContent = '0';
            elements.userAccuracy.textContent = '0%';
            elements.statsTotal.textContent = '0';
            elements.statsCorrect.textContent = '0';
            elements.statsWrong.textContent = '0';
            elements.statsAccuracy.textContent = '0%';
        }
    }

    // Atualizar gráfico de desempenho
    function updatePerformanceChart(questoesPorDia) {
        const ctx = document.getElementById('performanceChart')?.getContext('2d');
        if (!ctx) return;

        if (performanceChart) {
            performanceChart.destroy();
        }

        const labels = questoesPorDia?.map(item => item.data) || [];
        const totals = questoesPorDia?.map(item => item.total) || [];
        const corrects = questoesPorDia?.map(item => item.corretas) || [];

        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total de Questões',
                        data: totals,
                        borderColor: '#070738',
                        backgroundColor: 'rgba(7, 7, 56, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Acertos',
                        data: corrects,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Popular filtro de anos
    function populateYearFilter() {
        const years = [...new Set(questions.map(q => q.year))].sort((a, b) => b - a);
        elements.yearFilter.innerHTML = '<option value="">Todos os anos</option>';

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            elements.yearFilter.appendChild(option);
        });
    }

    // Aplicar filtros
    function applyFilters() {
        let filtered = [...questions];

        const subject = elements.subjectFilter.value;
        const origin = elements.originFilter.value;
        const year = elements.yearFilter.value;
        const difficulty = elements.difficultyFilter.value;

        if (subject) {
            filtered = filtered.filter(q => q.subject === subject);
        }

        if (origin) {
            filtered = filtered.filter(q => q.origin === origin);
        }

        if (year) {
            filtered = filtered.filter(q => q.year === parseInt(year));
        }

        if (difficulty) {
            filtered = filtered.filter(q => q.difficulty === difficulty);
        }

        filteredQuestions = filtered;
        renderQuestions();
    }

    // Renderizar questões
    function renderQuestions() {
        if (filteredQuestions.length === 0) {
            elements.questionsList.innerHTML = `
                <div class="no-questions">
                    <i class="fas fa-search"></i>
                    <h3>Nenhuma questão encontrada</h3>
                    <p>Tente ajustar os filtros ou verifique se há questões cadastradas.</p>
                </div>
            `;
            return;
        }

        elements.questionsList.innerHTML = filteredQuestions.map(question => `
            <div class="question-card" data-id="${question._id}">
                <div class="question-header">
                    <div class="question-meta">
                        <span class="question-badge badge-origin">${question.origin}</span>
                        <span class="question-badge badge-subject">${formatSubject(question.subject)}</span>
                        <span class="question-badge badge-difficulty ${question.difficulty?.toLowerCase() || 'media'}">
                            ${formatDifficulty(question.difficulty)}
                        </span>
                        <span class="question-year">${question.year}</span>
                    </div>
                    <div class="question-stats">
                        <div class="stat-bubble attempts">
                            <i class="fas fa-chart-bar"></i>
                            <span>${question.timesAttempted || 0}</span>
                        </div>
                        <div class="stat-bubble success-rate">
                            <i class="fas fa-percentage"></i>
                            <span>${question.successRate ? question.successRate.toFixed(1) : '0'}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="question-statement">
                    ${question.statement.length > 200 ?
                question.statement.substring(0, 200) + '...' :
                question.statement}
                </div>
                
                ${question.hashtags?.length > 0 ? `
                    <div class="question-hashtags">
                        ${question.hashtags.slice(0, 3).map(tag => `
                            <span class="hashtag-small">${tag}</span>
                        `).join('')}
                        ${question.hashtags.length > 3 ? `
                            <span class="hashtag-small">+${question.hashtags.length - 3}</span>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="question-actions">
                    <button class="action-btn solve" onclick="openQuestionModal('${question._id}')">
                        <i class="fas fa-play"></i> Resolver
                    </button>
                    ${currentUser?.permissions === 1 ? `
                        <button class="action-btn edit" onclick="editQuestion('${question._id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Formatar matéria
    function formatSubject(subject) {
        const subjects = {
            'MATEMATICA': 'Matemática',
            'PORTUGUES': 'Português',
            'FISICA': 'Física',
            'QUIMICA': 'Química',
            'BIOLOGIA': 'Biologia',
            'HISTORIA': 'História',
            'GEOGRAFIA': 'Geografia',
            'FILOSOFIA': 'Filosofia',
            'SOCIOLOGIA': 'Sociologia',
            'INGLES': 'Inglês',
            'ESPANHOL': 'Espanhol'
        };
        return subjects[subject] || subject;
    }

    // Formatar dificuldade
    function formatDifficulty(difficulty) {
        const difficulties = {
            'FACIL': 'Fácil',
            'MEDIA': 'Média',
            'DIFICIL': 'Difícil'
        };
        return difficulties[difficulty] || 'Média';
    }

    // Tempo sugerido
    function getSuggestedTime(difficulty) {
        const times = {
            'FACIL': '1-2 min',
            'MEDIA': '2-3 min',
            'DIFICIL': '3-5 min'
        };
        return times[difficulty] || '2-3 min';
    }

    // Mostrar loading
    function showLoading() {
        elements.questionsList.innerHTML = `
            <div class="loading-questions">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando questões...</p>
            </div>
        `;
    }

    // Mostrar erro
    function showError(message) {
        elements.questionsList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Atualizar sidebar de estatísticas
    function updateStatsSidebar() {
        // Estatísticas já são atualizadas em loadUserStats()
    }

    // Toast notifications
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

    // ========== FUNÇÕES GLOBAIS PARA O MODAL ==========

    // Abrir modal da questão
    window.openQuestionModal = async function (questionId) {
        try {
            const response = await fetch(`/api/questao/${questionId}`);
            const data = await response.json();

            if (data.success) {
                const question = data.questao;
                const modal = document.getElementById('questionModal');
                const content = document.getElementById('modalQuestionContent');
                
                // Armazenar questão atual
                currentQuestion = question;
                selectedAlternative = null;
                
                // Formatar conteúdo da questão
                content.innerHTML = `
                    <div class="question-modal-header">
                        <div class="modal-badges">
                            <span class="badge-origin">
                                <i class="fas fa-university"></i> ${question.origin} ${question.year}
                            </span>
                            <span class="badge-subject">
                                <i class="fas fa-book"></i> ${formatSubject(question.subject)}
                            </span>
                            <span class="badge-difficulty ${question.difficulty?.toLowerCase() || 'media'}">
                                <i class="fas fa-signal"></i> ${formatDifficulty(question.difficulty)}
                            </span>
                        </div>
                        <div class="question-subject-info">
                            <h4><i class="fas fa-graduation-cap"></i> ${formatSubject(question.subject)} • ${question.topic || 'Geral'}</h4>
                            <div class="question-timer">
                                <i class="far fa-clock"></i>
                                <span>Tempo sugerido: ${getSuggestedTime(question.difficulty)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="question-statement-full">
                        ${question.statement}
                        ${question.statementImage ? 
                            `<img src="${question.statementImage}" alt="Enunciado" class="question-image">` : ''}
                    </div>
                    
                    <div class="alternatives-list" id="alternativesList">
                        ${question.alternatives.map(alt => `
                            <div class="alternative-item" data-letter="${alt.letter}" onclick="selectAlternative('${alt.letter}')">
                                <div class="alternative-content">
                                    <div class="alt-letter">${alt.letter}</div>
                                    <div class="alt-text">
                                        ${alt.isImage ? 
                                            `<img src="${alt.imageUrl}" alt="Alternativa ${alt.letter}" class="alternative-image">` :
                                            alt.text
                                        }
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="answer-section">
                        <div class="answer-options">
                            ${['A', 'B', 'C', 'D', 'E'].map(letter => `
                                <button class="answer-btn" onclick="selectAlternative('${letter}')">
                                    <span>${letter}</span>
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="modal-controls">
                            <button class="control-btn skip" onclick="skipQuestion()">
                                <i class="fas fa-forward"></i> Pular
                            </button>
                            <button class="control-btn submit" onclick="submitSelectedAnswer()" disabled>
                                <i class="fas fa-paper-plane"></i> Confirmar
                            </button>
                        </div>
                    </div>
                    
                    <div id="feedbackSection" style="display: none;"></div>
                `;
                
                modal.classList.add('active');
                
                // Adicionar evento para fechar modal
                const closeBtn = modal.querySelector('.close-modal');
                closeBtn.onclick = () => closeQuestionModal();
                
                // Fechar ao clicar fora
                modal.onclick = (e) => {
                    if (e.target === modal) closeQuestionModal();
                };
                
                // Fechar com ESC
                document.addEventListener('keydown', handleModalKeyPress);
                
            } else {
                showToast('Erro ao carregar questão', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar questão:', error);
            showToast('Erro ao carregar questão. Tente novamente.', 'error');
        }
    };

    // Selecionar alternativa
    window.selectAlternative = function (letter) {
        selectedAlternative = letter;
        
        // Remover seleção anterior de alternativas
        document.querySelectorAll('.alternative-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Remover seleção anterior de botões
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        });
        
        // Adicionar nova seleção
        const selectedAlt = document.querySelector(`.alternative-item[data-letter="${letter}"]`);
        const selectedBtn = Array.from(document.querySelectorAll('.answer-btn')).find(btn => 
            btn.textContent.trim() === letter
        );
        
        if (selectedAlt) {
            selectedAlt.classList.add('selected');
        }
        
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
            selectedBtn.style.background = 'var(--vermelho)';
            selectedBtn.style.color = 'var(--branco)';
            selectedBtn.style.borderColor = 'var(--vermelho)';
        }
        
        // Habilitar botão de submit
        const submitBtn = document.querySelector('.control-btn.submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    };

    // Enviar resposta selecionada
    window.submitSelectedAnswer = async function () {
        if (!selectedAlternative || !currentQuestion) return;
        
        await submitAnswer(currentQuestion._id, selectedAlternative);
    };

    // Enviar resposta
    window.submitAnswer = async function (questionId, selectedAlt) {
        try {
            const userData = localStorage.getItem('user');
            if (!userData) {
                showToast('Usuário não autenticado', 'error');
                return;
            }

            const user = JSON.parse(userData);
            const userId = user.id;

            // Buscar questão para verificar resposta correta
            const questionResponse = await fetch(`/api/questao/${questionId}`);
            const questionData = await questionResponse.json();

            if (!questionData.success) {
                showToast('Erro ao verificar resposta', 'error');
                return;
            }

            const question = questionData.questao;
            const isCorrect = selectedAlt === question.correctAlternative;

            // Registrar resposta
            const response = await fetch('/api/questao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    questionId: questionId,
                    answer: selectedAlt,
                    correct: isCorrect
                })
            });

            const data = await response.json();

            if (data.success) {
                // Atualizar estatísticas da questão
                await fetch(`/api/questao/${questionId}/stats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correct: isCorrect })
                });

                // Mostrar feedback
                showFeedback(selectedAlt, isCorrect, question);
                
                // Atualizar estatísticas do usuário
                setTimeout(loadUserStats, 500);

            } else {
                showToast('Erro ao registrar resposta', 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar resposta:', error);
            showToast('Erro ao processar resposta. Tente novamente.', 'error');
        }
    };

    // Mostrar feedback
    function showFeedback(selectedAlt, isCorrect, question) {
        const content = document.getElementById('modalQuestionContent');
        const answerSection = content.querySelector('.answer-section');
        const feedbackSection = document.getElementById('feedbackSection');
        
        if (!answerSection) return;
        
        // Destacar alternativas
        const allAlternatives = content.querySelectorAll('.alternative-item');
        const allAnswerBtns = content.querySelectorAll('.answer-btn');
        
        allAlternatives.forEach(alt => {
            const letter = alt.getAttribute('data-letter');
            alt.classList.remove('correct', 'wrong');
            
            if (letter === selectedAlt && !isCorrect) {
                alt.classList.add('wrong');
            }
            
            if (letter === question.correctAlternative) {
                alt.classList.add('correct');
            }
        });
        
        allAnswerBtns.forEach(btn => {
            const letter = btn.textContent.trim();
            btn.disabled = true;
            
            if (letter === selectedAlt && !isCorrect) {
                btn.style.background = '#F44336';
                btn.style.color = 'white';
                btn.style.borderColor = '#F44336';
            }
            
            if (letter === question.correctAlternative) {
                btn.style.background = '#4CAF50';
                btn.style.color = 'white';
                btn.style.borderColor = '#4CAF50';
            }
        });
        
        // Criar feedback HTML
        const feedbackHtml = `
            <div class="feedback-section ${isCorrect ? 'correct' : 'incorrect'} slide-in-left">
                <div class="feedback-header ${isCorrect ? 'correct' : 'incorrect'}">
                    <i class="fas fa-${isCorrect ? 'check-circle' : 'times-circle'}"></i>
                    <h4>${isCorrect ? '🎉 Parabéns! Resposta Correta!' : '📝 Resposta Incorreta'}</h4>
                </div>
                <div class="feedback-content">
                    <div class="result-info">
                        <div class="result-item ${isCorrect ? 'correct' : ''}">
                            <span>Sua resposta:</span>
                            <strong>${selectedAlt}</strong>
                        </div>
                        <div class="result-item correct">
                            <span>Resposta correta:</span>
                            <strong>${question.correctAlternative}</strong>
                        </div>
                    </div>
                    
                    ${question.explanation ? `
                        <div class="explanation">
                            <h5><i class="fas fa-lightbulb"></i> Explicação:</h5>
                            <p>${question.explanation}</p>
                            ${question.explanationImage ? 
                                `<img src="${question.explanationImage}" alt="Explicação" class="explanation-image">` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="feedback-actions">
                        <button class="control-btn skip" onclick="closeQuestionModal()">
                            <i class="fas fa-times"></i> Fechar
                        </button>
                        <button class="control-btn submit" onclick="nextQuestion()">
                            <i class="fas fa-forward"></i> Próxima
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Substituir answer section pelo feedback
        answerSection.style.display = 'none';
        feedbackSection.innerHTML = feedbackHtml;
        feedbackSection.style.display = 'block';
    }

    // Pular questão
    window.skipQuestion = function () {
        closeQuestionModal();
        
        setTimeout(() => {
            if (filteredQuestions.length > 0) {
                const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
                openQuestionModal(randomQuestion._id);
            }
        }, 300);
    };

    // Próxima questão
    window.nextQuestion = function () {
        closeQuestionModal();
        
        setTimeout(() => {
            if (filteredQuestions.length > 0) {
                const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
                openQuestionModal(randomQuestion._id);
            }
        }, 500);
    };

    // Fechar modal
    window.closeQuestionModal = function () {
        const modal = document.getElementById('questionModal');
        const content = document.getElementById('modalQuestionContent');
        
        modal.classList.remove('active');
        
        // Limpar conteúdo após animação
        setTimeout(() => {
            content.innerHTML = '';
            selectedAlternative = null;
            currentQuestion = null;
        }, 300);
        
        // Remover event listener
        document.removeEventListener('keydown', handleModalKeyPress);
        
        // Recarregar estatísticas
        loadUserStats();
    };

    // Manipulador de teclas
    function handleModalKeyPress(e) {
        const modal = document.getElementById('questionModal');
        if (!modal || !modal.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeQuestionModal();
        }
        
        // Teclas 1-5 para alternativas A-E
        if (e.key >= '1' && e.key <= '5') {
            const letters = ['A', 'B', 'C', 'D', 'E'];
            const letter = letters[parseInt(e.key) - 1];
            selectAlternative(letter);
        }
        
        // Enter para confirmar
        if (e.key === 'Enter' && selectedAlternative) {
            const submitBtn = document.querySelector('.control-btn.submit:not(:disabled)');
            if (submitBtn) submitBtn.click();
        }
        
        // Espaço para pular
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            document.querySelector('.control-btn.skip')?.click();
        }
    }

    // Event Listeners
    elements.applyFilters.addEventListener('click', applyFilters);
    elements.clearFilters.addEventListener('click', () => {
        elements.subjectFilter.value = '';
        elements.originFilter.value = '';
        elements.yearFilter.value = '';
        elements.difficultyFilter.value = '';
        applyFilters();
    });

    elements.practiceModeBtn.addEventListener('click', () => {
        if (filteredQuestions.length > 0) {
            const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
            openQuestionModal(randomQuestion._id);
        } else {
            showToast('Não há questões disponíveis para prática.', 'error');
        }
    });

    // Logout
    elements.logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        window.location.href = 'login.html';
    });

    // Inicializar
    checkAuth();
});