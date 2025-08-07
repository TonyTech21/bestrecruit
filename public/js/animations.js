// AdvanceTravels - Professional Animation System

class AnimationController {
  constructor() {
    this.init();
  }

  init() {
    this.setupScrollAnimations();
    this.setupCounterAnimations();
    this.setupParallaxEffects();
    this.setupInteractiveElements();
    this.setupLoadingAnimations();
  }

  // Scroll-triggered animations with Intersection Observer
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animationType = element.dataset.animation || 'fadeInUp';
          const delay = element.dataset.delay || 0;
          
          setTimeout(() => {
            element.classList.add('animate', animationType);
          }, delay);

          // Unobserve after animation to improve performance
          animationObserver.unobserve(element);
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('[data-animation]').forEach(el => {
      animationObserver.observe(el);
    });
  }

  // Professional counter animations for statistics
  setupCounterAnimations() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  animateCounter(element) {
    const target = parseInt(element.dataset.counter);
    const duration = parseInt(element.dataset.duration) || 2000;
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    
    const startTime = performance.now();
    const startValue = 0;

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (target - startValue) * easeOut);
      
      element.textContent = prefix + current.toLocaleString() + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }

  // Advanced parallax effects
  setupParallaxEffects() {
    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.pageYOffset;
      
      // Hero parallax
      const heroParticles = document.querySelector('.hero-particles');
      if (heroParticles) {
        heroParticles.style.transform = `translateY(${scrollY * 0.3}px) rotate(${scrollY * 0.05}deg)`;
      }

      // Section parallax effects
      document.querySelectorAll('[data-parallax]').forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
  }

  // Interactive hover and click effects
  setupInteractiveElements() {
    // Country cards hover effects
    document.querySelectorAll('.country-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-15px) scale(1.02)';
        card.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });
    });

    // Feature cards with magnetic effect
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        card.style.transform = `translateX(${x * 0.1}px) translateY(${y * 0.1}px) rotateX(${y * 0.05}deg) rotateY(${x * 0.05}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateX(0) translateY(0) rotateX(0) rotateY(0)';
      });
    });

    // Button ripple effects
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', this.createRipple);
    });
  }

  createRipple(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  // Loading animations for page transitions
  setupLoadingAnimations() {
    // Form submission loading states
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', () => {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.classList.add('loading');
          submitBtn.disabled = true;
        }
      });
    });

    // Page transition effects
    window.addEventListener('beforeunload', () => {
      document.body.classList.add('page-exit');
    });
  }

  // Utility method for staggered animations
  static staggerAnimation(elements, delay = 100) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate', 'fadeInUp');
      }, index * delay);
    });
  }

  // Smooth scroll to sections
  static smoothScrollTo(targetId, offset = 80) {
    const target = document.getElementById(targetId);
    if (target) {
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// CSS Animation Classes
const animationStyles = `
  /* Base animation classes */
  .animate {
    animation-duration: 0.8s;
    animation-fill-mode: both;
  }

  .fadeInUp {
    animation-name: fadeInUp;
  }

  .fadeInDown {
    animation-name: fadeInDown;
  }

  .fadeInLeft {
    animation-name: fadeInLeft;
  }

  .fadeInRight {
    animation-name: fadeInRight;
  }

  .zoomIn {
    animation-name: zoomIn;
  }

  .slideInUp {
    animation-name: slideInUp;
  }

  /* Keyframe definitions */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 40px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translate3d(0, -40px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translate3d(-40px, 0, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translate3d(40px, 0, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale3d(0.3, 0.3, 0.3);
    }
    50% {
      opacity: 1;
    }
    to {
      transform: scale3d(1, 1, 1);
    }
  }

  @keyframes slideInUp {
    from {
      transform: translate3d(0, 100%, 0);
      visibility: visible;
    }
    to {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  /* Loading states */
  .loading {
    position: relative;
    color: transparent !important;
  }

  .loading::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    top: 50%;
    left: 50%;
    margin-left: -10px;
    margin-top: -10px;
    border: 2px solid transparent;
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Page transitions */
  .page-exit {
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.3s ease;
  }

  /* Responsive animation adjustments */
  @media (prefers-reduced-motion: reduce) {
    .animate {
      animation: none !important;
    }
  }

  @media (max-width: 768px) {
    .animate {
      animation-duration: 0.6s;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Initialize animation controller
document.addEventListener('DOMContentLoaded', () => {
  window.animationController = new AnimationController();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationController;
}