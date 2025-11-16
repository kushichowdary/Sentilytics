// MagicBento.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

export interface BentoCardProps {
  title?: string;
  description?: string;
  label?: string;
  tabId: string;
  textAutoHide?: boolean;
  disableAnimations?: boolean;
}

export interface BentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  onTabChange: (tabId: string) => void;
}

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 220; // px
const DEFAULT_PARTICLE_COLOR = 'var(--color-primary)';
const DEFAULT_PARTICLE_GLOW_COLOR = 'var(--color-primary-glow)';
const MOBILE_BREAKPOINT = 768;

const cardData: BentoCardProps[] = [
  { tabId: 'url-analysis', title: 'URL Analysis', description: 'Analyze a single product URL', label: 'Web Link' },
  { tabId: 'competitive-analysis', title: 'Competitor Analysis', description: 'Compare two products side-by-side', label: 'Compare' },
  { tabId: 'analytics', title: 'Analytics', description: 'View trends and product data', label: 'Insights' },
  { tabId: 'file-upload', title: 'File Upload', description: 'Bulk analyze reviews from a file', label: 'Dataset' },
  { tabId: 'single-review', title: 'Single Review', description: 'Get sentiment for one review', label: 'Text' },
  { tabId: 'reporting', title: 'Reporting', description: 'Generate and view reports', label: 'Reports' }
];

/* ---------- Helpers ---------- */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.35,
  fadeDistance: radius * 0.9
});

/* ---------- Particle element factory ---------- */

const createParticleElement = (x: number, y: number, glowColor = DEFAULT_PARTICLE_GLOW_COLOR, color = DEFAULT_PARTICLE_COLOR) => {
  const el = document.createElement('div');
  el.className = 'bento-particle';
  el.style.cssText = `
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${color};
    box-shadow: 0 0 10px ${glowColor};
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
    transform-origin: center;
    opacity: 0;
  `;
  return el;
};

/* ---------- ParticleCard (single card with all effects) ---------- */

const ParticleCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  onClick?: () => void;
  spotlightRadius?: number;
}> = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
  onClick,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const particlePoolRef = useRef<HTMLDivElement[]>([]);
  const activeParticlesRef = useRef<HTMLDivElement[]>([]);
  const hoverRef = useRef(false);
  const magnetTweenRef = useRef<gsap.core.Tween | null>(null);

  // create small pool once
  useEffect(() => {
    if (!cardRef.current) return;
    if (disableAnimations) return;

    const rect = cardRef.current.getBoundingClientRect();
    particlePoolRef.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * rect.width, Math.random() * rect.height)
    );

    return () => {
      particlePoolRef.current.forEach(p => p.remove());
      particlePoolRef.current = [];
    };
  }, [particleCount, disableAnimations]);

  const spawnParticles = useCallback((mouseX: number, mouseY: number) => {
    if (disableAnimations || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distToCenter = Math.hypot(mouseX - centerX, mouseY - centerY);

    // spawn handful quickly based on distance
    const spawnCount = clamp(Math.round((1 - Math.min(distToCenter / 300, 1)) * 6) + 2, 2, particlePoolRef.current.length);
    for (let i = 0; i < spawnCount; i++) {
      const p = particlePoolRef.current[i % particlePoolRef.current.length].cloneNode(true) as HTMLDivElement;
      p.style.left = `${Math.random() * rect.width}px`;
      p.style.top = `${Math.random() * rect.height}px`;
      cardRef.current.appendChild(p);
      activeParticlesRef.current.push(p);

      // entrance
      gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' });

      // drifting motion
      gsap.to(p, {
        x: (Math.random() - 0.5) * 120,
        y: (Math.random() - 0.5) * 120,
        rotation: Math.random() * 360,
        duration: 2 + Math.random() * 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });

      // gentle opacity pulsing
      gsap.to(p, {
        opacity: 0.3 + Math.random() * 0.7,
        duration: 1.2 + Math.random() * 1.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });

      // auto remove after some time to prevent DOM growth
      gsap.to(p, {
        delay: 6 + Math.random() * 2,
        opacity: 0,
        scale: 0,
        duration: 0.6,
        onComplete: () => {
          p.remove();
          activeParticlesRef.current = activeParticlesRef.current.filter(x => x !== p);
        }
      });
    }
  }, [disableAnimations]);

  const clearParticles = useCallback(() => {
    activeParticlesRef.current.forEach(p => {
      gsap.killTweensOf(p);
      p.remove();
    });
    activeParticlesRef.current = [];
  }, []);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const el = cardRef.current;

    // pointer handlers
    const handleEnter = () => {
      hoverRef.current = true;
      // tilt in
      if (enableTilt) {
        gsap.to(el, {
          rotateX: 6,
          rotateY: -6,
          duration: 0.35,
          ease: 'power3.out',
          transformPerspective: 900
        });
      }
    };

    const handleLeave = () => {
      hoverRef.current = false;
      clearParticles();
      if (enableTilt) {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.45, ease: 'power3.out' });
      }
      if (enableMagnetism) {
        magnetTweenRef.current?.kill();
        gsap.to(el, { x: 0, y: 0, duration: 0.45, ease: 'power3.out' });
      }
    };

    const handleMove = (e: MouseEvent) => {
      if (!el) return;
      // tilt (reactive)
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - cy) / cy) * -8;
        const rotateY = ((x - cx) / cx) * 8;
        gsap.to(el, { rotateX, rotateY, duration: 0.12, ease: 'power3.out', transformPerspective: 900 });
      }

      // magnetism - slight translate towards cursor
      if (enableMagnetism) {
        const magnetX = (x - cx) * 0.06;
        const magnetY = (y - cy) * 0.06;
        magnetTweenRef.current?.kill();
        magnetTweenRef.current = gsap.to(el, { x: magnetX, y: magnetY, duration: 0.25, ease: 'power3.out' });
      }

      // spawn particles occasionally when pointer is close
      const localX = e.clientX;
      const localY = e.clientY;
      const dist = Math.hypot(localX - (rect.left + cx), localY - (rect.top + cy));
      if (dist < spotlightRadius * 0.9 && Math.random() < 0.08) {
        spawnParticles(localX, localY);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!el) return;
      if (onClick) onClick();

      if (!clickEffect) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1200;
        background: radial-gradient(circle, var(--color-primary-glow) 0%, transparent 60%);
        transform: scale(0);
        opacity: 0.85;
      `;
      el.appendChild(ripple);

      gsap.to(ripple, {
        scale: 1,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      });
    };

    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('click', handleClick);

    return () => {
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('click', handleClick);
      clearParticles();
      magnetTweenRef.current?.kill();
    };
  }, [clearParticles, enableMagnetism, enableTilt, clickEffect, onClick, spawnParticles, disableAnimations, spotlightRadius]);

  return (
    <div
      ref={cardRef}
      className={`${className} relative overflow-hidden card`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
};

/* ---------- GlobalSpotlight: follows pointer, calculates falloff and updates per-card custom properties ---------- */

const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}> = ({ gridRef, disableAnimations = false, enabled = true, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS, glowColor }) => {
  const spotRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (disableAnimations || !enabled || !gridRef?.current) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'bento-global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: ${spotlightRadius * 2}px;
      height: ${spotlightRadius * 2}px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle at center, ${glowColor ?? 'var(--color-primary-glow)'} 0%, transparent 55%);
      z-index: 300;
      opacity: 0;
      transform: translate(-50%, -50%) scale(1);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotRef.current = spotlight;

    const cardsRoot = gridRef.current;

    const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);

    let lastMouse = { x: -9999, y: -9999 };

    const handleMove = (e: MouseEvent) => {
      lastMouse = { x: e.clientX, y: e.clientY };

      // find the section bounds, ensure pointer inside section
      const section = cardsRoot.closest('.bento-section');
      const sectionRect = section?.getBoundingClientRect();
      const inside =
        sectionRect &&
        lastMouse.x >= sectionRect.left &&
        lastMouse.x <= sectionRect.right &&
        lastMouse.y >= sectionRect.top &&
        lastMouse.y <= sectionRect.bottom;

      if (!inside) {
        gsap.to(spotlight, { opacity: 0, duration: 0.25, ease: 'power2.out' });
        // reduce all cards
        cardsRoot.querySelectorAll('.card').forEach(card => {
          (card as HTMLElement).style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      // update position smoothly
      gsap.to(spotlight, { left: lastMouse.x, top: lastMouse.y, duration: 0.08, ease: 'power2.out' });

      // compute minDistance to any card centers
      let minDistance = Infinity;
      cardsRoot.querySelectorAll('.card').forEach(card => {
        const cardEl = card as HTMLElement;
        const r = cardEl.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(lastMouse.x - cx, lastMouse.y - cy) - Math.max(r.width, r.height) / 2;
        const eff = Math.max(0, d);
        minDistance = Math.min(minDistance, eff);

        // for each card, compute glow intensity with falloff
        let glowIntensity = 0;
        if (eff <= proximity) {
          glowIntensity = 1;
        } else if (eff <= fadeDistance) {
          glowIntensity = (fadeDistance - eff) / (fadeDistance - proximity);
        }
        // set per-card CSS variables for glow position and intensity
        const relX = ((lastMouse.x - r.left) / r.width) * 100;
        const relY = ((lastMouse.y - r.top) / r.height) * 100;
        cardEl.style.setProperty('--glow-x', `${relX}%`);
        cardEl.style.setProperty('--glow-y', `${relY}%`);
        cardEl.style.setProperty('--glow-intensity', `${glowIntensity}`);
        cardEl.style.setProperty('--glow-radius', `${spotlightRadius}px`);
      });

      // set spotlight opacity based on nearest card
      const targetOpacity = minDistance <= proximity ? 0.9 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.9 : 0;
      gsap.to(spotlight, { opacity: clamp(targetOpacity, 0, 0.95), duration: 0.12, ease: 'power2.out' });
    };

    const handleLeave = () => {
      gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      cardsRoot.querySelectorAll('.card').forEach(card => (card as HTMLElement).style.setProperty('--glow-intensity', '0'));
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      spotRef.current?.remove();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

/* ---------- Layout helpers & responsive detection ---------- */

const BentoCardGrid: React.FC<{ children: React.ReactNode; gridRef?: React.RefObject<HTMLDivElement | null> }> = ({ children, gridRef }) => (
  <div
    className="bento-section grid gap-2 p-3 max-w-[54rem] select-none relative"
    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.5rem)' }}
    ref={gridRef}
  >
    {children}
  </div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

/* ---------- Main MagicBento component (export) ---------- */

const MagicBento: React.FC<BentoProps> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  clickEffect = true,
  enableMagnetism = true,
  onTabChange,
}) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <>
      <style>
        {`
          .bento-section {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: 220px;
            --border-color: var(--color-border);
            --text-color-primary: var(--color-text-primary);
            --text-color-secondary: var(--color-text-secondary);
          }

          .card-responsive {
            grid-template-columns: 1fr;
            width: 90%;
            margin: 0 auto;
            padding: 0.5rem;
          }

          @media (min-width: 600px) {
            .card-responsive {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .card-responsive {
              grid-template-columns: repeat(4, 1fr);
            }
            .card-responsive .card:nth-child(3) { grid-column: span 2; grid-row: span 2; }
            .card-responsive .card:nth-child(4) { grid-column: 1 / span 2; grid-row: 2 / span 2; }
            .card-responsive .card:nth-child(6) { grid-column: 4; grid-row: 3; }
          }

          .card--border-glow::after {
            content: '';
            position: absolute;
            inset: 0;
            padding: 2px;
            background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
                var(--color-primary-glow) 0%,
                transparent 60%);
            border-radius: inherit;
            pointer-events: none;
            transition: opacity 0.25s ease;
            z-index: 1;
            opacity: calc(var(--glow-intensity));
            mix-blend-mode: screen;
          }

          .card {
            transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
            will-change: transform;
            background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          }

          .card .card__title { transition: color 0.25s ease; }
          .card .card__description { transition: color 0.25s ease; }

          /* particle styles fallback */
          .bento-particle {
            pointer-events: none;
          }

          /* global spotlight fallback for very small screens */
          @media (max-width: 599px) {
              .bento-global-spotlight { display: none; }
          }
        `}
      </style>

      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        <div className="card-responsive grid gap-2">
          {cardData.map((card, index) => {
            const baseClassName = `card flex flex-col justify-between relative aspect-[4/3] min-h-[200px] w-full max-w-full p-5 rounded-[20px] border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 cursor-pointer bg-light-surface/80 dark:bg-dark-surface backdrop-blur-xl hover:bg-light-surface dark:hover:bg-dark-background ${
              enableBorderGlow ? 'card--border-glow' : ''
            }`;

            const cardStyle = {
              borderColor: 'var(--border-color)',
              '--glow-x': '50%',
              '--glow-y': '50%',
              '--glow-intensity': '0',
              '--glow-radius': `${spotlightRadius}px`
            } as React.CSSProperties;

            if (enableStars) {
              return (
                <ParticleCard
                  key={index}
                  className={baseClassName}
                  style={cardStyle}
                  disableAnimations={shouldDisableAnimations}
                  particleCount={particleCount}
                  enableTilt={enableTilt}
                  clickEffect={clickEffect}
                  enableMagnetism={enableMagnetism}
                  onClick={() => onTabChange(card.tabId)}
                  spotlightRadius={spotlightRadius}
                >
                  <div className="card__header flex justify-between gap-3 relative" style={{color: 'var(--text-color-primary)'}}>
                    <span className="card__label text-base">{card.label}</span>
                  </div>
                  <div className="card__content flex flex-col relative" style={{color: 'var(--text-color-primary)'}}>
                    <h3 className={`card__title font-normal text-base m-0 mb-1`}>{card.title}</h3>
                    <p className={`card__description text-xs leading-5`} style={{color: 'var(--text-color-secondary)'}}>{card.description}</p>
                  </div>
                </ParticleCard>
              );
            }

            return (
              <div key={index} className={baseClassName} style={cardStyle} onClick={() => onTabChange(card.tabId)}>
                <div className="card__header flex justify-between gap-3 relative" style={{color: 'var(--text-color-primary)'}}>
                  <span className="card__label text-base">{card.label}</span>
                </div>
                <div className="card__content flex flex-col relative" style={{color: 'var(--text-color-primary)'}}>
                  <h3 className={`card__title font-normal text-base m-0 mb-1`}>{card.title}</h3>
                  <p className={`card__description text-xs leading-5`} style={{color: 'var(--text-color-secondary)'}}>{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </BentoCardGrid>
    </>
  );
};

export default MagicBento;
