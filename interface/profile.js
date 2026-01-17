document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = '/api';

    // Verificar autenticação
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        window.location.href = 'login.html';
        return;
    }

    // Elementos DOM
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    // Perfil elements
    const profileAvatarElement = document.getElementById('profileAvatar');
    const profileNameElement = document.getElementById('profileName');
    const profileEmailElement = document.getElementById('profileEmail');
    const profileTurmaElement = document.getElementById('profileTurma');
    const memberSinceElement = document.getElementById('memberSince');
    
    // Info elements
    const infoFullNameElement = document.getElementById('infoFullName');
    const infoEmailElement = document.getElementById('infoEmail');
    const infoCPFElement = document.getElementById('infoCPF');
    const infoTurmaElement = document.getElementById('infoTurma');
    const infoRegisteredElement = document.getElementById('infoRegistered');
    
    // Stats elements
    const accuracyPercentElement = document.getElementById('accuracyPercent');
    const completionPercentElement = document.getElementById('completionPercent');
    const totalCorrectElement = document.getElementById('totalCorrect');
    const totalQuestionsElement = document.getElementById('totalQuestions');
    const totalClassesElement = document.getElementById('totalClasses');
    const totalRedacoesElement = document.getElementById('totalRedacoes');
    
    // System elements
    const accountStatusElement = document.getElementById('accountStatus');
    const permissionsLevelElement = document.getElementById('permissionsLevel');
    const lastAccessElement = document.getElementById('lastAccess');

    // Carregar dados do perfil
    async function loadProfileData() {
        try {
            // 1. Buscar dados do usuário
            const userResponse = await fetch(`${API_BASE_URL}/user/${user.id}`);
            let userData;
            
            if (userResponse.ok) {
                userData = await userResponse.json();
            } else {
                // Fallback: buscar do dashboard
                const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard?userId=${user.id}`);
                const dashboardData = await dashboardResponse.json();
                userData = dashboardData.data;
            }

            // 2. Buscar cursos do usuário
            const cursosResponse = await fetch(`${API_BASE_URL}/user-cursos?userId=${user.id}`);
            const cursosResult = await cursosResponse.json();

            // 3. Buscar estatísticas detalhadas
            const statsResponse = await fetch(`${API_BASE_URL}/dashboard?userId=${user.id}`);
            const statsData = await statsResponse.json();

            // Atualizar interface
            updateUserProfile(userData, statsData);
            renderCursosPerfil(cursosResult);
            renderRecentActivity(userData, statsData);
            updateSystemInfo(userData);

        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            showError('Erro ao carregar dados do perfil. Tente novamente.');
            usarDadosMockados();
        }
    }

    function updateUserProfile(userData, statsData) {
        // Usar dados do userData primeiro, depois statsData
        const userInfo = userData.userInfo || userData;
        const estatisticas = statsData.data?.estatisticas || statsData.estatisticas || {};

        // Atualizar avatar (em todos os lugares)
        const profilePicture = userInfo.profilePicture || 'https://i.ibb.co/placeholder/user.png';
        
        if (userAvatarElement) userAvatarElement.src = profilePicture;
        if (profileAvatarElement) profileAvatarElement.src = profilePicture;

        // Atualizar nome
        const fullName = userInfo.completename || userInfo.name || 'Usuário';
        if (userNameElement) userNameElement.textContent = fullName;
        if (profileNameElement) profileNameElement.textContent = fullName;
        if (infoFullNameElement) infoFullNameElement.textContent = fullName;

        // Atualizar email
        const email = userInfo.email || user.email || 'Não informado';
        if (profileEmailElement) profileEmailElement.textContent = email;
        if (infoEmailElement) infoEmailElement.textContent = email;

        // Atualizar CPF (se disponível no modelo)
        if (infoCPFElement) infoCPFElement.textContent = userInfo.cpf || 'Não informado';

        // Atualizar turma
        const turma = userInfo.turma || user.turma || 0;
        if (profileTurmaElement) profileTurmaElement.textContent = `Turma: ${turma}`;
        if (infoTurmaElement) infoTurmaElement.textContent = turma;

        // Atualizar data de cadastro
        if (userInfo.registered) {
            const registeredDate = new Date(userInfo.registered);
            const formattedDate = registeredDate.toLocaleDateString('pt-BR');
            if (memberSinceElement) memberSinceElement.textContent = `Membro desde ${formattedDate}`;
            if (infoRegisteredElement) infoRegisteredElement.textContent = formattedDate;
        }

        // Atualizar estatísticas
        updateProfileStats(estatisticas, userData);
    }

    function updateProfileStats(estatisticas, userData) {
        // Taxa de acerto
        const taxaAcerto = estatisticas.taxaAcerto || 0;
        if (accuracyPercentElement) {
            accuracyPercentElement.textContent = `${taxaAcerto}%`;
            updateProgressCircle('accuracyCircle', taxaAcerto);
        }

        // Conclusão de cursos (simplificado - usando aulas assistidas como proxy)
        const totalAulasAssistidas = estatisticas.aulasAssistidas || 0;
        const completionRate = Math.min(Math.round((totalAulasAssistidas / 100) * 100), 100);
        if (completionPercentElement) {
            completionPercentElement.textContent = `${completionRate}%`;
            updateProgressCircle('completionCircle', completionRate);
        }

        // Estatísticas gerais
        if (totalCorrectElement) {
            totalCorrectElement.textContent = estatisticas.questoesCorretas || 0;
        }
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = estatisticas.totalQuestoes || 0;
        }
        if (totalClassesElement) {
            totalClassesElement.textContent = estatisticas.aulasAssistidas || 0;
        }
        
        // Redações
        const redacoes = userData.redacoes || userData.data?.redacao?.total || 0;
        if (totalRedacoesElement) {
            totalRedacoesElement.textContent = redacoes;
        }
    }

    function updateProgressCircle(circleId, percent) {
        const circle = document.querySelector(`#${circleId} circle:nth-child(2)`);
        if (circle) {
            const radius = 27;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
            
            // Animação
            setTimeout(() => {
                circle.style.transition = 'stroke-dashoffset 1s ease';
            }, 100);
        }
    }

    async function renderCursosPerfil(cursosResult) {
        const coursesList = document.getElementById('profileCoursesList');
        const noCourses = document.getElementById('noProfileCourses');

        if (!coursesList) return;

        coursesList.innerHTML = '';

        if (!cursosResult.success || !cursosResult.cursos || cursosResult.cursos.length === 0) {
            if (noCourses) noCourses.style.display = 'flex';
            return;
        }

        if (noCourses) noCourses.style.display = 'none';

        // Limitar a 3 cursos para exibição
        const cursosExibicao = cursosResult.cursos.slice(0, 3);

        for (const cursoId of cursosExibicao) {
            try {
                const response = await fetch(`${API_BASE_URL}/course/${cursoId}?userId=${user.id}`);
                const result = await response.json();

                if (result.success) {
                    const curso = result.course;
                    const progress = result.progress;

                    const cursoElement = createCursoElementPerfil(curso, progress);
                    coursesList.appendChild(cursoElement);
                } else {
                    const cursoElement = createCursoElementBasicoPerfil(cursoId);
                    coursesList.appendChild(cursoElement);
                }
            } catch (error) {
                const cursoElement = createCursoElementBasicoPerfil(cursoId);
                coursesList.appendChild(cursoElement);
            }
        }

        // Adicionar botão "Ver todos" se houver mais cursos
        if (cursosResult.cursos.length > 3) {
            const verTodosElement = document.createElement('div');
            verTodosElement.className = 'ver-todos-btn';
            verTodosElement.innerHTML = `
                <a href="courses.html" class="btn-primary" style="width: 100%; text-align: center; display: block;">
                    <i class="fas fa-eye"></i> Ver todos os cursos (${cursosResult.cursos.length})
                </a>
            `;
            coursesList.appendChild(verTodosElement);
        }
    }

    function createCursoElementPerfil(curso, progress) {
        const cursoElement = document.createElement('div');
        cursoElement.className = 'course-item-small';

        // Determinar tipo de curso
        let iconClass = 'psc';
        let icon = 'fas fa-book';
        let tipoTexto = 'Curso';

        if (curso.type === 'enem') {
            iconClass = 'enem';
            icon = 'fas fa-star';
            tipoTexto = 'ENEM/Macro';
        } else if (curso.type === 'sis') {
            iconClass = 'sis';
            icon = 'fas fa-graduation-cap';
            tipoTexto = 'SIS';
        } else if (curso.type === 'psc') {
            iconClass = 'psc';
            icon = 'fas fa-university';
            tipoTexto = 'PSC';
        }

        // Calcular progresso
        const totalAulas = curso.totalLessons || 1;
        const aulasConcluidas = progress?.completedLessons?.length || 0;
        const progressoPercent = Math.round((aulasConcluidas / totalAulas) * 100);

        cursoElement.innerHTML = `
            <div class="course-icon-small ${iconClass}">
                <i class="${icon}"></i>
            </div>
            <div class="course-info-small">
                <h4>${curso.title}</h4>
                <p>${tipoTexto} • ${progressoPercent}% concluído</p>
            </div>
        `;

        cursoElement.onclick = () => acessarCurso(curso.courseId);
        cursoElement.style.cursor = 'pointer';

        return cursoElement;
    }

    function createCursoElementBasicoPerfil(cursoId) {
        const cursoElement = document.createElement('div');
        cursoElement.className = 'course-item-small';

        let iconClass = 'psc';
        let icon = 'fas fa-book';
        let cursoNome = cursoId;

        if (cursoId.includes('enem')) {
            iconClass = 'enem';
            icon = 'fas fa-star';
            cursoNome = 'ENEM/Macro';
        } else if (cursoId.includes('sis')) {
            iconClass = 'sis';
            icon = 'fas fa-graduation-cap';
        } else if (cursoId.includes('psc')) {
            iconClass = 'psc';
            icon = 'fas fa-university';
        }

        cursoElement.innerHTML = `
            <div class="course-icon-small ${iconClass}">
                <i class="${icon}"></i>
            </div>
            <div class="course-info-small">
                <h4>${cursoNome}</h4>
                <p>Curso ativo</p>
            </div>
        `;

        cursoElement.onclick = () => acessarCurso(cursoId);
        cursoElement.style.cursor = 'pointer';

        return cursoElement;
    }

    function renderRecentActivity(userData, statsData) {
        const activityTimeline = document.getElementById('activityTimeline');
        const noActivity = document.getElementById('noActivity');

        if (!activityTimeline) return;

        activityTimeline.innerHTML = '';

        // Combinar atividades de diferentes fontes
        const activities = [];
        
        // Adicionar questões recentes
        const questoesRecentes = statsData.data?.questoesRecentes || userData.questoesRecentes || [];
        questoesRecentes.slice(0, 3).forEach(q => {
            activities.push({
                type: 'question',
                content: q.correct ? 'Acertou uma questão' : 'Errou uma questão',
                time: getTimeAgo(new Date(q.date)),
                correct: q.correct,
                materia: q.materia
            });
        });

        // Adicionar aulas recentes
        const aulasRecentes = statsData.data?.aulasRecentes || userData.aulasRecentes || [];
        aulasRecentes.slice(0, 2).forEach(a => {
            activities.push({
                type: 'video',
                content: `Assistiu aula: ${a.course || 'Curso'}`,
                time: getTimeAgo(new Date(a.date))
            });
        });

        // Ordenar por data (mais recente primeiro)
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        if (activities.length === 0) {
            if (noActivity) noActivity.style.display = 'flex';
            return;
        }

        if (noActivity) noActivity.style.display = 'none';

        // Mostrar apenas 5 atividades mais recentes
        activities.slice(0, 5).forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = `activity-item ${activity.type} ${activity.correct ? 'correct' : 'incorrect'}`;
            
            let iconClass = '';
            let icon = '';
            
            if (activity.type === 'question') {
                iconClass = activity.correct ? 'fas fa-check-circle' : 'fas fa-times-circle';
                icon = activity.correct ? 'question' : 'question';
            } else if (activity.type === 'video') {
                iconClass = 'fas fa-play-circle';
                icon = 'video';
            } else {
                iconClass = 'fas fa-edit';
                icon = 'redacao';
            }

            activityElement.innerHTML = `
                <div class="activity-icon ${icon}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.content}</p>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `;

            activityTimeline.appendChild(activityElement);
        });
    }

    function updateSystemInfo(userData) {
        // Status da conta
        if (accountStatusElement) {
            accountStatusElement.textContent = 'Ativa';
            accountStatusElement.style.color = '#4CAF50';
        }

        // Permissões
        if (permissionsLevelElement) {
            const permissions = userData.permissions || user.permissions || 0;
            let levelText = 'Estudante';
            let color = '#070738';
            
            if (permissions === 1) {
                levelText = 'Professor';
                color = '#FF9800';
            } else if (permissions > 1) {
                levelText = 'Administrador';
                color = '#FE0000';
            }
            
            permissionsLevelElement.textContent = levelText;
            permissionsLevelElement.style.color = color;
        }

        // Último acesso
        if (lastAccessElement) {
            lastAccessElement.textContent = 'Hoje';
        }
    }

    // Helper functions
    function getTimeAgo(date) {
        if (!date) return 'Há algum tempo';
        
        const now = new Date();
        const dateObj = new Date(date);
        const diff = now - dateObj;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora mesmo';
        if (minutes < 60) return `${minutes} min atrás`;
        if (hours < 24) return `${hours} h atrás`;
        if (days === 1) return 'Ontem';
        return `${days} dias atrás`;
    }

    function showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 12px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Dados mockados como fallback
    function usarDadosMockados() {
        const mockData = {
            userInfo: {
                name: user.name || 'Estudante',
                email: user.email || 'estudante@email.com',
                turma: user.turma || 1,
                cpf: '000.000.000-00',
                registered: user.registered || Date.now(),
                profilePicture: 'https://i.ibb.co/placeholder/user.png'
            },
            estatisticas: {
                totalQuestoes: 0,
                questoesCorretas: 0,
                taxaAcerto: 0,
                aulasAssistidas: 0
            }
        };

        updateUserProfile(mockData, mockData);
        renderCursosPerfil({ success: true, cursos: user.cursos || [] });
        renderRecentActivity(mockData, mockData);
        updateSystemInfo(user);
    }

    // Event listeners
    function setupEventListeners() {
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

        // Clique fora do menu mobile para fechar
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-btn') && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }

    // Funções globais
    window.acessarCurso = function (cursoId) {
        window.location.href = `course.html?curso=${cursoId}`;
    };

    // Inicialização
    setupEventListeners();
    loadProfileData();

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
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 0.5; }
        }
        
        .ver-todos-btn {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(7, 7, 56, 0.1);
        }
        
        .btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0.8rem 1.5rem;
            background: linear-gradient(135deg, var(--vermelho), #FF4444);
            color: var(--branco);
            border: none;
            border-radius: 10px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(254, 0, 0, 0.3);
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        }
        
        .notification.error {
            background: #f8d7da;
            color: #721c24;
        }
    `;
    document.head.appendChild(style);
});

// Adicionar função de admin (copiada do dashboard)
function adicionarItemAdminNaNavbar() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!userData || !userData.permissions || userData.permissions < 1) {
        return;
    }

    if (userData.permissions > 1) {
        const navMenu = document.querySelector('.nav-menu');
        const logoutItem = document.querySelector('.nav-item .nav-link[href="#"]');

        if (!navMenu || document.querySelector('.nav-item .nav-link[href="admin.html"]')) {
            return;
        }

        const adminItem = document.createElement('li');
        adminItem.className = 'nav-item';
        const admin2Item = document.createElement('li');
        admin2Item.className = 'nav-item';

        if (logoutItem && logoutItem.closest('.nav-item')) {
            const logoutListItem = logoutItem.closest('.nav-item');
            adminItem.innerHTML = `
                <a href="admin.html" class="nav-link">
                    <div class="nav-icon">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <span class="nav-label">Administração</span>
                    <div class="nav-glow"></div>
                </a>
            `;

            admin2Item.innerHTML = `
                <a href="admincourse.html" class="nav-link">
                    <div class="nav-icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <span class="nav-label">Gerenciar</span>
                    <div class="nav-glow"></div>
                </a>
            `;

            navMenu.insertBefore(adminItem, logoutListItem);
            navMenu.insertBefore(admin2Item, logoutListItem);
        }
    } else if (userData.permissions == 1) {
        const navMenu = document.querySelector('.nav-menu');
        const logoutItem = document.querySelector('.nav-item .nav-link[href="#"]');

        if (!navMenu || document.querySelector('.nav-item .nav-link[href="admincourse.html"]')) {
            return;
        }

        const adminItem = document.createElement('li');
        adminItem.className = 'nav-item';

        if (logoutItem && logoutItem.closest('.nav-item')) {
            const logoutListItem = logoutItem.closest('.nav-item');
            adminItem.innerHTML = `
                <a href="admincourse.html" class="nav-link">
                    <div class="nav-icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <span class="nav-label">Gerenciar</span>
                    <div class="nav-glow"></div>
                </a>
            `;

            navMenu.insertBefore(adminItem, logoutListItem);
        }
    }
}

// Chamar após o DOM carregar
document.addEventListener('DOMContentLoaded', adicionarItemAdminNaNavbar);

document.getElementsByClassName("logo-text")[0].onclick = function () {
    window.location.href = "/dashboard.html";
};