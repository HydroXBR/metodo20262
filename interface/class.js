document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = '/api';
    
    // Verificar autenticação e carregar usuário
    let user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Se não tiver ID, buscar do servidor
    if (!user.id && user._id) {
        user.id = user._id;
    }
    
    if (!user.id) {
        console.error('Usuário não autenticado corretamente');
        window.location.href = 'login.html';
        return;
    }

    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const aulaId = urlParams.get('id');
    const cursoId = urlParams.get('curso');
    
    if (!aulaId || !cursoId) {
        window.location.href = 'courses.html';
        return;
    }

    // Estado atual
    let currentState = {
        aulaId: aulaId,
        cursoId: cursoId,
        aula: null,
        curso: null,
        materias: [],
        aulasDoCurso: []
    };

    // Inicializar página
    async function initPage() {
        try {
            // Atualizar informações do usuário
            await updateUserInfo();
            
            // Carregar curso
            await loadCursoInfo();
            
            // Carregar todas as matérias e aulas
            await loadMateriasEAulas();
            
            // Carregar aula específica
            await loadAula();
            
            // Renderizar lista de aulas no sidebar
            renderAulasSidebar();
            
            // Setup event listeners
            setupEventListeners();
            
        } catch (error) {
            console.error('Erro ao inicializar página:', error);
            showError('Erro ao carregar a aula. Tente novamente.');
        }
    }

    async function updateUserInfo() {
        try {
            if (user.completename) {
                document.getElementById('userName').textContent = user.completename;
                if (user.profilePicture) {
                    document.getElementById('userAvatar').src = user.profilePicture;
                }
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/dashboard?userId=${user.id}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                user = { ...user, ...data.data.userInfo };
                localStorage.setItem('user', JSON.stringify(user))
                
                document.getElementById('userName').textContent = user.name.split(" ")[0] || 'Estudante';
                if (user.profilePicture) {
                    document.getElementById('userAvatar').src = user.profilePicture;
                }
            }
            
        } catch (error) {
            console.error('Erro ao carregar informações do usuário:', error);
            document.getElementById('userName').textContent = user.completename || 'Estudante';
        }
    }

    async function loadCursoInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/course/${cursoId}?userId=${user.id}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Curso não encontrado');
            }
            
            currentState.curso = data.course;
            
        } catch (error) {
            console.error('Erro ao carregar curso:', error);
            window.location.href = 'courses.html';
        }
    }

    async function loadMateriasEAulas() {
        try {
            const materias = currentState.curso?.subjects || [];
            currentState.materias = [];
            currentState.aulasDoCurso = [];
            
            for (const materia of materias) {
                const response = await fetch(`${API_BASE_URL}/course/${cursoId}/subject/${materia.id}`);
                const data = await response.json();
                
                if (data.success) {
                    const materiaCompleta = {
                        ...materia,
                        aulas: data.lessons || []
                    };
                    
                    currentState.materias.push(materiaCompleta);
                    
                    // Adicionar todas as aulas com referência à matéria
                    data.lessons.forEach(aula => {
                        currentState.aulasDoCurso.push({
                            ...aula,
                            materiaId: materia.id,
                            materiaNome: materia.name,
                            materiaIcon: materia.icon
                        });
                    });
                }
            }
            
            // Ordenar aulas por ordem
            currentState.aulasDoCurso.sort((a, b) => a.order - b.order);
            
        } catch (error) {
            console.error('Erro ao carregar matérias e aulas:', error);
        }
    }

    async function loadAula() {
        try {
            // Buscar aula específica
            const aula = currentState.aulasDoCurso.find(a => a.id === currentState.aulaId);
            
            if (!aula) {
                // Se não encontrou na lista, buscar diretamente
                // Primeiro precisamos saber a qual matéria pertence
                const response = await fetch(`${API_BASE_URL}/lesson/${currentState.aulaId}`);
                const data = await response.json();
                
                if (data.success) {
                    currentState.aula = data.lesson;
                } else {
                    throw new Error('Aula não encontrada');
                }
            } else {
                currentState.aula = aula;
            }
            
            // Atualizar UI com informações da aula
            updateAulaUI();
            
            // Carregar vídeo
            loadVideoPlayer();
            
            // Carregar recursos
            loadRecursos();
            
            // Carregar comentários
            await loadComentarios();
            
            // Registrar visualização
            await registrarVisualizacao();
            
        } catch (error) {
            console.error('Erro ao carregar aula:', error);
            showError('Aula não encontrada. Redirecionando...');
            setTimeout(() => {
                window.location.href = `course.html?curso=${cursoId}`;
            }, 2000);
        }
    }

    function updateAulaUI() {
        const aula = currentState.aula;
        if (!aula) return;
        
        document.getElementById('lessonTitle').textContent = aula.title;
        document.getElementById('lessonProfessor').textContent = aula.professor || 'Professor';
        document.getElementById('lessonDuration').textContent = formatDuration(aula.duration);
        document.getElementById('lessonDescription').innerHTML = `<p>${aula.description || 'Sem descrição disponível.'}</p>`;
        
        // Encontrar matéria da aula
        const materia = currentState.materias.find(m => 
            m.aulas?.some(a => a.id === aula.id)
        );
        
        if (materia) {
            document.getElementById('lessonSubject').textContent = materia.name;
        }
        
        // Atualizar data de publicação (simplificado)
        document.getElementById('lessonDate').textContent = new Date().toLocaleDateString('pt-BR');
    }

    function formatDuration(minutes) {
        if (!minutes) return '--:--';
        if (minutes >= 60) {
            const horas = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${horas}:${mins.toString().padStart(2, '0')}h`;
        }
        return `${minutes}min`;
    }

    function loadVideoPlayer() {
        const videoContainer = document.getElementById('videoContainer');
        if (!videoContainer) return;
        
        const aula = currentState.aula;
        if (!aula) return;
        
        // Limpar container
        videoContainer.innerHTML = '';
        
        if (aula.videoUrl) {
            // Verificar se é YouTube
            if (aula.videoUrl.includes('youtube.com') || aula.videoUrl.includes('youtu.be')) {
                const videoId = extractYouTubeId(aula.videoUrl);
                if (videoId) {
                    videoContainer.innerHTML = `
                        <div class="video-wrapper">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    `;
                    return;
                }
            }
            
            // Para outros vídeos
            videoContainer.innerHTML = `
                <div class="video-wrapper">
                    <video controls controlsList="nodownload">
                        <source src="${aula.videoUrl}" type="video/mp4">
                        Seu navegador não suporta vídeos HTML5.
                    </video>
                </div>
            `;
        } else {
            // Se não houver vídeo, mostrar placeholder
            videoContainer.innerHTML = `
                <div class="video-placeholder" style="position: absolute; width: 100%; height: 100%;">
                    <i class="fas fa-play-circle" style="font-size: 4rem; color: var(--vermelho);"></i>
                    <p style="margin-top: 1rem; font-size: 1.2rem; color: var(--branco);">Conteúdo teórico</p>
                    <small style="color: rgba(255,255,255,0.7);">Esta aula não possui vídeo</small>
                </div>
            `;
        }
    }

    function extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    function loadRecursos() {
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (!resourcesGrid) return;
        
        const aula = currentState.aula;
        if (!aula) return;
        
        resourcesGrid.innerHTML = '';
        
        if (!aula.resources || aula.resources.length === 0) {
            resourcesGrid.innerHTML = `
                <div class="empty-resources">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--cinza-medio);"></i>
                    <p style="color: var(--cinza-escuro); margin-top: 1rem;">Nenhum recurso disponível para esta aula</p>
                </div>
            `;
            return;
        }
        
        aula.resources.forEach(recurso => {
            const icon = getResourceIcon(recurso.type);
            
            const resourceItem = document.createElement('div');
            resourceItem.className = 'resource-item';
            resourceItem.innerHTML = `
                <div class="resource-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="resource-info">
                    <h4>${recurso.title || 'Recurso'}</h4>
                    <p>${recurso.description || ''}</p>
                </div>
                <a href="${recurso.url}" target="_blank" class="resource-download" ${recurso.type === 'link' ? '' : 'download'}>
                    <i class="fas fa-${recurso.type === 'link' ? 'external-link-alt' : 'download'}"></i>
                </a>
            `;
            
            resourcesGrid.appendChild(resourceItem);
        });
    }

    function getResourceIcon(type) {
        const icons = {
            'pdf': 'fas fa-file-pdf',
            'ppt': 'fas fa-file-powerpoint',
            'doc': 'fas fa-file-word',
            'link': 'fas fa-link',
            'quiz': 'fas fa-question-circle'
        };
        return icons[type] || 'fas fa-file';
    }

    async function loadComentarios() {
        const commentsContainer = document.getElementById('commentsContainer');
        if (!commentsContainer) return;
        
        commentsContainer.innerHTML = '<div class="loading">Carregando comentários...</div>';
        
        try {
            // Em uma implementação real, você teria um endpoint específico para comentários
            // Por enquanto, usaremos os comentários que já vieram com a aula
            const comentarios = currentState.aula?.comments || [];
            
            if (comentarios.length === 0) {
                commentsContainer.innerHTML = `
                    <div class="no-comments">
                        <i class="fas fa-comment-slash" style="font-size: 2rem; color: var(--cinza-medio);"></i>
                        <p style="color: var(--cinza-escuro); margin-top: 1rem; text-align: center;">
                            Nenhum comentário ainda.<br>
                            Seja o primeiro a comentar!
                        </p>
                    </div>
                `;
                return;
            }
            
            // Ordenar por data (mais recentes primeiro)
            comentarios.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            commentsContainer.innerHTML = '';
            
            comentarios.forEach(comentario => {
                const commentItem = document.createElement('div');
                commentItem.className = 'comment-item';
                
                const initials = getInitials(comentario.authorName);
                
                commentItem.innerHTML = `
                    <div class="comment-header">
                        <div class="comment-avatar">${initials}</div>
                        <div class="comment-author">
                            <h4>${comentario.authorName}</h4>
                            <span>${new Date(comentario.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                    <div class="comment-content">
                        ${comentario.comment}
                    </div>
                    <div class="comment-actions">
                        <button class="comment-action">
                            <i class="fas fa-thumbs-up"></i>
                            <span>Útil</span>
                        </button>
                        <button class="comment-action">
                            <i class="fas fa-reply"></i>
                            <span>Responder</span>
                        </button>
                    </div>
                `;
                
                commentsContainer.appendChild(commentItem);
            });
            
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            commentsContainer.innerHTML = `
                <div class="error-comments">
                    <i class="fas fa-exclamation-circle" style="color: var(--vermelho);"></i>
                    <p style="color: var(--vermelho);">Erro ao carregar comentários</p>
                </div>
            `;
        }
    }

    function getInitials(name) {
        if (!name) return 'U';
        return name.split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    function renderAulasSidebar() {
        const courseLessons = document.getElementById('courseLessons');
        if (!courseLessons) return;
        
        courseLessons.innerHTML = '';
        
        if (currentState.aulasDoCurso.length === 0) {
            courseLessons.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--cinza-escuro);">
                    <i class="fas fa-video-slash"></i>
                    <p>Nenhuma aula disponível</p>
                </div>
            `;
            return;
        }
        
        currentState.aulasDoCurso.forEach((aula, index) => {
            const isActive = aula.id === currentState.aulaId;
            
            const lessonItem = document.createElement('div');
            lessonItem.className = `sidebar-lesson-item ${isActive ? 'active' : ''}`;
            lessonItem.dataset.aulaId = aula.id;
            
            // Encontrar ícone da matéria
            const materia = currentState.materias.find(m => m.id === aula.materiaId);
            const materiaIcon = materia?.icon || 'fas fa-video';
            
            lessonItem.innerHTML = `
                <div class="sidebar-lesson-icon">
                    <i class="${materiaIcon}"></i>
                </div>
                <div class="sidebar-lesson-info">
                    <h5>Aula ${index + 1}</h5>
                    <span>${aula.title.substring(0, 40)}${aula.title.length > 40 ? '...' : ''}</span>
                </div>
                <span class="sidebar-lesson-duration">${formatDurationShort(aula.duration)}</span>
            `;
            
            lessonItem.addEventListener('click', () => {
                window.location.href = `class.html?id=${aula.id}&curso=${cursoId}`;
            });
            
            courseLessons.appendChild(lessonItem);
        });
    }

    function formatDurationShort(minutes) {
        if (!minutes) return '--';
        if (minutes >= 60) {
            const horas = Math.floor(minutes / 60);
            return `${horas}h`;
        }
        return `${minutes}m`;
    }

    async function registrarVisualizacao() {
        try {
            // Registrar aula assistida
            await fetch(`${API_BASE_URL}/course/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    courseId: currentState.cursoId,
                    lessonId: currentState.aulaId
                })
            });
            
            // Atualizar botão de "Marcar como concluída"
            updateCompleteButton();
            
        } catch (error) {
            console.error('Erro ao registrar visualização:', error);
        }
    }

    async function updateCompleteButton() {
        try {
            // Verificar se a aula já foi concluída
            const response = await fetch(`${API_BASE_URL}/course/${cursoId}?userId=${user.id}`);
            const data = await response.json();
            
            if (data.success && data.progress) {
                const isCompleted = data.progress.completedLessons?.includes(currentState.aulaId) || false;
                
                const markBtn = document.getElementById('markCompleteBtn');
                if (markBtn) {
                    markBtn.innerHTML = `
                        <i class="fas fa-${isCompleted ? 'check-circle' : 'check'}"></i>
                        <span>${isCompleted ? 'Aula Concluída' : 'Marcar como concluída'}</span>
                    `;
                    
                    markBtn.style.background = isCompleted 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : 'linear-gradient(135deg, var(--vermelho), #FF4444)';
                    markBtn.style.color = isCompleted ? 'var(--verde)' : 'var(--branco)';
                }
            }
        } catch (error) {
            console.error('Erro ao verificar progresso:', error);
        }
    }

    function setupEventListeners() {
        // Botão de voltar ao curso
        document.getElementById('backToCourse').addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = `course.html?curso=${cursoId}`;
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        });
        
        // Marcar como concluída
        document.getElementById('markCompleteBtn').addEventListener('click', async function() {
            try {
                const isCurrentlyCompleted = this.innerHTML.includes('Aula Concluída');
                
                const response = await fetch(`${API_BASE_URL}/course/progress`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        courseId: currentState.cursoId,
                        lessonId: currentState.aulaId
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    updateCompleteButton();
                    
                    if (!isCurrentlyCompleted) {
                        showSuccess('Aula marcada como concluída!');
                    }
                }
            } catch (error) {
                console.error('Erro ao marcar aula como concluída:', error);
                showError('Erro ao atualizar progresso');
            }
        });
        
        // Navegação entre aulas
        document.getElementById('prevLessonBtn').addEventListener('click', navigateToPrevLesson);
        document.getElementById('nextLessonBtn').addEventListener('click', navigateToNextLesson);
        
        // Adicionar comentário
        document.getElementById('addCommentBtn').addEventListener('click', function() {
            const commentText = prompt('Digite seu comentário:');
            if (commentText && commentText.trim()) {
                enviarComentario(commentText);
            }
        });
        
        // Menu mobile
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', function() {
                this.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    }

    function navigateToPrevLesson() {
        const currentIndex = currentState.aulasDoCurso.findIndex(a => a.id === currentState.aulaId);
        if (currentIndex > 0) {
            const prevAula = currentState.aulasDoCurso[currentIndex - 1];
            window.location.href = `class.html?id=${prevAula.id}&curso=${cursoId}`;
        } else {
            showInfo('Esta é a primeira aula do curso');
        }
    }

    function navigateToNextLesson() {
        const currentIndex = currentState.aulasDoCurso.findIndex(a => a.id === currentState.aulaId);
        if (currentIndex < currentState.aulasDoCurso.length - 1) {
            const nextAula = currentState.aulasDoCurso[currentIndex + 1];
            window.location.href = `class.html?id=${nextAula.id}&curso=${cursoId}`;
        } else {
            showInfo('Esta é a última aula do curso');
        }
    }

    async function enviarComentario(texto) {
        try {
            const response = await fetch(`${API_BASE_URL}/course/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    lessonId: currentState.aulaId,
                    comment: texto
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showSuccess('Comentário enviado com sucesso!');
                // Recarregar comentários
                await loadComentarios();
            } else {
                showError('Erro ao enviar comentário: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
            showError('Erro ao enviar comentário');
        }
    }

    function showError(message) {
        showNotification(message, 'error');
    }

    function showSuccess(message) {
        showNotification(message, 'success');
    }

    function showInfo(message) {
        showNotification(message, 'info');
    }

    function showNotification(message, type) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Adicionar estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Inicializar
    initPage();
});