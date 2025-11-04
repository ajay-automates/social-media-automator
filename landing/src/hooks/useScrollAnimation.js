import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useScrollAnimation = (animation, dependencies = []) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      animation(element);
    }, element);

    return () => ctx.revert();
  }, dependencies);

  return ref;
};

export const fadeInUp = (element) => {
  gsap.from(element, {
    y: 100,
    opacity: 0,
    duration: 1,
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
      end: 'top 50%',
      scrub: 1,
    },
  });
};

export const fadeIn = (element) => {
  gsap.from(element, {
    opacity: 0,
    duration: 1,
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
  });
};

export const staggerFadeIn = (elements) => {
  gsap.from(elements, {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
      trigger: elements[0],
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
  });
};

