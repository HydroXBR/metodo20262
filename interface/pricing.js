document.addEventListener('DOMContentLoaded', function() {
    // Toggle mensal/anual
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const toggleSlider = document.querySelector('.toggle-slider');
    const mensalPrices = document.querySelectorAll('.mensal-price');
    const anualPrices = document.querySelectorAll('.anual-price');
    const pricePeriods = document.querySelectorAll('.price-period');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.dataset.period;
            
            // Atualizar botões ativos
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mover slider
            if (period === 'anual') {
                toggleSlider.style.transform = 'translateX(100%)';
                showAnualPrices();
            } else {
                toggleSlider.style.transform = 'translateX(0)';
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
    const pricingCards = document.querySelectorAll('.pricing-card');
    
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
    
    // Botões de plano com efeito
    const planBtns = document.querySelectorAll('.plan-btn');
    
    planBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', function(e) {
            const planName = this.closest('.pricing-card').querySelector('.plan-name').textContent;
            
            // Efeito de clique
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Salvar plano selecionado no localStorage
            localStorage.setItem('selectedPlan', planName);
        });
    });
    
    // Menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });
    }

});