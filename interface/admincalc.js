// admin-calc.js - Sistema Admin Completo
class AdminCalculadora {
    constructor() {
        this.API_BASE_URL = '/api';
        this.cursos = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.cotaSelecionada = null;
        this.cotaData = this.carregarDadosCotas();
        this.isAddingCota = false;
        this.csvData = null;
        this.currentVestibular = 'PSC';
        this.cotasExistentes = new Set();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.carregarDadosIniciais();
        this.configurarSistemaCotas();
        this.atualizarEstatisticas();
    }

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

        // Atualizar vestibular atual
        document.getElementById('vestibular')?.addEventListener('change', (e) => {
            this.currentVestibular = e.target.value;
            this.cotasExistentes.clear();
            this.atualizarListaCotasDisponiveis();
            this.atualizarCamposBonus(this.currentVestibular);
        });

        // Formulário de adicionar curso
        document.getElementById('formAdicionarCurso')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarCurso();
        });

        // Botão adicionar cota
        const btnAdicionarCota = document.getElementById('adicionarCota');
        if (btnAdicionarCota) {
            btnAdicionarCota.addEventListener('click', () => {
                this.handleAdicionarCota();
            });
        }

        // Botão visualizar
        document.getElementById('previewCurso')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.visualizarCurso();
        });

        // Filtros de gerenciamento
        const gerenciarContent = document.getElementById('gerenciarContent');
        if (gerenciarContent) {
            setTimeout(() => {
                document.querySelectorAll('#gerenciarContent select, #gerenciarContent input').forEach(element => {
                    element.addEventListener('change', () => this.carregarCursos());
                });
            }, 100);
        }

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
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    this.handleFileUpload(e.dataTransfer.files[0]);
                }
            });
        }

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
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Tem certeza que deseja sair?')) {
                    localStorage.removeItem('adminToken');
                    window.location.href = '/login.html';
                }
            });
        }
    }

    async processarImportacao() {
        if (!this.csvData || this.csvData.length === 0) {
            this.showNotification('Nenhum dado CSV para processar', 'error');
            return;
        }

        const processBtn = document.getElementById('processImport');
        const originalText = processBtn.innerHTML;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        processBtn.disabled = true;

        const skipDuplicates = document.getElementById('skipDuplicates')?.checked !== false;
        const validateData = document.getElementById('validateData')?.checked !== false;

        try {
            const resultados = {
                sucesso: 0,
                duplicados: 0,
                erros: 0,
                detalhes: []
            };

            // Processar cada linha do CSV
            for (let i = 0; i < this.csvData.length; i++) {
                const linha = this.csvData[i];

                try {
                    // Validar dados mínimos
                    if (!linha.universidade || !linha.curso || !linha.vestibular || !linha.ano) {
                        resultados.erros++;
                        resultados.detalhes.push(`Linha ${i + 1}: Dados obrigatórios faltando`);
                        continue;
                    }

                    // Verificar duplicidade
                    if (skipDuplicates) {
                        const response = await fetch(`${this.API_BASE_URL}/calculator/courses?vestibular=${linha.vestibular}&ano=${linha.ano}&universidade=${encodeURIComponent(linha.universidade)}&curso=${encodeURIComponent(linha.curso)}`);
                        const data = await response.json();

                        if (data.success && data.courses && data.courses.length > 0) {
                            resultados.duplicados++;
                            resultados.detalhes.push(`Linha ${i + 1}: Curso duplicado encontrado`);
                            continue;
                        }
                    }

                    // Preparar dados para envio
                    const cursoData = {
                        universidade: linha.universidade.trim(),
                        curso: linha.curso.trim(),
                        campus: linha.campus ? linha.campus.trim() : null,
                        vestibular: linha.vestibular.trim().toUpperCase(),
                        ano: parseInt(linha.ano),
                        edicao: linha.edicao || `${linha.vestibular} ${linha.ano}`,
                        periodo: linha.periodo || null,
                        totalVagas: linha.totalVagas ? parseInt(linha.totalVagas) : null,
                        notaGeral: parseFloat(linha.notaGeral) || 0,
                        cotas: []
                    };

                    // Processar cotas do CSV
                    if (linha.cotas_tipo || linha.cotas_codigo) {
                        const cotas = [];

                        // Se há múltiplas cotas separadas por ";"
                        if (linha.cotas_tipo && linha.cotas_tipo.includes(';')) {
                            const tipos = linha.cotas_tipo.split(';');
                            const codigos = linha.cotas_codigo ? linha.cotas_codigo.split(';') : tipos;
                            const descricoes = linha.cotas_descricao ? linha.cotas_descricao.split(';') : codigos;
                            const notas = linha.cotas_notaCorte ? linha.cotas_notaCorte.split(';') : [];
                            const vagas = linha.cotas_vagas ? linha.cotas_vagas.split(';') : [];

                            tipos.forEach((tipo, index) => {
                                cotas.push({
                                    tipo: tipo.trim(),
                                    codigo: codigos[index] ? codigos[index].trim() : tipo.trim(),
                                    descricao: descricoes[index] ? descricoes[index].trim() : this.cotaData.DESCRICOES_COTA[tipo.trim()] || tipo.trim(),
                                    notaCorte: notas[index] ? parseFloat(notas[index]) : parseFloat(linha.notaGeral),
                                    vagas: vagas[index] ? parseInt(vagas[index]) : null,
                                    colocacao: null,
                                    observacoes: ''
                                });
                            });
                        } else {
                            // Cota única
                            cotas.push({
                                tipo: linha.cotas_tipo || linha.cotas_codigo || 'AMPLA',
                                codigo: linha.cotas_codigo || linha.cotas_tipo || 'AMPLA',
                                descricao: linha.cotas_descricao || this.cotaData.DESCRICOES_COTA[linha.cotas_tipo] || 'Ampla Concorrência',
                                notaCorte: linha.cotas_notaCorte ? parseFloat(linha.cotas_notaCorte) : parseFloat(linha.notaGeral),
                                vagas: linha.cotas_vagas ? parseInt(linha.cotas_vagas) : null,
                                colocacao: linha.cotas_colocacao ? parseInt(linha.cotas_colocacao) : null,
                                percentualBonus: linha.cotas_bonus ? parseFloat(linha.cotas_bonus) : 0,
                                observacoes: linha.cotas_observacoes || ''
                            });
                        }

                        cursoData.cotas = cotas;
                    } else {
                        // Adicionar cota AMPLA padrão
                        cursoData.cotas = [{
                            tipo: 'AMPLA',
                            codigo: 'AMPLA',
                            descricao: 'Ampla Concorrência',
                            notaCorte: parseFloat(linha.notaGeral)
                        }];
                    }

                    // Validar dados se necessário
                    if (validateData) {
                        const errors = [];
                        if (!cursoData.universidade) errors.push('Universidade é obrigatória');
                        if (!cursoData.curso) errors.push('Curso é obrigatório');
                        if (!cursoData.vestibular) errors.push('Vestibular é obrigatório');
                        if (!cursoData.ano) errors.push('Ano é obrigatório');
                        if (!cursoData.notaGeral || isNaN(cursoData.notaGeral)) errors.push('Nota geral é obrigatória e deve ser um número');

                        if (errors.length > 0) {
                            resultados.erros++;
                            resultados.detalhes.push(`Linha ${i + 1}: ${errors.join(', ')}`);
                            continue;
                        }
                    }

                    // Enviar para API
                    const response = await fetch(`${this.API_BASE_URL}/calculator/courses`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(cursoData)
                    });

                    const result = await response.json();

                    if (result.success) {
                        resultados.sucesso++;
                        resultados.detalhes.push(`Linha ${i + 1}: Curso criado com sucesso (ID: ${result.course?._id || 'N/A'})`);
                    } else {
                        resultados.erros++;
                        resultados.detalhes.push(`Linha ${i + 1}: Erro - ${result.message || 'Erro desconhecido'}`);
                    }

                } catch (error) {
                    resultados.erros++;
                    resultados.detalhes.push(`Linha ${i + 1}: Erro - ${error.message}`);
                }

                // Pequena pausa para não sobrecarregar o servidor
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Mostrar resultados
            const resultadoHTML = `
            <div class="import-result">
                <h4>Resultado da Importação</h4>
                <div class="result-stats">
                    <div class="result-stat success">
                        <i class="fas fa-check-circle"></i>
                        <div>
                            <strong>${resultados.sucesso}</strong>
                            <span>Cursos criados</span>
                        </div>
                    </div>
                    <div class="result-stat warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>${resultados.duplicados}</strong>
                            <span>Duplicados ignorados</span>
                        </div>
                    </div>
                    <div class="result-stat error">
                        <i class="fas fa-times-circle"></i>
                        <div>
                            <strong>${resultados.erros}</strong>
                            <span>Erros</span>
                        </div>
                    </div>
                </div>
                
                ${resultados.detalhes.length > 0 ? `
                <div class="result-details">
                    <h5>Detalhes:</h5>
                    <div class="details-list">
                        ${resultados.detalhes.map(detalhe => `
                            <div class="detail-item">
                                ${detalhe}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="result-actions">
                    <button onclick="admin.recarregarPagina()" class="btn btn-primary">
                        <i class="fas fa-redo"></i>
                        Recarregar Página
                    </button>
                </div>
            </div>
        `;

            this.showModal('Importação Concluída', resultadoHTML);

            this.showNotification(
                `Importação concluída: ${resultados.sucesso} criados, ${resultados.duplicados} duplicados, ${resultados.erros} erros`,
                resultados.erros === 0 ? 'success' : 'warning'
            );

        } catch (error) {
            console.error('Erro no processamento:', error);
            this.showNotification('Erro ao processar importação: ' + error.message, 'error');
        } finally {
            processBtn.innerHTML = originalText;
            processBtn.disabled = false;

            // Limpar dados do CSV após processamento
            this.csvData = null;
            this.prepararImportacao();
        }
    }

    // Adicione essas funções que estavam faltando:

    async editarCurso(cursoId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses/${cursoId}`);
            const result = await response.json();

            if (result.success) {
                const curso = result.course;

                // Preencher formulário
                this.switchTab('adicionar');

                // Preencher campos básicos
                document.getElementById('universidade').value = curso.universidade || '';
                document.getElementById('curso').value = curso.curso || '';
                document.getElementById('campus').value = curso.campus || '';
                document.getElementById('vestibular').value = curso.vestibular || '';
                document.getElementById('ano').value = curso.ano || '';
                document.getElementById('edicao').value = curso.edicao || '';
                document.getElementById('periodo').value = curso.periodo || '';
                document.getElementById('vagasTotal').value = curso.totalVagas || '';
                document.getElementById('notaGeral').value = curso.notaGeral || '';

                // Limpar cotas existentes
                const container = document.getElementById('cotasContainer');
                if (container) {
                    container.innerHTML = '';
                    this.cotasExistentes.clear();
                }

                // Adicionar cotas do curso
                if (curso.cotas && curso.cotas.length > 0) {
                    curso.cotas.forEach(cota => {
                        this.adicionarCampoCota(
                            cota.tipo || cota.codigo,
                            cota.descricao || '',
                            curso.vestibular
                        );
                    });
                }

                // Atualizar botão do formulário
                const submitBtn = document.querySelector('#formAdicionarCurso button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Curso';
                    submitBtn.dataset.editing = cursoId;
                }

                this.showNotification('Curso carregado para edição', 'info');

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
            const response = await fetch(`${this.API_BASE_URL}/calculator/courses/${cursoId}/toggle`, {
                method: 'PATCH',
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

    // Função que estava faltando:
    confirmarExclusao(cursoId) {
        this.showConfirmModal(
            'Excluir Curso',
            'Tem certeza que deseja excluir permanentemente este curso? Esta ação não pode ser desfeita.',
            () => this.excluirCurso(cursoId)
        );
    }

    // Adicione também a função showConfirmModal:
    showConfirmModal(titulo, mensagem, onConfirm) {
        const modal = document.getElementById('confirmModal');
        if (!modal) return;

        // Atualizar título e mensagem
        const titleElement = modal.querySelector('h3');
        const messageElement = modal.querySelector('#confirmMessage');

        if (titleElement) titleElement.textContent = titulo;
        if (messageElement) messageElement.textContent = mensagem;

        // Limpar event listeners anteriores
        const confirmBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        if (confirmBtn) {
            // Clonar e substituir para remover event listeners antigos
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

            // Adicionar novo event listener
            newConfirmBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                if (onConfirm) onConfirm();
            });
        }

        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            newCancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        modal.classList.add('active');
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

    // Outras funções que podem estar faltando:
    carregarConfigCotas() {
        // Implementação simplificada
        console.log('Carregando configuração de cotas...');
    }

    downloadTemplateCSV() {
        const template = `universidade,curso,campus,vestibular,ano,edicao,periodo,totalVagas,notaGeral,cotas_tipo,cotas_codigo,cotas_descricao,cotas_notaCorte,cotas_vagas,cotas_colocacao,cotas_bonus,cotas_observacoes
UFAM,Medicina,Manaus,PSC,2026,PSC 2026,INTEGRAL,50,850.500,AMPLA,AMPLA,Ampla Concorrência,850.500,20,20,,Exemplo de observação`;

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
        /*if (!file || file.type !== 'text/csv') {
            this.showNotification('Por favor, selecione um arquivo CSV válido', 'error');
            return;
        }*/

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                this.csvData = this.processarCSV(csvContent, file.name);

                if (this.csvData.length > 0) {
                    document.getElementById('processImport').disabled = false;
                    this.showNotification(`CSV carregado com ${this.csvData.length} registros`, 'success');
                } else {
                    this.showNotification('Nenhum dado válido encontrado no CSV', 'warning');
                }
            } catch (error) {
                console.error('Erro ao processar CSV:', error);
                this.showNotification('Erro ao processar arquivo CSV', 'error');
            }
        };

        reader.onerror = () => {
            this.showNotification('Erro ao ler arquivo', 'error');
        };

        reader.readAsText(file, 'UTF-8');
    }
    parseCSVLine(line) {
        const valores = [];
        let valorAtual = '';
        let dentroAspas = false;
        let aspasAnterior = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (!dentroAspas) {
                    dentroAspas = true;
                } else if (i + 1 < line.length && line[i + 1] === '"') {
                    // Aspas duplas dentro de aspas
                    valorAtual += '"';
                    i++; // Pular próxima aspa
                } else {
                    dentroAspas = false;
                    aspasAnterior = true;
                }
            } else if (char === ',' && !dentroAspas) {
                valores.push(aspasAnterior ? valorAtual : valorAtual.trim());
                valorAtual = '';
                aspasAnterior = false;
            } else {
                valorAtual += char;
                aspasAnterior = false;
            }
        }

        valores.push(aspasAnterior ? valorAtual : valorAtual.trim());
        return valores;
    }

    processarCSV(csvContent, fileName) {
        const linhas = csvContent.split('\n').filter(linha => linha.trim() !== '');

        if (linhas.length < 2) {
            throw new Error('CSV vazio ou sem dados');
        }

        // Processar cabeçalho
        const cabecalho = this.parseCSVLine(linhas[0]).map(h => h.trim().toLowerCase());

        // Mapear cabeçalhos para nomes padrão
        const headerMap = {
            'universidade': 'universidade',
            'curso': 'curso',
            'campus': 'campus',
            'vestibular': 'vestibular',
            'ano': 'ano',
            'edicao': 'edicao',
            'periodo': 'periodo',
            'totalvagas': 'totalVagas',
            'vagastotais': 'totalVagas',
            'notageral': 'notaGeral',
            'cotas_tipo': 'cotas_tipo',
            'cotas_codigo': 'cotas_codigo',
            'cotas_descricao': 'cotas_descricao',
            'cotas_notacorte': 'cotas_notaCorte',
            'cotas_vagas': 'cotas_vagas',
            'cotas_colocacao': 'cotas_colocacao',
            'cotas_bonus': 'cotas_bonus',
            'cotas_observacoes': 'cotas_observacoes'
        };

        // Processar linhas de dados
        const dados = [];

        for (let i = 1; i < linhas.length; i++) {
            const valores = this.parseCSVLine(linhas[i]);

            if (valores.length !== cabecalho.length) {
                console.warn(`Linha ${i + 1} ignorada: número de colunas incorreto (${valores.length} vs ${cabecalho.length})`);
                continue;
            }

            const linhaObj = {};

            cabecalho.forEach((h, index) => {
                const key = headerMap[h] || h;
                linhaObj[key] = valores[index] || '';
            });

            dados.push(linhaObj);
        }

        // Atualizar interface com prévia
        this.exibirPreviewCSV(dados, cabecalho);

        return dados;
    }

    exibirPreviewCSV(dados, cabecalho) {
        const previewSection = document.getElementById('previewSection');
        const previewTable = document.getElementById('previewTable');
        const previewStats = document.getElementById('previewStats');
        const fileInfo = document.getElementById('fileInfo');

        if (!previewSection || !previewTable || !previewStats || !fileInfo) return;

        // Mostrar seção
        previewSection.style.display = 'block';

        // Informações do arquivo
        fileInfo.innerHTML = `
        <div class="file-info-content">
            <p><strong>Arquivo carregado:</strong> ${dados.length} registros</p>
            <p><strong>Colunas:</strong> ${cabecalho.length}</p>
        </div>
    `;

        // Construir tabela
        let html = '<thead><tr>';
        cabecalho.forEach(h => {
            html += `<th>${h}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Mostrar apenas as primeiras 5 linhas para preview
        const linhasParaMostrar = Math.min(5, dados.length);
        for (let i = 0; i < linhasParaMostrar; i++) {
            html += '<tr>';
            cabecalho.forEach(h => {
                const key = h.toLowerCase();
                const valor = dados[i][key] || '';
                const displayValor = typeof valor === 'string' && valor.length > 30 ?
                    valor.substring(0, 30) + '...' : valor;
                html += `<td title="${valor}">${displayValor}</td>`;
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
            <div class="stat-item">
                <span>Cursos únicos:</span>
                <strong>${[...new Set(dados.map(d => d.curso))].length}</strong>
            </div>
            ${dados.length > 5 ? `
            <div class="stat-item warning">
                <span>Atenção:</span>
                <strong>Mostrando apenas 5 de ${dados.length} linhas</strong>
            </div>
            ` : ''}
        </div>
    `;

        // Scroll para pré-visualização
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    recarregarPagina() {
        location.reload();
    }

    salvarDescricaoCota() {
        console.log('Salvando descrição de cota...');
        this.showNotification('Descrição salva (simulação)', 'success');
    }

    // Continuação das outras funções...

    switchTab(tabId) {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Content`);
        });

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
                if (select) {
                    select.innerHTML = '<option value="">Todas</option>';
                    dataUni.universidades.forEach(uni => {
                        const option = document.createElement('option');
                        option.value = uni;
                        option.textContent = uni;
                        select.appendChild(option);
                    });
                }
            }

            // Carregar anos
            const resAnos = await fetch(`${this.API_BASE_URL}/calculator/anios`);
            const dataAnos = await resAnos.json();

            if (dataAnos.success) {
                const select = document.getElementById('filtroAno');
                if (select) {
                    select.innerHTML = '<option value="">Todos</option>';
                    dataAnos.anos.forEach(ano => {
                        const option = document.createElement('option');
                        option.value = ano;
                        option.textContent = ano;
                        select.appendChild(option);
                    });
                }
            }

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showNotification('Erro ao carregar dados', 'error');
        }
    }

    atualizarEstatisticas() {
        const totalCursos = document.getElementById('totalCursosAdmin');
        if (totalCursos) {
            // Simulação - na implementação real, buscar da API
            totalCursos.textContent = this.cursos.length.toString();
        }
    }

    configurarSistemaCotas() {
        const container = document.getElementById('cotasContainer');
        if (container) {
            container.innerHTML = '';
        }

        this.cotasExistentes.clear();
        this.adicionarCampoCota('AMPLA', 'Ampla Concorrência', this.currentVestibular);
    }

    atualizarListaCotasDisponiveis() {
        const container = document.getElementById('cotasContainer');
        if (!container) return;

        const tiposAtuais = new Set();
        container.querySelectorAll('.cota-item-form').forEach(cota => {
            const tipoInput = cota.querySelector('input[id$="_tipo"]');
            if (tipoInput && tipoInput.value) {
                tiposAtuais.add(tipoInput.value);
            }
        });

        this.cotasExistentes = tiposAtuais;
    }

    handleAdicionarCota() {
        if (this.isAddingCota) return;

        this.isAddingCota = true;

        try {
            const vestibular = this.getVestibularAtual();
            const tiposCota = this.cotaData.TIPOS_POR_VESTIBULAR[vestibular] || ['AMPLA'];
            const tiposDisponiveis = tiposCota.filter(tipo => !this.cotasExistentes.has(tipo));

            if (tiposDisponiveis.length === 0) {
                this.showNotification('Todas as cotas disponíveis já foram adicionadas', 'info');
                return;
            }

            this.mostrarSelecionarCota(tiposDisponiveis, vestibular);
        } finally {
            setTimeout(() => {
                this.isAddingCota = false;
            }, 300);
        }
    }

    atualizarCamposBonus(vestibular) {
        const container = document.getElementById('cotasContainer');
        if (!container) return;

        container.querySelectorAll('.cota-item-form').forEach(item => {
            const campoBonus = item.querySelector('input[id$="_bonus"]');
            const campoContainer = campoBonus?.closest('.form-group');
            if (campoContainer) {
                campoContainer.style.display = vestibular === 'PSI' ? 'block' : 'none';
            }
        });
    }

    mostrarSelecionarCota(tiposCota, vestibular) {
        const modalContent = `
            <div class="modal-select-cota">
                <h4>Selecione o tipo de cota</h4>
                <p class="modal-help">Vestibular: ${vestibular}</p>
                <p>Selecione uma cota para adicionar ao formulário:</p>
                <div class="cota-options">
                    ${tiposCota.map(tipo => `
                        <button type="button" class="cota-option" data-tipo="${tipo}">
                            <div class="cota-option-icon">
                                <i class="fas fa-user-plus"></i>
                            </div>
                            <div class="cota-option-content">
                                <strong>${tipo}</strong>
                                <span>${this.cotaData.DESCRICOES_COTA[tipo] || tipo}</span>
                            </div>
                        </button>
                    `).join('')}
                </div>
                <div class="modal-actions" style="margin-top: 20px; text-align: center;">
                    <button type="button" class="btn btn-secondary modal-close">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        this.showModal('Adicionar Cota', modalContent, () => {
            document.querySelectorAll('.cota-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tipo = e.currentTarget.dataset.tipo;
                    const descricao = this.cotaData.DESCRICOES_COTA[tipo] || tipo;

                    document.getElementById('cursoModal').classList.remove('active');

                    setTimeout(() => {
                        this.adicionarCampoCota(tipo, descricao, vestibular);
                        this.cotasExistentes.add(tipo);
                    }, 100);
                });
            });

            document.querySelector('.modal-select-cota .modal-close')?.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('cursoModal').classList.remove('active');
            });
        });
    }

    adicionarCampoCota(tipo = '', descricao = '', vestibular = '') {
        const container = document.getElementById('cotasContainer');
        if (!container) return;

        const cotaId = `cota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const temTipo = tipo && tipo.trim() !== '';

        const cotasVazias = container.querySelectorAll('.cota-item-form.vazia');

        if (cotasVazias.length > 0 && !temTipo) {
            const cotaVazia = cotasVazias[0];
            this.preencherCotaVazia(cotaVazia, tipo, descricao, vestibular);
            return;
        }

        const cotaHTML = `
            <div class="cota-item-form ${temTipo ? 'preenchida' : 'vazia'}" id="${cotaId}">
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

        if (temTipo && this.cotasExistentes) {
            this.cotasExistentes.add(tipo);
        }
    }

    preencherCotaVazia(cotaElement, tipo, descricao, vestibular) {
        const cotaId = cotaElement.id;

        document.getElementById(`${cotaId}_tipo`).value = tipo;
        document.getElementById(`${cotaId}_codigo`).value = tipo;
        document.getElementById(`${cotaId}_descricao`).value = descricao;

        cotaElement.classList.remove('vazia');
        cotaElement.classList.add('preenchida');

        const header = cotaElement.querySelector('.cota-item-header h5');
        if (header) {
            header.textContent = descricao || tipo;
        }

        const aviso = cotaElement.querySelector('.cota-aviso');
        if (aviso) {
            aviso.remove();
        }

        if (vestibular === 'PSI') {
            const formGroups = cotaElement.querySelectorAll('.form-group');
            const lastFormGroup = formGroups[formGroups.length - 2];

            const bonusHTML = `
                <div class="form-group">
                    <label for="${cotaId}_bonus">Bônus (%)</label>
                    <input type="number" id="${cotaId}_bonus" min="0" max="100" 
                           placeholder="Ex: 20 para interior">
                </div>
            `;

            lastFormGroup.insertAdjacentHTML('afterend', bonusHTML);
        }

        if (this.cotasExistentes) {
            this.cotasExistentes.add(tipo);
        }
    }

    removeCota(cotaId) {
        const element = document.getElementById(cotaId);
        if (!element) return;

        const tipoInput = element.querySelector('input[id$="_tipo"]');
        if (tipoInput && tipoInput.value && this.cotasExistentes) {
            this.cotasExistentes.delete(tipoInput.value);
        }

        element.remove();
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
            ano: parseInt(document.getElementById('ano').value) || 0,
            edicao: document.getElementById('edicao').value,
            periodo: document.getElementById('periodo').value,
            totalVagas: document.getElementById('vagasTotal').value ?
                parseInt(document.getElementById('vagasTotal').value) : null,
            notaGeral: parseFloat(document.getElementById('notaGeral').value) || 0,
            cotas: []
        };

        document.querySelectorAll('.cota-item-form').forEach(item => {
            const tipoInput = document.getElementById(`${item.id}_tipo`);
            const codigoInput = document.getElementById(`${item.id}_codigo`);
            const descricaoInput = document.getElementById(`${item.id}_descricao`);
            const notaInput = document.getElementById(`${item.id}_nota`);

            if (!tipoInput || !codigoInput || !descricaoInput || !notaInput) return;
            if (!notaInput.value) return;

            const cota = {
                tipo: tipoInput.value,
                codigo: codigoInput.value,
                descricao: descricaoInput.value,
                notaCorte: parseFloat(notaInput.value),
                vagas: document.getElementById(`${item.id}_vagas`)?.value ?
                    parseInt(document.getElementById(`${item.id}_vagas`).value) : null,
                colocacao: document.getElementById(`${item.id}_colocacao`)?.value ?
                    parseInt(document.getElementById(`${item.id}_colocacao`).value) : null,
                percentualBonus: document.getElementById(`${item.id}_bonus`) ?
                    parseFloat(document.getElementById(`${item.id}_bonus`).value) : 0,
                preenchida: document.getElementById(`${item.id}_preenchida`)?.checked || false,
                observacoes: document.getElementById(`${item.id}_obs`)?.value || ''
            };

            dados.cotas.push(cota);
        });

        return dados;
    }

    async salvarCurso() {
        const dados = this.coletarDadosFormulario();

        if (!dados.universidade || !dados.curso || !dados.vestibular || !dados.ano || !dados.notaGeral) {
            this.showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (dados.cotas.length === 0) {
            this.showNotification('Adicione pelo menos uma cota', 'error');
            return;
        }

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
                this.atualizarEstatisticas();
            } else {
                this.showNotification(result.message || 'Erro ao salvar curso', 'error');
                if (result.errors) {
                    console.error('Erros de validação:', result.errors);
                }
            }
        } catch (error) {
            console.error('Erro ao salvar curso:', error);
            this.showNotification('Erro ao conectar com o servidor', 'error');
        }
    }

    limparFormulario() {
        const form = document.getElementById('formAdicionarCurso');
        if (form) {
            form.reset();
        }

        const container = document.getElementById('cotasContainer');
        if (container) {
            container.innerHTML = '';
        }

        this.cotasExistentes.clear();
        const vestibular = document.getElementById('vestibular')?.value || 'PSC';
        this.adicionarCampoCota('AMPLA', 'Ampla Concorrência', vestibular);
    }

    getVestibularAtual() {
        const select = document.getElementById('vestibular');
        return select ? select.value : this.currentVestibular;
    }

    async carregarCursos(pagina = 1) {
        try {
            const container = document.getElementById('cursosContainer');
            if (!container) return;

            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Carregando cursos...</p></div>';

            const filtros = new URLSearchParams({
                page: pagina.toString(),
                limit: '20'
            });

            const vestibular = document.getElementById('filtroVestibular')?.value;
            const universidade = document.getElementById('filtroUniversidade')?.value;
            const ano = document.getElementById('filtroAno')?.value;
            const ativo = document.getElementById('filtroAtivo')?.value;
            const busca = document.getElementById('buscaCurso')?.value;

            if (vestibular) filtros.append('vestibular', vestibular);
            if (universidade) filtros.append('universidade', universidade);
            if (ano) filtros.append('ano', ano);
            if (ativo === 'ativo') filtros.append('ativo', 'true');
            if (ativo === 'inativo') filtros.append('ativo', 'false');
            if (busca) filtros.append('curso', busca);

            const response = await fetch(`${this.API_BASE_URL}/calculator/courses?${filtros.toString()}`);
            const result = await response.json();

            if (result.success) {
                this.cursos = result.courses;
                this.totalPages = result.pagination?.totalPages || 1;
                this.currentPage = pagina;

                this.renderCursos();
                this.renderPaginacao();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            const container = document.getElementById('cursosContainer');
            if (container) {
                container.innerHTML = `
                    <div class="error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar cursos: ${error.message}</p>
                    </div>
                `;
            }
        }
    }

    renderCursos() {
        const container = document.getElementById('cursosContainer');
        if (!container) return;

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
        if (!container) return;

        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        if (this.currentPage > 1) {
            html += `<button class="pagina-btn" onclick="admin.carregarCursos(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                     </button>`;
        }

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

    prepararImportacao() {
        const previewSection = document.getElementById('previewSection');
        const processImport = document.getElementById('processImport');
        const fileInfo = document.getElementById('fileInfo');

        if (previewSection) previewSection.style.display = 'none';
        if (processImport) processImport.disabled = true;
        if (fileInfo) fileInfo.innerHTML = '';
    }

    showModal(titulo, conteudo, onOpen = null) {
        const modal = document.getElementById('cursoModal');
        if (!modal) return;

        const titleElement = document.getElementById('modalCursoTitle');
        const contentElement = document.getElementById('modalCursoContent');

        if (titleElement) titleElement.textContent = titulo;
        if (contentElement) contentElement.innerHTML = conteudo;

        modal.classList.add('active');

        if (onOpen) {
            setTimeout(onOpen, 100);
        }
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
            background: ${tipo === 'success' ? '#d4edda' :
                tipo === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${tipo === 'success' ? '#155724' :
                tipo === 'error' ? '#721c24' : '#0c5460'};
            border-left: 4px solid ${tipo === 'success' ? '#28a745' :
                tipo === 'error' ? '#dc3545' : '#17a2b8'};
        `;

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Inicializar
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
`;
document.head.appendChild(adminStyles);