// index.js

document.addEventListener("DOMContentLoaded", () => {
  // ===== Mobile menu =====
  const btn = document.getElementById("mobileMenuBtn");
  const menu = document.getElementById("navMenu");

  if (btn && menu) {
    btn.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });

    // fecha ao clicar fora
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!menu.contains(target) && !btn.contains(target)) {
        menu.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ===== Contadores do hero =====
  const counters = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const duration = 1100;
    const start = performance.now();

    const step = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const value = Math.floor(target * (0.12 + 0.88 * p));
      el.textContent = target >= 1000 ? value.toLocaleString("pt-BR") : String(value);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target >= 1000 ? target.toLocaleString("pt-BR") : String(target);
    };

    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  counters.forEach((c) => counterObserver.observe(c));

  // ===== Reveal (animações de entrada) =====
  const revealEls = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.12 });

  revealEls.forEach((el) => revealObserver.observe(el));

  // ===== CARROSSEL DE APROVADOS =====
  const aprovadosTrack = document.getElementById("aprovadosTrack");
  
  if (aprovadosTrack) {
    // Lista de imagens dos aprovados (PNGs sem fundo)
    const alunosAprovados = [
      "https://i.ibb.co/BVc9wNL/Whats-App-Image-2025-03-15-at-23-47-36.png",  // Igor Duarte
      "https://i.ibb.co/bs0jS94/Whats-App-Image-2025-03-15-at-23-46-54.png",  // Andrezza
      "https://i.ibb.co/PZYpHLT/Whats-App-Image-2025-03-15-at-23-45-13.png",  // Hanna
      "https://i.ibb.co/4VbTj42/Whats-App-Image-2025-03-15-at-23-44-31.png",  // Breno
      "https://i.ibb.co/JtzpYQh/Whats-App-Image-2025-03-15-at-23-43-53.png",  // Ytalo
      "https://i.ibb.co/ZdKM0tc/Whats-App-Image-2025-03-15-at-23-43-01.png",  // Ravi
      "https://i.ibb.co/wK6V8RD/Whats-App-Image-2025-03-15-at-23-42-23.png",  // Giovanna
      "https://i.ibb.co/NSv3j6H/Whats-App-Image-2025-03-15-at-23-41-37.png",  // Priscila
      "https://i.ibb.co/KNw4hPv/Whats-App-Image-2025-03-15-at-23-40-31.png",  // Isadora
      "https://i.ibb.co/tD0CHnF/Whats-App-Image-2025-03-15-at-23-39-37.png",  // Ana Beatriz
      "https://i.ibb.co/H4grf7Q/Whats-App-Image-2025-03-15-at-23-38-52.png",  // Andreia
      "https://i.ibb.co/xS7Kttrh/lucasgab.png",  // Lucas Gabriel
      "https://i.ibb.co/5gvYVhNy/everthania.png"  // Everthania
    ];

    // Criar elementos de imagem duplicados para animação contínua
    const images = [...alunosAprovados, ...alunosAprovados]; // Duplica para transição suave
    
    images.forEach((src, index) => {
      const img = document.createElement("img");
      img.className = "aprovado-img";
      img.src = src;
      img.alt = `Aluno aprovado ${index + 1}`;
      img.loading = "lazy";
      img.setAttribute("data-index", index);
      aprovadosTrack.appendChild(img);
    });

    // Configurar velocidade da animação baseada no número de imagens
    const totalImages = images.length;
    const animationDuration = totalImages * 2; // 2 segundos por imagem
    aprovadosTrack.style.animationDuration = `${animationDuration}s`;

    // Pausar animação ao passar o mouse
    const marquee = document.querySelector(".aprovados-marquee");
    if (marquee) {
      marquee.addEventListener("mouseenter", () => {
        aprovadosTrack.style.animationPlayState = "paused";
      });
      
      marquee.addEventListener("mouseleave", () => {
        aprovadosTrack.style.animationPlayState = "running";
      });
    }

    // Ajustar tamanho das imagens baseado na largura da tela
    const adjustImageSize = () => {
      const images = document.querySelectorAll(".aprovado-img");
      const isMobile = window.innerWidth <= 768;
      images.forEach(img => {
        img.style.height = isMobile ? "120px" : "170px";
      });
    };

    // Ajustar inicialmente e ao redimensionar
    adjustImageSize();
    window.addEventListener("resize", adjustImageSize);
  }

  // ===== ANIMAÇÃO DO TÍTULO DO HERO =====
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.innerHTML = text
      .split(" ")
      .map(word => `<span class="hero-word">${word}</span>`)
      .join(" ");
    
    // Animar palavras sequencialmente
    const words = document.querySelectorAll(".hero-word");
    words.forEach((word, index) => {
      word.style.opacity = "0";
      word.style.transform = "translateY(10px)";
      
      setTimeout(() => {
        word.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        word.style.opacity = "1";
        word.style.transform = "translateY(0)";
      }, 100 + index * 50);
    });
  }
});