document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = '/api';
    let currentUser = null;
    let allCourses = [];
    let filteredCourses = [];
    
    // Inicializar
    async function init() {
        try {
            
            // Configurar eventos
            setupEventListeners();
            
            // Carregar cursos da API
            await loadCourses();
            
            // Atualizar estatísticas
            updateStats();
            
            // Inicializar cálculos
            updateCalculations();
            
        } catch (error) {
            console.error('Erro ao inicializar calculadora:', error);
            showError('Erro ao carregar a calculadora. Tente novamente.');
        }
    }
    
    // Carregar cursos da API
    async function loadCourses() {
        try {
            const response = await fetch(`${API_BASE_URL}/calculator/courses`);
            const data = await response.json();
            
            if (data.success) {
                allCourses = data.courses;
                populateFilters();
                filterCourses();
            } else {
                throw new Error(data.message || 'Erro ao carregar cursos');
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            showError('Não foi possível carregar os cursos. Tente novamente.');
        }
    }
    
    // Popular filtros
    function populateFilters() {
        const universidades = [...new Set(allCourses.map(c => c.universidade))].sort();
        const cursos = [...new Set(allCourses.map(c => c.curso))].sort();
        
        const universidadeSelect = document.getElementById('universidadeFilter');
        const cursoSelect = document.getElementById('cursoFilter');
        
        // Limpar opções atuais (exceto a primeira)
        while (universidadeSelect.options.length > 1) universidadeSelect.remove(1);
        while (cursoSelect.options.length > 1) cursoSelect.remove(1);
        
        // Adicionar opções
        universidades.forEach(uni => {
            const option = document.createElement('option');
            option.value = uni;
            option.textContent = uni;
            universidadeSelect.appendChild(option);
        });
        
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            cursoSelect.appendChild(option);
        });
    }
    
    // Configurar eventos
    function setupEventListeners() {
        // Toggle entre PSC/SIS/ENEM
        document.querySelectorAll('.toggle-vest').forEach(btn => {
            btn.addEventListener('click', function() {
                const vestibular = this.dataset.vestibular;
                
                // Atualizar botões ativos
                document.querySelectorAll('.toggle-vest').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Mostrar formulário correspondente
                document.querySelectorAll('.input-form').forEach(form => form.classList.add('hidden'));
                document.getElementById(`${vestibular}Form`).classList.remove('hidden');
            });
        });
        
        // Inputs numéricos PSC
        const pscInputs = ['psc1', 'psc2', 'psc3', 'redacaoPsc'];
        pscInputs.forEach(id => {
            const input = document.getElementById(id);
            const slider = document.getElementById(`${id}Slider`);
            
            if (input && slider) {
                input.addEventListener('input', function() {
                    const value = parseFloat(this.value) || 0;
                    const max = parseInt(this.max);
                    
                    if (value > max) this.value = max;
                    if (value < 0) this.value = 0;
                    
                    slider.value = value;
                    updateCalculations();
                });
                
                slider.addEventListener('input', function() {
                    input.value = this.value;
                    updateCalculations();
                });
            }
        });
        
        // Botão reset PSC
        document.getElementById('resetPsc').addEventListener('click', function() {
            document.getElementById('psc1').value = 0;
            document.getElementById('psc2').value = 0;
            document.getElementById('psc3').value = 0;
            document.getElementById('redacaoPsc').value = 0;
            
            document.getElementById('psc1Slider').value = 0;
            document.getElementById('psc2Slider').value = 0;
            document.getElementById('psc3Slider').value = 0;
            document.getElementById('redacaoSlider').value = 0;
            
            updateCalculations();
        });
        
        // Filtros
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', filterCourses);
        });
        
        // Busca
        document.getElementById('searchCourse').addEventListener('input', filterCourses);
        
        // Reset filtros
        document.getElementById('resetFilters').addEventListener('click', function() {
            document.getElementById('universidadeFilter').value = '';
            document.getElementById('cursoFilter').value = '';
            document.getElementById('cotaFilter').value = '';
            document.getElementById('anoFilter').value = '';
            document.getElementById('searchCourse').value = '';
            
            filterCourses();
        });
        
        // Ordenar
        document.getElementById('sortBy').addEventListener('click', function() {
            // Implementar lógica de ordenação
            console.log('Ordenar cursos');
        });
        
        // Modal
        document.getElementById('modalClose').addEventListener('click', function() {
            document.getElementById('courseModal').classList.remove('active');
        });
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }
        });
        
        // Menu mobile
        const menuToggle = document.getElementById('menuToggle');
        const navMobile = document.getElementById('navMobile');
        
        if (menuToggle && navMobile) {
            menuToggle.addEventListener('click', function() {
                this.classList.toggle('active');
                navMobile.classList.toggle('active');
            });
        }
        
        // Header scroll
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Atualizar cálculos
    function updateCalculations() {
        const psc1 = parseFloat(document.getElementById('psc1').value) || 0;
        const psc2 = parseFloat(document.getElementById('psc2').value) || 0;
        const psc3 = parseFloat(document.getElementById('psc3').value) || 0;
        const redacao = parseFloat(document.getElementById('redacaoPsc').value) || 0;
        
        // Calcular com pesos PSC (questão = 3, redação = 6)
        const psc1Peso = psc1 * 3;
        const psc2Peso = psc2 * 3;
        const psc3Peso = psc3 * 3;
        const redacaoPeso = redacao * 6;
        
        const total = psc1Peso + psc2Peso + psc3Peso + redacaoPeso;
        
        // Atualizar display
        document.getElementById('psc1Peso').textContent = psc1Peso.toFixed(3);
        document.getElementById('psc2Peso').textContent = psc2Peso.toFixed(3);
        document.getElementById('psc3Peso').textContent = psc3Peso.toFixed(3);
        document.getElementById('redacaoPeso').textContent = redacaoPeso.toFixed(3);
        
        document.getElementById('pscTotal').textContent = total.toFixed(3);
        document.getElementById('breakdownPsc1').textContent = psc1Peso.toFixed(3);
        document.getElementById('breakdownPsc2').textContent = psc2Peso.toFixed(3);
        document.getElementById('breakdownPsc3').textContent = psc3Peso.toFixed(3);
        document.getElementById('breakdownRedacao').textContent = redacaoPeso.toFixed(3);
        
        // Filtrar cursos com base na nova nota
        filterCourses();
    }
    
    // Filtrar cursos
    function filterCourses() {
        const total = parseFloat(document.getElementById('pscTotal').textContent) || 0;
        
        // Obter valores dos filtros
        const universidade = document.getElementById('universidadeFilter').value;
        const curso = document.getElementById('cursoFilter').value;
        const cota = document.getElementById('cotaFilter').value;
        const ano = document.getElementById('anoFilter').value;
        const search = document.getElementById('searchCourse').value.toLowerCase();
        
        // Filtrar cursos
        filteredCourses = allCourses.filter(course => {
            // Filtro por vestibular (por enquanto só PSC)
            if (course.vestibular !== 'PSC') return false;
            
            // Filtro por universidade
            if (universidade && course.universidade !== universidade) return false;
            
            // Filtro por curso
            if (curso && course.curso !== curso) return false;
            
            // Filtro por cota
            if (cota && course.cota.tipo !== cota) return false;
            
            // Filtro por ano
            if (ano && course.ano.toString() !== ano) return false;
            
            // Filtro por busca
            if (search && !(
                course.curso.toLowerCase().includes(search) ||
                course.universidade.toLowerCase().includes(search) ||
                course.campus?.toLowerCase().includes(search)
            )) return false;
            
            return true;
        });
        
        // Ordenar por diferença de nota (mais próxima primeiro)
        filteredCourses.sort((a, b) => {
            const diffA = Math.abs(total - a.notas.total);
            const diffB = Math.abs(total - b.notas.total);
            return diffA - diffB;
        });
        
        // Renderizar resultados
        renderResults(total);
    }
    
    // Renderizar resultados
    function renderResults(userScore) {
        const container = document.getElementById('resultsContainer');
        const countElement = document.getElementById('resultsCount');
        
        if (filteredCourses.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>Nenhum curso encontrado</h4>
                    <p>Tente ajustar os filtros ou inserir diferentes notas.</p>
                </div>
            `;
            countElement.textContent = '0 cursos encontrados';
            return;
        }
        
        countElement.textContent = `${filteredCourses.length} cursos encontrados`;
        
        container.innerHTML = '';
        
        filteredCourses.forEach(course => {
            const courseScore = course.notas.total;
            const diff = userScore - courseScore;
            const diffPercent = (diff / courseScore) * 100;
            
            // Determinar status
            let status = 'fail';
            let statusClass = 'fail';
            let statusText = 'Abaixo da nota';
            
            if (diff >= 0) {
                status = 'pass';
                statusClass = 'pass';
                statusText = 'Você passaria!';
            } else if (diffPercent >= -5) {
                status = 'close';
                statusClass = 'close';
                statusText = 'Próximo da nota';
            }
            
            // Calcular porcentagem para barra
            const maxScore = 477; // Máximo PSC
            const userPercent = (userScore / maxScore) * 100;
            const coursePercent = (courseScore / maxScore) * 100;
            
            const courseCard = document.createElement('div');
            courseCard.className = `course-card ${statusClass}`;
            courseCard.dataset.courseId = course._id;
            
            courseCard.innerHTML = `
                <div class="course-header">
                    <div class="course-title">
                        <h4>${course.curso}</h4>
                        <div class="course-university">
                            <i class="fas fa-university"></i>
                            <span>${course.universidade} • ${course.campus || 'Campus principal'}</span>
                        </div>
                    </div>
                    <div class="course-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                
                <div class="course-info">
                    <div class="info-item">
                        <span class="info-label">
                            <i class="fas fa-calendar"></i>
                            Ano
                        </span>
                        <strong class="info-value">${course.ano}</strong>
                    </div>
                    <div class="info-item">
                        <span class="info-label">
                            <i class="fas fa-users"></i>
                            Cota
                        </span>
                        <strong class="info-value">${getCotaName(course.cota.tipo)}</strong>
                    </div>
                    <div class="info-item">
                        <span class="info-label">
                            <i class="fas fa-graduation-cap"></i>
                            Nota de Corte
                        </span>
                        <strong class="info-value">${courseScore.toFixed(3)}</strong>
                    </div>
                    <div class="info-item">
                        <span class="info-label">
                            <i class="fas fa-chart-line"></i>
                            Sua Nota
                        </span>
                        <strong class="info-value ${statusClass}">${userScore.toFixed(3)}</strong>
                    </div>
                </div>
                
                <div class="course-comparison">
                    <div class="comparison-bar">
                        <div class="comparison-fill ${statusClass}" style="width: ${coursePercent}%"></div>
                        <div class="comparison-marker" style="left: ${userPercent}%"></div>
                    </div>
                    <div class="comparison-labels">
                        <span>0</span>
                        <span>Sua nota: ${userScore.toFixed(3)}</span>
                        <span>Corte: ${courseScore.toFixed(3)}</span>
                        <span>477</span>
                    </div>
                </div>
            `;
            
            courseCard.addEventListener('click', () => showCourseModal(course));
            container.appendChild(courseCard);
        });
    }
    
    // Mostrar modal do curso
    function showCourseModal(course) {
        const modal = document.getElementById('courseModal');
        const title = document.getElementById('modalCourseTitle');
        const info = document.getElementById('modalCourseInfo');
        
        const diff = parseFloat(document.getElementById('pscTotal').textContent) - course.notas.total;
        
        title.textContent = `${course.curso} - ${course.universidade}`;
        
        info.innerHTML = `
            <div class="modal-course-header">
                <h4>Informações Detalhadas</h4>
                <p>${course.campus || 'Campus principal'} • ${course.ano}</p>
            </div>
            
            <div class="modal-course-details">
                <div class="detail-item">
                    <span class="detail-label">Vestibular:</span>
                    <strong class="detail-value">${course.vestibular} ${course.edicao || ''}</strong>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Modalidade:</span>
                    <strong class="detail-value">${getCotaName(course.cota.tipo)}</strong>
                    ${course.cota.descricao ? `<p class="detail-desc">${course.cota.descricao}</p>` : ''}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Período:</span>
                    <strong class="detail-value">${course.notas.periodo || 'Não informado'}</strong>
                </div>
                ${course.notas.vagas ? `
                <div class="detail-item">
                    <span class="detail-label">Vagas:</span>
                    <strong class="detail-value">${course.notas.vagas}</strong>
                </div>
                ` : ''}
                ${course.notas.colocacao ? `
                <div class="detail-item">
                    <span class="detail-label">Colocação do último:</span>
                    <strong class="detail-value">${course.notas.colocacao}º lugar</strong>
                </div>
                ` : ''}
            </div>
            
            <div class="modal-course-scores">
                <h4>Notas de Corte</h4>
                <div class="scores-grid">
                    ${course.notas.psc1 ? `
                    <div class="score-item">
                        <span>PSC 1:</span>
                        <strong>${course.notas.psc1.toFixed(3)}</strong>
                    </div>
                    ` : ''}
                    ${course.notas.psc2 ? `
                    <div class="score-item">
                        <span>PSC 2:</span>
                        <strong>${course.notas.psc2.toFixed(3)}</strong>
                    </div>
                    ` : ''}
                    ${course.notas.psc3 ? `
                    <div class="score-item">
                        <span>PSC 3:</span>
                        <strong>${course.notas.psc3.toFixed(3)}</strong>
                    </div>
                    ` : ''}
                    ${course.notas.redacao ? `
                    <div class="score-item">
                        <span>Redação:</span>
                        <strong>${course.notas.redacao.toFixed(3)}</strong>
                    </div>
                    ` : ''}
                </div>
                
                <div class="score-total">
                    <span>Nota Total:</span>
                    <strong>${course.notas.total.toFixed(3)}</strong>
                </div>
            </div>
            
            <div class="modal-course-comparison">
                <h4>Sua Pontuação</h4>
                <div class="comparison-result ${diff >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${diff >= 0 ? 'check-circle' : 'times-circle'}"></i>
                    <div>
                        <strong>Sua nota: ${parseFloat(document.getElementById('pscTotal').textContent).toFixed(3)}</strong>
                        <span>${diff >= 0 ? '+' : ''}${diff.toFixed(3)} pontos ${diff >= 0 ? 'acima' : 'abaixo'} da nota de corte</span>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    // Atualizar estatísticas
    function updateStats() {
        const totalCursos = allCourses.length;
        const totalUniversidades = new Set(allCourses.map(c => c.universidade)).size;
        
        document.getElementById('totalCursos').textContent = totalCursos;
        document.getElementById('totalUniversidades').textContent = totalUniversidades;
    }
    
    // Helper: obter nome da cota
    function getCotaName(tipo) {
        const cotas = {
            'AMPLA': 'Ampla Concorrência',
            'PPI': 'PPI (Pretos, Pardos e Indígenas)',
            'RENDA': 'Baixa Renda',
            'PUBLICA': 'Escola Pública',
            'DEFICIENTE': 'PcD (Pessoa com Deficiência)',
            'OUTRA': 'Outra'
        };
        return cotas[tipo] || tipo;
    }
    
    // Helper: mostrar erro
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notification notification-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }
    
    // Inicializar a aplicação
    init();
});