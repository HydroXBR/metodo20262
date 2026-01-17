document.addEventListener('DOMContentLoaded', function() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.form-input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }
    
    function showNotification(message, type = 'error') {
        const notification = document.getElementById('authNotification');
        notification.textContent = message;
        notification.className = 'auth-notification ' + type;
        
        setTimeout(() => {
            notification.className = 'auth-notification';
        }, 5000);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                email: formData.get('email'),
                senha: formData.get('senha')
            };
            
            try {
                const response = await fetch('/api/login?' + new URLSearchParams({
                    email: data.email,
                    senha: data.senha
                }), {
                    method: 'GET'
                });
                
                const result = await response.json();
                console.log(result)
                
                if (result.success) {
                    showNotification('Login realizado com sucesso! Redirecionando...', 'success');
                    
                    localStorage.setItem('user', JSON.stringify({
                        id: result.user._id,
                        name: result.user.completename,
                        email: result.user.email,
                        turma: result.user.turma,
                        profilePicture: result.user.profilePicture,
                        permissions: result.user.permissions
                    }));
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    showNotification(result.reason || 'Erro ao fazer login', 'error');
                }
                
            } catch (error) {
                console.error('Erro no login:', error);
                showNotification('Erro de conexão. Verifique o servidor.', 'error');
            }
        });
    }
    
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const completename = formData.get('completename');
            let cpf = formData.get('cpf');
            const email = formData.get('email');
            const senha = formData.get('senha');
            const confirmarSenha = formData.get('confirmarSenha');
            const turma = formData.get('turma');
            
            if (senha !== confirmarSenha) {
                showNotification('As senhas não coincidem.', 'error');
                return;
            }
            
            if (senha.length < 6) {
                showNotification('A senha deve ter no mínimo 6 caracteres.', 'error');
                return;
            }
            
            cpf = cpf.replace(/\D/g, '');
            
            if (cpf.length !== 11) {
                showNotification('CPF deve ter 11 dígitos.', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/cadastro?' + new URLSearchParams({
                    completename: completename,
                    cpf: cpf,
                    email: email,
                    senha: senha,
                    turma: turma
                }), {
                    method: 'GET'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('Cadastro realizado com sucesso! Redirecionando para login...', 'success');
                    
                    cadastroForm.reset();
                    
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 3000);
                } else {
                    showNotification(result.reason || 'Erro ao cadastrar', 'error');
                }
                
            } catch (error) {
                console.error('Erro no cadastro:', error);
                showNotification('Erro de conexão. Verifique o servidor.', 'error');
            }
        });
    }
    
    function checkAuth() {
        const user = localStorage.getItem('user');
        if (user && (window.location.pathname.includes('login.html') || 
                     window.location.pathname.includes('cadastro.html'))) {
            window.location.href = 'index.html';
        }
    }
    
    checkAuth();
    
    window.logout = function() {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    };
    
    window.requireAuth = function() {
        const user = localStorage.getItem('user');
        if (!user && !window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('cadastro.html')) {
            window.location.href = 'login.html';
        }
        return user ? JSON.parse(user) : null;
    };
});