// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ===== MOBILE MENU TOGGLE =====
const menuToggle = document.getElementById('menuToggle');
const navMobile = document.getElementById('navMobile');

if (menuToggle && navMobile) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMobile.classList.toggle('active');
  });

  // Close mobile menu when clicking on a link
  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMobile.classList.remove('active');
    });
  });
}

// ===== CARROSSEL DE IMAGENS (15+ ALUNOS) =====
function initCarousel() {
  const carousel = document.getElementById('heroCarousel');
  const dotsContainer = document.getElementById('heroDots');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  
  if (!carousel) return;
  
  // ===== LISTA DE IMAGENS - COLOQUE AQUI SUAS 15+ IMAGENS =====
  const imagensAlunos = [
    // SUAS IMAGENS PNG (substitua pelos seus links)
    { src: 'https://i.ibb.co/HD8cdZ1t/5.png', alt: 'Aluno 1' },
    { src: 'https://i.ibb.co/xSWsPPV0/3.png', alt: 'Aluno 2' },
    { src: 'https://i.ibb.co/VpJb2JFd/1.png', alt: 'Aluno 3' },
    { src: 'https://i.ibb.co/Y4ZZ2TSb/2.png', alt: 'Aluno 4' },
    { src: 'https://i.ibb.co/ZpZF6Ymh/4.png', alt: 'Aluno 5' }
  ];
  
  // Limpar carrossel se já tiver slides
  carousel.innerHTML = '';
  
  // Criar slides com as imagens
  imagensAlunos.forEach((imagem, index) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    if (index === 0) slide.classList.add('active');
    
    const img = document.createElement('img');
    img.src = imagem.src;
    img.alt = imagem.alt;
    img.className = 'aluno-photo';
    
    slide.appendChild(img);
    carousel.appendChild(slide);
  });
  
  const slides = carousel.querySelectorAll('.carousel-slide');
  let currentIndex = 0;
  let autoSlideInterval;
  const slideDuration = 3000; // 3 segundos

  // Criar dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });
  }

  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove('active');
      slide.style.opacity = '0';
      slide.style.transition = 'opacity 0.5s ease';
      
      if (index === currentIndex) {
        slide.classList.add('active');
        slide.style.opacity = '1';
      }
    });
    
    // Atualizar transformação
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Atualizar dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    }
  }

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    updateSlides();
    restartAutoSlide();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  // Iniciar auto-slide
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, slideDuration);
  }

  function restartAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }

  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }

  // Event listeners para botões
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      restartAutoSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      restartAutoSlide();
    });
  }

  // Pausar auto-slide no hover
  carousel.addEventListener('mouseenter', stopAutoSlide);
  carousel.addEventListener('mouseleave', startAutoSlide);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      restartAutoSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      restartAutoSlide();
    }
  });

  // Swipe para mobile
  let startX = 0;
  let isDragging = false;

  carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    stopAutoSlide();
  });

  carousel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });

  carousel.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    isDragging = false;
    setTimeout(startAutoSlide, 3000); // Retoma auto-slide depois de 3 segundos
  });

  // Inicializar
  updateSlides();
  startAutoSlide();
}

// ===== DEPOIMENTOS CAROUSEL =====
function initDepoimentosCarousel() {
  const depoTrack = document.getElementById('depoTrack');
  const depoPrev = document.getElementById('depoPrev');
  const depoNext = document.getElementById('depoNext');
  const depoDots = document.getElementById('depoDots');
  
  if (!depoTrack) return;
  
  const depoCards = depoTrack.querySelectorAll('.depoimento-card');
  if (depoCards.length === 0) return;
  
  let depoCurrentIndex = 0;
  let depoResizeTimeout;

  function getCardsPerView() {
    const width = window.innerWidth;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  }

  function createDepoDots() {
    if (!depoDots) return;
    
    depoDots.innerHTML = '';
    const cardsPerView = getCardsPerView();
    const totalDots = Math.ceil(depoCards.length / cardsPerView);
    
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Ir para grupo ${i + 1}`);
      dot.addEventListener('click', () => goToDepoSlide(i));
      depoDots.appendChild(dot);
    }
  }

  function goToDepoSlide(index) {
    const cardsPerView = getCardsPerView();
    const maxIndex = Math.ceil(depoCards.length / cardsPerView) - 1;
    depoCurrentIndex = Math.max(0, Math.min(index, maxIndex));
    
    if (window.innerWidth >= 768) {
      const trackRect = depoTrack.getBoundingClientRect();
      const cardWidth = trackRect.width / cardsPerView;
      const offset = depoCurrentIndex * cardsPerView * cardWidth;
      depoTrack.style.transform = `translateX(-${offset}px)`;
    } else {
      const card = depoCards[depoCurrentIndex * cardsPerView];
      if (card) {
        card.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      }
    }
    
    updateDepoDots();
  }

  function updateDepoDots() {
    if (!depoDots) return;
    
    const dots = depoDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === depoCurrentIndex);
    });
  }

  if (depoPrev) {
    depoPrev.addEventListener('click', () => {
      goToDepoSlide(depoCurrentIndex - 1);
    });
  }

  if (depoNext) {
    depoNext.addEventListener('click', () => {
      goToDepoSlide(depoCurrentIndex + 1);
    });
  }

  function handleResize() {
    clearTimeout(depoResizeTimeout);
    depoResizeTimeout = setTimeout(() => {
      createDepoDots();
      goToDepoSlide(0);
      depoTrack.style.transition = 'none';
      setTimeout(() => {
        depoTrack.style.transition = 'transform 0.3s ease';
      }, 50);
    }, 250);
  }

  createDepoDots();
  goToDepoSlide(0);
  
  window.addEventListener('resize', handleResize);
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        if (history.pushState) {
          history.pushState(null, null, href);
        }
      }
    });
  });
}

// ===== ANIMAÇÕES =====
function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animateElements = document.querySelectorAll(
    '.sobre-card, .vestibular-card, .diferencial-card, .depoimento-card, .section-header'
  );
  
  animateElements.forEach(element => {
    observer.observe(element);
  });

  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.opacity = '1';
  }
}

// ===== INICIALIZAR TUDO =====
document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  initDepoimentosCarousel();
  initSmoothScroll();
  initAnimations();
});

// ===== CSS DINÂMICO PARA IMAGENS PNG =====
// Remove qualquer fundo ou borda das imagens
const dynamicCSS = document.createElement('style');
dynamicCSS.textContent = `
  /* Garantir que as imagens PNG fiquem sem fundo */
  .aluno-photo {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  
  .carousel-slide {
    background: transparent !important;
  }
  
  .carousel-container {
    background: transparent !important;
  }
  
  /* Ajuste para imagens muito grandes */
  .aluno-photo {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }
  
  /* Efeito de transição suave */
  .carousel-slide {
    transition: opacity 0.5s ease;
  }
  
  .carousel-slide:not(.active) {
    opacity: 0;
    pointer-events: none;
  }
  
  .carousel-slide.active {
    opacity: 1;
    pointer-events: all;
  }
`;

document.head.appendChild(dynamicCSS);