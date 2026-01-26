class CalculadoraNotas {
    constructor() {
        this.API_BASE_URL = '/api';
        this.allCourses = [];
        this.filteredCourses = [];
        this.currentVestibular = 'psc';
        this.userNotes = {
            psc: { total: 0 },
            sis: { total: 0 },
            enem: { total: 0 },
            macro: { total: 0 },
            psi: { total: 0 }
        };
        this.filterTimeout = null;
        this.init();
    }

    debounceFilterCourses() {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.filterCourses();
        }, 300); // Aguarda 300ms após a última digitação
    }


    async init() {
        try {
            this.setupEventListeners();
            await this.loadCourses();
            this.updateStats();
            this.updateCalculations();
        } catch (error) {
            console.error('Erro ao inicializar calculadora:', error);
            this.showError('Erro ao carregar a calculadora. Tente novamente.');
        }
    }

    async loadCourses() {
        try {
            console.log('Carregando cursos da API...');

            // Adicionar parâmetros para garantir resposta
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses?limit=50&page=1`);

            if (!response.ok) {
                console.error('Erro HTTP:', response.status, response.statusText);
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Resposta da API:', data);

            if (data.success && data.courses) {
                this.allCourses = data.courses;
                console.log(`${this.allCourses.length} cursos carregados com sucesso`);

                this.populateFilters();
                this.filterCourses();
                this.updateStats();
            } else {
                console.error('API retornou success=false ou courses vazio:', data);
                throw new Error(data.message || 'Dados inválidos retornados pela API');
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            this.showError('Não foi possível carregar os cursos. Verifique sua conexão ou tente novamente mais tarde.');

            // Opcional: limpar interface para indicar erro
            const container = document.getElementById('resultsContainer');
            if (container) {
                container.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Erro ao carregar cursos</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-accent" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Tentar novamente
                    </button>
                </div>
            `;
            }
        }
    }

    populateFilters() {
        // Universidades
        const universidades = [...new Set(this.allCourses.map(c => c.universidade))].sort();
        const universidadeSelect = document.getElementById('universidadeFilter');
        universidades.forEach(uni => {
            const option = document.createElement('option');
            option.value = uni;
            option.textContent = uni;
            universidadeSelect.appendChild(option);
        });

        // Cursos
        const cursos = [...new Set(this.allCourses.map(c => c.curso))].sort();
        const cursoSelect = document.getElementById('cursoFilter');
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            cursoSelect.appendChild(option);
        });

        // Anos
        const anos = [...new Set(this.allCourses.map(c => c.ano))].sort((a, b) => b - a);
        const anoSelect = document.getElementById('anoFilter');
        anos.forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            anoSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Toggle entre vestibulares
        document.querySelectorAll('.toggle-vest').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vestibular = e.target.dataset.vestibular;
                this.switchVestibular(vestibular);
            });
        });

        // Inputs PSC - COM DEBOUNCE
        ['psc1', 'psc2', 'psc3', 'redacaoPsc'].forEach(id => {
            const input = document.getElementById(id);
            input?.addEventListener('input', () => {
                this.calcularPSC();
                this.debounceFilterCourses(); // USE DEBOUNCE
            });
        });

        // Inputs SIS - COM DEBOUNCE
        ['sis1', 'sis2', 'sis3', 'redacaoSis2', 'redacaoSis3'].forEach(id => {
            const input = document.getElementById(id);
            input?.addEventListener('input', () => {
                this.calcularSIS();
                this.debounceFilterCourses(); // USE DEBOUNCE
            });
        });

        // Inputs ENEM - COM DEBOUNCE
        ['enemLinguagens', 'enemHumanas', 'enemNatureza', 'enemMatematica', 'enemRedacao'].forEach(id => {
            const input = document.getElementById(id);
            input?.addEventListener('input', () => {
                this.calcularENEM();
                this.filterCourses(); // ADICIONE ESTA LINHA
            });
        });

        // Inputs MACRO - COM DEBOUNCE
        ['macroCG', 'macroCE', 'macroRedacao'].forEach(id => {
            const input = document.getElementById(id);
            input?.addEventListener('input', () => {
                this.calcularMACRO();
                this.filterCourses(); // ADICIONE ESTA LINHA
            });
        });

        // Input PSI - COM DEBOUNCE
        const psiInput = document.getElementById('psiNotaTotal');
        psiInput?.addEventListener('input', () => {
            this.calcularPSI();
            this.filterCourses(); // ADICIONE ESTA LINHA
        });

        // Botões reset
        document.getElementById('resetPsc')?.addEventListener('click', () => this.resetForm('psc'));
        document.getElementById('resetSis')?.addEventListener('click', () => this.resetForm('sis'));
        document.getElementById('resetEnem')?.addEventListener('click', () => this.resetForm('enem'));
        document.getElementById('resetMacro')?.addEventListener('click', () => this.resetForm('macro'));
        document.getElementById('resetPsi')?.addEventListener('click', () => this.resetForm('psi'));

        // Filtros
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', () => this.filterCourses());
        });

        // Busca
        document.getElementById('searchCourse')?.addEventListener('input', () => this.filterCourses());

        // Ordenação
        document.getElementById('sortSelect')?.addEventListener('change', () => this.filterCourses());

        // Reset filtros
        document.getElementById('resetFilters')?.addEventListener('click', () => {
            document.getElementById('universidadeFilter').value = '';
            document.getElementById('cursoFilter').value = '';
            document.getElementById('cotaFilter').value = '';
            document.getElementById('anoFilter').value = '';
            document.getElementById('searchCourse').value = '';
            this.filterCourses();
        });

        // Modal
        document.getElementById('modalClose')?.addEventListener('click', () => {
            document.getElementById('courseModal').classList.remove('active');
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }
        });

        // Menu mobile
        const menuToggle = document.getElementById('menuToggle');
        const navMobile = document.getElementById('navMobile');
        menuToggle?.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMobile.classList.toggle('active');
        });

        // Header scroll
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            header?.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Fechar modal ao clicar fora
        document.getElementById('courseModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'courseModal') {
                e.target.classList.remove('active');
            }
        });
    }

    switchVestibular(vestibular) {
        this.currentVestibular = vestibular;

        // Atualizar botões ativos
        document.querySelectorAll('.toggle-vest').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.vestibular === vestibular);
        });

        // Atualizar badge
        document.getElementById('vestibularBadge').textContent = vestibular.toUpperCase() + ' 2026';

        // Mostrar formulário correspondente
        document.querySelectorAll('.input-form').forEach(form => {
            form.classList.toggle('hidden', form.id !== `${vestibular}Form`);
        });

        // Atualizar cálculos
        this.updateCalculations();
    }

    updateCalculations() {
        switch (this.currentVestibular) {
            case 'psc':
                this.calcularPSC();
                break;
            case 'sis':
                this.calcularSIS();
                break;
            case 'enem':
                this.calcularENEM();
                break;
            case 'macro':
                this.calcularMACRO();
                break;
            case 'psi':
                this.calcularPSI();
                break;
        }
        // CHAME filterCourses() AQUI TAMBÉM
        this.filterCourses();
    }

    calcularPSC() {
        const psc1 = parseFloat(document.getElementById('psc1').value) || 0;
        const psc2 = parseFloat(document.getElementById('psc2').value) || 0;
        const psc3 = parseFloat(document.getElementById('psc3').value) || 0;
        const redacao = parseFloat(document.getElementById('redacaoPsc').value) || 0;

        // Aplicar pesos
        const psc1Peso = psc1 * 3;
        const psc2Peso = psc2 * 3;
        const psc3Peso = psc3 * 3;
        const redacaoPeso = redacao * 6;
        const total = psc1Peso + psc2Peso + psc3Peso + redacaoPeso;

        // Atualizar display
        document.getElementById('psc1Peso').textContent = psc1Peso.toFixed(3);
        document.getElementById('psc2Peso').textContent = psc2Peso.toFixed(3);
        document.getElementById('psc3Peso').textContent = psc3Peso.toFixed(3);
        document.getElementById('redacaoPscPeso').textContent = redacaoPeso.toFixed(3);
        document.getElementById('pscTotal').textContent = total.toFixed(3);

        // ATUALIZAR NOTA DO USUÁRIO
        this.userNotes.psc.total = total;

        console.log('Nota PSC atualizada:', total); // DEBUG

        return total;
    }

    calcularSIS() {
        const sis1 = parseFloat(document.getElementById('sis1').value) || 0;
        const sis2 = parseFloat(document.getElementById('sis2').value) || 0;
        const sis3 = parseFloat(document.getElementById('sis3').value) || 0;
        const redacao2 = parseFloat(document.getElementById('redacaoSis2').value) || 0;
        const redacao3 = parseFloat(document.getElementById('redacaoSis3').value) || 0;

        // Aplicar pesos (redações × 2)
        const redacao2Peso = redacao2 * 2;
        const redacao3Peso = redacao3 * 2;
        const total = sis1 + sis2 + sis3 + redacao2Peso + redacao3Peso;

        // Atualizar display
        document.getElementById('sis1Nota').textContent = sis1.toFixed(3);
        document.getElementById('sis2Nota').textContent = sis2.toFixed(3);
        document.getElementById('sis3Nota').textContent = sis3.toFixed(3);
        document.getElementById('redacaoSis2Peso').textContent = redacao2Peso.toFixed(3);
        document.getElementById('redacaoSis3Peso').textContent = redacao3Peso.toFixed(3);
        document.getElementById('sisTotal').textContent = total.toFixed(3);

        // ATUALIZAR NOTA DO USUÁRIO
        this.userNotes.sis.total = total;

        console.log('Nota SIS atualizada:', total); // DEBUG

        return total;
    }

    calcularENEM() {
        const ling = parseFloat(document.getElementById('enemLinguagens').value) || 0;
        const hum = parseFloat(document.getElementById('enemHumanas').value) || 0;
        const nat = parseFloat(document.getElementById('enemNatureza').value) || 0;
        const mat = parseFloat(document.getElementById('enemMatematica').value) || 0;
        const red = parseFloat(document.getElementById('enemRedacao').value) || 0;

        const total = (ling + hum + nat + mat + red) / 5;
        document.getElementById('enemTotal').textContent = total.toFixed(3);

        // ATUALIZAR NOTA DO USUÁRIO
        this.userNotes.enem.total = total;

        console.log('Nota ENEM atualizada:', total); // DEBUG

        return total;
    }

    calcularMACRO() {
        const cg = parseInt(document.getElementById('macroCG').value) || 0;
        const ce = parseInt(document.getElementById('macroCE').value) || 0;
        const redacao = parseFloat(document.getElementById('macroRedacao').value) || 0;

        // Cálculos MACRO
        const cgNota = (cg * 100) / 84; // (certas×100)/84
        const cePeso = ce * 2; // peso 2
        const total = (cgNota + cePeso + redacao) / 2;

        // Atualizar display
        document.getElementById('macroCGNota').textContent = cgNota.toFixed(3);
        document.getElementById('macroCEPeso').textContent = cePeso.toFixed(3);
        document.getElementById('macroTotal').textContent = total.toFixed(3);

        // ATUALIZAR NOTA DO USUÁRIO
        this.userNotes.macro.total = total;

        console.log('Nota MACRO atualizada:', total); // DEBUG

        return total;
    }

    calcularPSI() {
        const notaTotal = parseFloat(document.getElementById('psiNotaTotal').value) || 0;
        document.getElementById('psiTotal').textContent = notaTotal.toFixed(3);

        // ATUALIZAR NOTA DO USUÁRIO
        this.userNotes.psi.total = notaTotal;

        console.log('Nota PSI atualizada:', notaTotal); // DEBUG

        return notaTotal;
    }

    resetForm(vestibular) {
        const inputs = {
            psc: ['psc1', 'psc2', 'psc3', 'redacaoPsc'],
            sis: ['sis1', 'sis2', 'sis3', 'redacaoSis2', 'redacaoSis3'],
            enem: ['enemLinguagens', 'enemHumanas', 'enemNatureza', 'enemMatematica', 'enemRedacao'],
            macro: ['macroCG', 'macroCE', 'macroRedacao'],
            psi: ['psiNotaTotal']
        };

        inputs[vestibular]?.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = 0;
        });

        this.updateCalculations();
    }

    filterCourses() {
        const userScore = this.userNotes[this.currentVestibular].total;
        const universidade = document.getElementById('universidadeFilter').value;
        const curso = document.getElementById('cursoFilter').value;
        const cota = document.getElementById('cotaFilter').value;
        const ano = document.getElementById('anoFilter').value;
        const search = document.getElementById('searchCourse').value.toLowerCase();
        const sortBy = document.getElementById('sortSelect').value;

        console.log('=== FILTER COURSES CHAMADO ===');
        console.log('Vestibular atual:', this.currentVestibular);
        console.log('Nota do usuário:', userScore);
        console.log('Total de cursos disponíveis:', this.allCourses.length);

        // Filtrar cursos
        this.filteredCourses = this.allCourses.filter(course => {
            // Filtro por vestibular
            if (course.vestibular.toLowerCase() !== this.currentVestibular) {
                console.log(`Curso ${course.curso} - vestibular não corresponde: ${course.vestibular} !== ${this.currentVestibular}`);
                return false;
            }

            // Filtro por universidade
            if (universidade && course.universidade !== universidade) return false;

            // Filtro por curso
            if (curso && course.curso !== curso) return false;

            // Filtro por cota
            if (cota && !course.cotas?.some(c => c.tipo === cota || c.codigo === cota)) return false;

            // Filtro por ano
            if (ano && course.ano.toString() !== ano.toString()) return false;

            // Filtro por busca
            if (search && !(
                course.curso.toLowerCase().includes(search) ||
                course.universidade.toLowerCase().includes(search) ||
                (course.campus && course.campus.toLowerCase().includes(search))
            )) return false;

            return true;
        });

        console.log('Cursos filtrados:', this.filteredCourses.length);

        // Ordenar
        this.sortCourses(sortBy, userScore);

        // Renderizar resultados
        this.renderResults(userScore);
    }

    sortCourses(sortBy, userScore) {
        switch (sortBy) {
            case 'relevancia':
                this.filteredCourses.sort((a, b) => {
                    // CORREÇÃO: Usar notaTotal ou notaGeral
                    const notaA = a.notaTotal || a.notaGeral || 0;
                    const notaB = b.notaTotal || b.notaGeral || 0;
                    const diffA = Math.abs(userScore - notaA);
                    const diffB = Math.abs(userScore - notaB);
                    return diffA - diffB;
                });
                break;

            case 'nota-asc':
                this.filteredCourses.sort((a, b) => {
                    const notaA = a.notaTotal || a.notaGeral || 0;
                    const notaB = b.notaTotal || b.notaGeral || 0;
                    return notaA - notaB;
                });
                break;

            case 'nota-desc':
                this.filteredCourses.sort((a, b) => {
                    const notaA = a.notaTotal || a.notaGeral || 0;
                    const notaB = b.notaTotal || b.notaGeral || 0;
                    return notaB - notaA;
                });
                break;

            case 'curso-asc':
                this.filteredCourses.sort((a, b) =>
                    a.curso.localeCompare(b.curso)
                );
                break;

            case 'universidade-asc':
                this.filteredCourses.sort((a, b) =>
                    a.universidade.localeCompare(b.universidade)
                );
                break;
        }
    }

    renderResults(userScore) {
        const container = document.getElementById('resultsContainer');
        const countElement = document.getElementById('resultsCount');

        if (!container || !countElement) {
            console.error('Elementos do DOM não encontrados');
            return;
        }

        // Garantir que userScore é um número
        userScore = parseFloat(userScore) || 0;

        if (!this.filteredCourses || this.filteredCourses.length === 0) {
            container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h4>Nenhum curso encontrado</h4>
                <p>Tente ajustar os filtros ou verificar se há cursos cadastrados para este vestibular.</p>
            </div>
        `;
            countElement.textContent = '0 cursos encontrados';
            return;
        }

        countElement.textContent = `${this.filteredCourses.length} cursos encontrados`;
        container.innerHTML = '';

        // Validar cada curso antes de renderizar
        this.filteredCourses.forEach((course, index) => {
            try {
                // Validação básica do curso
                if (!course || typeof course !== 'object') {
                    console.warn(`Curso inválido no índice ${index}`, course);
                    return;
                }

                // Obter nota do curso
                const courseScore = parseFloat(course.notaTotal || course.notaGeral || 0);

                // Calcular diferença
                const diff = userScore - courseScore;
                const diffPercent = courseScore > 0 ? (diff / courseScore) * 100 : 0;

                // Determinar status
                let statusClass = 'fail';
                let statusText = 'Abaixo da nota';

                if (diff >= 0) {
                    statusClass = 'pass';
                    statusText = 'Você passaria!';
                } else if (diffPercent >= -5) {
                    statusClass = 'close';
                    statusText = 'Próximo da nota';
                }

                // Calcular porcentagens para a barra
                const maxScores = {
                    psc: 477,
                    sis: 180,
                    enem: 1000,
                    macro: 100,
                    psi: 1000
                };

                const maxScore = maxScores[this.currentVestibular] || 1000;
                const userPercent = maxScore > 0 ? Math.min((userScore / maxScore) * 100, 100) : 0;
                const coursePercent = maxScore > 0 ? Math.min((courseScore / maxScore) * 100, 100) : 0;

                // Obter cota principal
                let cotaPrincipal = { tipo: 'AMPLA', codigo: 'AMPLA' };
                if (course.cotas && Array.isArray(course.cotas) && course.cotas.length > 0) {
                    cotaPrincipal = course.cotas[0];
                }

                // Criar card do curso
                const courseCard = document.createElement('div');
                courseCard.className = `course-card ${statusClass}`;
                courseCard.dataset.courseId = course._id || index;

                courseCard.innerHTML = `
                <div class="course-header">
                    <div class="course-title">
                        <h4>${course.curso || 'Curso não especificado'}</h4>
                        <div class="course-university">
                            <i class="fas fa-university"></i>
                            <span>${course.universidade || 'Universidade não especificada'} • ${course.campus || 'Campus principal'}</span>
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
                        <strong class="info-value">${course.ano || 'N/A'}</strong>
                    </div>
                    <div class="info-item">
                        <span class="info-label">
                            <i class="fas fa-users"></i>
                            Cota
                        </span>
                        <strong class="info-value">${this.getCotaName(cotaPrincipal.tipo || cotaPrincipal.codigo)}</strong>
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
                        <div class="bar-background"></div>
                        <div class="comparison-fill ${statusClass}" style="width: ${coursePercent}%"></div>
                        <div class="comparison-marker" style="left: ${userPercent}%">
                            <div class="marker-tooltip">Sua nota: ${userScore.toFixed(3)}</div>
                        </div>
                    </div>
                    <div class="comparison-labels">
                        <span>0</span>
                        <span>Nota de corte: ${courseScore.toFixed(3)}</span>
                        <span>${maxScore}</span>
                    </div>
                </div>
            `;

                courseCard.addEventListener('click', () => this.showCourseModal(course, userScore));
                container.appendChild(courseCard);

            } catch (error) {
                console.error(`Erro ao renderizar curso no índice ${index}:`, error, course);
            }
        });
    }

    showCourseModal(course, userScore) {
        const modal = document.getElementById('courseModal');
        const title = document.getElementById('modalCourseTitle');
        const info = document.getElementById('modalCourseInfo');

        // CORREÇÃO: Usar notaTotal ou notaGeral, não course.notas.total
        const courseScore = course.notaTotal || course.notaGeral || 0;
        const diff = userScore - courseScore;

        title.textContent = `${course.curso} - ${course.universidade}`;

        // CORREÇÃO: course.notas pode não existir, usar course.especificacoes ou vazio
        const especificacoes = course.notas || course.especificacoes || {};

        // Preparar detalhes específicos do vestibular
        let detalhesNotas = '';

        switch (this.currentVestibular.toUpperCase()) {
            case 'PSC':
                if (especificacoes.psc) {
                    detalhesNotas = `
                    <div class="scores-grid">
                        <div class="score-item">
                            <span>PSC 1:</span>
                            <strong>${(especificacoes.psc.psc1 || 0).toFixed(3)}</strong>
                        </div>
                        <div class="score-item">
                            <span>PSC 2:</span>
                            <strong>${(especificacoes.psc.psc2 || 0).toFixed(3)}</strong>
                        </div>
                        <div class="score-item">
                            <span>PSC 3:</span>
                            <strong>${(especificacoes.psc.psc3 || 0).toFixed(3)}</strong>
                        </div>
                        <div class="score-item">
                            <span>Redação:</span>
                            <strong>${(especificacoes.psc.redacao || 0).toFixed(3)}</strong>
                        </div>
                    </div>
                `;
                }
                break;

            case 'SIS':
                if (especificacoes.sis) {
                    detalhesNotas = `
                    <div class="scores-grid">
                        <div class="score-item">
                            <span>SIS 1:</span>
                            <strong>${(especificacoes.sis.sis1 || 0).toFixed(3)}</strong>
                        </div>
                        <div class="score-item">
                            <span>SIS 2:</span>
                            <strong>${(especificacoes.sis.sis2 || 0).toFixed(3)}</strong>
                        </div>
                        <div class="score-item">
                            <span>SIS 3:</span>
                            <strong>${(especificacoes.sis.sis3 || 0).toFixed(3)}</strong>
                        </div>
                        <div class="score-item">
                            <span>Redação SIS 2:</span>
                            <strong>${(especificacoes.sis.redacaoSis2 || 0).toFixed(3)}</strong>
                        </div>
                        <div class="score-item">
                            <span>Redação SIS 3:</span>
                            <strong>${(especificacoes.sis.redacaoSis3 || 0).toFixed(3)}</strong>
                        </div>
                    </div>
                `;
                }
                break;
        }

        // CORREÇÃO: course.cota.tipo → usar a primeira cota do array course.cotas
        const cotaPrincipal = course.cotas && course.cotas.length > 0 ? course.cotas[0] : {
            tipo: 'AMPLA',
            descricao: 'Ampla Concorrência'
        };

        // CORREÇÃO: course.notas?.vagas → course.totalVagas
        // CORREÇÃO: course.notas?.colocacao → verificar em cada cota
        let colocacaoInfo = '';
        if (course.cotas && course.cotas.length > 0) {
            // Verificar se alguma cota tem colocação
            const cotaComColocacao = course.cotas.find(c => c.colocacao);
            if (cotaComColocacao) {
                colocacaoInfo = `
                <div class="detail-item">
                    <span class="detail-label">Colocação do último:</span>
                    <strong class="detail-value">${cotaComColocacao.colocacao}º lugar</strong>
                </div>
            `;
            }
        }

        // CORREÇÃO: Adicionar tabela de cotas se houver múltiplas
        let tabelaCotas = '';
        if (course.cotas && course.cotas.length > 1) {
            tabelaCotas = `
            <div class="modal-cotas">
                <h4>Todas as Cotas Disponíveis</h4>
                <table class="cotas-table">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Descrição</th>
                            <th>Nota de Corte</th>
                            <th>Vagas</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${course.cotas.map(cota => `
                            <tr>
                                <td><strong>${cota.codigo || cota.tipo || 'AMPLA'}</strong></td>
                                <td>${cota.descricao || '-'}</td>
                                <td>${cota.notaCorte ? cota.notaCorte.toFixed(3) : '-'}</td>
                                <td>${cota.vagas || '-'}</td>
                                <td>${cota.preenchida ? 'Preenchida' : 'Disponível'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        }

        info.innerHTML = `
        <div class="modal-course-header">
            <h4>Informações Detalhadas</h4>
            <p>${course.campus || 'Campus principal'} • ${course.ano} • ${course.vestibular}</p>
        </div>
        
        <div class="modal-course-details">
            <div class="detail-item">
                <span class="detail-label">Universidade:</span>
                <strong class="detail-value">${course.universidade}</strong>
            </div>
            <div class="detail-item">
                <span class="detail-label">Campus:</span>
                <strong class="detail-value">${course.campus || 'Principal'}</strong>
            </div>
            <div class="detail-item">
                <span class="detail-label">Modalidade:</span>
                <strong class="detail-value">${this.getCotaName(cotaPrincipal.tipo)}</strong>
                ${cotaPrincipal.descricao ? `<p class="detail-desc">${cotaPrincipal.descricao}</p>` : ''}
            </div>
            <div class="detail-item">
                <span class="detail-label">Período:</span>
                <strong class="detail-value">${course.periodo || 'Não informado'}</strong>
            </div>
            ${course.totalVagas ? `
            <div class="detail-item">
                <span class="detail-label">Vagas Totais:</span>
                <strong class="detail-value">${course.totalVagas}</strong>
            </div>
            ` : ''}
            ${colocacaoInfo}
        </div>
        
        ${tabelaCotas}
        
        ${detalhesNotas ? `
        <div class="modal-course-scores">
            <h4>Notas de Corte Detalhadas</h4>
            ${detalhesNotas}
        </div>
        ` : ''}
        
        <div class="modal-course-comparison">
            <h4>Comparação com sua nota</h4>
            <div class="comparison-result ${diff >= 0 ? 'positive' : 'negative'}">
                <i class="fas fa-${diff >= 0 ? 'check-circle' : 'times-circle'}"></i>
                <div>
                    <strong>Sua nota: ${userScore.toFixed(3)}</strong>
                    <span>Nota de corte: ${courseScore.toFixed(3)}</span>
                    <span class="diff">${diff >= 0 ? '+' : ''}${diff.toFixed(3)} pontos ${diff >= 0 ? 'acima' : 'abaixo'}</span>
                </div>
            </div>
        </div>
    `;

        modal.classList.add('active');
    }

    updateStats() {
        const totalCursos = this.allCourses.length;
        const totalUniversidades = new Set(this.allCourses.map(c => c.universidade)).size;

        document.getElementById('totalCursos').textContent = totalCursos;
        document.getElementById('totalUniversidades').textContent = totalUniversidades;
    }

    getCotaName(tipo) {
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

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notification notification-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
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

        // Botão para fechar
        errorDiv.querySelector('.notification-close').addEventListener('click', () => {
            errorDiv.remove();
        });

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }
}

class SistemaCotas {
    constructor(calculadora) {
        this.calculadora = calculadora;
        this.cotaSelecionada = null;
        this.gruposSelecionados = new Set();
        this.modoComparacao = false;

        // Mapeamento completo de descrições
        this.DESCRICOES_COTA = {
            // PSC/PSI
            'AMPLA': 'Ampla Concorrência',
            'PP1': 'EP + Pretos/Pardos c/ renda',
            'PP2': 'EP + Pretos/Pardos s/ renda',
            'IND1': 'EP + Indígenas c/ renda',
            'IND2': 'EP + Indígenas s/ renda',
            'QLB1': 'EP + Quilombolas c/ renda',
            'QLB2': 'EP + Quilombolas s/ renda',
            'NDC1': 'Escola Pública (EP) c/ renda',
            'NDC2': 'Escola Pública (EP) s/ renda',
            'PCD1': 'EP + PcD c/ renda',
            'PCD2': 'EP + PcD s/ renda',
            'BONIFICA': 'Bonificação',
            'INTERIOR': 'Estudante do Interior (20% bônus)',

            // ENEM/SISU
            'L1': 'L1 - Renda ≤ 1SM + EP',
            'L2': 'L2 - PPI c/ renda + EP',
            'L5': 'L5 - Qualquer renda + EP',
            'L6': 'L6 - PPI qualquer renda + EP',
            'L9': 'L9 - PcD c/ renda + EP',
            'L10': 'L10 - PcD + PPI c/ renda + EP',
            'L13': 'L13 - PcD qualquer renda + EP',
            'L14': 'L14 - PcD + PPI qualquer renda + EP',

            // SIS UEA
            'A': 'A - EP Geral Brasil',
            'B': 'B - Geral Brasil',
            'C': 'C - PCD Geral Brasil',
            'D': 'D - Pretos Geral Brasil',
            'E': 'E - Indígenas Geral Brasil',
            'F': 'F - EP Reserva Amazonas',
            'G': 'G - Geral Reserva Amazonas',
            'H': 'H - PCD Reserva Amazonas',
            'I': 'I - Pretos Reserva Amazonas',
            'J': 'J - Indígenas Reserva Amazonas',
            'K': 'K - Interior Amazonas',

            // MACRO UEA
            'G1': 'G1 - EP',
            'G2': 'G2 - Qualquer natureza',
            'G3': 'G3 - Portadores de diploma',
            'G4': 'G4 - PCD',
            'G5': 'G5 - Pretos',
            'G6': 'G6 - Indígenas',
            'G7': 'G7 - EP Amazonas',
            'G8': 'G8 - Qualquer natureza Amazonas',
            'G9': 'G9 - PCD Amazonas',
            'G10': 'G10 - Pretos Amazonas',
            'G11': 'G11 - Indígenas Amazonas',
            'G12': 'G12 - Interior Amazonas'
        };

        // Grupos lógicos de cotas
        this.GRUPOS_COTAS = {
            'ESCOLA_PUBLICA': {
                nome: 'Escola Pública',
                cotas: ['NDC1', 'NDC2', 'L1', 'L5', 'A', 'F', 'G1', 'G7'],
                vestibulares: ['PSC', 'ENEM', 'SIS', 'MACRO']
            },
            'PPI': {
                nome: 'Pretos, Pardos e Indígenas',
                cotas: ['PP1', 'PP2', 'IND1', 'IND2', 'QLB1', 'QLB2', 'L2', 'L6', 'D', 'I', 'G5', 'G10'],
                vestibulares: ['PSC', 'ENEM', 'SIS', 'MACRO']
            },
            'PCD': {
                nome: 'Pessoas com Deficiência',
                cotas: ['PCD1', 'PCD2', 'L9', 'L10', 'L13', 'L14', 'C', 'H', 'G4', 'G9'],
                vestibulares: ['PSC', 'ENEM', 'SIS', 'MACRO']
            },
            'INTERIOR': {
                nome: 'Estudantes do Interior',
                cotas: ['INTERIOR', 'K', 'G12'],
                vestibulares: ['PSI', 'SIS', 'MACRO']
            },
            'RENDA': {
                nome: 'Com Critério de Renda',
                cotas: ['PP1', 'IND1', 'QLB1', 'NDC1', 'PCD1', 'L1', 'L2', 'L9', 'L10'],
                vestibulares: ['PSC', 'ENEM']
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.carregarCotasVestibular();
    }

    setupEventListeners() {
        // Sistema de cota
        document.getElementById('sistemaCotaFilter')?.addEventListener('change', (e) => {
            this.handleSistemaCotaChange(e.target.value);
        });

        // Modo comparação
        document.getElementById('modoComparacao')?.addEventListener('change', (e) => {
            this.modoComparacao = e.target.checked;
            this.calculadora.filterCourses();
        });

        // Filtro por tipo de cota
        document.getElementById('tipoCotaFilter')?.addEventListener('change', (e) => {
            this.cotaSelecionada = e.target.value;
            this.calculadora.filterCourses();
        });

        // Bônus interior
        document.getElementById('bonusInterior')?.addEventListener('change', (e) => {
            if (e.target.checked && this.calculadora.currentVestibular === 'psi') {
                // Aplica bônus de 20% na nota do usuário
                const notaAtual = this.calculadora.userNotes.psi.total;
                const notaComBonus = notaAtual * 1.2;
                document.getElementById('psiTotal').textContent = notaComBonus.toFixed(3);
                this.calculadora.userNotes.psi.total = notaComBonus;
                this.calculadora.filterCourses();
            }
        });

        // Status vagas
        document.getElementById('statusVagasFilter')?.addEventListener('change', () => {
            this.calculadora.filterCourses();
        });
    }

    handleSistemaCotaChange(sistema) {
        const gruposContainer = document.getElementById('cotaGroupsContainer');
        const especificaContainer = document.getElementById('cotaEspecificaContainer');

        gruposContainer.classList.add('hidden');
        especificaContainer.classList.add('hidden');

        switch (sistema) {
            case 'GRUPOS':
                gruposContainer.classList.remove('hidden');
                this.renderGruposCotas();
                break;
            case 'ESPECIFICAS':
                especificaContainer.classList.remove('hidden');
                this.carregarCotasVestibular();
                break;
        }

        this.calculadora.filterCourses();
    }

    carregarCotasVestibular() {
        const vestibular = this.calculadora.currentVestibular.toUpperCase();
        const select = document.getElementById('tipoCotaFilter');
        const bonusFilter = document.querySelector('.bonus-filter');

        // Limpar opções
        select.innerHTML = '<option value="">Selecione uma cota</option>';

        // Cotas disponíveis para este vestibular
        const cotasDisponiveis = this.getCotasPorVestibular(vestibular);

        // Adicionar opções
        cotasDisponiveis.forEach(cota => {
            const option = document.createElement('option');
            option.value = cota;
            option.textContent = `${cota} - ${this.DESCRICOES_COTA[cota] || cota}`;
            select.appendChild(option);
        });

        // Mostrar/ocultar filtro de bônus
        if (vestibular === 'PSI') {
            bonusFilter.classList.remove('hidden');
        } else {
            bonusFilter.classList.add('hidden');
        }
    }

    getCotasPorVestibular(vestibular) {
        switch (vestibular) {
            case 'PSC':
                return ['AMPLA', 'PP1', 'PP2', 'IND1', 'IND2', 'QLB1', 'QLB2', 'NDC1', 'NDC2', 'PCD1', 'PCD2'];
            case 'ENEM':
                return ['AMPLA', 'L1', 'L2', 'L5', 'L6', 'L9', 'L10', 'L13', 'L14'];
            case 'SIS':
                return ['AMPLA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
            case 'MACRO':
                return ['AMPLA', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'];
            case 'PSI':
                return ['AMPLA', 'PP1', 'PP2', 'IND1', 'IND2', 'QLB1', 'QLB2', 'NDC1', 'NDC2', 'PCD1', 'PCD2', 'INTERIOR'];
            default:
                return ['AMPLA'];
        }
    }

    renderGruposCotas() {
        const container = document.getElementById('cotaGroupsContainer');
        const vestibular = this.calculadora.currentVestibular.toUpperCase();

        container.innerHTML = '';

        // Criar checkboxes para cada grupo disponível neste vestibular
        Object.entries(this.GRUPOS_COTAS).forEach(([key, grupo]) => {
            if (grupo.vestibulares.includes(vestibular)) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'filter-group';

                groupDiv.innerHTML = `
                    <label class="checkbox-label grupo-cota-label">
                        <input type="checkbox" class="grupo-cota-checkbox" 
                               data-grupo="${key}" 
                               data-cotas="${grupo.cotas.join(',')}">
                        <span><strong>${grupo.nome}</strong></span>
                    </label>
                    <div class="cota-detalhes">
                        ${grupo.cotas.map(cota =>
                    `<span class="cota-tag" title="${this.DESCRICOES_COTA[cota] || cota}">${cota}</span>`
                ).join('')}
                    </div>
                `;

                container.appendChild(groupDiv);
            }
        });

        // Adicionar eventos aos checkboxes
        container.querySelectorAll('.grupo-cota-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const grupo = e.target.dataset.grupo;
                const cotas = e.target.dataset.cotas.split(',');

                if (e.target.checked) {
                    cotas.forEach(cota => this.gruposSelecionados.add(cota));
                } else {
                    cotas.forEach(cota => this.gruposSelecionados.delete(cota));
                }

                this.calculadora.filterCourses();
            });
        });
    }

    // Método para filtrar cursos com base nas cotas
    filtrarPorCotas(cursos) {
        const sistema = document.getElementById('sistemaCotaFilter').value;

        if (sistema === 'TODAS') {
            return cursos;
        }

        if (sistema === 'AMPLA') {
            return cursos.filter(curso =>
                curso.cotas?.some(c => c.tipo === 'AMPLA' || c.codigo === 'AMPLA')
            );
        }

        if (sistema === 'GRUPOS' && this.gruposSelecionados.size > 0) {
            return cursos.filter(curso =>
                curso.cotas?.some(cota =>
                    this.gruposSelecionados.has(cota.tipo) ||
                    this.gruposSelecionados.has(cota.codigo)
                )
            );
        }

        if (sistema === 'ESPECIFICAS' && this.cotaSelecionada) {
            return cursos.filter(curso =>
                curso.cotas?.some(cota =>
                    cota.tipo === this.cotaSelecionada ||
                    cota.codigo === this.cotaSelecionada
                )
            );
        }

        return cursos;
    }

    // Método para filtrar por status das vagas
    filtrarPorStatusVagas(cursos) {
        const status = document.getElementById('statusVagasFilter').value;

        if (!status) return cursos;

        return cursos.filter(curso => {
            if (!curso.cotas) return false;

            switch (status) {
                case 'preenchidas':
                    return curso.cotas.some(c => c.preenchida === true);
                case 'disponiveis':
                    return curso.cotas.some(c =>
                        (c.vagas && c.vagas > 0) ||
                        (c.preenchida === false)
                    );
                case 'migradas':
                    return curso.cotas.some(c =>
                        c.observacoes?.toLowerCase().includes('migra') ||
                        c.observacoes?.toLowerCase().includes('redistribui')
                    );
                default:
                    return true;
            }
        });
    }

    // Método para renderizar cursos com múltiplas cotas (modo comparação)
    renderCursoComCotas(curso, userScore) {
        if (!this.modoComparacao || !curso.cotas || curso.cotas.length <= 1) {
            return this.renderCursoPadrao(curso, userScore);
        }

        // Ordenar cotas por nota de corte
        const cotasOrdenadas = [...curso.cotas].sort((a, b) => a.notaCorte - b.notaCorte);

        const container = document.createElement('div');
        container.className = 'curso-multiplas-cotas';

        // Cabeçalho do curso
        container.innerHTML = `
            <div class="curso-header-multiplo">
                <div class="curso-titulo-multiplo">
                    <h4>${curso.curso}</h4>
                    <div class="curso-universidade">
                        <i class="fas fa-university"></i>
                        <span>${curso.universidade} • ${curso.campus || 'Campus principal'}</span>
                    </div>
                </div>
                <div class="curso-info-geral">
                    <span class="info-geral-item">
                        <i class="fas fa-calendar"></i> ${curso.ano}
                    </span>
                    <span class="info-geral-item">
                        <i class="fas fa-door-open"></i> ${curso.totalVagas || '--'} vagas
                    </span>
                </div>
            </div>
            <div class="cotas-container">
                ${cotasOrdenadas.map(cota => this.renderCotaItem(cota, userScore)).join('')}
            </div>
        `;

        return container;
    }

    renderCotaItem(cota, userScore) {
        const diff = userScore - cota.notaCorte;
        const diffPercent = (diff / cota.notaCorte) * 100;

        let statusClass = 'fail';
        if (diff >= 0) {
            statusClass = 'pass';
        } else if (diffPercent >= -5) {
            statusClass = 'close';
        }

        // Aplicar bônus se necessário
        let notaFinal = cota.notaCorte;
        let bonusInfo = '';
        if (cota.percentualBonus && cota.percentualBonus > 0) {
            notaFinal = cota.notaCorte * (1 - cota.percentualBonus / 100);
            bonusInfo = `<span class="bonus-tag">-${cota.percentualBonus}%</span>`;
        }

        return `
            <div class="cota-item ${statusClass}">
                <div class="cota-header">
                    <div class="cota-tipo">
                        <strong>${cota.codigo || cota.tipo}</strong>
                        ${bonusInfo}
                    </div>
                    <div class="cota-status ${statusClass}">
                        ${this.getStatusText(diff)}
                    </div>
                </div>
                <div class="cota-descricao">
                    ${this.DESCRICOES_COTA[cota.codigo || cota.tipo] || cota.descricao}
                </div>
                <div class="cota-detalhes">
                    <div class="cota-nota">
                        <span>Nota de corte:</span>
                        <strong>${notaFinal.toFixed(3)}</strong>
                    </div>
                    <div class="cota-vagas">
                        <span>Vagas:</span>
                        <strong>${cota.vagas || '--'}</strong>
                    </div>
                    ${cota.colocacao ? `
                    <div class="cota-colocacao">
                        <span>Último classificado:</span>
                        <strong>${cota.colocacao}º</strong>
                    </div>
                    ` : ''}
                </div>
                <div class="cota-comparacao">
                    <div class="comparacao-bar">
                        <div class="comparacao-fill ${statusClass}" 
                             style="width: ${Math.min((notaFinal / 1000) * 100, 100)}%"></div>
                        <div class="comparacao-marker" 
                             style="left: ${Math.min((userScore / 1000) * 100, 100)}%">
                            <div class="marker-tooltip">Sua nota: ${userScore.toFixed(3)}</div>
                        </div>
                    </div>
                    <div class="comparacao-diff ${diff >= 0 ? 'positive' : 'negative'}">
                        ${diff >= 0 ? '+' : ''}${diff.toFixed(3)} 
                        (${diff >= 0 ? '+' : ''}${diffPercent.toFixed(1)}%)
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(diff) {
        if (diff >= 0) return 'Você passaria!';
        if (diff >= -0.05) return 'Muito próximo';
        return 'Abaixo da nota';
    }

    // Método para integrar com a Calculadora principal
    integrarComCalculadora() {
        const originalFilter = this.calculadora.filterCourses.bind(this.calculadora);

        // Sobrescrever o método filterCourses
        this.calculadora.filterCourses = () => {
            // Chamar filtro original
            originalFilter();

            // Aplicar filtros de cotas
            this.aplicarFiltrosCotas();
        };

        // Atualizar quando mudar vestibular
        const originalSwitch = this.calculadora.switchVestibular.bind(this.calculadora);
        this.calculadora.switchVestibular = (vestibular) => {
            originalSwitch(vestibular);
            this.carregarCotasVestibular();
        };
    }

    aplicarFiltrosCotas() {
        const cursos = this.calculadora.filteredCourses;

        // Aplicar filtros de cotas
        let cursosFiltrados = this.filtrarPorCotas(cursos);
        cursosFiltrados = this.filtrarPorStatusVagas(cursosFiltrados);

        // Atualizar renderização se estiver no modo comparação
        if (this.modoComparacao) {
            this.renderCursosComCotas(cursosFiltrados);
        }

        this.calculadora.filteredCourses = cursosFiltrados;
    }

    renderCursosComCotas(cursos) {
        const container = document.getElementById('resultsContainer');
        const userScore = this.calculadora.userNotes[this.calculadora.currentVestibular].total;

        container.innerHTML = '';

        cursos.forEach(curso => {
            const cursoElement = this.renderCursoComCotas(curso, userScore);
            container.appendChild(cursoElement);
        });
    }
}

let calculadora;

document.addEventListener('DOMContentLoaded', () => {
    calculadora = new CalculadoraNotas();
    const sistemaCotas = new SistemaCotas(calculadora);
    sistemaCotas.integrarComCalculadora();
});

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
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.2em;
        margin-left: 10px;
    }
    
    .hidden {
        display: none !important;
    }
    
    .modal.active {
        display: flex;
    }
    
    .marker-tooltip {
        position: absolute;
        bottom: 25px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .comparison-marker:hover .marker-tooltip {
        opacity: 1;
    }
    
    .comparison-result.positive {
        background: #d4edda;
        color: #155724;
        border-left: 4px solid #28a745;
    }
    
    .comparison-result.negative {
        background: #f8d7da;
        color: #721c24;
        border-left: 4px solid #dc3545;
    }
    
    .comparison-result {
        padding: 15px;
        border-radius: 8px;
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .comparison-result .diff {
        font-size: 0.9em;
        opacity: 0.8;
    }
`;
document.head.appendChild(style);