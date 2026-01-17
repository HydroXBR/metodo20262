document.addEventListener('DOMContentLoaded', function () {
    let currentStudent = null;
    let currentSimulado = null;
    let currentRankingData = [];
    let currentPosition = 0;

    // URLs parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    const simuladoId = urlParams.get('simulado');

    if (!studentId || !simuladoId) {
        showError('Parâmetros inválidos. Redirecionando para o ranking...');
        setTimeout(() => window.location.href = 'ranking.html', 2000);
        return;
    }

    // Elementos DOM
    const studentNameElement = document.getElementById('studentName');
    const studentTurmaElement = document.getElementById('studentTurma');
    /*const studentPositionElement = document.getElementById('studentPosition');*/
    const studentAvatarElement = document.getElementById('studentAvatar');
    const userAvatarElement = document.getElementById('userAvatar');
    const userNameElement = document.getElementById('userName');

    const simuladoNameElement = document.getElementById('simuladoName');
    const simuladoDateElement = document.getElementById('simuladoDate');
    const simuladoModelElement = document.getElementById('simuladoModel');
    const simuladoQuestionsElement = document.getElementById('simuladoQuestions');
    const simuladoDescriptionElement = document.getElementById('simuladoDescription');

    // Botões
    const backBtn = document.getElementById('backBtn');
    const problemBtn = document.getElementById('problemBtn');
    const printBtn = document.getElementById('printBtn');
    const toggleAnswersBtn = document.getElementById('toggleAnswers');

    // Elementos de desempenho
    const totalPercentageElement = document.getElementById('totalPercentage');
    const correctCountElement = document.getElementById('correctCount');
    const wrongCountElement = document.getElementById('wrongCount');
    const totalCountElement = document.getElementById('totalCount');
    const progressRingFill = document.querySelector('.progress-ring-fill');
    const highlightsContent = document.getElementById('highlightsContent');
    const subjectsContent = document.getElementById('subjectsContent');
    const answerTableBody = document.getElementById('answerTableBody');
    const historyNoteElement = document.getElementById('historyNote');

    // Inicializar
    async function init() {
        updateUserInfo();
        await loadPerformanceData();
        setupEventListeners();
        addAdminItemToNavbar();
    }

    // Atualizar informações do usuário
    function updateUserInfo() {
        const user = JSON.parse(localStorage.getItem('user')) || {};
        if (userAvatarElement && user.profilePicture) {
            userAvatarElement.src = user.profilePicture;
        }
        if (userNameElement) {
            userNameElement.textContent = user.completename || 'Usuário';
        }
    }

    // Carregar dados de desempenho - VERSÃO SIMPLIFICADA
    async function loadPerformanceData() {
        try {
            showLoading();
            
            // 1. Buscar dados do ranking para obter informações do aluno
            const rankingResponse = await fetch(`/apiranking?id=${simuladoId}&sel=general`);
            const rankingData = await rankingResponse.json();
            
            if (!rankingData || rankingData.length === 0) {
                throw new Error('Nenhum dado encontrado para este simulado');
            }
            
            currentRankingData = rankingData;
            
            currentStudent = rankingData.find(student => {
                if (student.id === studentId) return true;
                if (student.completename && student.completename.includes(studentId)) return true;
                return false;
            });
            
            if (!currentStudent) {
                currentStudent = rankingData[0];
                console.warn('Aluno não encontrado pelo ID, usando primeiro do ranking para demonstração');
            }
            
            currentPosition = rankingData.findIndex(student => 
                student.id === currentStudent.id || 
                student.completename === currentStudent.completename
            );
            
            currentPosition = currentPosition + 1;
            
            console.log('Posição encontrada:', currentPosition, 'de', rankingData.length, 'alunos');
            
            currentSimulado = currentStudent.simulado;
            
            updateStudentInfo();
            updateSimuladoInfo();
            updatePerformanceMetrics();
            updateSubjectsPerformance();
            updateHighlights();
            createAnswerMirror();
            
            try {
                await loadComparisonCharts();
            } catch (chartError) {
                console.warn('Erro ao carregar gráficos:', chartError);
                historyNoteElement.textContent = 'Continue participando dos simulados para acompanhar sua evolução!';
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados de desempenho:', error);
            showError('Erro ao carregar dados de desempenho. Usando dados de demonstração...');
            useDemoData();
        } finally {
            hideLoading();
        }
    }

    function updateStudentInfo() {
        studentNameElement.textContent = currentStudent.completename || currentStudent.name || 'Estudante';
        
        // Turma - CORREÇÃO: Turmas 4,5,6 são faltosos
        const turmaNumber = Number(currentStudent.turma);
        let turmaDisplay;
        if (turmaNumber > 3) {
            turmaDisplay = `${turmaNumber - 3}° ano (Faltosos)`;
        } else {
            turmaDisplay = `${turmaNumber}° ano`;
        }
        studentTurmaElement.textContent = turmaDisplay;
        
        // Posição no ranking - USAR A POSIÇÃO CALCULADA
        /*studentPositionElement.textContent = `Posição: ${currentPosition}º`;*/
        
        // Avatar
        if (studentAvatarElement) {
            studentAvatarElement.src = 'https://i.ibb.co/placeholder/user.png';
        }
    }

    function updateSimuladoInfo() {
        if (!currentSimulado) {
            simuladoNameElement.textContent = 'Simulado não encontrado';
            return;
        }
        
        simuladoNameElement.textContent = currentSimulado.name || 'Simulado';
        simuladoDescriptionElement.textContent = currentSimulado.description || '';
        
        // Formatar data
        if (currentSimulado.date) {
            const dateParts = currentSimulado.date.split('-');
            if (dateParts.length === 3) {
                const formattedDate = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;
                simuladoDateElement.textContent = formattedDate;
            } else {
                simuladoDateElement.textContent = currentSimulado.date;
            }
        } else {
            simuladoDateElement.textContent = '-';
        }
        
        simuladoModelElement.textContent = currentSimulado.model || '-';
        simuladoQuestionsElement.textContent = `${currentSimulado.questions || 0} questões`;
    }

    function updatePerformanceMetrics() {
        if (!currentSimulado || !currentStudent) return;
        
        const totalQuestions = currentSimulado.questions || 0;
        const correctAnswers = currentStudent.pont || 0;
        const wrongAnswers = totalQuestions - correctAnswers;
        const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0;
        
        // Atualizar textos
        totalPercentageElement.textContent = `${percentage}%`;
        correctCountElement.textContent = correctAnswers;
        wrongCountElement.textContent = wrongAnswers;
        totalCountElement.textContent = totalQuestions;
        
        // Atualizar gráfico circular
        if (progressRingFill) {
            const circumference = 2 * Math.PI * 90;
            const offset = circumference - (percentage / 100) * circumference;
            progressRingFill.style.strokeDasharray = `${circumference} ${circumference}`;
            progressRingFill.style.strokeDashoffset = offset;
        }
    }

    function updateSubjectsPerformance() {
        subjectsContent.innerHTML = '';
        
        if (!currentSimulado || !currentSimulado.organization || currentSimulado.organization.length === 0) {
            subjectsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>Não há informações de matérias disponíveis</p>
                </div>
            `;
            return;
        }
        
        // Ordenar matérias pela ordem definida no simulado
        const organization = Array.isArray(currentSimulado.organization) ? 
            currentSimulado.organization : [];
        
        organization.forEach((subject, index) => {
            const subjectKey = subject.materia;
            const correct = currentStudent[subjectKey] || 0;
            const total = subject.q || 0;
            const percentage = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
            
            // Determinar classe de desempenho
            let performanceClass = 'low';
            if (percentage >= 70) performanceClass = 'high';
            else if (percentage >= 50) performanceClass = 'medium';
            
            const subjectItem = document.createElement('div');
            subjectItem.className = 'subject-item fade-in';
            subjectItem.style.setProperty('--item-index', index);
            subjectItem.innerHTML = `
                <div class="subject-header">
                    <span class="subject-name">
                        <i class="fas fa-book"></i>
                        ${subject.name || subject.materia}
                    </span>
                    <span class="subject-percent ${performanceClass}">${percentage}%</span>
                </div>
                <div class="subject-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${performanceClass}" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="subject-details">
                    <span>${correct} de ${total} acertos</span>
                    <span>${correct}/${total}</span>
                </div>
            `;
            
            subjectsContent.appendChild(subjectItem);
        });
    }

    function updateHighlights() {
        highlightsContent.innerHTML = '';
        
        if (!currentSimulado || !currentSimulado.organization || currentSimulado.organization.length === 0) {
            highlightsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>Não há destaques disponíveis</p>
                </div>
            `;
            return;
        }
        
        // Calcular desempenho por matéria
        const subjects = currentSimulado.organization.map(subject => {
            const subjectKey = subject.materia;
            const correct = currentStudent[subjectKey] || 0;
            const total = subject.q || 0;
            const percentage = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
            
            return {
                name: subject.name || subject.materia,
                percentage: parseFloat(percentage),
                correct,
                total
            };
        }).filter(subject => subject.total > 0); // Filtrar matérias com questões
        
        if (subjects.length === 0) {
            highlightsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <p>Continue estudando! Você vai melhorar no próximo simulado 💪</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por porcentagem (maior primeiro)
        subjects.sort((a, b) => b.percentage - a.percentage);
        
        // Pegar as melhores matérias (> 60% ou top 3 se todas abaixo de 60%)
        const topSubjects = subjects.filter(subject => subject.percentage >= 60);
        const displaySubjects = topSubjects.length > 0 ? topSubjects.slice(0, 3) : subjects.slice(0, 2);
        
        displaySubjects.forEach((subject, index) => {
            const highlightItem = document.createElement('div');
            highlightItem.className = 'highlight-item';
            highlightItem.style.animationDelay = `${index * 0.2}s`;
            highlightItem.innerHTML = `
                <i class="fas fa-medal"></i>
                <span>${subject.name}: ${subject.percentage}% (${subject.correct}/${subject.total})</span>
            `;
            highlightsContent.appendChild(highlightItem);
        });
    }

    function createAnswerMirror() {
        answerTableBody.innerHTML = '';
        
        if (!currentSimulado || !currentStudent.letras) {
            answerTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <p>Espelho de respostas não disponível</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        const studentAnswers = Array.isArray(currentStudent.letras) ? 
            currentStudent.letras : 
            (typeof currentStudent.letras === 'string' ? currentStudent.letras.split('') : []);
        
        // Encontrar gabarito correto para a turma do aluno
        let officialAnswers = [];
        if (currentSimulado.answers && Array.isArray(currentSimulado.answers)) {
            const turmaAnswer = currentSimulado.answers.find(a => a.turma == Number(currentStudent.turma));
            if (turmaAnswer && turmaAnswer.respostas) {
                officialAnswers = turmaAnswer.respostas;
            }
        }
        
        if (officialAnswers.length === 0 && studentAnswers.length === 0) {
            answerTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Dados de respostas incompletos</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        const specials = Array.isArray(currentSimulado.special) ? currentSimulado.special : [];
        const mats = Array.isArray(currentSimulado.matspecial) ? currentSimulado.matspecial : [];
        
        let questionIndex = 0;
        const totalQuestions = Math.max(officialAnswers.length, studentAnswers.length);
        
        for (let i = 0; i < totalQuestions + mats.length; i++) {
            const row = document.createElement('tr');
            
            // Verificar se esta linha é um cabeçalho de matéria
            const isMateriaHeader = specials.includes(i);
            if (isMateriaHeader) {
                const materia = mats.find(m => m.special === i);
                row.className = 'materia-row';
                row.innerHTML = `
                    <td colspan="4">
                        <i class="fas fa-book-open"></i>
                        ${materia ? materia.materia : 'Matéria'}
                    </td>
                `;
                answerTableBody.appendChild(row);
                continue;
            }
            
            // Linha normal de questão
            const questionNumber = questionIndex + 1;
            const studentAnswer = studentAnswers[questionIndex] || 'N';
            const officialAnswer = officialAnswers[questionIndex] || 'X';
            const isCorrect = studentAnswer === officialAnswer || officialAnswer === 'X';
            
            // Determinar classes para as respostas
            let studentAnswerClass = 'wrong-answer';
            let resultClass = 'result-wrong';
            let resultIcon = '✗';
            
            if (isCorrect) {
                studentAnswerClass = officialAnswer === 'X' ? 'null-answer' : 'correct-answer';
                resultClass = 'result-correct';
                resultIcon = '✔';
            } else if (studentAnswer === 'N') {
                studentAnswerClass = 'blank-answer';
            }
            
            // Classe para o gabarito oficial
            const officialAnswerClass = officialAnswer === 'X' ? 'null-answer' : 'correct-answer';
            
            row.innerHTML = `
                <td class="number-cell">${questionNumber}</td>
                <td>
                    <div class="answer-cell ${officialAnswerClass}" title="Gabarito oficial">
                        ${officialAnswer}
                    </div>
                </td>
                <td>
                    <div class="answer-cell ${studentAnswerClass}" title="Sua resposta">
                        ${studentAnswer}
                    </div>
                </td>
                <td class="result-cell ${resultClass}" title="${isCorrect ? 'Correto' : 'Incorreto'}">
                    ${resultIcon}
                </td>
            `;
            
            answerTableBody.appendChild(row);
            questionIndex++;
        }
    }

    async function loadComparisonCharts() {
        // Tentar carregar dados dos simulados
        try {
            const simuladosResponse = await fetch('/varsimulados');
            const allSimulados = await simuladosResponse.json();
            
            if (!Array.isArray(allSimulados)) {
                throw new Error('Formato de dados inválido');
            }
            
            // Criar gráfico de radar simples
            createSimpleRadarChart();
            
            // Tentar criar histórico (pode falhar silenciosamente)
            try {
                await createSimpleHistoryChart(allSimulados);
            } catch (historyError) {
                console.warn('Não foi possível criar gráfico de histórico:', historyError);
                historyNoteElement.textContent = 'Participe dos próximos simulados para acompanhar sua evolução!';
            }
            
        } catch (error) {
            console.warn('Não foi possível carregar dados para gráficos:', error);
            // Criar gráfico básico com dados atuais
            createSimpleRadarChart();
            historyNoteElement.textContent = 'Este é seu desempenho atual. Continue assim!';
        }
    }

    function createSimpleRadarChart() {
        const ctx = document.getElementById('radarChart');
        if (!ctx) return;
        
        // Destruir gráfico anterior se existir
        if (window.radarChartInstance) {
            window.radarChartInstance.destroy();
        }
        
        if (!currentSimulado || !currentSimulado.organization) {
            return;
        }
        
        // Preparar dados básicos
        const labels = [];
        const data = [];
        
        currentSimulado.organization.forEach(subject => {
            labels.push(subject.name || subject.materia);
            
            const subjectKey = subject.materia;
            const correct = currentStudent[subjectKey] || 0;
            const total = subject.q || 1;
            const percentage = (correct / total) * 100;
            
            data.push(percentage);
        });
        
        window.radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Desempenho (%)',
                    data: data,
                    backgroundColor: 'rgba(254, 0, 0, 0.2)',
                    borderColor: 'rgba(254, 0, 0, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(254, 0, 0, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    async function createSimpleHistoryChart(allSimulados) {
        const ctx = document.getElementById('historyChart');
        if (!ctx) return;
        
        // Destruir gráfico anterior se existir
        if (window.historyChartInstance) {
            window.historyChartInstance.destroy();
        }
        
        // Buscar histórico simples (últimos 4 simulados)
        const historyData = [];
        const studentName = currentStudent.completename || currentStudent.name;
        
        // Ordenar simulados por data (mais recentes primeiro)
        const sortedSimulados = allSimulados
            .filter(s => s.id !== simuladoId) // Excluir atual
            .sort((a, b) => {
                const dateA = parseDate(a.date);
                const dateB = parseDate(b.date);
                return dateB - dateA; // Mais recente primeiro
            })
            .slice(0, 4); // Pegar apenas 4 mais recentes
        
        for (const simulado of sortedSimulados) {
            try {
                const response = await fetch(`/apiranking?id=${simulado.id}&sel=general`);
                const rankingData = await response.json();
                
                const studentData = rankingData.find(s => 
                    s.completename === studentName || 
                    s.name === studentName
                );
                
                if (studentData) {
                    historyData.push({
                        date: simulado.date.replace(/-/g, '/'),
                        percentage: parseFloat(studentData.percent),
                        label: simulado.name.substring(0, 15) + '...'
                    });
                }
            } catch (error) {
                // Ignorar erro e continuar
            }
        }
        
        if (historyData.length === 0) {
            historyNoteElement.textContent = 'Este é seu primeiro simulado registrado! Continue assim!';
            return;
        }
        
        // Ordenar por data (mais antigo primeiro para o gráfico)
        historyData.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateA - dateB;
        });
        
        const labels = historyData.map(item => item.date);
        const percentages = historyData.map(item => item.percentage);
        
        window.historyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Evolução',
                    data: percentages,
                    borderColor: 'rgba(7, 7, 56, 1)',
                    backgroundColor: 'rgba(7, 7, 56, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentual (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data do Simulado'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Análise simples
        if (historyData.length > 1) {
            const lastPercentage = percentages[percentages.length - 1];
            const currentPercentage = parseFloat(currentStudent.percent);
            
            if (currentPercentage > lastPercentage) {
                historyNoteElement.innerHTML = `🎉 <strong>Melhorou ${(currentPercentage - lastPercentage).toFixed(1)}%</strong> em relação ao último simulado!`;
            } else if (currentPercentage < lastPercentage) {
                historyNoteElement.innerHTML = `📚 <strong>Revisão necessária:</strong> caiu ${(lastPercentage - currentPercentage).toFixed(1)}%. Foque nos estudos!`;
            } else {
                historyNoteElement.innerHTML = `⚖️ <strong>Estabilidade mantida.</strong> Busque melhorar no próximo!`;
            }
        } else {
            historyNoteElement.innerHTML = `✨ <strong>Primeiro passo dado!</strong> Compare com os próximos simulados.`;
        }
    }

    function parseDate(dateString) {
        try {
            const [day, month, year] = dateString.split('/').map(Number);
            return new Date(year, month - 1, day);
        } catch (e) {
            return new Date();
        }
    }

    // Funções de utilidade
    function showLoading() {
        const existingOverlay = document.getElementById('loadingOverlay');
        if (existingOverlay) existingOverlay.remove();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingOverlay';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;
        loadingDiv.innerHTML = `
            <div class="loading-spinner" style="width: 60px; height: 60px; border-width: 4px;"></div>
            <p style="margin-top: 1rem; color: var(--azul); font-weight: 500;">Carregando desempenho...</p>
        `;
        document.body.appendChild(loadingDiv);
    }

    function hideLoading() {
        const loadingDiv = document.getElementById('loadingOverlay');
        if (loadingDiv) {
            loadingDiv.style.opacity = '0';
            setTimeout(() => {
                if (loadingDiv.parentNode) {
                    loadingDiv.parentNode.removeChild(loadingDiv);
                }
            }, 300);
        }
    }

    function showError(message) {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.4s ease forwards;
            max-width: 400px;
            border-left: 4px solid #dc3545;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    }

    function showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.4s ease forwards;
            max-width: 400px;
            border-left: 4px solid #28a745;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    // Dados de demonstração para fallback
    function useDemoData() {
        console.log('Usando dados de demonstração...');
        
        currentStudent = {
            completename: 'João Silva (Demonstração)',
            turma: 1,
            pont: 35,
            percent: '58.3',
            letras: ['A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B'],
            simulado: {
                id: 'demo',
                name: 'Simulado de Demonstração',
                date: '15-11-2024',
                model: 'PSC',
                questions: 60,
                description: 'Dados de demonstração para teste',
                organization: [
                    { materia: 'port', q: 12, name: 'Português' },
                    { materia: 'mat', q: 8, name: 'Matemática' },
                    { materia: 'hist', q: 8, name: 'História' }
                ],
                answers: [
                    {
                        turma: 1,
                        respostas: ['A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B']
                    }
                ],
                special: [0, 12],
                matspecial: [
                    { materia: 'Português', special: 0 },
                    { materia: 'Matemática', special: 12 }
                ]
            },
            port: 8,
            mat: 5,
            hist: 6
        };
        
        currentSimulado = currentStudent.simulado;
        currentPosition = 15; // Posição de demonstração
        
        updateStudentInfo();
        updateSimuladoInfo();
        updatePerformanceMetrics();
        updateSubjectsPerformance();
        updateHighlights();
        createAnswerMirror();
        
        // Gráficos simples
        createSimpleRadarChart();
        historyNoteElement.textContent = 'Dados de demonstração. Seus dados reais serão carregados quando o sistema estiver completo.';
        
        showSuccess('Carregados dados de demonstração. O sistema está funcionando!');
    }

    // Setup event listeners
    function setupEventListeners() {
        // Voltar ao ranking
        backBtn.addEventListener('click', () => {
            if (!currentStudent || !currentSimulado) {
                window.location.href = 'ranking.html';
                return;
            }
            
            const turmaNumber = Number(currentStudent.turma);
            const serie = turmaNumber > 3 ? turmaNumber - 3 : turmaNumber;
            window.location.href = `ranking.html?id=${currentSimulado.id}&serie=${serie}`;
        });

        // Problema com resultado
        problemBtn.addEventListener('click', () => {
            const studentName = currentStudent.completename || currentStudent.name || 'Estudante';
            const message = `Olá! Sou ${studentName} e estou com dúvidas/problemas em relação ao simulado "${currentSimulado.name}" (ID: ${currentSimulado.id}).`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://api.whatsapp.com/send?phone=559284507170&text=${encodedMessage}`, '_blank');
        });

        // Imprimir
        printBtn.addEventListener('click', () => {
            window.print();
        });

        // Alternar visualização das respostas
        toggleAnswersBtn.addEventListener('click', () => {
            const table = document.getElementById('answerTable');
            const icon = toggleAnswersBtn.querySelector('i');
            const span = toggleAnswersBtn.querySelector('span');
            
            if (table.classList.contains('compact')) {
                table.classList.remove('compact');
                icon.className = 'fas fa-compress';
                span.textContent = 'Visualização Compacta';
                showSuccess('Modo de visualização normal ativado');
            } else {
                table.classList.add('compact');
                icon.className = 'fas fa-expand';
                span.textContent = 'Visualização Normal';
                showSuccess('Modo de visualização compacta ativado');
            }
        });

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

        // Menu mobile
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', function () {
                this.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    }

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
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        
        .highlight-item {
            animation: fadeIn 0.6s ease-out forwards;
        }
        
        /* Estilos para tabela compacta */
        .compact .answer-cell {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
        }
        
        .compact .materia-row td {
            padding: 1rem;
            font-size: 1rem;
        }
        
        .compact .number-cell,
        .compact .result-cell {
            font-size: 0.9rem;
            padding: 0.8rem;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(254, 0, 0, 0.1);
            border-top-color: var(--vermelho);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Inicializar
    init();
});

document.getElementsByClassName("logo-text")[0].onclick = function () {
    window.location.href = "/dashboard.html";
};