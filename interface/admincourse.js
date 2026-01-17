// ========== SISTEMA DE AUTENTICAÇÃO ==========
let currentUser = null;
let currentCourses = [];
let currentQuestions = [];
let currentLessons = [];
let editingCourseId = null;
const API_BASE_URL = '/api';

// Sistema de autenticação (mesmo da admin)
async function verificarAutenticacao() {
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const userData = JSON.parse(userDataStr);
        currentUser = {
            _id: userData.id,
            completename: userData.name || userData.completename,
            email: userData.email,
            profilePicture: userData.profilePicture || userData.profilepicture,
            permissions: userData.permissions
        };

        if (!currentUser.permissions || currentUser.permissions < 1) {
            mostrarAcessoNegado();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
        window.location.href = 'login.html';
        return false;
    }
}

function mostrarAcessoNegado() {
    document.body.innerHTML = `
        <div class="access-denied">
            <div class="denied-content">
                <i class="fas fa-lock" style="font-size: 4rem; color: var(--vermelho); margin-bottom: 1rem;"></i>
                <h2 style="color: var(--vermelho); margin-bottom: 1rem;">Acesso Restrito</h2>
                <p style="margin-bottom: 1.5rem; color: var(--cinza-escuro); max-width: 400px; text-align: center;">
                    Você precisa de permissões de professor (nível 1 ou superior) para acessar esta página.
                </p>
                <button onclick="window.location.href='dashboard.html'" class="btn btn-primary">
                    <i class="fas fa-home"></i> Voltar para o Dashboard
                </button>
            </div>
        </div>
    `;
}

// Funções auxiliares (mesmas da admin)
function formatarDataHoje() {
    const data = new Date();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return `${data.getDate()} de ${meses[data.getMonth()]} de ${data.getFullYear()}`;
}

function atualizarDataHora() {
    const now = new Date();
    document.getElementById('currentDate').textContent = formatarDataHoje();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
        background: ${type === 'error' ? 'var(--vermelho)' : type === 'success' ? 'var(--verde)' : 'var(--azul)'};
        color: white; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000; animation: slideIn 0.3s ease; display: flex; align-items: center; gap: 10px;
    `;
    notification.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ========== FUNÇÕES DE NAVEGAÇÃO ==========
function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.tab-section').forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar seção selecionada
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
        section.classList.add('active');
    }

    // Atualizar link ativo
    document.querySelectorAll('.tab-navigation').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.tab-navigation[data-tab="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Atualizar sidebar
    document.getElementById('sidebarActiveSection').textContent =
        sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    // Carregar dados da seção
    if (sectionId === 'cursos') {
        loadCourses();
    } else if (sectionId === 'questoes') {
        loadQuestions();
        setupQuestionTab();
    } else if (sectionId === 'aulas') {
        loadLessons();
    } else if (sectionId === 'redacoes') {
        loadRedacoes();
    }
}

// ========== FUNÇÕES DE CURSOS ==========
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/courses`);
        const data = await response.json();

        if (data.success) {
            currentCourses = data.courses || [];
            renderCoursesList();
            populateCourseDropdowns();
            updateCourseStats();
        }
    } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        showNotification('Erro ao carregar cursos', 'error');
    }
}

function renderCoursesList() {
    const container = document.getElementById('coursesList');
    if (!container) return;

    if (currentCourses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h4>Nenhum curso cadastrado</h4>
                <p>Comece criando seu primeiro curso usando o formulário acima.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = currentCourses.map(course => `
        <div class="course-item">
            <div class="course-header">
                <span class="course-badge ${course.type}">${course.type.toUpperCase()}</span>
                <div class="course-actions">
                    <button onclick="editCourse('${course.courseId}')" title="Editar curso">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCourse('${course.courseId}')" title="Excluir curso">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <div class="course-stats">
                <span><i class="fas fa-users"></i> ${course.enrolledStudents || 0} alunos</span>
                <span><i class="fas fa-clock"></i> ${course.totalHours || 0}h</span>
                <span><i class="fas fa-book"></i> ${course.totalLessons || 0} aulas</span>
            </div>
            <div class="form-actions" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--cinza-medio);">
                <button class="btn btn-secondary btn-sm" onclick="viewCourse('${course.courseId}')">
                    <i class="fas fa-eye"></i> Ver Aulas
                </button>
            </div>
        </div>
    `).join('');
}

function populateCourseDropdowns() {
    // Para formulário de aula
    const lessonSelect = document.getElementById('lessonCourseId');
    const filterSelect = document.getElementById('filterLessonCourse');

    if (lessonSelect) {
        lessonSelect.innerHTML = '<option value="">Selecione um curso...</option>' +
            currentCourses.map(course => `<option value="${course.courseId}">${course.title}</option>`).join('');
    }

    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todos os cursos</option>' +
            currentCourses.map(course => `<option value="${course.courseId}">${course.title}</option>`).join('');
    }
}

async function handleCourseSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSubmitCourse');
    const originalText = btn.innerHTML;
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const courseData = {
            courseId: document.getElementById('courseId').value.trim(),
            title: document.getElementById('courseTitle').value.trim(),
            description: document.getElementById('courseDescription').value.trim(),
            type: document.getElementById('courseType').value,
            totalHours: parseInt(document.getElementById('totalHours').value) || 0,
            professors: document.getElementById('professors').value
                .split(',')
                .map(p => p.trim())
                .filter(p => p)
        };

        // VALIDAÇÕES
        if (!courseData.courseId || !courseData.title || !courseData.description || !courseData.type) {
            showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const method = editingCourseId ? 'PUT' : 'POST';
        const url = editingCourseId ?
            `${API_BASE_URL}/admin/course/${editingCourseId}` :
            `${API_BASE_URL}/admin/course`;

        console.log(`Enviando requisição ${method} para:`, url);
        console.log('Dados do curso:', courseData);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                // Adicione token de autenticação se necessário
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(courseData)
        });

        const result = await response.json();
        console.log('Resposta do servidor:', result);

        if (result.success) {
            showNotification(editingCourseId ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!', 'success');
            limparFormularioCurso();
            await loadCourses(); // Recarrega a lista
        } else {
            showNotification(`Erro: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao salvar curso. Verifique o console para mais detalhes.', 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function editCourse(courseId) {
    try {
        showNotification('Carregando dados do curso...', 'info');

        const response = await fetch(`${API_BASE_URL}/admin/course/${courseId}`);
        const result = await response.json();

        if (!result.success) {
            showNotification(`Erro: ${result.message}`, 'error');
            return;
        }

        const course = result.course;
        editingCourseId = courseId;

        // Preencher formulário
        document.getElementById('courseId').value = course.courseId;
        document.getElementById('courseTitle').value = course.title;
        document.getElementById('courseDescription').value = course.description;
        document.getElementById('courseType').value = course.type;
        document.getElementById('totalHours').value = course.totalHours;
        document.getElementById('professors').value = course.professors?.join(', ') || '';

        // Atualizar UI
        document.getElementById('formTitle').textContent = 'Editar Curso';
        document.getElementById('btnSubmitText').textContent = 'Atualizar Curso';
        document.getElementById('btnCancelEdit').style.display = 'block';
        document.getElementById('courseId').readOnly = true;

        showNotification('Modo edição ativado. Altere os dados e clique em "Atualizar Curso".', 'info');
        document.getElementById('courseForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Erro ao carregar curso:', error);
        showNotification('Erro ao carregar dados do curso', 'error');
    }
}

function cancelEdit() {
    editingCourseId = null;
    limparFormularioCurso();
    document.getElementById('btnCancelEdit').style.display = 'none';
    showNotification('Edição cancelada', 'info');
}

function limparFormularioCurso() {
    document.getElementById('courseForm').reset();
    document.getElementById('formTitle').textContent = 'Adicionar Novo Curso';
    document.getElementById('btnSubmitText').textContent = 'Criar Curso';
    document.getElementById('btnCancelEdit').style.display = 'none';
    document.getElementById('courseId').readOnly = false;
    editingCourseId = null;
}

async function deleteCourse(courseId) {
    if (!confirm('Tem certeza que deseja excluir este curso? Todas as aulas relacionadas também serão removidas.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/course/${courseId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Curso excluído com sucesso!', 'success');
            loadCourses();
        } else {
            showNotification(`Erro: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao excluir curso', 'error');
    }
}

// ========== FUNÇÕES DE AULAS ==========
function addResourceField() {
    const container = document.getElementById('resourcesContainer');
    const resourceField = document.createElement('div');
    resourceField.className = 'resource-field';
    resourceField.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <select class="form-input resource-type">
                    <option value="">Tipo</option>
                    <option value="pdf">PDF</option>
                    <option value="ppt">Apresentação</option>
                    <option value="doc">Documento</option>
                    <option value="link">Link</option>
                    <option value="quiz">Quiz</option>
                </select>
            </div>
            <div class="form-group">
                <input type="text" class="form-input resource-title" placeholder="Título">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <input type="url" class="form-input resource-url" placeholder="URL">
            </div>
            <div class="form-group">
                <input type="text" class="form-input resource-desc" placeholder="Descrição">
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.resource-field').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(resourceField);
}

async function loadLessons() {
    // Implementar carregamento de aulas
    console.log('Carregando aulas...');
}

function limparFormularioAula() {
    document.getElementById('lessonForm').reset();
    document.getElementById('resourcesContainer').innerHTML = '';
}

// ========== FUNÇÕES DE QUESTÕES ==========
function setupQuestionTab() {
    // Inicializar alternativas
    const container = document.getElementById('alternativesContainer');
    if (container) {
        container.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            addAlternative();
        }
    }
}

function addAlternative() {
    const container = document.getElementById('alternativesContainer');
    if (!container) return;

    const alternatives = container.querySelectorAll('.alternative-item');
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const nextLetter = letters[alternatives.length];

    if (!nextLetter) {
        showNotification('Máximo de 5 alternativas permitidas', 'warning');
        return;
    }

    const altDiv = document.createElement('div');
    altDiv.className = 'alternative-item';
    altDiv.innerHTML = `
        <div class="alt-letter">${nextLetter}</div>
        <div class="alt-input">
            <input type="text" class="form-input alt-text-input" 
                   placeholder="Texto da alternativa ${nextLetter}" 
                   data-letter="${nextLetter}" required>
            <div class="alt-image-option">
                <label>
                    <input type="checkbox" class="alt-is-image" data-letter="${nextLetter}">
                    É imagem
                </label>
                <input type="text" class="form-input alt-image-url" 
                       placeholder="URL da imagem" data-letter="${nextLetter}"
                       style="display: none;">
            </div>
        </div>
        ${alternatives.length >= 4 ? `
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.alternative-item').remove(); updateCorrectAlternatives();">
                <i class="fas fa-trash"></i>
            </button>
        ` : ''}
    `;

    container.appendChild(altDiv);
    updateCorrectAlternatives();

    // Evento para checkbox de imagem
    const checkbox = altDiv.querySelector('.alt-is-image');
    const imageUrlInput = altDiv.querySelector('.alt-image-url');
    checkbox.addEventListener('change', function () {
        imageUrlInput.style.display = this.checked ? 'block' : 'none';
        imageUrlInput.required = this.checked;
    });
}

function updateCorrectAlternatives() {
    const select = document.getElementById('correctAlternative');
    const container = document.getElementById('alternativesContainer');
    if (!select || !container) return;

    select.innerHTML = '<option value="">Selecione a correta</option>';
    container.querySelectorAll('.alt-text-input').forEach(alt => {
        const letter = alt.dataset.letter;
        const option = document.createElement('option');
        option.value = letter;
        option.textContent = `Alternativa ${letter}`;
        select.appendChild(option);
    });
}

async function loadQuestions() {
    try {
        const response = await fetch('/api/admin/questoes');
        const data = await response.json();

        if (data.success) {
            currentQuestions = data.questoes || [];
            renderQuestionsList();
            updateQuestionStats();
        }
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
    }
}

function renderQuestionsList() {
    const container = document.getElementById('questionsList');
    if (!container) return;

    if (currentQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <h4>Nenhuma questão cadastrada</h4>
                <p>Comece criando sua primeira questão usando o formulário acima.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = currentQuestions.map(question => `
        <div class="question-item">
            <div class="question-header">
                <span class="question-badge">${question.origin} ${question.year}</span>
                <span class="question-badge subject">${formatSubject(question.subject)}</span>
                <span class="question-badge difficulty">${question.difficulty || 'Média'}</span>
                <div class="question-actions">
                    <button onclick="editQuestion('${question._id}')" title="Editar questão">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteQuestion('${question._id}')" title="Excluir questão">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="question-content">
                <p>${question.statement.substring(0, 150)}${question.statement.length > 150 ? '...' : ''}</p>
                <div class="question-stats">
                    <span><i class="fas fa-users"></i> ${question.timesAttempted || 0}</span>
                    <span><i class="fas fa-check"></i> ${question.timesCorrect || 0}</span>
                    <span><i class="fas fa-percentage"></i> ${question.successRate ? question.successRate.toFixed(1) : '0'}%</span>
                </div>
            </div>
        </div>
    `).join('');
}

function formatSubject(subject) {
    const subjects = {
        'MATEMATICA': 'Matemática', 'PORTUGUES': 'Português', 'FISICA': 'Física',
        'QUIMICA': 'Química', 'BIOLOGIA': 'Biologia', 'HISTORIA': 'História',
        'GEOGRAFIA': 'Geografia', 'FILOSOFIA': 'Filosofia', 'SOCIOLOGIA': 'Sociologia',
        'INGLES': 'Inglês', 'ESPANHOL': 'Espanhol'
    };
    return subjects[subject] || subject;
}

function limparFormularioQuestao() {
    document.getElementById('questionForm').reset();
    document.getElementById('alternativesContainer').innerHTML = '';
    for (let i = 0; i < 4; i++) {
        addAlternative();
    }
}

// ========== FUNÇÕES DE ESTATÍSTICAS ==========
function updateCourseStats() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    const totalCursos = currentCourses.length;
    const totalAulas = currentCourses.reduce((sum, curso) => sum + (curso.totalLessons || 0), 0);
    const totalAlunos = currentCourses.reduce((sum, curso) => sum + (curso.enrolledStudents || 0), 0);
    const totalHoras = currentCourses.reduce((sum, curso) => sum + (curso.totalHours || 0), 0);

    statsGrid.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-book"></i>
            <h4>Total de Cursos</h4>
            <div class="value">${totalCursos}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-video"></i>
            <h4>Total de Aulas</h4>
            <div class="value">${totalAulas}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-users"></i>
            <h4>Total de Alunos</h4>
            <div class="value">${totalAlunos}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-clock"></i>
            <h4>Horas de Conteúdo</h4>
            <div class="value">${totalHoras}h</div>
        </div>
    `;

    // Atualizar sidebar
    document.getElementById('sidebarCourses').textContent = totalCursos;
    document.getElementById('sidebarLessons').textContent = totalAulas;
    document.getElementById('sidebarQuestions').textContent = currentQuestions.length;
}

function updateQuestionStats() {
    document.getElementById('sidebarQuestions').textContent = currentQuestions.length;
}

// ========== CONFIGURAÇÃO INICIAL ==========
document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticação
    if (!await verificarAutenticacao()) return;

    // Atualizar informações do usuário
    if (currentUser.completename) {
        const nomeCurto = currentUser.completename.split(" ")[0] || 'Professor';
        document.getElementById('adminName').textContent = nomeCurto;
        document.getElementById('userName').textContent = nomeCurto;
        document.getElementById('sidebarAdmin').textContent = nomeCurto;
    }

    // Nível de permissão
    let nivelTexto = 'Professor';
    if (currentUser.permissions === 2) nivelTexto = 'Administrador';
    if (currentUser.permissions >= 3) nivelTexto = 'Super Admin';
    document.getElementById('sidebarLevel').textContent = nivelTexto;

    // Configurar data/hora
    atualizarDataHora();
    setInterval(atualizarDataHora, 60000);

    // Event Listeners
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Navegação por tabs
    document.querySelectorAll('.tab-navigation').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const tab = this.dataset.tab;
            showSection(tab);
        });
    });

    // Formulários
    document.getElementById('courseForm').addEventListener('submit', handleCourseSubmit);
    document.getElementById('btnCancelEdit').addEventListener('click', cancelEdit);

    const lessonForm = document.getElementById('lessonForm');
    if (lessonForm) {
        lessonForm.addEventListener('submit', handleLessonSubmit);
    }

    // Adicionar um campo de recurso inicial
    setTimeout(() => {
        if (document.getElementById('resourcesContainer') &&
            document.getElementById('resourcesContainer').children.length === 0) {
            addResourceField();
        }
    }, 500);

    // Event listeners para filtros de aulas
    const searchLesson = document.getElementById('searchLesson');
    if (searchLesson) {
        searchLesson.addEventListener('input', debounce(renderLessonsList, 300));
    }

    const filterLessonCourse = document.getElementById('filterLessonCourse');
    if (filterLessonCourse) {
        filterLessonCourse.addEventListener('change', renderLessonsList);
    }
    // Carregar dados iniciais
    await loadCourses();
    await loadQuestions();

    // Verificar hash na URL
    const hash = window.location.hash.substring(1);
    if (hash && ['cursos', 'aulas', 'questoes', 'usuarios'].includes(hash)) {
        showSection(hash);
    }
});

// ========== VARIÁVEIS GLOBAIS PARA REDAÇÕES ==========
let currentRedacoes = [];
let currentRedacaoParaCorrigir = null;

// ========== FUNÇÕES DE REDAÇÕES ==========
async function loadRedacoes() {
    try {
        showNotification('Carregando redações...', 'info');

        const response = await fetch(`${API_BASE_URL}/admin/redacoes`);
        const data = await response.json();

        console.log('Dados completos da API (/admin/redacoes):', data); // Debug completo
        
        if (data.success) {
            currentRedacoes = data.redacoes || [];
            
            // DEBUG DETALHADO
            console.log('=== DEBUG DETALHADO DAS REDAÇÕES ===');
            console.log('Número total de redações:', currentRedacoes.length);
            
            if (currentRedacoes.length > 0) {
                console.log('Primeira redação (objeto completo):', currentRedacoes[0]);
                console.log('Tipo da primeira redação:', typeof currentRedacoes[0]);
                
                // Verificar todas as propriedades da primeira redação
                if (currentRedacoes[0]) {
                    console.log('Propriedades da primeira redação:');
                    for (const key in currentRedacoes[0]) {
                        console.log(`  ${key}:`, currentRedacoes[0][key]);
                    }
                    
                    // Verificar se é uma redação válida ou apenas informação do aluno
                    const hasRedacaoFields = '_id' in currentRedacoes[0] || 'titulo' in currentRedacoes[0] || 'texto' in currentRedacoes[0];
                    console.log('Tem campos de redação?', hasRedacaoFields);
                    
                    if (!hasRedacaoFields) {
                        console.log('ATENÇÃO: Os dados podem estar estruturados incorretamente!');
                        console.log('Provavelmente as redações estão dentro de um sub-objeto');
                    }
                }
            }
            console.log('=== FIM DEBUG ===');
            
            renderRedacoesList();
            updateRedacaoStats();
            showNotification(`${currentRedacoes.length} redações carregadas`, 'success');
        } else {
            console.error('Erro na resposta:', data.message);
            showNotification('Erro ao carregar redações: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar redações:', error);
        showNotification('Erro ao carregar redações. Verifique o console.', 'error');
    }
}

function renderRedacoesList() {
    const container = document.getElementById('redacoesCorrecaoList');
    if (!container) return;

    // Filtrar redações
    const statusFilter = document.getElementById('filterRedacaoStatus')?.value || 'pendente';
    const estiloFilter = document.getElementById('filterRedacaoEstilo')?.value || '';
    const searchText = document.getElementById('searchRedacao')?.value.toLowerCase() || '';
    
    console.log('Redações disponíveis:', currentRedacoes); // Debug
    console.log('Filtro status:', statusFilter);
    console.log('Filtro estilo:', estiloFilter);
    console.log('Busca:', searchText);
    
    let filtered = currentRedacoes;
    
    // Filtro de status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Filtro de estilo
    if (estiloFilter) {
        filtered = filtered.filter(r => r.estilo === estiloFilter);
    }
    
    // Filtro de busca
    if (searchText) {
        filtered = filtered.filter(r => {
            const titulo = r.titulo || r.title || '';
            const alunoNome = r.alunoNome || r.authorName || '';
            const texto = r.texto || r.text || r.content || '';
            const observacoes = r.observacoes || '';
            
            return titulo.toLowerCase().includes(searchText) ||
                   alunoNome.toLowerCase().includes(searchText) ||
                   texto.toLowerCase().includes(searchText) ||
                   observacoes.toLowerCase().includes(searchText);
        });
    }
    
    console.log('Redações filtradas:', filtered); // Debug
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-edit"></i>
                <h4>Nenhuma redação encontrada</h4>
                <p>${statusFilter === 'corrigido' ? 
                    'Nenhuma redação corrigida ainda' : 
                    statusFilter === 'pendente' ? 'Todas as redações estão corrigidas!' :
                    'Nenhuma redação encontrada com os filtros atuais'}</p>
                <button class="btn btn-secondary btn-sm" onclick="loadRedacoes()">
                    <i class="fas fa-sync"></i> Recarregar
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(redacao => {
        console.log('Processando redação:', redacao); // Debug
        
        const titulo = redacao.titulo || redacao.title || 'Sem título';
        const alunoNome = redacao.alunoNome || redacao.authorName || 'Aluno desconhecido';
        const estilo = redacao.estilo || 'enem';
        const status = redacao.status || 'pendente';
        const dataEnvio = redacao.dataEnvio || redacao.createdAt || redacao.date;
        const dataCorrecao = redacao.dataCorrecao;
        const texto = redacao.texto || redacao.text || redacao.content || '';
        const observacoes = redacao.observacoes || '';
        const nota = redacao.nota;
        const alunoTurma = redacao.alunoTurma || redacao.turma || 1;
        
        return `
        <div class="redacao-correcao-item" data-id="${redacao._id}">
            <div class="redacao-correcao-header">
                <div class="redacao-info">
                    <div class="redacao-titulo">${titulo}</div>
                    <div class="redacao-aluno">
                        <i class="fas fa-user"></i>
                        <span>${alunoNome}</span>
                        <span class="turma-badge turma-${alunoTurma}">
                            Turma ${alunoTurma}
                        </span>
                    </div>
                    <div class="redacao-meta">
                        <span class="redacao-badge badge-estilo">${estilo.toUpperCase()}</span>
                        <span class="redacao-badge ${status === 'corrigido' ? 'badge-corrigido' : 'badge-pendente'}">
                            ${status === 'corrigido' ? 'Corrigida' : 'Aguardando correção'}
                        </span>
                        <span><i class="far fa-calendar"></i> ${formatDate(dataEnvio)}</span>
                        ${dataCorrecao ? 
                            `<span><i class="fas fa-check-circle"></i> Corrigida em: ${formatDate(dataCorrecao)}</span>` : 
                            ''
                        }
                        ${nota ? 
                            `<span><i class="fas fa-star"></i> Nota: ${nota} ${getNotaMaxima(estilo)}</span>` : 
                            ''
                        }
                    </div>
                </div>
                <div class="redacao-acoes">
                    ${status !== 'corrigido' ? 
                        `<button class="btn-corrigir" onclick="abrirCorrecao('${redacao._id}')">
                            <i class="fas fa-edit"></i> Corrigir
                        </button>` : 
                        `<button class="btn-visualizar" onclick="visualizarCorrecao('${redacao._id}')">
                            <i class="fas fa-eye"></i> Ver Correção
                        </button>`
                    }
                </div>
            </div>
            
            ${status !== 'corrigido' ? `
                <div class="redacao-texto">
                    ${formatarTextoRedacao(texto)}
                </div>
                ${observacoes ? `
                    <div class="redacao-observacoes">
                        <strong><i class="fas fa-comment-dots"></i> Observações do aluno:</strong>
                        <p>${observacoes}</p>
                    </div>
                ` : ''}
            ` : `
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 2rem; color: var(--verde); margin-bottom: 0.5rem;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h4 style="color: var(--verde); margin-bottom: 0.5rem;">Redação Corrigida</h4>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--azul);">
                        Nota: ${nota} ${getNotaMaxima(estilo)}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="visualizarCorrecao('${redacao._id}')" style="margin-top: 1rem;">
                        <i class="fas fa-eye"></i> Ver Detalhes da Correção
                    </button>
                </div>
            `}
        </div>
    `}).join('');
}

function formatarTextoRedacao(texto) {
    console.log('Texto recebido para formatação (tipo):', typeof texto, 'valor:', texto); // Debug
    
    if (!texto) {
        console.log('Texto é vazio ou undefined');
        return '<p style="color: var(--cinza-escuro); opacity: 0.7;">Texto não disponível</p>';
    }
    
    try {
        let textoParaFormatar = texto;
        
        // Se for objeto, tentar extrair texto
        if (typeof texto === 'object') {
            console.log('Texto é objeto, propriedades:', Object.keys(texto));
            textoParaFormatar = texto.texto || texto.text || texto.content || 
                               texto.redacao || texto.essay || 
                               (texto.toString && texto.toString()) || 
                               JSON.stringify(texto);
        }
        
        // Converter para string
        textoParaFormatar = String(textoParaFormatar);
        
        // Verificar se é uma string válida
        if (!textoParaFormatar || textoParaFormatar === '[object Object]') {
            return '<p style="color: var(--cinza-escuro); opacity: 0.7;">Texto não disponível ou formato inválido</p>';
        }
        
        // Dividir por linhas e formatar
        const linhas = textoParaFormatar.split('\n');
        const textoFormatado = linhas.map((linha, index) => 
            `<div class="texto-linha">
                <span class="texto-linha-numero">${index + 1}</span>
                ${linha || ' '}
            </div>`
        ).join('');
        
        console.log('Texto formatado com sucesso, número de linhas:', linhas.length);
        return textoFormatado;
        
    } catch (error) {
        console.error('Erro ao formatar texto:', error);
        return '<p style="color: var(--vermelho); opacity: 0.7;">Erro ao formatar texto</p>';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function getNotaMaxima(estilo) {
    switch (estilo) {
        case 'enem': return '/1000';
        case 'psc': return '/9';
        case 'sis': return '/10';
        case 'macro': return '/28';
        default: return '';
    }
}

function updateRedacaoStats() {
    if (!currentRedacoes.length) {
        document.getElementById('pendentesCount').textContent = '0';
        document.getElementById('corrigidasCount').textContent = '0';
        document.getElementById('alunosCount').textContent = '0';
        return;
    }

    const pendentes = currentRedacoes.filter(r => r.status === 'pendente').length;
    const corrigidas = currentRedacoes.filter(r => r.status === 'corrigido').length;

    // Contar alunos únicos
    const alunosUnicos = [...new Set(currentRedacoes.map(r => r.alunoId))].length;

    document.getElementById('pendentesCount').textContent = pendentes;
    document.getElementById('corrigidasCount').textContent = corrigidas;
    document.getElementById('alunosCount').textContent = alunosUnicos;
}

async function abrirCorrecao(redacaoId) {
    console.log('Tentando abrir correção para ID:', redacaoId); // Debug
    
    if (!redacaoId || redacaoId === 'undefined' || redacaoId === 'null') {
        showNotification('ID da redação inválido', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/redacao/${redacaoId}`);
        console.log('Resposta do servidor:', response.status); // Debug
        
        const data = await response.json();
        console.log('Dados da redação:', data); // Debug

        if (!data.success) {
            showNotification('Erro ao carregar redação: ' + data.message, 'error');
            return;
        }

        currentRedacaoParaCorrigir = data.redacao;
        mostrarModalCorrecao();
        setupCompetencias();
    } catch (error) {
        console.error('Erro ao carregar redação:', error);
        showNotification('Erro ao carregar redação para correção', 'error');
    }
}
function mostrarModalCorrecao() {
    if (!currentRedacaoParaCorrigir) return;
    
    const redacao = currentRedacaoParaCorrigir;
    
    console.log('Redação para correção:', redacao); // Debug
    
    // Preencher informações da redação
    const titulo = redacao.titulo || redacao.title || 'Redação sem título';
    const alunoNome = redacao.alunoNome || redacao.authorName || 'Aluno desconhecido';
    const estilo = redacao.estilo || 'enem';
    const dataEnvio = redacao.dataEnvio || redacao.createdAt;
    const texto = redacao.texto || redacao.text || redacao.content || '';
    const observacoes = redacao.observacoes || '';
    
    document.getElementById('modalCorrecaoTitulo').textContent = `Corrigir: ${titulo}`;
    document.getElementById('viewRedacaoTitulo').textContent = titulo;
    
    // Informações do aluno
    document.getElementById('viewRedacaoInfo').innerHTML = `
        <span><i class="fas fa-user"></i> ${alunoNome}</span>
        <span class="redacao-badge badge-estilo">${estilo.toUpperCase()}</span>
        <span><i class="far fa-calendar"></i> Enviada em: ${formatDate(dataEnvio)}</span>
    `;
    
    // Texto da redação
    const textoFormatado = formatarTextoRedacao(texto);
    document.getElementById('viewRedacaoTexto').innerHTML = textoFormatado;
    
    // Observações do aluno
    if (observacoes) {
        document.getElementById('viewRedacaoObservacoes').style.display = 'block';
        document.getElementById('viewObservacoesTexto').textContent = observacoes;
    } else {
        document.getElementById('viewRedacaoObservacoes').style.display = 'none';
    }
    
    // Mostrar modal
    document.getElementById('correcaoModal').style.display = 'flex';
}

function setupCompetencias() {
    const container = document.getElementById('competenciaContainer');
    if (!container || !currentRedacaoParaCorrigir) return;

    const estilo = currentRedacaoParaCorrigir.estilo;
    let competencias = [];
    let notaMaxima = 0;

    switch (estilo) {
        case 'enem':
            competencias = [
                { nome: 'Competência 1: Domínio da norma padrão', peso: 200, max: 200 },
                { nome: 'Competência 2: Compreensão da proposta', peso: 200, max: 200 },
                { nome: 'Competência 3: Argumentação', peso: 200, max: 200 },
                { nome: 'Competência 4: Coesão', peso: 200, max: 200 },
                { nome: 'Competência 5: Proposta de intervenção', peso: 200, max: 200 }
            ];
            notaMaxima = 1000;
            break;

        case 'psc':
            competencias = [
                { nome: 'Unidade temática', peso: 3, max: 3 },
                { nome: 'Mecanismos linguísticos', peso: 4, max: 4 },
                { nome: 'Compreensão da proposta', peso: 2, max: 2 }
            ];
            notaMaxima = 9;
            break;

        case 'sis':
            competencias = [
                { nome: 'Tema', peso: 4, max: 4 },
                { nome: 'Gênero/tipo e coerência', peso: 4, max: 4 },
                { nome: 'Modalidade e registro', peso: 3, max: 3 },
                { nome: 'Coesão', peso: 3, max: 3 }
            ];
            notaMaxima = 14;
            break;

        case 'macro':
            competencias = [
                { nome: 'Tema', peso: 4, max: 4 },
                { nome: 'Gênero/tipo e coerência', peso: 4, max: 4 },
                { nome: 'Modalidade e registro', peso: 3, max: 3 },
                { nome: 'Coesão', peso: 3, max: 3 }
            ];
            notaMaxima = 14;
            break;

        default:
            competencias = [
                { nome: 'Conteúdo e Argumentação', peso: 5, max: 5 },
                { nome: 'Estrutura e Organização', peso: 3, max: 3 },
                { nome: 'Linguagem e Gramática', peso: 2, max: 2 }
            ];
            notaMaxima = 10;
    }

    container.innerHTML = competencias.map((comp, index) => `
        <div class="competencia-item">
            <div class="competencia-header">
                <h5>${comp.nome}</h5>
                <span>Max: ${comp.max}</span>
            </div>
            <div class="competencia-input">
                <input type="number" 
                       class="nota-input competencia-nota" 
                       data-index="${index}"
                       min="0" 
                       max="${comp.max}"
                       value="0"
                       step="${comp.max <= 10 ? '0.5' : '1'}">
                <span class="nota-max">/ ${comp.max}</span>
            </div>
            <textarea class="comentarios-input" 
                      placeholder="Comentários específicos sobre esta competência..."
                      rows="2"></textarea>
        </div>
    `).join('');

    document.getElementById('notaMaxTotal').textContent = `de ${notaMaxima} pontos`;

    container.querySelectorAll('.competencia-nota').forEach(input => {
        input.addEventListener('input', atualizarNotaTotal);
    });

    atualizarNotaTotal();
}

function atualizarNotaTotal() {
    const inputs = document.querySelectorAll('.competencia-nota');
    let total = 0;

    inputs.forEach(input => {
        const valor = parseFloat(input.value) || 0;
        total += valor;
    });

    document.getElementById('notaFinal').textContent = total;
}

async function salvarCorrecao() {
    if (!currentRedacaoParaCorrigir) return;

    try {
        // Coletar dados da correção
        const competencias = [];
        const competenciaItems = document.querySelectorAll('.competencia-item');

        competenciaItems.forEach((item, index) => {
            const nome = item.querySelector('h5').textContent;
            const nota = parseFloat(item.querySelector('.competencia-nota').value) || 0;
            const comentarios = item.querySelector('.comentarios-input').value.trim();
            const notaMax = parseInt(item.querySelector('.nota-max').textContent.replace('/', '')) || 10;

            competencias.push({
                nome,
                nota,
                maxNota: notaMax,
                comentarios: comentarios || null
            });
        });

        const correcaoData = {
            redacaoId: currentRedacaoParaCorrigir._id,
            nota: parseFloat(document.getElementById('notaFinal').textContent) || 0,
            competencias,
            comentariosProfessor: document.getElementById('comentariosProfessor').value.trim(),
            dataCorrecao: new Date().toISOString(),
            professorCorretor: currentUser.completename || 'Professor'
        };

        // Validar
        if (correcaoData.nota <= 0) {
            showNotification('Por favor, atribua notas às competências', 'warning');
            return;
        }

        // Enviar correção
        showNotification('Salvando correção...', 'info');

        const response = await fetch(`${API_BASE_URL}/admin/redacao/corrigir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(correcaoData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Correção salva com sucesso!', 'success');
            fecharModalCorrecao();
            await loadRedacoes(); // Recarregar lista
        } else {
            showNotification('Erro ao salvar correção: ' + result.message, 'error');
        }

    } catch (error) {
        console.error('Erro ao salvar correção:', error);
        showNotification('Erro ao salvar correção', 'error');
    }
}

function fecharModalCorrecao() {
    document.getElementById('correcaoModal').style.display = 'none';
    currentRedacaoParaCorrigir = null;
    document.getElementById('correcaoForm').reset();
    document.getElementById('competenciaContainer').innerHTML = '';
}

async function visualizarCorrecao(redacaoId) {
    console.log('Visualizando correção ID:', redacaoId); // Debug
    
    if (!redacaoId || redacaoId === 'undefined' || redacaoId === 'null') {
        showNotification('ID da redação inválido', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/redacao/${redacaoId}/correcao`);
        const data = await response.json();

        if (!data.success) {
            showNotification('Erro ao carregar correção: ' + data.message, 'error');
            return;
        }

        const redacao = data.redacao;
        const correcao = data.correcao;

        // Criar modal de visualização
        const modalHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
                <div class="modal-header">
                    <h3>Correção: ${redacao.titulo || 'Redação sem título'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body" style="overflow-y: auto;">
                    <div class="redacao-view-container">
                        <div class="redacao-view-header">
                            <div class="redacao-view-title">${redacao.titulo || 'Redação sem título'}</div>
                            <div class="redacao-view-info">
                                <span><i class="fas fa-user"></i> ${redacao.alunoNome || 'Aluno desconhecido'}</span>
                                <span class="redacao-badge badge-estilo">${redacao.estilo?.toUpperCase() || 'ENEM'}</span>
                                <span><i class="far fa-calendar"></i> Enviada em: ${formatDate(redacao.dataEnvio)}</span>
                            </div>
                        </div>
                        
                        <div class="nota-total-container" style="margin: 1rem 0;">
                            <h4>Nota Final</h4>
                            <div class="nota-final">${redacao.nota} ${getNotaMaxima(redacao.estilo)}</div>
                            <div>Corrigido por: ${correcao.professorCorretor || 'Professor'}</div>
                            <div>Data da correção: ${formatDate(correcao.dataCorrecao)}</div>
                        </div>
                        
                        <div class="redacao-view-texto">
                            ${formatarTextoRedacao(redacao.texto)}
                        </div>
                        
                        ${redacao.observacoes ? `
                            <div class="redacao-view-observacoes">
                                <strong><i class="fas fa-comment-dots"></i> Observações do aluno:</strong>
                                <p>${redacao.observacoes}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="margin-top: 2rem;">
                        <h4 style="color: var(--azul); margin-bottom: 1rem;">Detalhes da Correção</h4>
                        
                        ${correcao.competencias?.length ? `
                            <div class="competencias-grid" style="display: grid; gap: 1rem; margin-bottom: 1.5rem;">
                                ${correcao.competencias.map(comp => `
                                    <div class="competencia-item">
                                        <div class="competencia-header">
                                            <h5>${comp.nome}</h5>
                                            <span>${comp.nota}/${comp.maxNota}</span>
                                        </div>
                                        ${comp.comentarios ? `<p style="color: var(--cinza-escuro); font-size: 0.9rem; margin-top: 0.5rem;">${comp.comentarios}</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${correcao.comentariosProfessor ? `
                            <div class="form-group">
                                <label class="form-label">Comentários Gerais do Professor</label>
                                <div style="background: var(--cinza-claro); padding: 1rem; border-radius: 8px; color: var(--cinza-escuro);">
                                    ${correcao.comentariosProfessor}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Fechar</button>
                </div>
            </div>
        `;

        // Criar e mostrar modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);

        // Fechar modal ao clicar fora
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                setTimeout(() => modal.remove(), 300);
            }
        });

    } catch (error) {
        console.error('Erro ao visualizar correção:', error);
        showNotification('Erro ao carregar detalhes da correção', 'error');
    }
}

// ========== EVENT LISTENERS ADICIONAIS ==========
function setupRedacaoEventListeners() {
    // Filtros de busca
    document.getElementById('searchRedacao')?.addEventListener('input', debounce(renderRedacoesList, 300));
    document.getElementById('filterRedacaoStatus')?.addEventListener('change', renderRedacoesList);
    document.getElementById('filterRedacaoEstilo')?.addEventListener('change', renderRedacoesList);

    // Modal de correção
    document.getElementById('closeCorrecaoModal')?.addEventListener('click', fecharModalCorrecao);
    document.getElementById('btnCancelCorrecao')?.addEventListener('click', fecharModalCorrecao);
    document.getElementById('btnSalvarCorrecao')?.addEventListener('click', salvarCorrecao);
}

// Função debounce para otimizar busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

setupRedacaoEventListeners();

// ========== FUNÇÕES DE AULAS ==========

// Função para adicionar campo de recurso
function addResourceField() {
    const container = document.getElementById('resourcesContainer');
    const resourceCount = container.children.length;
    const resourceField = document.createElement('div');
    resourceField.className = 'resource-field';
    resourceField.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Tipo de Recurso</label>
                <select class="form-input resource-type" required>
                    <option value="">Selecione...</option>
                    <option value="pdf">PDF</option>
                    <option value="ppt">Apresentação</option>
                    <option value="doc">Documento</option>
                    <option value="link">Link</option>
                    <option value="quiz">Quiz</option>
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Título</label>
                <input type="text" class="form-input resource-title" placeholder="Ex: Slides da aula" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">URL</label>
                <input type="url" class="form-input resource-url" placeholder="https://..." required>
            </div>
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <input type="text" class="form-input resource-desc" placeholder="Descrição opcional">
            </div>
            <div class="form-group" style="align-self: flex-end;">
                ${resourceCount > 0 ? `
                    <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.resource-field').remove()">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    container.appendChild(resourceField);
}

async function loadLessons() {
    try {
        console.log('Carregando aulas...');

        // Primeiro carregar cursos para poder buscar aulas por curso
        if (currentCourses.length === 0) {
            await loadCourses();
        }

        // Buscar aulas para cada curso
        let allLessons = [];

        for (const course of currentCourses) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/course/${course.courseId}/detail`);
                const data = await response.json();

                if (data.success && data.lessons) {
                    // Adicionar informações do curso a cada aula
                    const lessonsWithCourse = data.lessons.map(lesson => ({
                        ...lesson,
                        courseTitle: course.title,
                        courseType: course.type
                    }));
                    allLessons = [...allLessons, ...lessonsWithCourse];
                }
            } catch (error) {
                console.error(`Erro ao carregar aulas do curso ${course.courseId}:`, error);
            }
        }

        currentLessons = allLessons;
        renderLessonsList();
        updateLessonStats();

        if (allLessons.length > 0) {
            showNotification(`${allLessons.length} aulas carregadas`, 'success');
        }

    } catch (error) {
        console.error('Erro ao carregar aulas:', error);
        showNotification('Erro ao carregar aulas. Verifique o console.', 'error');

        // Para debug, use dados de exemplo
        loadSampleLessons();
    }
}

function renderRedacoesList() {
    const container = document.getElementById('redacoesCorrecaoList');
    if (!container) return;

    // Filtrar redações
    const statusFilter = document.getElementById('filterRedacaoStatus')?.value || 'pendente';
    const estiloFilter = document.getElementById('filterRedacaoEstilo')?.value || '';
    const searchText = document.getElementById('searchRedacao')?.value.toLowerCase() || '';
    
    console.log('Redações disponíveis:', currentRedacoes); // Debug
    console.log('Total de redações:', currentRedacoes.length); // Debug
    
    let filtered = currentRedacoes;
    
    // Filtro de status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Filtro de estilo
    if (estiloFilter) {
        filtered = filtered.filter(r => r.estilo === estiloFilter);
    }
    
    // Filtro de busca
    if (searchText) {
        filtered = filtered.filter(r => {
            const titulo = r.titulo || r.title || '';
            const alunoNome = r.alunoNome || r.authorName || '';
            const texto = r.texto || r.text || r.content || '';
            const observacoes = r.observacoes || '';
            
            return titulo.toLowerCase().includes(searchText) ||
                   alunoNome.toLowerCase().includes(searchText) ||
                   texto.toLowerCase().includes(searchText) ||
                   observacoes.toLowerCase().includes(searchText);
        });
    }
    
    console.log('Redações filtradas:', filtered.length); // Debug
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-edit"></i>
                <h4>Nenhuma redação encontrada</h4>
                <p>${statusFilter === 'corrigido' ? 
                    'Nenhuma redação corrigida ainda' : 
                    statusFilter === 'pendente' ? 'Todas as redações estão corrigidas!' :
                    'Nenhuma redação encontrada com os filtros atuais'}</p>
                <button class="btn btn-secondary btn-sm" onclick="loadRedacoes()">
                    <i class="fas fa-sync"></i> Recarregar
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(redacao => {
        console.log('Processando redação ID:', redacao._id); // Debug
        
        const redacaoId = redacao._id || redacao.id;
        
        // VERIFICAÇÃO CRÍTICA: garantir que temos um ID
        if (!redacaoId) {
            console.error('Redação sem ID:', redacao);
            return `<div class="error-item">Redação sem ID válido</div>`;
        }
        
        const titulo = redacao.titulo || redacao.title || 'Sem título';
        const alunoNome = redacao.alunoNome || redacao.authorName || 'Aluno desconhecido';
        const estilo = redacao.estilo || 'enem';
        const status = redacao.status || 'pendente';
        const dataEnvio = redacao.dataEnvio || redacao.createdAt || redacao.date;
        const dataCorrecao = redacao.dataCorrecao;
        const texto = redacao.texto || redacao.text || redacao.content || '';
        const observacoes = redacao.observacoes || '';
        const nota = redacao.nota;
        const alunoTurma = redacao.alunoTurma || redacao.turma || 1;
        
        return `
        <div class="redacao-correcao-item" data-id="${redacaoId}">
            <div class="redacao-correcao-header">
                <div class="redacao-info">
                    <div class="redacao-titulo">${titulo}</div>
                    <div class="redacao-aluno">
                        <i class="fas fa-user"></i>
                        <span>${alunoNome}</span>
                        <span class="turma-badge turma-${alunoTurma}">
                            Turma ${alunoTurma}
                        </span>
                    </div>
                    <div class="redacao-meta">
                        <span class="redacao-badge badge-estilo">${estilo.toUpperCase()}</span>
                        <span class="redacao-badge ${status === 'corrigido' ? 'badge-corrigido' : 'badge-pendente'}">
                            ${status === 'corrigido' ? 'Corrigida' : 'Aguardando correção'}
                        </span>
                        <span><i class="far fa-calendar"></i> ${formatDate(dataEnvio)}</span>
                        ${dataCorrecao ? 
                            `<span><i class="fas fa-check-circle"></i> Corrigida em: ${formatDate(dataCorrecao)}</span>` : 
                            ''
                        }
                        ${nota ? 
                            `<span><i class="fas fa-star"></i> Nota: ${nota} ${getNotaMaxima(estilo)}</span>` : 
                            ''
                        }
                    </div>
                </div>
                <div class="redacao-acoes">
                    ${status !== 'corrigido' ? 
                        `<button class="btn-corrigir" onclick="abrirCorrecao('${redacaoId}')">
                            <i class="fas fa-edit"></i> Corrigir
                        </button>` : 
                        `<button class="btn-visualizar" onclick="visualizarCorrecao('${redacaoId}')">
                            <i class="fas fa-eye"></i> Ver Correção
                        </button>`
                    }
                </div>
            </div>
            
            ${status !== 'corrigido' ? `
                <div class="redacao-texto">
                    ${formatarTextoRedacao(texto)}
                </div>
                ${observacoes ? `
                    <div class="redacao-observacoes">
                        <strong><i class="fas fa-comment-dots"></i> Observações do aluno:</strong>
                        <p>${observacoes}</p>
                    </div>
                ` : ''}
            ` : `
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 2rem; color: var(--verde); margin-bottom: 0.5rem;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h4 style="color: var(--verde); margin-bottom: 0.5rem;">Redação Corrigida</h4>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--azul);">
                        Nota: ${nota} ${getNotaMaxima(estilo)}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="visualizarCorrecao('${redacaoId}')" style="margin-top: 1rem;">
                        <i class="fas fa-eye"></i> Ver Detalhes da Correção
                    </button>
                </div>
            `}
        </div>
    `}).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function getCourseTitle(courseId) {
    const course = currentCourses.find(c => c.courseId === courseId);
    return course ? course.title : courseId;
}

async function handleLessonSubmit(e) {
    e.preventDefault();

    const btn = e.target.querySelector('.btn-success');
    const originalText = btn.innerHTML;
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const courseId = document.getElementById('lessonCourseId').value;
        const lessonData = {
            subject: document.getElementById('lessonSubject').value,
            title: document.getElementById('lessonTitle').value.trim(),
            description: document.getElementById('lessonDescription').value.trim() || null,
            videoUrl: document.getElementById('videoUrl').value.trim() || null,
            duration: parseInt(document.getElementById('lessonDuration').value) || 0,
            order: parseInt(document.getElementById('lessonOrder').value) || 0,
            professor: document.getElementById('lessonProfessor').value.trim() || null
        };

        // Coletar recursos
        const resources = [];
        document.querySelectorAll('.resource-field').forEach(field => {
            const type = field.querySelector('.resource-type')?.value;
            const title = field.querySelector('.resource-title')?.value;
            const url = field.querySelector('.resource-url')?.value;
            const desc = field.querySelector('.resource-desc')?.value;

            if (type && title && url) {
                resources.push({
                    type,
                    title,
                    url,
                    description: desc || null
                });
            }
        });

        if (resources.length > 0) {
            lessonData.resources = resources;
        }

        // Validações
        if (!courseId || !lessonData.subject || !lessonData.title) {
            showNotification('Preencha todos os campos obrigatórios (Curso, Matéria e Título)', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/admin/course/${courseId}/lesson`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lessonData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Aula criada com sucesso!', 'success');
            limparFormularioAula();
            await loadLessons(); // Recarregar lista
        } else {
            showNotification(`Erro: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar aula:', error);
        showNotification('Erro ao salvar aula', 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function editLesson(lessonId) {
    try {
        // Primeiro, precisamos encontrar qual curso esta aula pertence
        const lesson = currentLessons.find(l => l._id === lessonId);
        if (!lesson) {
            showNotification('Aula não encontrada na lista carregada', 'error');
            return;
        }

        // Buscar detalhes completos da aula
        const response = await fetch(`${API_BASE_URL}/api/questao/${lessonId}`);
        const data = await response.json();

        if (!data.success) {
            // Tentar buscar de outra forma
            showNotification('Erro ao carregar detalhes da aula', 'error');
            return;
        }

        const lessonDetails = data.questao || data.lesson || lesson;

        // Preencher formulário
        document.getElementById('lessonCourseId').value = lesson.courseId;
        document.getElementById('lessonSubject').value = lesson.subject || lessonDetails.subject;
        document.getElementById('lessonTitle').value = lesson.title || lessonDetails.title;
        document.getElementById('lessonDescription').value = lesson.description || lessonDetails.description || '';
        document.getElementById('videoUrl').value = lesson.videoUrl || lessonDetails.videoUrl || '';
        document.getElementById('lessonDuration').value = lesson.duration || lessonDetails.duration || '';
        document.getElementById('lessonOrder').value = lesson.order || lessonDetails.order || '';
        document.getElementById('lessonProfessor').value = lesson.professor || lessonDetails.professor || '';

        // Preencher recursos
        const resourcesContainer = document.getElementById('resourcesContainer');
        resourcesContainer.innerHTML = '';

        const resources = lesson.resources || lessonDetails.resources || [];
        if (resources.length > 0) {
            resources.forEach(resource => {
                addResourceField();
                const lastField = resourcesContainer.lastElementChild;
                if (lastField) {
                    lastField.querySelector('.resource-type').value = resource.type;
                    lastField.querySelector('.resource-title').value = resource.title;
                    lastField.querySelector('.resource-url').value = resource.url;
                    lastField.querySelector('.resource-desc').value = resource.description || '';
                }
            });
        } else {
            // Adicionar um campo vazio
            addResourceField();
        }

        // Mudar texto do botão para "Atualizar Aula"
        const submitBtn = document.querySelector('#lessonForm .btn-success');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Aula';
            submitBtn.onclick = function (e) {
                e.preventDefault();
                updateLesson(lessonId, lesson.courseId);
            };
        }

        showNotification('Modo edição ativado. Altere os dados e clique em "Atualizar Aula".', 'info');
        document.getElementById('lessonForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Erro ao carregar aula:', error);
        showNotification('Erro ao carregar dados da aula', 'error');
    }
}

async function updateLesson(lessonId, courseId) {
    try {
        const lessonData = {
            subject: document.getElementById('lessonSubject').value,
            title: document.getElementById('lessonTitle').value.trim(),
            description: document.getElementById('lessonDescription').value.trim() || null,
            videoUrl: document.getElementById('videoUrl').value.trim() || null,
            duration: parseInt(document.getElementById('lessonDuration').value) || 0,
            order: parseInt(document.getElementById('lessonOrder').value) || 0,
            professor: document.getElementById('lessonProfessor').value.trim() || null
        };

        // Coletar recursos
        const resources = [];
        document.querySelectorAll('.resource-field').forEach(field => {
            const type = field.querySelector('.resource-type')?.value;
            const title = field.querySelector('.resource-title')?.value;
            const url = field.querySelector('.resource-url')?.value;
            const desc = field.querySelector('.resource-desc')?.value;

            if (type && title && url) {
                resources.push({
                    type,
                    title,
                    url,
                    description: desc || null
                });
            }
        });

        if (resources.length > 0) {
            lessonData.resources = resources;
        }

        // Validações
        if (!lessonData.subject || !lessonData.title) {
            showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/questao/${lessonId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lessonData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Aula atualizada com sucesso!', 'success');
            limparFormularioAula();
            await loadLessons(); // Recarregar lista

            // Restaurar botão para adicionar nova aula
            const submitBtn = document.querySelector('#lessonForm .btn-success');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Aula';
                submitBtn.onclick = handleLessonSubmit;
            }
        } else {
            showNotification(`Erro: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        showNotification('Erro ao atualizar aula', 'error');
    }
}

async function deleteLesson(lessonId, courseId) {
    if (!confirm('Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        // Usando o endpoint de exclusão de questão como referência
        const response = await fetch(`${API_BASE_URL}/api/admin/questao/${lessonId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Aula excluída com sucesso!', 'success');
            await loadLessons(); // Recarregar lista
        } else {
            showNotification(`Erro: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        showNotification('Erro ao excluir aula', 'error');
    }
}

function updateLessonStats() {
    // Atualizar sidebar se necessário
    if (document.getElementById('sidebarLessons')) {
        document.getElementById('sidebarLessons').textContent = currentLessons.length;
    }

    // Atualizar estatísticas gerais
    if (currentLessons.length > 0) {
        const totalDuration = currentLessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
        console.log(`Total de ${currentLessons.length} aulas, ${totalDuration} minutos de conteúdo`);
    }
}

function limparFormularioAula() {
    document.getElementById('lessonForm').reset();
    document.getElementById('resourcesContainer').innerHTML = '';
    // Adicionar um campo de recurso vazio
    addResourceField();

    // Garantir que o botão está no modo de adicionar
    const submitBtn = document.querySelector('#lessonForm .btn-success');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Aula';
        submitBtn.onclick = handleLessonSubmit;
    }
}

// Função para carregar aulas de exemplo (para debug)
function loadSampleLessons() {
    currentLessons = [
        {
            _id: 'sample1',
            courseId: 'ps1',
            courseTitle: 'PSC I - 1º Ano',
            subject: 'mat',
            title: 'Introdução à Álgebra',
            description: 'Conceitos básicos de álgebra e equações lineares',
            duration: 45,
            order: 1,
            professor: 'Prof. João Silva',
            videoUrl: 'https://youtube.com/watch?v=abc123',
            resources: [
                { type: 'pdf', title: 'Slides da Aula', url: 'https://exemplo.com/slides1.pdf' }
            ],
            createdAt: '2024-01-15T10:00:00Z'
        },
        {
            _id: 'sample2',
            courseId: 'ps1',
            courseTitle: 'PSC I - 1º Ano',
            subject: 'port',
            title: 'Gramática: Verbos',
            description: 'Estudo dos tempos verbais e conjugações',
            duration: 50,
            order: 2,
            professor: 'Prof. Maria Santos',
            resources: [],
            createdAt: '2024-01-16T14:30:00Z'
        }
    ];

    renderLessonsList();
    showNotification(`${currentLessons.length} aulas de exemplo carregadas`, 'info');
}
function renderLessonsList() {
    const container = document.getElementById('lessonsList');
    if (!container) return;
    
    // Filtrar aulas
    const courseFilter = document.getElementById('filterLessonCourse')?.value || '';
    const searchText = document.getElementById('searchLesson')?.value.toLowerCase() || '';
    
    let filtered = currentLessons;
    
    // Filtro de curso
    if (courseFilter) {
        filtered = filtered.filter(lesson => lesson.courseId === courseFilter);
    }
    
    // Filtro de busca
    if (searchText) {
        filtered = filtered.filter(lesson => 
            lesson.title?.toLowerCase().includes(searchText) ||
            lesson.description?.toLowerCase().includes(searchText) ||
            lesson.subject?.toLowerCase().includes(searchText) ||
            lesson.professor?.toLowerCase().includes(searchText) ||
            (lesson.courseTitle && lesson.courseTitle.toLowerCase().includes(searchText))
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <h4>Nenhuma aula encontrada</h4>
                <p>${courseFilter ? 
                    'Nenhuma aula encontrada para este curso' : 
                    'Comece criando sua primeira aula usando o formulário acima.'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(lesson => `
        <div class="lesson-item" data-id="${lesson._id}">
            <div class="lesson-header">
                <div class="lesson-badges">
                    <span class="lesson-badge subject">${formatSubject(lesson.subject)}</span>
                    <span class="lesson-badge course">${lesson.courseTitle || lesson.courseId}</span>
                    ${lesson.duration ? 
                        `<span class="lesson-badge duration"><i class="fas fa-clock"></i> ${lesson.duration} min</span>` : 
                        ''
                    }
                    ${lesson.videoUrl ? 
                        `<span class="lesson-badge video"><i class="fas fa-video"></i> Com vídeo</span>` : 
                        ''
                    }
                </div>
                <div class="lesson-actions">
                    <button onclick="editLesson('${lesson._id}')" title="Editar aula">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteLesson('${lesson._id}', '${lesson.courseId}')" title="Excluir aula">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="lesson-content">
                <h4>${lesson.title}</h4>
                <p>${lesson.description || 'Sem descrição'}</p>
                <div class="lesson-meta">
                    ${lesson.professor ? 
                        `<span><i class="fas fa-chalkboard-teacher"></i> ${lesson.professor}</span>` : 
                        ''
                    }
                    ${lesson.order !== undefined ? 
                        `<span><i class="fas fa-sort-numeric-up"></i> Ordem: ${lesson.order}</span>` : 
                        ''
                    }
                    ${lesson.resources && lesson.resources.length > 0 ? 
                        `<span><i class="fas fa-paperclip"></i> ${lesson.resources.length} recursos</span>` : 
                        ''
                    }
                    ${lesson.comments && lesson.comments.length > 0 ? 
                        `<span><i class="fas fa-comments"></i> ${lesson.comments.length} comentários</span>` : 
                        ''
                    }
                    <span><i class="far fa-calendar"></i> ${formatDate(lesson.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Adicione esta função auxiliar para formatar matérias
function formatSubject(subject) {
    const subjects = {
        'mat': 'Matemática',
        'port': 'Português',
        'hist': 'História',
        'geo': 'Geografia',
        'bio': 'Biologia',
        'quim': 'Química',
        'fis': 'Física',
        'lit': 'Literatura'
    };
    return subjects[subject] || subject;
}

// Verificar hash na URL
const hash = window.location.hash.substring(1);
const validTabs = ['cursos', 'aulas', 'questoes', 'usuarios', 'redacoes'];

if (hash && validTabs.includes(hash)) {
    showSection(hash);
} else {
    // Mostrar cursos por padrão
    showSection('cursos');
}

document.getElementsByClassName("logo-text")[0].onclick = function () {
    window.location.href = "/index.html";
};