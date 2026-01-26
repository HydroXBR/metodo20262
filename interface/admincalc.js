// admin-calc.js - Sistema Admin Completo
class AdminCalculadora {
    constructor() {
        this.API_BASE_URL = '/api';
        this.cursos = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.cotaSelecionada = null;
        this.cotaData = this.carregarDadosCotas();
        this.isAddingCota = false; // Flag para prevenir múltiplos cliques
        this.currentVestibular = 'PSC'; // Vestibular atual

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.carregarDadosIniciais();
        this.configurarSistemaCotas();
        this.atualizarEstatisticas();
    }

    // Dados das cotas por vestibular
    carregarDadosCotas() {
        return {
            DESCRICOES_COTA: {
                // PSC/PSI
                'AMPLA': 'Ampla Concorrência',
                'PP1': 'EP + Pretos/Pardos com renda',
                'PP2': 'EP + Pretos/Pardos sem renda',
                'IND1': 'EP + Indígenas com renda',
                'IND2': 'EP + Indígenas sem renda',
                'QLB1': 'EP + Quilombolas com renda',
                'QLB2': 'EP + Quilombolas sem renda',
                'NDC1': 'Escola Pública com renda',
                'NDC2': 'Escola Pública sem renda',
                'PCD1': 'EP + PcD com renda',
                'PCD2': 'EP + PcD sem renda',
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
                'A': 'A - Escola Pública (Geral Brasil)',
                'B': 'B - Escola Qualquer Natureza (Geral Brasil)',
                'C': 'C - Pessoas com Deficiência (Geral Brasil)',
                'D': 'D - Pessoas Pretas (Geral Brasil)',
                'E': 'E - Pessoas Indígenas (Geral Brasil)',
                'F': 'F - Escola Pública (Reserva Amazonas)',
                'G': 'G - Escola Qualquer Natureza (Reserva Amazonas)',
                'H': 'H - PCD (Reserva Amazonas)',
                'I': 'I - Pessoas Pretas (Reserva Amazonas)',
                'J': 'J - Pessoas Indígenas (Reserva Amazonas)',
                'K': 'K - Estudantes do Interior (Amazonas)',

                // MACRO UEA
                'G1': 'G1 - Estudantes de Escola Pública',
                'G2': 'G2 - Estudantes de Qualquer Natureza',
                'G3': 'G3 - Portadores de Diploma',
                'G4': 'G4 - Pessoas com Deficiência',
                'G5': 'G5 - Pessoas Pretas',
                'G6': 'G6 - Pessoas Indígenas',
                'G7': 'G7 - EP no Amazonas',
                'G8': 'G8 - Qualquer Natureza no Amazonas',
                'G9': 'G9 - PCD no Amazonas',
                'G10': 'G10 - Pretas no Amazonas',
                'G11': 'G11 - Indígenas no Amazonas',
                'G12': 'G12 - Interior do Amazonas'
            },

            TIPOS_POR_VESTIBULAR: {
                'PSC': ['AMPLA', 'PP1', 'PP2', 'IND1', 'IND2', 'QLB1', 'QLB2', 'NDC1', 'NDC2', 'PCD1', 'PCD2'],
                'ENEM': ['AMPLA', 'L1', 'L2', 'L5', 'L6', 'L9', 'L10', 'L13', 'L14'],
                'SIS': ['AMPLA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
                'MACRO': ['AMPLA', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
                'PSI': ['AMPLA', 'PP1', 'PP2', 'IND1', 'IND2', 'QLB1', 'QLB2', 'NDC1', 'NDC2', 'PCD1', 'PCD2', 'INTERIOR']
            }
        };
    }

    setupEventListeners() {
        // Navegação entre abas
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });

        document.getElementById('vestibular')?.addEventListener('change', (e) => {
            this.currentVestibular = e.target.value;
            
            // Atualizar opções de bônus para PSI
            this.atualizarCamposBonus(this.currentVestibular);
        });

        // Formulário de adicionar curso
        document.getElementById('formAdicionarCurso')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarCurso();
        });

        // Botão adicionar cota - Configurar apenas uma vez
        document.getElementById('adicionarCota').addEventListener('click', () => {
            this.handleAdicionarCota();
        });

        // Botão visualizar
        document.getElementById('previewCurso')?.addEventListener('click', () => {
            this.visualizarCurso();
        });

        // Filtros de gerenciamento
        document.querySelectorAll('#gerenciarContent select, #gerenciarContent input').forEach(element => {
            element.addEventListener('change', () => this.carregarCursos());
        });

        document.getElementById('limparFiltros')?.addEventListener('click', () => {
            this.limparFiltros();
        });

        // Botões de ação
        document.getElementById('salvarDescricao')?.addEventListener('click', () => {
            this.salvarDescricaoCota();
        });

        // Importação CSV
        document.getElementById('downloadTemplate')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadTemplateCSV();
        });

        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        document.getElementById('processImport')?.addEventListener('click', () => {
            this.processarImportacao();
        });

        // Drag & drop para CSV
        const uploadArea = document.getElementById('uploadArea');
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        // Modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        document.getElementById('confirmCancel')?.addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('active');
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('adminToken');
                window.location.href = '/login.html';
            }
        });
    }

    switchTab(tabId) {
        // Atualizar botões ativos
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Atualizar conteúdo ativo
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Content`);
        });

        // Carregar dados específicos da aba
        switch (tabId) {
            case 'gerenciar':
                this.carregarCursos();
                break;
            case 'cotas':
                this.carregarConfigCotas();
                break;
            case 'importar':
                this.prepararImportacao();
                break;
        }
    }

    async carregarDadosIniciais() {
        try {
            // Carregar universidades
            const resUni = await fetch(`${this.API_BASE_URL}/calculator/universidades`);
            const dataUni = await resUni.json();

            if (dataUni.success) {
                const select = document.getElementById('filtroUniversidade');
                dataUni.universidades.forEach(uni => {
                    const option = document.createElement('option');
                    option.value = uni;
                    option.textContent = uni;
                    select.appendChild(option);
                });
            }

            // Carregar anos
            const resAnos = await fetch(`${this.API_BASE_URL}/calculator/anios`);
            const dataAnos = await resAnos.json();

            if (dataAnos.success) {
                const select = document.getElementById('filtroAno');
                dataAnos.anos.forEach(ano => {
                    const option = document.createElement('option');
                    option.value = ano;
                    option.textContent = ano;
                    select.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showNotification('Erro ao carregar dados', 'error');
        }
    }

    atualizarEstatisticas() {
        // Aqui você implementaria a busca de estatísticas
        document.getElementById('totalCursosAdmin').textContent = '0';
        document.getElementById('vestibularesAtivos').textContent = '5';
    }

    // ========== ABA ADICIONAR CURSO ==========

    configurarSistemaCotas() {
        // Inicializar com PSC
        this.currentVestibular = 'PSC';

        // Verificar se já há cotas (pode ser que o usuário já tenha adicionado manualmente)
        const container = document.getElementById('cotasContainer');
        const cotasExistentes = container.querySelectorAll('.cota-item-form');

        // Se não houver cotas, adicionar AMPLA automaticamente
        if (cotasExistentes.length === 0) {
            this.adicionarCampoCota('AMPLA', 'Ampla Concorrência', this.currentVestibular);
        }

        // Configurar o vestibular inicial no select
        const selectVestibular = document.getElementById('vestibular');
        if (selectVestibular) {
            selectVestibular.value = this.currentVestibular;
        }
    }

    handleAdicionarCota() {
        // Prevenir múltiplos cliques rápidos
        if (this.isAddingCota) return;
        
        this.isAddingCota = true;
        
        try {
            const vestibular = this.getVestibularAtual();
            const tiposCota = this.cotaData.TIPOS_POR_VESTIBULAR[vestibular] || ['AMPLA'];
            
            const container = document.getElementById('cotasContainer');
            const tiposDisponiveis = this.filtrarTiposCotaDisponiveis(tiposCota, container);

            if (tiposDisponiveis.length === 0) {
                this.showNotification('Todas as cotas disponíveis já foram adicionadas', 'info');
                return;
            }

            this.mostrarSelecionarCota(tiposDisponiveis, vestibular);
        } finally {
            // Resetar flag após um pequeno delay
            setTimeout(() => {
                this.isAddingCota = false;
            }, 300);
        }
    }

    atualizarCamposBonus(vestibular) {
        const container = document.getElementById('cotasContainer');
        const camposBonus = container.querySelectorAll('input[id$="_bonus"]');

        camposBonus.forEach(campo => {
            const campoContainer = campo.closest('.form-group');
            if (campoContainer) {
                campoContainer.style.display = vestibular === 'PSI' ? 'block' : 'none';
            }
        });
    }

    // Filtrar tipos de cota já adicionados
    filtrarTiposCotaDisponiveis(tiposCota, container) {
        // Coletar tipos já adicionados
        const tiposAdicionados = new Set();

        container.querySelectorAll('.cota-item-form').forEach(cota => {
            const tipoInput = cota.querySelector('input[id$="_tipo"]');
            if (tipoInput && tipoInput.value) {
                tiposAdicionados.add(tipoInput.value);
            }
        });

        // Filtrar tipos que ainda não foram adicionados
        return tiposCota.filter(tipo => !tiposAdicionados.has(tipo));
    }

    mostrarSelecionarCota(tiposCota, vestibular) {
        // Verificar se o modal já está aberto
        const modal = document.getElementById('cursoModal');
        if (modal && modal.classList.contains('active')) {
            return; // Modal já está aberto
        }

        const modalContent = `
            <div class="modal-select-cota">
                <h4>Selecione o tipo de cota</h4>
                <p class="modal-help">Uma nova cota será criada com o tipo selecionado</p>
                <div class="cota-options">
                    ${tiposCota.map(tipo => `
                        <button class="cota-option" data-tipo="${tipo}" type="button">
                            <strong>${tipo}</strong>
                            <span>${this.cotaData.DESCRICOES_COTA[tipo] || tipo}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="modal-actions" style="margin-top: 20px; text-align: center;">
                    <button type="button" class="btn btn-secondary modal-close" style="padding: 10px 20px;">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        this.showModal('Selecionar Cota', modalContent, () => {
            // Adicionar eventos aos botões
            document.querySelectorAll('.cota-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tipo = e.currentTarget.dataset.tipo;
                    const descricao = this.cotaData.DESCRICOES_COTA[tipo] || tipo;
                    
                    // Fechar modal
                    document.getElementById('cursoModal').classList.remove('active');
                    
                    // Adicionar cota após um pequeno delay
                    setTimeout(() => {
                        this.adicionarCampoCota(tipo, descricao, vestibular, true);
                    }, 100);
                });
            });

            // Botão cancelar no modal
            document.querySelector('.modal-select-cota .modal-close')?.addEventListener('click', () => {
                document.getElementById('cursoModal').classList.remove('active');
            });
        });
    }

    adicionarCampoCota(tipo = '', descricao = '', vestibular = '', isFromModal = false) {
        const container = document.getElementById('cotasContainer');

        // Se estiver vindo do modal (seleção de cota pré-definida)
        if (isFromModal && tipo) {
            // Procurar cota vazia para substituir
            let cotaVaziaEncontrada = false;

            container.querySelectorAll('.cota-item-form').forEach(cotaElement => {
                const tipoInput = cotaElement.querySelector('input[id$="_tipo"]');
                const tipoValue = tipoInput ? tipoInput.value : '';

                // Se encontrou cota vazia (sem tipo ou tipo vazio)
                if (!tipoValue || tipoValue.trim() === '') {
                    this.substituirCotaVazia(cotaElement.id, tipo, descricao, vestibular);
                    cotaVaziaEncontrada = true;
                }
            });

            // Se encontrou cota vazia e substituiu, não criar nova
            if (cotaVaziaEncontrada) {
                return;
            }
        }

        // Se não encontrou cota vazia ou não está vindo do modal, criar nova
        this.criarNovaCota(container, tipo, descricao, vestibular);
    }

    // Nova função para substituir cota vazia
    substituirCotaVazia(cotaId, tipo, descricao, vestibular) {
        // Atualizar todos os campos da cota
        const inputs = [
            { id: `${cotaId}_tipo`, value: tipo },
            { id: `${cotaId}_codigo`, value: tipo },
            { id: `${cotaId}_descricao`, value: descricao }
        ];

        inputs.forEach(input => {
            const element = document.getElementById(input.id);
            if (element) {
                element.value = input.value;
            }
        });

        // Atualizar cabeçalho
        const header = document.querySelector(`#${cotaId} .cota-item-header h5`);
        if (header) {
            header.textContent = descricao || tipo;
        }

        // Adicionar classe para indicar que não está mais vazia
        const cotaElement = document.getElementById(cotaId);
        if (cotaElement) {
            cotaElement.classList.remove('vazia');
            cotaElement.classList.add('preenchida');
        }

        // Remover aviso se existir
        const aviso = cotaElement.querySelector('.cota-aviso');
        if (aviso) {
            aviso.remove();
        }
    }

    criarNovaCota(container, tipo, descricao, vestibular) {
        const cotaId = `cota_${Date.now()}`;
        const temTipo = tipo && tipo.trim() !== '';

        const cotaHTML = `
            <div class="cota-item-form ${!temTipo ? 'vazia' : 'preenchida'}" id="${cotaId}">
                <div class="cota-item-header">
                    <h5>${descricao || (temTipo ? tipo : 'Nova Cota')}</h5>
                    <button type="button" class="btn-remove-cota" onclick="admin.removeCota('${cotaId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="form-group">
                    <label for="${cotaId}_tipo">Tipo de Cota</label>
                    <input type="text" id="${cotaId}_tipo" value="${tipo}" readonly>
                </div>
                
                <div class="form-group">
                    <label for="${cotaId}_codigo">Código</label>
                    <input type="text" id="${cotaId}_codigo" value="${tipo}" 
                           placeholder="AMPLA, PP1, L1, etc." ${!temTipo ? 'required' : ''}>
                </div>
                
                <div class="form-group">
                    <label for="${cotaId}_descricao">Descrição</label>
                    <input type="text" id="${cotaId}_descricao" value="${descricao}" ${!temTipo ? 'required' : ''}>
                </div>
                
                <div class="form-group">
                    <label for="${cotaId}_nota">Nota de Corte *</label>
                    <input type="number" id="${cotaId}_nota" step="0.001" required 
                           placeholder="Ex: 750.500">
                </div>
                
                <div class="form-group">
                    <label for="${cotaId}_vagas">Vagas</label>
                    <input type="number" id="${cotaId}_vagas" min="0" 
                           placeholder="Número de vagas">
                </div>
                
                <div class="form-group">
                    <label for="${cotaId}_colocacao">Colocação do Último</label>
                    <input type="number" id="${cotaId}_colocacao" min="0" 
                           placeholder="Posição do último classificado">
                </div>
                
                ${vestibular === 'PSI' ? `
                <div class="form-group">
                    <label for="${cotaId}_bonus">Bônus (%)</label>
                    <input type="number" id="${cotaId}_bonus" min="0" max="100" 
                           placeholder="Ex: 20 para interior">
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="${cotaId}_preenchida">
                        <span>Vaga preenchida</span>
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="${cotaId}_obs">Observações</label>
                    <textarea id="${cotaId}_obs" rows="2" placeholder="Migração de vagas, etc."></textarea>
                </div>
                
                ${!temTipo ? `
                <div class="cota-aviso">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Selecione um tipo de cota predefinido</span>
                </div>
                ` : ''}
            </div>
        `;

        container.insertAdjacentHTML('beforeend', cotaHTML);
    }

    removeCota(cotaId) {
        const element = document.getElementById(cotaId);
        if (element) {
            element.remove();
        }
    }

    visualizarCurso() {
        const dados = this.coletarDadosFormulario();

        const preview = `
            <div class="curso-preview">
                <div class="preview-header">
                    <h4>${dados.curso} - ${dados.universidade}</h4>
                    <p>${dados.campus || 'Campus principal'} • ${dados.vestibular} ${dados.ano}</p>
                </div>
                
                <div class="preview-detalhes">
                    <div class="detalhe-item">
                        <span>Período:</span>
                        <strong>${dados.periodo || 'Não informado'}</strong>
                    </div>
                    <div class="detalhe-item">
                        <span>Vagas totais:</span>
                        <strong>${dados.totalVagas || '--'}</strong>
                    </div>
                    <div class="detalhe-item">
                        <span>Nota geral:</span>
                        <strong>${parseFloat(dados.notaGeral).toFixed(3)}</strong>
                    </div>
                </div>
                
                <div class="preview-cotas">
                    <h5>Cotas Configuradas (${dados.cotas.length})</h5>
                    <div class="cotas-lista-preview">
                        ${dados.cotas.map(cota => `
                            <div class="cota-preview-item">
                                <span class="cota-codigo">${cota.codigo}</span>
                                <span class="cota-nota">${parseFloat(cota.notaCorte).toFixed(3)}</span>
                                <span class="cota-vagas">${cota.vagas || '--'} vagas</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.showModal('Pré-visualização do Curso', preview);
    }

    coletarDadosFormulario() {
        const dados = {
            universidade: document.getElementById('universidade').value,
            curso: document.getElementById('curso').value,
            campus: document.getElementById('campus').value,
            vestibular: document.getElementById('vestibular').value,
            ano: parseInt(document.getElementById('ano').value),
            edicao: document.getElementById('edicao').value,
            periodo: document.getElementById('periodo').value,
            totalVagas: document.getElementById('vagasTotal').value ?
                parseInt(document.getElementById('vagasTotal').value) : null,
            notaGeral: parseFloat(document.getElementById('notaGeral').value),
            cotas: []
        };

        // Coletar dados das cotas
        document.querySelectorAll('.cota-item-form').forEach(item => {
            const cota = {
                tipo: document.getElementById(`${item.id}_tipo`).value,
                codigo: document.getElementById(`${item.id}_codigo`).value,
                descricao: document.getElementById(`${item.id}_descricao`).value,
                notaCorte: parseFloat(document.getElementById(`${item.id}_nota`).value),
                vagas: document.getElementById(`${item.id}_vagas`).value ?
                    parseInt(document.getElementById(`${item.id}_vagas`).value) : null,
                colocacao: document.getElementById(`${item.id}_colocacao`).value ?
                    parseInt(document.getElementById(`${item.id}_colocacao`).value) : null,
                percentualBonus: document.getElementById(`${item.id}_bonus`) ?
                    parseFloat(document.getElementById(`${item.id}_bonus`).value) : 0,
                preenchida: document.getElementById(`${item.id}_preenchida`).checked,
                observacoes: document.getElementById(`${item.id}_obs`).value
            };

            dados.cotas.push(cota);
        });

        return dados;
    }

    async salvarCurso() {
        const dados = this.coletarDadosFormulario();

        try {
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Curso salvo com sucesso!', 'success');
                this.limparFormulario();

                // Atualizar estatísticas
                this.atualizarEstatisticas();
            } else {
                this.showNotification(result.message || 'Erro ao salvar curso', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar curso:', error);
            this.showNotification('Erro ao conectar com o servidor', 'error');
        }
    }

    limparFormulario() {
        document.getElementById('formAdicionarCurso').reset();
        document.getElementById('cotasContainer').innerHTML = '';

        // Re-adicionar apenas AMPLA
        const vestibular = document.getElementById('vestibular').value;
        if (vestibular) {
            this.adicionarCampoCota('AMPLA', 'Ampla Concorrência', vestibular);
        }
    }

    // ========== ABA GERENCIAR CURSOS ==========

    async carregarCursos(pagina = 1) {
        try {
            const container = document.getElementById('cursosContainer');
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Carregando cursos...</p></div>';

            // Construir filtros
            const filtros = {
                page: pagina,
                limit: 20
            };

            const vestibular = document.getElementById('filtroVestibular').value;
            const universidade = document.getElementById('filtroUniversidade').value;
            const ano = document.getElementById('filtroAno').value;
            const ativo = document.getElementById('filtroAtivo').value;
            const busca = document.getElementById('buscaCurso').value;

            if (vestibular) filtros.vestibular = vestibular;
            if (universidade) filtros.universidade = universidade;
            if (ano) filtros.ano = ano;
            if (ativo) filtros.ativo = ativo === 'ativo';
            if (busca) filtros.search = busca;

            // Fazer requisição
            const queryParams = new URLSearchParams(filtros).toString();
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses?${queryParams}`);
            const result = await response.json();

            if (result.success) {
                this.cursos = result.courses;
                this.totalPages = result.totalPages || 1;
                this.currentPage = pagina;

                this.renderCursos();
                this.renderPaginacao();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            const container = document.getElementById('cursosContainer');
            container.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar cursos: ${error.message}</p>
                </div>
            `;
        }
    }

    renderCursos() {
        const container = document.getElementById('cursosContainer');

        if (this.cursos.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>Nenhum curso encontrado com os filtros atuais</p>
                </div>
            `;
            return;
        }

        let html = '';

        this.cursos.forEach(curso => {
            const nota = curso.notaTotal || curso.notas?.total || curso.notaGeral || 0;
            const cotasCount = curso.cotas?.length || 0;

            html += `
                <div class="curso-item ${curso.ativo === false ? 'inativo' : ''}" data-id="${curso._id}">
                    <div class="curso-info">
                        <div class="curso-nome">${curso.curso}</div>
                        <div class="curso-detalhes">
                            <span>${curso.universidade}</span>
                            <span>${curso.campus || 'Principal'}</span>
                            <span>${curso.vestibular} ${curso.ano}</span>
                        </div>
                        <div class="curso-cotas">
                            <span class="cota-badge">Nota: ${parseFloat(nota).toFixed(3)}</span>
                            ${cotasCount > 0 ? `<span class="cota-badge">${cotasCount} cotas</span>` : ''}
                            <span class="status-badge ${curso.ativo !== false ? 'status-ativo' : 'status-inativo'}">
                                ${curso.ativo !== false ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="curso-periodo">
                        ${curso.periodo || '--'}
                    </div>
                    
                    <div class="curso-vagas">
                        ${curso.totalVagas || curso.notas?.vagas || '--'} vagas
                    </div>
                    
                    <div class="curso-actions">
                        <button class="curso-action-btn edit" onclick="admin.editarCurso('${curso._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="curso-action-btn toggle" onclick="admin.toggleCurso('${curso._id}', ${curso.ativo !== false})">
                            <i class="fas fa-${curso.ativo !== false ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="curso-action-btn delete" onclick="admin.confirmarExclusao('${curso._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderPaginacao() {
        const container = document.getElementById('paginacao');

        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // Botão anterior
        if (this.currentPage > 1) {
            html += `<button class="pagina-btn" onclick="admin.carregarCursos(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                     </button>`;
        }

        // Páginas
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button class="pagina-btn ${i === this.currentPage ? 'active' : ''}" 
                                onclick="admin.carregarCursos(${i})">
                            ${i}
                         </button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span class="pagina-ellipsis">...</span>`;
            }
        }

        // Botão próximo
        if (this.currentPage < this.totalPages) {
            html += `<button class="pagina-btn" onclick="admin.carregarCursos(${this.currentPage + 1})">
                        <i class="fas fa-chevron-right"></i>
                     </button>`;
        }

        container.innerHTML = html;
    }

    limparFiltros() {
        document.getElementById('filtroVestibular').value = '';
        document.getElementById('filtroUniversidade').value = '';
        document.getElementById('filtroAno').value = '';
        document.getElementById('filtroAtivo').value = '';
        document.getElementById('buscaCurso').value = '';

        this.carregarCursos(1);
    }

    async editarCurso(cursoId) {
        try {
            // Primeiro, carregar os dados do curso
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses/${cursoId}`);
            const result = await response.json();

            if (result.success) {
                const curso = result.course;

                // Preencher formulário
                this.switchTab('adicionar');

                document.getElementById('universidade').value = curso.universidade;
                document.getElementById('curso').value = curso.curso;
                document.getElementById('campus').value = curso.campus || '';
                document.getElementById('vestibular').value = curso.vestibular;
                document.getElementById('ano').value = curso.ano;
                document.getElementById('edicao').value = curso.edicao || '';
                document.getElementById('periodo').value = curso.periodo || curso.notas?.periodo || '';
                document.getElementById('vagasTotal').value = curso.totalVagas || curso.notas?.vagas || '';
                document.getElementById('notaGeral').value = curso.notaGeral || curso.notas?.total || '';

                // Limpar e adicionar cotas
                const container = document.getElementById('cotasContainer');
                container.innerHTML = '';

                if (curso.cotas && curso.cotas.length > 0) {
                    curso.cotas.forEach(cota => {
                        this.adicionarCampoCota(
                            cota.tipo || cota.codigo,
                            cota.descricao,
                            curso.vestibular,
                            true
                        );

                        // Preencher os campos da cota recém-adicionada
                        const lastCota = container.lastElementChild;
                        if (lastCota) {
                            document.getElementById(`${lastCota.id}_codigo`).value = cota.codigo || cota.tipo;
                            document.getElementById(`${lastCota.id}_descricao`).value = cota.descricao;
                            document.getElementById(`${lastCota.id}_nota`).value = cota.notaCorte;
                            document.getElementById(`${lastCota.id}_vagas`).value = cota.vagas || '';
                            document.getElementById(`${lastCota.id}_colocacao`).value = cota.colocacao || '';
                            document.getElementById(`${lastCota.id}_bonus`).value = cota.percentualBonus || '';
                            document.getElementById(`${lastCota.id}_preenchida`).checked = cota.preenchida || false;
                            document.getElementById(`${lastCota.id}_obs`).value = cota.observacoes || '';
                        }
                    });
                }

                // Atualizar botão do formulário
                const form = document.getElementById('formAdicionarCurso');
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Curso';
                submitBtn.dataset.editing = cursoId;

                this.showNotification('Formulário preenchido com os dados do curso', 'info');

                // Scroll para o topo do formulário
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao carregar curso para edição:', error);
            this.showNotification('Erro ao carregar dados do curso', 'error');
        }
    }

    async toggleCurso(cursoId, ativoAtual) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses/${cursoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ativo: !ativoAtual })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`Curso ${!ativoAtual ? 'ativado' : 'desativado'} com sucesso`, 'success');
                this.carregarCursos(this.currentPage);
                this.atualizarEstatisticas();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao alterar status do curso:', error);
            this.showNotification('Erro ao alterar status do curso', 'error');
        }
    }

    confirmarExclusao(cursoId) {
        this.showConfirmModal(
            'Excluir Curso',
            'Tem certeza que deseja excluir permanentemente este curso? Esta ação não pode ser desfeita.',
            () => this.excluirCurso(cursoId)
        );
    }

    async excluirCurso(cursoId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses/${cursoId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Curso excluído com sucesso', 'success');
                this.carregarCursos(this.currentPage);
                this.atualizarEstatisticas();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao excluir curso:', error);
            this.showNotification('Erro ao excluir curso', 'error');
        }
    }

    // ========== ABA GERENCIAR COTAS ==========

    carregarConfigCotas() {
        // PSC
        this.renderCotasVestibular('PSC', 'cotasPsc');

        // SIS
        this.renderCotasVestibular('SIS', 'cotasSis');

        // ENEM
        this.renderCotasVestibular('ENEM', 'cotasEnem');

        // MACRO
        this.renderCotasVestibular('MACRO', 'cotasMacro');

        // PSI
        this.renderCotasVestibular('PSI', 'cotasPsi');
    }

    renderCotasVestibular(vestibular, containerId) {
        const container = document.getElementById(containerId);
        const tipos = this.cotaData.TIPOS_POR_VESTIBULAR[vestibular] || [];

        container.innerHTML = tipos.map(tipo => `
            <div class="cota-config-item" data-tipo="${tipo}" data-vestibular="${vestibular}">
                <div class="cota-codigo">${tipo}</div>
                <div class="cota-desc">${this.cotaData.DESCRICOES_COTA[tipo] || 'Sem descrição'}</div>
            </div>
        `).join('');

        // Adicionar eventos
        container.querySelectorAll('.cota-config-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tipo = e.currentTarget.dataset.tipo;
                const vestibular = e.currentTarget.dataset.vestibular;
                this.selecionarCotaParaEdicao(tipo, vestibular);
            });
        });
    }

    getVestibularAtual() {
        const select = document.getElementById('vestibular');
        return select ? select.value : this.currentVestibular;
    }

    selecionarCotaParaEdicao(tipo, vestibular) {
        this.cotaSelecionada = { tipo, vestibular };

        // Remover seleção anterior
        document.querySelectorAll('.cota-config-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Adicionar seleção atual
        document.querySelector(`[data-tipo="${tipo}"][data-vestibular="${vestibular}"]`)?.classList.add('selected');

        // Preencher formulário de edição
        document.getElementById('editCodigo').value = tipo;
        document.getElementById('editDescricao').value = this.cotaData.DESCRICOES_COTA[tipo] || '';
        document.getElementById('editAbreviacao').value = this.getAbreviacaoCota(tipo);
    }

    getAbreviacaoCota(tipo) {
        const descricao = this.cotaData.DESCRICOES_COTA[tipo] || '';
        // Extrair abreviação (primeiras palavras)
        return descricao.split(' ').slice(0, 3).join(' ');
    }

    salvarDescricaoCota() {
        if (!this.cotaSelecionada) {
            this.showNotification('Selecione uma cota primeiro', 'error');
            return;
        }

        const codigo = document.getElementById('editCodigo').value;
        const descricao = document.getElementById('editDescricao').value;

        // Atualizar na memória
        this.cotaData.DESCRICOES_COTA[codigo] = descricao;

        // Aqui você salvaria no banco de dados
        // Por enquanto, só atualizamos localmente
        this.renderCotasVestibular(this.cotaSelecionada.vestibular, `cotas${this.cotaSelecionada.vestibular}`);

        this.showNotification('Descrição salva com sucesso', 'success');
    }

    // ========== ABA IMPORTAR CSV ==========

    prepararImportacao() {
        // Limpar prévia anterior
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('processImport').disabled = true;
        document.getElementById('fileInfo').innerHTML = '';
    }

    downloadTemplateCSV() {
        const template = `universidade,curso,campus,vestibular,ano,edicao,periodo,totalVagas,notaGeral,cotas_tipo,cotas_codigo,cotas_descricao,cotas_notaCorte,cotas_vagas,cotas_colocacao,cotas_bonus,cotas_observacoes
UFAM,Medicina,Manaus,PSC,2026,PSC 2026,INTEGRAL,50,850.500,AMPLA,AMPLA,Ampla Concorrência,850.500,20,20,,Exemplo de observação
UFAM,Medicina,Manaus,PSC,2026,PSC 2026,INTEGRAL,50,780.250,PP1,PP1,EP + Pretos/Pardos c/ renda,780.250,5,5,,Vagas preenchidas
UEA,Engenharia Civil,Manaus,SIS,2026,SIS 1 2026,INTEGRAL,40,720.500,A,A,EP Geral Brasil,720.500,10,10,,`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template-cursos.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    handleFileUpload(file) {
        if (!file || file.type !== 'text/csv') {
            this.showNotification('Por favor, selecione um arquivo CSV válido', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                this.processarCSV(csvContent, file.name);
            } catch (error) {
                console.error('Erro ao processar CSV:', error);
                this.showNotification('Erro ao processar arquivo CSV', 'error');
            }
        };

        reader.onerror = () => {
            this.showNotification('Erro ao ler arquivo', 'error');
        };

        reader.readAsText(file);
    }

    processarCSV(csvContent, fileName) {
        // Exibir informações do arquivo
        document.getElementById('fileInfo').innerHTML = `
            <p><strong>Arquivo:</strong> ${fileName}</p>
            <p><strong>Tamanho:</strong> ${(csvContent.length / 1024).toFixed(2)} KB</p>
            <p><strong>Linhas:</strong> ${csvContent.split('\n').length - 1}</p>
        `;

        // Processar CSV
        const linhas = csvContent.split('\n');
        const cabecalho = linhas[0].split(',').map(h => h.trim());

        // Validar cabeçalho mínimo
        const cabecalhosObrigatorios = ['universidade', 'curso', 'vestibular', 'ano', 'notaGeral'];
        const cabecalhosFaltantes = cabecalhosObrigatorios.filter(h => !cabecalho.includes(h));

        if (cabecalhosFaltantes.length > 0) {
            this.showNotification(`Cabeçalhos obrigatórios faltando: ${cabecalhosFaltantes.join(', ')}`, 'error');
            return;
        }

        // Processar dados
        const dados = [];
        for (let i = 1; i < linhas.length; i++) {
            if (linhas[i].trim() === '') continue;

            const valores = this.parseCSVLine(linhas[i]);
            if (valores.length !== cabecalho.length) {
                console.warn(`Linha ${i + 1} ignorada: número de colunas incorreto`);
                continue;
            }

            const linhaObj = {};
            cabecalho.forEach((h, index) => {
                linhaObj[h] = valores[index] || '';
            });

            dados.push(linhaObj);
        }

        // Exibir pré-visualização
        this.exibirPreviewCSV(dados, cabecalho);

        // Habilitar botão de processamento
        document.getElementById('processImport').disabled = false;
    }

    parseCSVLine(line) {
        const valores = [];
        let valorAtual = '';
        let dentroAspas = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                dentroAspas = !dentroAspas;
            } else if (char === ',' && !dentroAspas) {
                valores.push(valorAtual.trim());
                valorAtual = '';
            } else {
                valorAtual += char;
            }
        }

        valores.push(valorAtual.trim());
        return valores;
    }

    exibirPreviewCSV(dados, cabecalho) {
        const previewSection = document.getElementById('previewSection');
        const previewTable = document.getElementById('previewTable');
        const previewStats = document.getElementById('previewStats');

        // Mostrar seção
        previewSection.style.display = 'block';

        // Construir tabela
        let html = '<thead><tr>';
        cabecalho.forEach(h => {
            html += `<th>${h}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Mostrar apenas as primeiras 10 linhas para preview
        const linhasParaMostrar = Math.min(10, dados.length);
        for (let i = 0; i < linhasParaMostrar; i++) {
            html += '<tr>';
            cabecalho.forEach(h => {
                const valor = dados[i][h];
                html += `<td title="${valor}">${valor.length > 30 ? valor.substring(0, 30) + '...' : valor}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody>';

        previewTable.innerHTML = html;

        // Estatísticas
        const vestibulares = [...new Set(dados.map(d => d.vestibular))];
        const universidades = [...new Set(dados.map(d => d.universidade))];

        previewStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span>Total de registros:</span>
                    <strong>${dados.length}</strong>
                </div>
                <div class="stat-item">
                    <span>Vestibulares:</span>
                    <strong>${vestibulares.length}</strong>
                </div>
                <div class="stat-item">
                    <span>Universidades:</span>
                    <strong>${universidades.length}</strong>
                </div>
                ${dados.length > 10 ? `<div class="stat-item warning">
                    <span>Atenção:</span>
                    <strong>Mostrando apenas 10 de ${dados.length} linhas</strong>
                </div>` : ''}
            </div>
        `;

        // Scroll para pré-visualização
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    async processarImportacao() {
        const processBtn = document.getElementById('processImport');
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        processBtn.disabled = true;

        try {
            // Aqui você implementaria o envio dos dados para a API
            // Por enquanto, simulamos um processamento

            await new Promise(resolve => setTimeout(resolve, 2000));

            this.showNotification('Importação processada com sucesso!', 'success');

            // Limpar formulário
            this.prepararImportacao();

            // Atualizar lista de cursos
            this.carregarCursos(1);

        } catch (error) {
            console.error('Erro ao processar importação:', error);
            this.showNotification('Erro ao processar importação', 'error');
        } finally {
            processBtn.innerHTML = '<i class="fas fa-play"></i> Processar Importação';
            processBtn.disabled = false;
        }
    }

    // ========== UTILIDADES ==========

    showModal(titulo, conteudo, onOpen = null) {
        document.getElementById('modalCursoTitle').textContent = titulo;
        document.getElementById('modalCursoContent').innerHTML = conteudo;
        document.getElementById('cursoModal').classList.add('active');

        if (onOpen) {
            setTimeout(onOpen, 100);
        }
    }

    showConfirmModal(titulo, mensagem, onConfirm) {
        document.getElementById('confirmMessage').textContent = mensagem;
        const modal = document.getElementById('confirmModal');
        modal.classList.add('active');

        const confirmBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        const confirmHandler = () => {
            modal.classList.remove('active');
            onConfirm();
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };

        const cancelHandler = () => {
            modal.classList.remove('active');
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };

        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
    }

    showNotification(mensagem, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' :
                tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${mensagem}</span>
            <button class="notification-close">&times;</button>
        `;

        // Adicionar estilos dinâmicos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        // Botão para fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        document.body.appendChild(notification);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminCalculadora();
});

// Adicionar animações CSS
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .modal-select-cota {
        padding: 20px;
    }
    
    .cota-options {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        margin-top: 15px;
        margin-bottom: 20px;
    }
    
    .cota-option {
        background: #f8f9fa;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        text-align: left;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .cota-option:hover {
        background: #e9ecef;
        border-color: #4a6491;
    }
    
    .cota-option strong {
        display: block;
        color: #2c3e50;
        margin-bottom: 5px;
    }
    
    .cota-option span {
        font-size: 0.9em;
        color: #666;
    }
    
    .curso-preview {
        padding: 10px;
    }
    
    .preview-header h4 {
        margin: 0 0 5px 0;
        color: #2c3e50;
    }
    
    .preview-detalhes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .detalhe-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    
    .detalhe-item span {
        font-size: 0.9em;
        color: #666;
    }
    
    .preview-cotas h5 {
        margin: 20px 0 10px 0;
        color: #2c3e50;
    }
    
    .cotas-lista-preview {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
    }
    
    .cota-preview-item {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .cota-codigo {
        font-weight: 600;
        color: #4a6491;
    }
    
    .cota-nota {
        font-weight: 600;
    }
    
    .cota-vagas {
        font-size: 0.9em;
        color: #666;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    
    .stat-item {
        background: white;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
    }
    
    .stat-item span {
        display: block;
        font-size: 0.9em;
        color: #666;
        margin-bottom: 5px;
    }
    
    .stat-item.warning {
        background: #fff3cd;
        border-color: #ffeaa7;
    }
    
    .error {
        text-align: center;
        padding: 40px;
        color: #dc3545;
    }
    
    .error i {
        font-size: 2em;
        margin-bottom: 15px;
    }
    
    .no-results {
        text-align: center;
        padding: 40px;
        color: #666;
    }
    
    .no-results i {
        font-size: 2em;
        margin-bottom: 15px;
    }
    
    .modal-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
    }
    
    .btn {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.3s;
    }
    
    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover {
        background-color: #5a6268;
    }
`;
document.head.appendChild(adminStyles);