// redacao.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const form = document.getElementById('redacaoForm');
    const tituloInput = document.getElementById('tituloRedacao');
    const textoInput = document.getElementById('textoRedacao');
    const contadorCaracteres = document.getElementById('contadorCaracteres');
    const caracteresAtuais = document.getElementById('caracteresAtuais');
    const submitBtn = document.getElementById('submitRedacao');
    const estiloOptions = document.querySelectorAll('.estilo-option');
    const confirmaModal = document.getElementById('confirmaModal');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const btnNovaRedacao = document.getElementById('btnNovaRedacao');
    const modalInfo = document.getElementById('modalInfo');
    const redacoesRecentes = document.getElementById('redacoesRecentes');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const redacoesEnviadas = document.getElementById('redacoesEnviadas');
    const mediaNota = document.getElementById('mediaNota');
    const correcoesRestantes = document.getElementById('correcoesRestantes');
    const ultimaCorrecao = document.getElementById('ultimaCorrecao');

    // Configurações
    const API_BASE_URL = 'http://localhost:3000/api'; // Ajuste conforme sua API
    
    // Verificar autenticação
    const storedUser = localStorage.getItem('user');
    let user = null;
    
    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
            if (!user || !user.id) {
                redirectToLogin();
                return;
            }
        } catch (error) {
            console.error('Erro ao parsear usuário do localStorage:', error);
            redirectToLogin();
            return;
        }
    } else {
        redirectToLogin();
        return;
    }

    // Inicialização
    init();

    async function init() {
        if (!user || !user.id) {
            redirectToLogin();
            return;
        }
        addStyles();
        setupEventListeners();
        loadUserData();
        loadRedacoesRecentes();
        setupEstiloSelection();
        setupCharacterCounter();
        setupFormValidation();
    }

    function redirectToLogin() {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    // Carregar dados do usuário
    async function loadUserData() {
        if (!user || !user.id) {
            redirectToLogin();
            return;
        }

        try {
            // Atualizar informações do usuário na navbar
            if (userName) {
                userName.textContent = user.completename || user.name || 'Usuário';
            }
            
            if (userAvatar && user.profilePicture) {
                userAvatar.src = user.profilePicture;
            } else if (userAvatar) {
                // Avatar padrão se não tiver imagem
                userAvatar.src = 'https://cdn-icons-png.flaticon.com/512/12225/12225881.png';
            }

            // Carregar dados do dashboard para estatísticas de redação
            const response = await fetch(`${API_BASE_URL}/dashboard?userId=${user.id}`);
            const result = await response.json();

            if (result.success && result.data.redacao) {
                updateRedacaoStats(result.data.redacao);
            } else {
                // Se não tiver dados de redação, inicializar com zeros
                updateRedacaoStats({
                    total: 0,
                    mediaNota: 0,
                    correcoesRestantes: 4
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            showError('Erro ao carregar dados. Tente novamente.');
        }
    }

    function updateRedacaoStats(redacaoData) {
        if (redacoesEnviadas) {
            redacoesEnviadas.textContent = redacaoData.total || 0;
        }
        
        if (mediaNota) {
            mediaNota.textContent = redacaoData.mediaNota || '0.0';
        }
        
        if (correcoesRestantes) {
            const restantes = redacaoData.correcoesRestantes || 4;
            correcoesRestantes.textContent = restantes;
            
            // Verificar e atualizar botão de envio baseado nas correções restantes
            if (submitBtn && restantes <= 0) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-ban"></i> Limite de Correções Atingido';
                submitBtn.style.background = 'var(--cinza-escuro)';
            }
        }
        
        if (ultimaCorrecao) {
            // Isso será atualizado quando carregarmos as redações recentes
            ultimaCorrecao.textContent = 'Carregando...';
            ultimaCorrecao.className = 'status-value pendente';
        }
    }

    // Carregar redações recentes do usuário
    async function loadRedacoesRecentes() {
        if (!user || !user.id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/redacao/usuario/${user.id}`);
            const result = await response.json();

            if (redacoesRecentes) {
                if (result.success && result.redacoes && result.redacoes.length > 0) {
                    renderRedacoesRecentes(result.redacoes);
                    
                    // Atualizar última correção
                    const ultima = result.redacoes[0];
                    if (ultimaCorrecao) {
                        if (ultima.status === 'corrigido' && ultima.dataCorrecao) {
                            const data = new Date(ultima.dataCorrecao).toLocaleDateString('pt-BR');
                            ultimaCorrecao.textContent = data;
                            ultimaCorrecao.className = 'status-value corrigido';
                        } else {
                            ultimaCorrecao.textContent = 'Pendente';
                            ultimaCorrecao.className = 'status-value pendente';
                        }
                    }
                } else {
                    showNoRedacoesMessage();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar redações recentes:', error);
            showNoRedacoesMessage();
        }
    }

    function renderRedacoesRecentes(redacoes) {
    redacoesRecentes.innerHTML = '';
    
    // Ordenar por data (mais recente primeiro) e pegar as 5 mais recentes
    const recentes = redacoes
        .sort((a, b) => new Date(b.dataEnvio) - new Date(a.dataEnvio))
        .slice(0, 5);

    recentes.forEach(redacao => {
        const redacaoItem = document.createElement('div');
        redacaoItem.className = 'redacao-item';
        redacaoItem.dataset.id = redacao._id;
        
        redacaoItem.innerHTML = `
            <div class="redacao-header-item">
                <span class="redacao-titulo">${redacao.titulo}</span>
                <span class="redacao-estilo">${redacao.estilo.toUpperCase()}</span>
            </div>
            <div class="redacao-meta">
                Enviada em: ${new Date(redacao.dataEnvio).toLocaleDateString('pt-BR')}
                ${redacao.dataCorrecao ? 
                    `<br>Corrigida em: ${new Date(redacao.dataCorrecao).toLocaleDateString('pt-BR')}` : 
                    ''
                }
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <span class="redacao-status ${redacao.status === 'corrigido' ? 'status-corrigido' : 'status-pendente'}">
                    ${redacao.status === 'corrigido' ? 'Corrigido' : 'Aguardando correção'}
                </span>
                ${redacao.nota ? `<span class="redacao-nota">${formatNota(redacao.estilo, redacao.nota)}</span>` : ''}
                ${redacao.status === 'corrigido' ? 
                    `<button class="btn-ver-correcao" data-id="${redacao._id}">
                        <i class="fas fa-eye"></i> Ver
                    </button>` : 
                    ''
                }
            </div>
        `;
        redacoesRecentes.appendChild(redacaoItem);
    });

    // Adicionar event listeners aos botões de ver correção
    document.querySelectorAll('.btn-ver-correcao').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const redacaoId = this.dataset.id;
            await visualizarCorrecaoDetalhada(redacaoId);
        });
    });

    // Adicionar clique na redação para expandir texto (se não corrigida)
    document.querySelectorAll('.redacao-item .redacao-header-item').forEach(header => {
        const redacaoItem = header.closest('.redacao-item');
        const redacaoId = redacaoItem.dataset.id;
        const redacao = recentes.find(r => r._id === redacaoId);
        
        if (redacao && redacao.status !== 'corrigido') {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                mostrarTextoRedacao(redacao);
            });
        }
    });
}


    function formatNota(estilo, nota) {
        switch(estilo) {
            case 'enem':
                return `${nota}/1000`;
            case 'psc':
                return `${nota}/9`;
            case 'sis':
                return `${nota}/10`;
            case 'macro':
                return `${nota}/28`;
            default:
                return nota;
        }
    }

    function mostrarTextoRedacao(redacao) {
    // Criar modal para mostrar texto da redação
    const modalHTML = `
        <div class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh;">
                <div class="modal-header">
                    <h3>${redacao.titulo}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="overflow-y: auto;">
                    <div style="margin-bottom: 1rem; color: var(--cinza-escuro);">
                        <span><i class="fas fa-user"></i> ${user.completename || 'Você'}</span>
                        <span style="margin-left: 1rem;"><i class="fas fa-file-alt"></i> ${redacao.estilo.toUpperCase()}</span>
                        <span style="margin-left: 1rem;"><i class="far fa-calendar"></i> Enviada em: ${new Date(redacao.dataEnvio).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div style="background: var(--cinza-claro); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <h4 style="color: var(--azul); margin-bottom: 1rem;">Texto da Redação</h4>
                        <div class="texto-redacao">
                            ${formatarTextoRedacao(redacao.texto)}
                        </div>
                    </div>
                    
                    ${redacao.observacoes ? `
                        <div style="background: rgba(255, 152, 0, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--laranja); margin-bottom: 1rem;">
                            <strong><i class="fas fa-comment-dots"></i> Suas observações:</strong>
                            <p style="margin-top: 0.5rem;">${redacao.observacoes}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary fechar-modal">Fechar</button>
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);

    // Adicionar eventos para fechar modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    });
    
    modal.querySelector('.fechar-modal').addEventListener('click', () => {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        }
    });
}

async function visualizarCorrecaoDetalhada(redacaoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/redacao/usuario/${user.id}`);
        const result = await response.json();

        if (!result.success || !result.redacoes) {
            throw new Error('Redação não encontrada');
        }

        const redacao = result.redacoes.find(r => r._id === redacaoId);
        if (!redacao) {
            throw new Error('Redação não encontrada');
        }

        // Criar modal de visualização da correção
        const modalHTML = `
            <div class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
                    <div class="modal-header">
                        <h3>Correção: ${redacao.titulo}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" style="overflow-y: auto;">
                        <div style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <div style="color: var(--cinza-escuro);">
                                    <span><i class="fas fa-user"></i> ${user.completename || 'Você'}</span>
                                    <span style="margin-left: 1rem;"><i class="fas fa-file-alt"></i> ${redacao.estilo.toUpperCase()}</span>
                                </div>
                                <div class="nota-total" style="font-size: 1.5rem; font-weight: bold; color: var(--branco);">
                                    Nota: ${redacao.nota}\/${formatNota(redacao.estilo, redacao.nota).split('/')[1] || ''}
                                </div>
                            </div>
                            <div style="color: var(--cinza-escuro); font-size: 0.9rem;">
                                <span><i class="far fa-calendar"></i> Enviada em: ${new Date(redacao.dataEnvio).toLocaleDateString('pt-BR')}</span>
                                ${redacao.dataCorrecao ? 
                                    `<span style="margin-left: 1rem;"><i class="fas fa-check-circle"></i> Corrigida em: ${new Date(redacao.dataCorrecao).toLocaleDateString('pt-BR')}</span>` : 
                                    ''
                                }
                                ${redacao.professorCorretor ? 
                                    `<span style="margin-left: 1rem;"><i class="fas fa-chalkboard-teacher"></i> Corrigido por: ${redacao.professorCorretor}</span>` : 
                                    ''
                                }
                            </div>
                        </div>

                        <div style="background: var(--cinza-claro); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                            <h4 style="color: var(--azul); margin-bottom: 1rem;">Texto da Redação</h4>
                            <div class="texto-redacao">
                                ${formatarTextoRedacao(redacao.texto)}
                            </div>
                        </div>

                        ${redacao.observacoes ? `
                            <div style="background: rgba(255, 152, 0, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--laranja); margin-bottom: 1.5rem;">
                                <strong><i class="fas fa-comment-dots"></i> Suas observações:</strong>
                                <p style="margin-top: 0.5rem;">${redacao.observacoes}</p>
                            </div>
                        ` : ''}

                        ${redacao.competencias && redacao.competencias.length > 0 ? `
                            <div style="margin-bottom: 1.5rem;">
                                <h4 style="color: var(--azul); margin-bottom: 1rem;">Detalhes da Correção</h4>
                                <div style="display: grid; gap: 1rem; margin-bottom: 1.5rem;">
                                    ${redacao.competencias.map(comp => `
                                        <div style="background: white; border: 1px solid var(--cinza-medio); border-radius: 8px; padding: 1rem;">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                                <h5 style="margin: 0; color: var(--cinza-escuro);">${comp.nome}</h5>
                                                <span style="font-weight: bold; color: var(--azul);">${comp.nota}/${comp.maxNota}</span>
                                            </div>
                                            ${comp.comentarios ? `
                                                <div style="color: var(--cinza-escuro); font-size: 0.9rem; padding-top: 0.5rem; border-top: 1px solid var(--cinza-medio);">
                                                    <strong>Comentários:</strong> ${comp.comentarios}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${redacao.comentariosProfessor ? `
                            <div style="background: rgba(7, 7, 56, 0.05); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--azul);">
                                <h4 style="color: var(--azul); margin-bottom: 1rem;">
                                    <i class="fas fa-chalkboard-teacher"></i> Comentários do Professor
                                </h4>
                                <div style="color: var(--cinza-escuro); line-height: 1.6;">
                                    ${formatarTextoComentarios(redacao.comentariosProfessor)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary fechar-modal">Fechar</button>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);

        // Adicionar eventos para fechar modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('.fechar-modal').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                setTimeout(() => modal.remove(), 300);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar correção:', error);
        showError('Erro ao carregar detalhes da correção');
    }
}

// Adicionar esta função auxiliar após a função formatNota
function formatarTextoRedacao(texto) {
    if (!texto) return '<p style="color: var(--cinza-escuro); opacity: 0.7;">Texto não disponível</p>';
    
    const linhas = texto.split('\n');
    return linhas.map((linha, index) => 
        `<div style="padding: 0.5rem 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
            <span style="display: inline-block; width: 30px; color: var(--cinza-escuro); opacity: 0.6; text-align: right; margin-right: 10px; user-select: none;">
                ${index + 1}
            </span>
            ${linha || ' '}
        </div>`
    ).join('');
}

function formatarTextoComentarios(texto) {
    if (!texto) return '';
    
    const linhas = texto.split('\n');
    return linhas.map(linha => 
        `<p style="margin-bottom: 0.8rem;">${linha}</p>`
    ).join('');
}

    function showNoRedacoesMessage() {
        if (redacoesRecentes) {
            redacoesRecentes.innerHTML = `
                <div class="redacao-item vazia">
                    <div style="text-align: center; color: var(--cinza-escuro); opacity: 0.7; padding: 2rem;">
                        <i class="fas fa-file-alt" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Nenhuma redação enviada ainda</p>
                    </div>
                </div>
            `;
        }
        
        if (ultimaCorrecao) {
            ultimaCorrecao.textContent = 'Nenhuma';
            ultimaCorrecao.className = 'status-value pendente';
        }
    }

    // Configurar seleção de estilo
    function setupEstiloSelection() {
        estiloOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remover seleção de todas as opções
                estiloOptions.forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Adicionar seleção à opção clicada
                this.classList.add('selected');
                
                // Marcar o radio button correspondente
                const radio = this.querySelector('.estilo-radio');
                if (radio) {
                    radio.checked = true;
                }
                
                validateForm();
            });
        });
        
        // Selecionar ENEM por padrão
        const estiloEnem = document.querySelector('#estilo-enem');
        if (estiloEnem && estiloEnem.parentElement) {
            estiloEnem.parentElement.classList.add('selected');
            estiloEnem.checked = true;
        }
    }

    // Configurar contador de caracteres
    function setupCharacterCounter() {
        if (textoInput) {
            textoInput.addEventListener('input', function() {
                const caracteres = this.value.length;
                if (caracteresAtuais) {
                    caracteresAtuais.textContent = caracteres;
                }
                
                if (contadorCaracteres) {
                    if (caracteres > 4000) {
                        contadorCaracteres.classList.add('alerta');
                    } else {
                        contadorCaracteres.classList.remove('alerta');
                    }
                }
                
                validateForm();
            });
        }
    }

    // Configurar validação do formulário
    function setupFormValidation() {
        if (tituloInput) {
            tituloInput.addEventListener('input', validateForm);
        }
        
        if (textoInput) {
            textoInput.addEventListener('input', validateForm);
        }
    }

    function validateForm() {
        if (!tituloInput || !textoInput || !submitBtn) return false;

        const tituloValido = tituloInput.value.trim().length > 5;
        const textoValido = textoInput.value.trim().length >= 300;
        const textoMaximo = textoInput.value.length <= 4000;
        const estiloSelecionado = document.querySelector('input[name="estilo"]:checked');
        
        // Verificar se ainda tem correções disponíveis
        const restantes = correcoesRestantes ? parseInt(correcoesRestantes.textContent) : 4;
        const temCorrecoes = restantes > 0;
        
        const formValido = tituloValido && textoValido && textoMaximo && estiloSelecionado && temCorrecoes;
        
        submitBtn.disabled = !formValido;
        
        return formValido;
    }

    // Configurar eventos
    function setupEventListeners() {
        // Envio do formulário
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        // Modal
        if (btnFecharModal) {
            btnFecharModal.addEventListener('click', () => {
                if (confirmaModal) {
                    confirmaModal.style.display = 'none';
                }
            });
        }

        if (btnNovaRedacao) {
            btnNovaRedacao.addEventListener('click', () => {
                if (confirmaModal) {
                    confirmaModal.style.display = 'none';
                }
                // Rolar para o topo do formulário
                const formulario = document.querySelector('.formulario-redacao');
                if (formulario) {
                    formulario.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Fechar modal ao clicar fora
        if (confirmaModal) {
            confirmaModal.addEventListener('click', (e) => {
                if (e.target === confirmaModal) {
                    confirmaModal.style.display = 'none';
                }
            });
        }

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Menu mobile
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!user || !user.id) {
            redirectToLogin();
            return;
        }
        
        if (!validateForm()) {
            showError('Por favor, preencha todos os campos corretamente.');
            return;
        }

        // Obter dados do formulário
        const redacaoData = {
            userId: user.id,
            titulo: tituloInput.value.trim(),
            estilo: document.querySelector('input[name="estilo"]:checked').value,
            texto: textoInput.value.trim(),
            observacoes: document.getElementById('observacoesRedacao')?.value.trim() || ''
        };

        try {
            await enviarRedacao(redacaoData);
        } catch (error) {
            console.error('Erro ao enviar redação:', error);
            showError('Erro ao enviar redação. Tente novamente.');
        }
    }

    async function enviarRedacao(redacaoData) {
        if (!submitBtn) return;
        
        // Salvar estado original do botão
        const originalHTML = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;
        
        // Desabilitar botão durante envio
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/redacao/enviar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(redacaoData)
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar estatísticas
                if (redacoesEnviadas) {
                    const totalAtual = parseInt(redacoesEnviadas.textContent) || 0;
                    redacoesEnviadas.textContent = totalAtual + 1;
                }
                
                if (correcoesRestantes) {
                    const restantes = result.correcoesRestantes || 0;
                    correcoesRestantes.textContent = restantes;
                    
                    // Atualizar botão se atingiu limite
                    if (submitBtn && restantes <= 0) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<i class="fas fa-ban"></i> Limite de Correções Atingido';
                        submitBtn.style.background = 'var(--cinza-escuro)';
                    }
                }

                // Atualizar lista de redações
                await loadRedacoesRecentes();

                // Mostrar modal de confirmação
                if (modalInfo) {
                    modalInfo.textContent = `Correções restantes: ${result.correcoesRestantes || 0}`;
                }
                if (confirmaModal) {
                    confirmaModal.style.display = 'flex';
                }

                // Limpar formulário
                if (form) form.reset();
                
                // Resetar seleção de estilo
                estiloOptions.forEach(opt => {
                    opt.classList.remove('selected');
                });
                const estiloEnem = document.querySelector('#estilo-enem');
                if (estiloEnem && estiloEnem.parentElement) {
                    estiloEnem.parentElement.classList.add('selected');
                    estiloEnem.checked = true;
                }
                
                // Resetar contador
                if (caracteresAtuais) {
                    caracteresAtuais.textContent = '0';
                }
                if (contadorCaracteres) {
                    contadorCaracteres.classList.remove('alerta');
                }

                console.log('Redação enviada com sucesso:', result.data);
            } else {
                throw new Error(result.message || 'Erro ao enviar redação');
            }
        } catch (error) {
            console.error('Erro ao enviar redação:', error);
            throw error;
        } finally {
            // Restaurar botão apenas se não atingiu o limite
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = originalDisabled;
                validateForm();
            }
        }
    }

    function handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    function toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.classList.toggle('show');
        }
    }

    function showError(message) {
        // Criar um toast de erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: var(--vermelho); color: white; 
                        padding: 1rem; border-radius: 8px; z-index: 10000; box-shadow: 0 3px 10px rgba(0,0,0,0.2);">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Adicionar estilos para menu mobile e toast
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .nav-menu {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background: var(--azul);
                flex-direction: column;
                padding: 1rem;
                z-index: 1000;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            
            .nav-menu.show {
                display: flex;
            }
            
            .nav-item {
                width: 100%;
            }
            
            .nav-link {
                flex-direction: row;
                justify-content: flex-start;
                width: 100%;
                padding: 1rem;
                border-radius: 0;
            }
            
            .nav-icon {
                margin-bottom: 0;
                margin-right: 10px;
            }
        }
        
        .status-value.corrigido {
            color: var(--verde);
        }
        
        .status-value.pendente {
            color: var(--laranja);
        }
    `;
    document.head.appendChild(style);
});

function addStyles() {
    const styles = `
        .btn-ver-correcao {
            background: var(--azul);
            color: white;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        
        .btn-ver-correcao:hover {
            background: var(--azul-claro);
            transform: translateY(-2px);
        }
        
        .texto-redacao {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            font-size: 1rem;
            color: var(--cinza-escuro);
        }
        
        .nota-total {
            background: linear-gradient(135deg, var(--azul), var(--azul-claro));
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 10px;
            display: inline-block;
        }
        
        .status-corrigido {
            background: rgba(76, 175, 80, 0.1);
            color: var(--verde);
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        
        .status-pendente {
            background: rgba(255, 152, 0, 0.1);
            color: var(--laranja);
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        
        .redacao-nota {
            background: var(--azul);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
            width: 90%;
            max-width: 800px;
        }
        
        .modal-header {
            padding: 1.5rem;
            background: linear-gradient(135deg, var(--azul), var(--azul-claro));
            color: white;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 1.3rem;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.8rem;
            cursor: pointer;
            line-height: 1;
        }
        
        .modal-body {
            padding: 1.5rem;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .modal-footer {
            padding: 1rem 1.5rem;
            background: var(--cinza-claro);
            border-radius: 0 0 12px 12px;
            text-align: right;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { 
                opacity: 0;
                transform: translateY(-20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

document.getElementsByClassName("logo-text")[0].onclick = function () {
    window.location.href = "/dashboard.html";
};