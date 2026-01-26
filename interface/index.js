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

// ===== CARROSSEL DE IMAGENS (HERO) =====
function initHeroCarousel() {
  const carousel = document.getElementById('heroCarousel');
  const dotsContainer = document.getElementById('heroDots');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  
  if (!carousel) return;
  
  // Lista de imagens dos alunos (aumentei o carrossel como solicitado)
  const imagensAlunos = [
    { src: 'https://i.ibb.co/HD8cdZ1t/5.png', alt: 'Aluno 1' },
    { src: 'https://i.ibb.co/xSWsPPV0/3.png', alt: 'Aluno 2' },
    { src: 'https://i.ibb.co/VpJb2JFd/1.png', alt: 'Aluno 3' },
    { src: 'https://i.ibb.co/Y4ZZ2TSb/2.png', alt: 'Aluno 4' },
    { src: 'https://i.ibb.co/ZpZF6Ymh/4.png', alt: 'Aluno 5' },
    // Adicione mais imagens aqui se necessário
    { src: 'https://i.ibb.co/HD8cdZ1t/5.png', alt: 'Aluno 6' },
    { src: 'https://i.ibb.co/xSWsPPV0/3.png', alt: 'Aluno 7' },
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
  const slideDuration = 4000; // 4 segundos

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
    setTimeout(startAutoSlide, 4000);
  });

  // Inicializar
  updateSlides();
  startAutoSlide();
}

// ===== CARROSSEL DE PROFESSORES =====
function initProfessoresCarousel() {
  const profTrack = document.getElementById('profTrack');
  const profPrev = document.getElementById('profPrev');
  const profNext = document.getElementById('profNext');
  const profDots = document.getElementById('profDots');
  
  if (!profTrack) return;
  
  // Dados dos professores
  const professores = [
    {
      name: "Luana Dias",
      subject: "Medicina",
      experience: "UFAM PSC",
      image: "https://i.ibb.co/nqYrpxLy/luana.png"
    },
    {
      name: "Yuri Silveira",
      subject: "Ciências Contábeis",
      experience: "UFAM PSC",
      image: "https://i.ibb.co/qL8yK4RN/yuri.png"
    },
    {
      name: "Silas Santos",
      subject: "Direito",
      experience: "UFAM PSC",
      image: "https://i.ibb.co/GfGMGTBM/silas.png"
    },
    {
      name: "Joana Victoria",
      subject: "Direito",
      experience: "UFAM PSC",
      image: "https://i.ibb.co/PZ09559S/Joana.png"
    },
    {
      name: "Samuel Vicente",
      subject: "Medicina",
      experience: "UFAM PSC",
      image: "https://i.ibb.co/S76vDsLQ/samuelv.png"
    },
    {
      name: "Paulo Eduardo",
      subject: "Eng. da Computação",
      experience: "UFAM PSC",
      image: "https://i.ibb.co/HLV9QHd4/paulo.png"
    },
    {
      name: "Anna Jaques",
      subject: "Medicina",
      experience: "UFAM PSC",
      image: "https://i.ibb.co/Jjh4nYmj/jaques.png"
    }
  ];
  
  // Limpar track
  profTrack.innerHTML = '';
  
  // Criar slides dos professores
  professores.forEach(professor => {
    const slide = document.createElement('div');
    slide.className = 'professor-slide';
    
    slide.innerHTML = `
      <div class="professor-image">
        <img src="${professor.image}" alt="${professor.name}" loading="lazy">
      </div>
      <div class="professor-info">
        <h3>${professor.name}</h3>
        <span class="professor-subject">${professor.subject}</span>
        <div class="professor-experience">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
          </svg>
          <span>${professor.experience}</span>
        </div>
      </div>
    `;
    
    profTrack.appendChild(slide);
  });
  
  const slides = profTrack.querySelectorAll('.professor-slide');
  let currentIndex = 0;
  const slidesPerView = getSlidesPerView();
  let autoSlideInterval;
  
  function getSlidesPerView() {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 768) return 3;
    if (width >= 480) return 2;
    return 1;
  }
  
  function createDots() {
    if (!profDots) return;
    
    profDots.innerHTML = '';
    const totalDots = Math.ceil(slides.length / slidesPerView);
    
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Ir para grupo ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      profDots.appendChild(dot);
    }
  }
  
  function updateTrack() {
    const trackWidth = profTrack.clientWidth;
    const slideWidth = trackWidth / slidesPerView;
    const offset = currentIndex * slideWidth * slidesPerView;
    
    profTrack.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }
  
  function goToSlide(index) {
    const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateTrack();
    restartAutoSlide();
  }
  
  function nextSlide() {
    const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
    if (currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    } else {
      goToSlide(0);
    }
  }
  
  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else {
      const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
      goToSlide(maxIndex);
    }
  }
  
  function updateDots() {
    if (!profDots) return;
    
    const dots = profDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }
  
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }
  
  function restartAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }
  
  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }
  
  // Event listeners
  if (profPrev) {
    profPrev.addEventListener('click', () => {
      prevSlide();
      restartAutoSlide();
    });
  }
  
  if (profNext) {
    profNext.addEventListener('click', () => {
      nextSlide();
      restartAutoSlide();
    });
  }
  
  // Pausar no hover
  profTrack.addEventListener('mouseenter', stopAutoSlide);
  profTrack.addEventListener('mouseleave', startAutoSlide);
  
  // Responsividade
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newSlidesPerView = getSlidesPerView();
      if (newSlidesPerView !== slidesPerView) {
        currentIndex = 0;
        createDots();
        updateTrack();
      }
    }, 250);
  });
  
  // Inicializar
  createDots();
  updateTrack();
  startAutoSlide();
}

// ===== CARROSSEL DE DEPOIMENTOS =====
function initDepoimentosCarousel() {
  const depoTrack = document.getElementById('depoTrack');
  const depoPrev = document.getElementById('depoPrev');
  const depoNext = document.getElementById('depoNext');
  const depoDots = document.getElementById('depoDots');
  
  if (!depoTrack) return;
  
  // Dados dos depoimentos (com imagens maiores)
  const depoimentos = [
    {
      name: "Maria Almeida",
      course: "Medicina",
      university: "UFAM",
      position: "1º lugar PSC",
      text: "O Método foi fundamental para minha aprovação em Medicina na UFAM. Os professores são incríveis e o material é muito focado nos vestibulares daqui.",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "João Santos",
      course: "Direito",
      university: "UEA",
      position: "SIS",
      text: "Estudei 2 anos no Método e consegui minha vaga em Direito na UEA. O diferencial são os simulados semanais que nos deixam preparados para qualquer prova.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Ana Costa",
      course: "Engenharia Civil",
      university: "UFAM",
      position: "ENEM",
      text: "Graças ao Método consegui uma ótima nota no ENEM e entrei em Engenharia Civil. O plantão de dúvidas fez toda a diferença na minha preparação.",
      image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Pedro Oliveira",
      course: "Pedagogia",
      university: "UFAM Parintins",
      position: "PSI",
      text: "O material focado no PSI foi essencial. Consegui minha vaga no campus de Parintins e hoje curso Pedagogia. Recomendo demais!",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Larissa Souza",
      course: "Odontologia",
      university: "UEA",
      position: "Macro",
      text: "Passei no Macro para Odontologia! Os professores conhecem a prova como ninguém e sabem exatamente o que a UEA cobra.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Rafael Ferreira",
      course: "Enfermagem",
      university: "UEA",
      position: "SIS",
      text: "Fiz o intensivo de 6 meses e consegui passar em Enfermagem. A dedicação dos professores é impressionante, estão sempre disponíveis.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    }
  ];
  
  // Limpar track
  depoTrack.innerHTML = '';
  
  // Criar slides dos depoimentos
  depoimentos.forEach(depoimento => {
    const slide = document.createElement('div');
    slide.className = 'depoimento-slide';
    
    slide.innerHTML = `
      <div class="depoimento-header">
        <img src="${depoimento.image}" alt="${depoimento.name}" class="depoimento-image" loading="lazy">
        <div class="depoimento-overlay">
          <div class="depoimento-course">${depoimento.course}</div>
          <div class="depoimento-university">${depoimento.university} • ${depoimento.position}</div>
        </div>
      </div>
      <div class="depoimento-content">
        <p class="depoimento-text">${depoimento.text}</p>
        <div class="depoimento-author">
          <div class="author-avatar">${depoimento.name.split(' ').map(n => n[0]).join('')}</div>
          <div class="author-info">
            <strong>${depoimento.name}</strong>
            <span>${depoimento.course} - ${depoimento.university} (${depoimento.position})</span>
          </div>
        </div>
      </div>
    `;
    
    depoTrack.appendChild(slide);
  });
  
  const slides = depoTrack.querySelectorAll('.depoimento-slide');
  let currentIndex = 0;
  const slidesPerView = getSlidesPerView();
  let autoSlideInterval;
  
  function getSlidesPerView() {
    const width = window.innerWidth;
    if (width >= 1200) return 3;
    if (width >= 768) return 2;
    return 1;
  }
  
  function createDots() {
    if (!depoDots) return;
    
    depoDots.innerHTML = '';
    const totalDots = Math.ceil(slides.length / slidesPerView);
    
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Ir para grupo ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      depoDots.appendChild(dot);
    }
  }
  
  function updateTrack() {
    const trackWidth = depoTrack.clientWidth;
    const slideWidth = trackWidth / slidesPerView;
    const offset = currentIndex * slideWidth * slidesPerView;
    
    depoTrack.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }
  
  function goToSlide(index) {
    const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateTrack();
    restartAutoSlide();
  }
  
  function nextSlide() {
    const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
    if (currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    } else {
      goToSlide(0);
    }
  }
  
  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else {
      const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
      goToSlide(maxIndex);
    }
  }
  
  function updateDots() {
    if (!depoDots) return;
    
    const dots = depoDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }
  
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 6000);
  }
  
  function restartAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }
  
  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }
  
  // Event listeners
  if (depoPrev) {
    depoPrev.addEventListener('click', () => {
      prevSlide();
      restartAutoSlide();
    });
  }
  
  if (depoNext) {
    depoNext.addEventListener('click', () => {
      nextSlide();
      restartAutoSlide();
    });
  }
  
  // Pausar no hover
  depoTrack.addEventListener('mouseenter', stopAutoSlide);
  depoTrack.addEventListener('mouseleave', startAutoSlide);
  
  // Responsividade
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newSlidesPerView = getSlidesPerView();
      if (newSlidesPerView !== slidesPerView) {
        currentIndex = 0;
        createDots();
        updateTrack();
      }
    }, 250);
  });
  
  // Inicializar
  createDots();
  updateTrack();
  startAutoSlide();
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
    '.sobre-card, .vestibular-card, .diferencial-card, .depoimento-slide, .professor-slide, .section-header'
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
  initHeroCarousel();
  initProfessoresCarousel();
  initDepoimentosCarousel();
  initSmoothScroll();
  initAnimations();
});

// ===== CSS DINÂMICO PARA IMAGENS PNG =====
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
  
  /* Melhorar performance em mobile */
  @media (max-width: 768px) {
    .carousel-slide,
    .professor-slide,
    .depoimento-slide {
      will-change: transform;
    }
  }
`;

document.head.appendChild(dynamicCSS);