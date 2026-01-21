document.addEventListener('DOMContentLoaded', function() {
    // Toggle mensal/anual
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const mensalPrices = document.querySelectorAll('.mensal-price');
    const anualPrices = document.querySelectorAll('.anual-price');
    const pricePeriods = document.querySelectorAll('.price-period');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.dataset.period;
            
            // Atualizar botões ativos
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar preços correspondentes
            if (period === 'anual') {
                showAnualPrices();
            } else {
                showMensalPrices();
            }
            
            // Efeito de clique
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    function showAnualPrices() {
        mensalPrices.forEach(price => price.classList.add('hidden'));
        anualPrices.forEach(price => price.classList.remove('hidden'));
        pricePeriods.forEach(period => {
            period.textContent = '/ ano';
        });
    }
    
    function showMensalPrices() {
        anualPrices.forEach(price => price.classList.add('hidden'));
        mensalPrices.forEach(price => price.classList.remove('hidden'));
        pricePeriods.forEach(period => {
            period.textContent = '/ mês';
        });
    }
    
    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Fechar outros itens
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Alternar item atual
            item.classList.toggle('active');
            
            // Efeito de animação
            item.style.transform = 'scale(1.02)';
            setTimeout(() => {
                item.style.transform = 'scale(1)';
            }, 200);
        });
    });
    
    // Animação de entrada dos cards
    const pricingCards = document.querySelectorAll('.plan-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });
    
    pricingCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
    
    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const navMobile = document.getElementById('navMobile');
    
    if (menuToggle && navMobile) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMobile.classList.toggle('active');
            
            if (navMobile.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Fechar menu ao clicar em um link
    const navLinks = document.querySelectorAll('.nav-mobile a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMobile.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
    
    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Botões de plano com efeito
    const planBtns = document.querySelectorAll('.plan-card .btn');
    
    planBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', function(e) {
            const planCard = this.closest('.plan-card');
            const planName = planCard.querySelector('.plan-name').textContent;
            
            // Efeito de clique
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Salvar plano selecionado no localStorage
            localStorage.setItem('selectedPlan', planName);
            
            // Feedback visual
            planCard.style.boxShadow = '0 0 0 3px rgba(254, 0, 0, 0.2)';
            setTimeout(() => {
                planCard.style.boxShadow = '';
            }, 500);
        });
    });
    
    // Inicializar com preços mensais
    showMensalPrices();
});