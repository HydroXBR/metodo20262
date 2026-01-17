// ========== SISTEMA DE AUTENTICAÇÃO ==========
let currentUser = null;

// Verificar autenticação
async function verificarAutenticacao() {
    const userDataStr = localStorage.getItem('user');

    if (!userDataStr) {
        console.log('Nenhum usuário no localStorage, redirecionando para login');
        return false;
    }

    try {
        const userData = JSON.parse(userDataStr);
        console.log('Usuário encontrado:', userData);

        // Estruturar o currentUser
        currentUser = {
            _id: userData.id,
            completename: userData.name || userData.completename,
            email: userData.email,
            turma: userData.turma,
            profilePicture: userData.profilePicture || userData.profilepicture,
            permissions: userData.permissions
        };

        console.log('CurrentUser estruturado:', currentUser);

        // Verificar se o usuário tem dados mínimos
        if (!currentUser._id || currentUser.permissions === undefined) {
            console.log('Dados do usuário incompletos');
            return false;
        }

        return true;

    } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
        return false;
    }
}

// Verificar permissões (nível 1 ou superior para admin)
function temPermissaoAdmin() {
    if (!currentUser) {
        console.log('currentUser não definido');
        return false;
    }

    console.log('Verificando permissões:', {
        permissions: currentUser.permissions,
        type: typeof currentUser.permissions,
        hasPermission: currentUser.permissions >= 1
    });

    return currentUser.permissions >= 1;
}

// Fazer logout
function fazerLogout() {
    localStorage.removeItem('user');
    currentUser = null;
    window.location.href = '/login';
}

// ========== FUNÇÕES DE FORMATAÇÃO ==========
function formatarDataHoje() {
    const data = new Date();
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    return `${dia} de ${mes} de ${ano}`;
}

function atualizarDataHora() {
    const now = new Date();
    const dataElement = document.getElementById('currentDate');
    const horaElement = document.getElementById('currentTime');

    if (dataElement) {
        dataElement.textContent = formatarDataHoje();
    }

    if (horaElement) {
        horaElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}

// ========== FUNÇÕES DE VALIDAÇÃO ==========
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Elimina CPFs inválidos conhecidos
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Valida 1º dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digitoVerificador1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;
    
    // Valida 2º dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digitoVerificador2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(cpf.charAt(10)) === digitoVerificador2;
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarTelefone(telefone) {
    const telefoneLimpo = telefone.replace(/[^\d]/g, '');
    return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
}

function validarDiaPagamento(dia) {
    return dia >= 1 && dia <= 31;
}

// ========== FUNÇÕES DE FORMATAÇÃO DE INPUT ==========
function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return cpf;
}

function formatarTelefone(tel) {
    tel = tel.replace(/\D/g, '');
    return tel;
}

function formatarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    cep = cep.replace(/^(\d{5})(\d)/, '$1-$2');
    return cep;
}

// ========== FUNÇÕES DE API ==========
async function verificarAlunoExistente(nome) {
    try {
        const response = await fetch(`/checkname?name=${encodeURIComponent(nome)}`);
        if (!response.ok) throw new Error('Erro ao verificar aluno');
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, reason: 'Erro na verificação' };
    }
}

async function cadastrarAluno(dados) {
    try {
        const params = new URLSearchParams();
        Object.keys(dados).forEach(key => {
            if (dados[key] !== undefined && dados[key] !== null) {
                params.append(key, dados[key]);
            }
        });

        const response = await fetch(`/cadastraradmin?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao cadastrar aluno');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, reason: 'Erro no cadastro' };
    }
}

// ========== FUNÇÕES DE UI ==========
function showNotification(message, type = 'info') {
    // Remover notificações antigas
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? 'var(--vermelho)' : type === 'success' ? 'var(--verde)' : 'var(--azul)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

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
`;
document.head.appendChild(style);

function showLoading(btn) {
    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processando...`;
}

function hideLoading(btn, originalText) {
    btn.classList.remove('loading');
    btn.disabled = false;
    btn.innerHTML = originalText;
}

function mostrarModalConfirmacao(dadosAluno) {
    const modal = document.getElementById('confirmModal');
    const detailsDiv = document.getElementById('confirmDetails');
    
    detailsDiv.innerHTML = `
        <p><strong>Aluno:</strong> ${dadosAluno.completename}</p>
        <p><strong>Responsável:</strong> ${dadosAluno.responsavel}</p>
        <p><strong>Turma:</strong> ${dadosAluno.turma}° Turma</p>
        <p><strong>Dia de Pagamento:</strong> ${dadosAluno.dia}</p>
        <p><strong>Telefone:</strong> ${dadosAluno.telresp}</p>
    `;
    
    modal.style.display = 'flex';
}

function mostrarModalErro(mensagem, detalhes) {
    const modal = document.getElementById('errorModal');
    const detailsDiv = document.getElementById('errorDetails');
    
    document.getElementById('errorMessage').textContent = mensagem;
    
    if (detalhes) {
        detailsDiv.innerHTML = `
            <p><strong>Detalhes do erro:</strong></p>
            <p>${detalhes}</p>
        `;
    } else {
        detailsDiv.innerHTML = '';
    }
    
    modal.style.display = 'flex';
}

function limparFormulario() {
    document.getElementById('formCadastro').reset();
    
    // Limpar estilos de validação
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('success', 'error');
    });
    
    // Focar no primeiro campo
    document.getElementById('completename').focus();
}

// ========== EVENT LISTENERS ==========
function configurarEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fazerLogout();
        });
    }

    // Voltar
    const btnVoltar = document.getElementById('btnVoltar');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            window.location.href = '/admin.html';
        });
    }

    // Limpar formulário
    const btnLimpar = document.getElementById('btnLimpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFormulario);
    }

    // Fechar modais
    const closeConfirmModal = document.getElementById('closeConfirmModal');
    const btnFecharConfirm = document.getElementById('btnFecharConfirm');
    const closeErrorModal = document.getElementById('closeErrorModal');
    const btnFecharError = document.getElementById('btnFecharError');

    if (closeConfirmModal) {
        closeConfirmModal.addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
        });
    }

    if (btnFecharConfirm) {
        btnFecharConfirm.addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
            window.location.href = '/admin.html';
        });
    }

    if (closeErrorModal) {
        closeErrorModal.addEventListener('click', () => {
            document.getElementById('errorModal').style.display = 'none';
        });
    }

    if (btnFecharError) {
        btnFecharError.addEventListener('click', () => {
            document.getElementById('errorModal').style.display = 'none';
        });
    }

    // Novo cadastro
    const btnNovoCadastro = document.getElementById('btnNovoCadastro');
    if (btnNovoCadastro) {
        btnNovoCadastro.addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
            limparFormulario();
        });
    }

    // Tentar novamente
    const btnTentarNovamente = document.getElementById('btnTentarNovamente');
    if (btnTentarNovamente) {
        btnTentarNovamente.addEventListener('click', () => {
            document.getElementById('errorModal').style.display = 'none';
            document.getElementById('btnCadastrar').click();
        });
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Formatação automática dos campos
    const cpfInput = document.getElementById('cpfresp');
    if (cpfInput) {
        cpfInput.addEventListener('input', function() {
            this.value = formatarCPF(this.value);
        });
    }

    const telRespInput = document.getElementById('telresp');
    if (telRespInput) {
        telRespInput.addEventListener('input', function() {
            this.value = formatarTelefone(this.value);
        });
    }

    const telAlInput = document.getElementById('telal');
    if (telAlInput) {
        telAlInput.addEventListener('input', function() {
            this.value = formatarTelefone(this.value);
        });
    }

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function() {
            this.value = formatarCEP(this.value);
        });
    }

    // Validação em tempo real
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validarEmail(this.value)) {
                this.classList.add('error');
                showNotification('Email inválido', 'warning');
            } else if (this.value) {
                this.classList.remove('error');
                this.classList.add('success');
            }
        });
    }

    const cpfInputVal = document.getElementById('cpfresp');
    if (cpfInputVal) {
        cpfInputVal.addEventListener('blur', function() {
            if (this.value && !validarCPF(this.value.replace(/\D/g, ''))) {
                this.classList.add('error');
                showNotification('CPF inválido', 'warning');
            } else if (this.value) {
                this.classList.remove('error');
                this.classList.add('success');
            }
        });
    }

    const diaInput = document.getElementById('dia');
    if (diaInput) {
        diaInput.addEventListener('blur', function() {
            if (this.value && !validarDiaPagamento(parseInt(this.value))) {
                this.classList.add('error');
                showNotification('Dia de pagamento deve ser entre 1 e 31', 'warning');
            } else if (this.value) {
                this.classList.remove('error');
                this.classList.add('success');
            }
        });
    }

    // Submissão do formulário
    const form = document.getElementById('formCadastro');
    const btnCadastrar = document.getElementById('btnCadastrar');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!btnCadastrar) return;
            
            const originalText = btnCadastrar.innerHTML;
            showLoading(btnCadastrar);
            
            try {
                // Coletar dados do formulário
                const dados = {
                    completename: document.getElementById('completename').value.trim(),
                    nascimento: document.getElementById('nascimento').value,
                    email: document.getElementById('email').value.trim(),
                    responsavel: document.getElementById('responsavel').value.trim(),
                    rgresp: document.getElementById('rgresp').value.trim(),
                    cpfresp: document.getElementById('cpfresp').value.replace(/[^\d]/g, ''),
                    telresp: document.getElementById('telresp').value.replace(/[^\d]/g, ''),
                    telal: document.getElementById('telal').value.replace(/[^\d]/g, ''),
                    endereco: document.getElementById('endereco').value.trim(),
                    bairro: document.getElementById('bairro').value.trim(),
                    cep: document.getElementById('cep').value.replace(/[^\d]/g, ''),
                    dia: document.getElementById('dia').value,
                    camisa: document.getElementById('camisa').value,
                    bolsista: document.getElementById('bolsista').value,
                    turma: document.getElementById('turma').value,
                    observacoes: document.getElementById('observacoes').value.trim()
                };
                
                // Validações
                if (!dados.completename) {
                    throw new Error('Nome completo é obrigatório');
                }
                
                if (!dados.nascimento) {
                    throw new Error('Data de nascimento é obrigatória');
                }
                
                if (!dados.responsavel) {
                    throw new Error('Nome do responsável é obrigatório');
                }
                
                if (!dados.rgresp) {
                    throw new Error('RG do responsável é obrigatório');
                }
                
                if (!dados.telresp) {
                    throw new Error('Telefone do responsável é obrigatório');
                }
                
                if (!validarTelefone(dados.telresp)) {
                    throw new Error('Telefone do responsável inválido');
                }
                
                if (dados.telal && !validarTelefone(dados.telal)) {
                    throw new Error('Telefone do aluno inválido');
                }
                
                if (dados.email && !validarEmail(dados.email)) {
                    throw new Error('Email inválido');
                }
                
                if (!dados.dia) {
                    throw new Error('Dia de pagamento é obrigatório');
                }
                
                if (!validarDiaPagamento(parseInt(dados.dia))) {
                    throw new Error('Dia de pagamento deve ser entre 1 e 31');
                }
                
                if (!dados.turma) {
                    throw new Error('Turma é obrigatória');
                }
                
                // Verificar se aluno já existe
                const verificacao = await verificarAlunoExistente(dados.completename);
                if (verificacao.success && verificacao.reason.includes("already")) {
                    throw new Error('Aluno já cadastrado anteriormente');
                }
                
                // Cadastrar aluno
                const resultado = await cadastrarAluno(dados);
                
                if (resultado.success) {
                    mostrarModalConfirmacao(dados);
                    showNotification('Aluno cadastrado com sucesso!', 'success');
                } else {
                    throw new Error(resultado.reason || 'Erro ao cadastrar aluno');
                }
                
            } catch (error) {
                console.error('Erro no cadastro:', error);
                mostrarModalErro('Erro ao cadastrar aluno', error.message);
                showNotification(error.message, 'error');
            } finally {
                hideLoading(btnCadastrar, originalText);
            }
        });
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM Carregado - Iniciando verificação de autenticação');
    
    // Verificar autenticação
    const autenticado = await verificarAutenticacao();
    console.log('Usuário autenticado?', autenticado);

    if (!autenticado) {
        console.log('Usuário não autenticado, redirecionando para login');
        window.location.href = '/login.html';
        return;
    }

    console.log('CurrentUser após autenticação:', currentUser);

    // Verificar permissões (nível 1+ para acessar admin)
    const temPermissao = temPermissaoAdmin();
    console.log('Tem permissão de admin?', temPermissao);

    if (!temPermissao) {
        console.log('Usuário não tem permissão de admin');
        // Mostrar mensagem de acesso negado
        document.body.innerHTML = `
            <div class="access-denied">
                <div class="denied-content">
                    <i class="fas fa-lock" style="font-size: 4rem; color: var(--vermelho); margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--vermelho); margin-bottom: 1rem;">Acesso Restrito</h2>
                    <p style="margin-bottom: 1.5rem; color: var(--cinza-escuro); max-width: 400px; text-align: center;">
                        Você precisa de permissões de administrador (nível 1 ou superior) para acessar esta página.
                    </p>
                    <p style="margin-bottom: 1.5rem; color: var(--cinza-escuro); font-size: 0.9rem;">
                        Nome: <strong>${currentUser?.completename || 'Não identificado'}</strong><br>
                        Permissões atuais: <strong>${currentUser?.permissions || 0}</strong>
                    </p>
                    <button onclick="window.location.href='/admin.html'" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i> Voltar para Administração
                    </button>
                </div>
            </div>
        `;

        // Adicionar estilo para a mensagem
        const style = document.createElement('style');
        style.textContent = `
            .access-denied {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: linear-gradient(135deg, var(--azul), var(--azul-claro));
            }
            .denied-content {
                background: white;
                padding: 3rem;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                max-width: 500px;
                width: 90%;
            }
            .btn {
                padding: 0.7rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .btn-primary {
                background: var(--vermelho);
                color: var(--branco);
            }
            .btn-primary:hover {
                background: #e60000;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(254, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(style);
        return;
    }

    console.log('Usuário tem permissão, configurando interface...');

    // ========== USUÁRIO AUTENTICADO E COM PERMISSÃO ==========

    // Atualizar informações do usuário na interface
    if (currentUser.completename) {
        const nomeCurto = currentUser.completename.split(" ")[0] || 'Administrador';
        document.getElementById('adminName').textContent = nomeCurto;
        document.getElementById('userName').textContent = nomeCurto;
    }

    if (currentUser.profilePicture && currentUser.profilePicture !== "" && currentUser.profilePicture !== "null") {
        document.getElementById('userAvatar').src = currentUser.profilePicture;
    } else {
        // Imagem padrão
        document.getElementById('userAvatar').src = "https://cdn-icons-png.flaticon.com/512/12225/12225881.png";
    }

    // Configurar data/hora
    atualizarDataHora();
    setInterval(atualizarDataHora, 60000);

    // Configurar todos os event listeners
    configurarEventListeners();

    // Definir data mínima para nascimento (100 anos atrás) e máxima (hoje)
    const hoje = new Date();
    const dataMinima = new Date();
    dataMinima.setFullYear(hoje.getFullYear() - 100);
    
    const nascimentoInput = document.getElementById('nascimento');
    if (nascimentoInput) {
        nascimentoInput.max = hoje.toISOString().split('T')[0];
        nascimentoInput.min = dataMinima.toISOString().split('T')[0];
    }

    // Definir data atual para o campo de nascimento como sugestão (15 anos atrás)
    const dataSugerida = new Date();
    dataSugerida.setFullYear(hoje.getFullYear() - 15);
    if (nascimentoInput && !nascimentoInput.value) {
        nascimentoInput.value = dataSugerida.toISOString().split('T')[0];
    }

    // Definir dia padrão para pagamento (10)
    const diaInput = document.getElementById('dia');
    if (diaInput && !diaInput.value) {
        diaInput.value = '10';
    }

    // Focar no primeiro campo
    setTimeout(() => {
        const primeiroCampo = document.getElementById('completename');
        if (primeiroCampo) {
            primeiroCampo.focus();
        }
    }, 500);

    // Verificar se a sessão expirou (verificação a cada 5 minutos)
    setInterval(async () => {
        const aindaAutenticado = await verificarAutenticacao();
        if (!aindaAutenticado) {
            fazerLogout();
        }
    }, 300000); // 5 minutos

    // Atualizar última atividade
    function updateLastActivity() {
        localStorage.setItem('lastActivity', Date.now().toString());
    }

    document.addEventListener('click', updateLastActivity);
    document.addEventListener('keypress', updateLastActivity);
    updateLastActivity();
});