document.addEventListener('DOMContentLoaded', () => {
  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('visible'));
  }

  const progress = document.querySelector('.progress-line');
  const header = document.querySelector('.site-header');
  const updateScrollUi = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ratio))}%`;
    document.body.style.setProperty('--scroll-progress', `${Math.min(100, Math.max(0, ratio))}`);
    if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  };
  updateScrollUi();
  window.addEventListener('scroll', updateScrollUi, { passive: true });

  const locationMap = document.querySelector('#locationMap');
  if (locationMap) {
    const routeButton = document.querySelector('[data-route-button]');
    const centerLat = Number(locationMap.dataset.mapCenterLat);
    const centerLon = Number(locationMap.dataset.mapCenterLon);
    const pointLat = Number(locationMap.dataset.mapPointLat);
    const pointLon = Number(locationMap.dataset.mapPointLon);
    const zoom = Number(locationMap.dataset.mapZoom || 17);

    if (routeButton instanceof HTMLAnchorElement) {
      const routeUrl = new URL('https://yandex.ru/maps/213/moscow/');
      routeUrl.searchParams.set('mode', 'routes');
      routeUrl.searchParams.set('ll', `${centerLon},${centerLat}`);
      routeUrl.searchParams.set('rtext', `~${pointLat},${pointLon}`);
      routeUrl.searchParams.set('rtt', 'auto');
      routeUrl.searchParams.set('z', String(zoom));
      routeButton.href = routeUrl.toString();
    }

    const initLocationMap = () => {
      if (!window.ymaps || locationMap.dataset.mapReady === 'true') return;

      const map = new window.ymaps.Map('locationMap', {
        center: [centerLat, centerLon],
        zoom,
        controls: ['zoomControl', 'fullscreenControl']
      }, {
        suppressMapOpenBlock: true
      });

      const placemark = new window.ymaps.Placemark([pointLat, pointLon], {
        balloonContentHeader: 'Промтехнопарк',
        balloonContentBody: 'Москва, ул. Барышиха, вл. 32',
        hintContent: 'Промтехнопарк',
        iconCaption: 'Промтехнопарк'
      }, {
        preset: 'islands#redDotIconWithCaption'
      });

      map.geoObjects.add(placemark);
      map.behaviors.disable('scrollZoom');
      locationMap.dataset.mapReady = 'true';
    };

    const tryInitMap = () => {
      if (window.ymaps && typeof window.ymaps.ready === 'function') {
        window.ymaps.ready(initLocationMap);
      }
    };

    tryInitMap();
    window.addEventListener('load', tryInitMap, { once: true });
  }

  const constructionTimeline = document.querySelector('[data-construction-progress]');
  if (constructionTimeline) {
    if ('IntersectionObserver' in window) {
      const constructionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            constructionTimeline.classList.add('is-animated');
            constructionObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });

      constructionObserver.observe(constructionTimeline);
    } else {
      constructionTimeline.classList.add('is-animated');
    }
  }

  // Hero stats counters
  const statCounters = [...document.querySelectorAll('.stat-value[data-count]')];
  const compositeCounters = [...document.querySelectorAll('.stat-value[data-counter-type="quarter-year"]')];
  const animatedCounters = new WeakSet();

  const formatCounterValue = (value, decimals) => {
    const fixed = value.toFixed(decimals);
    return fixed.replace('.', ',');
  };

  const animateCounter = (el) => {
    if (animatedCounters.has(el)) return;
    animatedCounters.add(el);

    const target = Number(el.dataset.count || 0);
    const decimals = Number(el.dataset.decimals || 0);
    const durationMs = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const progressRatio = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - progressRatio, 3);
      const current = target * eased;
      el.textContent = formatCounterValue(current, decimals);
      if (progressRatio < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatCounterValue(target, decimals);
      }
    };

    el.textContent = formatCounterValue(0, decimals);
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    statCounters.forEach((counter) => counterObserver.observe(counter));
  } else {
    statCounters.forEach((counter) => animateCounter(counter));
  }

  const animateQuarterYearCounter = (el) => {
    if (animatedCounters.has(el)) return;
    animatedCounters.add(el);

    const targetQuarter = Math.max(0, Number(el.dataset.quarter || 0));
    const targetYear = Math.max(0, Number(el.dataset.year || 0));
    const durationMs = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const progressRatio = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - progressRatio, 3);
      const quarter = Math.round(targetQuarter * eased);
      const year = Math.round(targetYear * eased);
      el.textContent = `Q${quarter} ${year}`;
      if (progressRatio < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = `Q${targetQuarter} ${targetYear}`;
      }
    };

    el.textContent = 'Q0 0';
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const compositeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateQuarterYearCounter(entry.target);
          compositeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    compositeCounters.forEach((counter) => compositeObserver.observe(counter));
  } else {
    compositeCounters.forEach((counter) => animateQuarterYearCounter(counter));
  }

  // Lots sliders
  const sliders = [...document.querySelectorAll('[data-slider]')];
  sliders.forEach((slider) => {
    const slides = [...slider.querySelectorAll('.lot-slide')];
    const dots = [...slider.querySelectorAll('.slider-dot')];
    const prevBtn = slider.querySelector('[data-prev]');
    const nextBtn = slider.querySelector('[data-next]');
    if (!slides.length) return;

    let currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('active')));
    if (currentIndex === -1) currentIndex = 0;

    const render = (index) => {
      currentIndex = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
        slide.setAttribute('aria-hidden', i === currentIndex ? 'false' : 'true');
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
        dot.setAttribute('aria-current', i === currentIndex ? 'true' : 'false');
      });
    };

    prevBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex - 1);
    });

    nextBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex + 1);
    });

    [prevBtn, nextBtn].forEach((control, index) => {
      control?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        render(currentIndex + (index === 0 ? -1 : 1));
      });
    });

    dots.forEach((dot, i) => {
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.addEventListener('click', () => render(i));
      dot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          render(i);
        }
      });
    });

    slider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') render(currentIndex - 1);
      if (event.key === 'ArrowRight') render(currentIndex + 1);
    });

    render(currentIndex);
  });

  // Lobby carousel
  const lobbyTrack = document.querySelector('[data-lobby-track]');
  const lobbyPrevBtn = document.querySelector('[data-lobby-prev]');
  const lobbyNextBtn = document.querySelector('[data-lobby-next]');

  if (lobbyTrack && lobbyPrevBtn && lobbyNextBtn) {
    const lobbyCards = [...lobbyTrack.querySelectorAll('.lobby-card')];

    const setArrowDisabled = (control, isDisabled) => {
      control.classList.toggle('is-disabled', isDisabled);
      control.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      control.tabIndex = isDisabled ? -1 : 0;
    };

    const getStep = () => {
      if (lobbyCards.length < 2) return lobbyTrack.clientWidth;
      const firstCard = lobbyCards[0];
      const secondCard = lobbyCards[1];
      const firstOffset = firstCard.offsetLeft;
      const secondOffset = secondCard.offsetLeft;
      return secondOffset > firstOffset ? secondOffset - firstOffset : firstCard.getBoundingClientRect().width;
    };

    const updateLobbyControls = () => {
      const maxScroll = Math.max(0, lobbyTrack.scrollWidth - lobbyTrack.clientWidth);
      setArrowDisabled(lobbyPrevBtn, lobbyTrack.scrollLeft <= 4);
      setArrowDisabled(lobbyNextBtn, lobbyTrack.scrollLeft >= maxScroll - 4);
    };

    const scrollLobby = (direction) => {
      lobbyTrack.scrollBy({
        left: getStep() * direction,
        behavior: 'smooth'
      });
    };

    lobbyPrevBtn.addEventListener('click', () => {
      if (lobbyPrevBtn.classList.contains('is-disabled')) return;
      scrollLobby(-1);
    });

    lobbyNextBtn.addEventListener('click', () => {
      if (lobbyNextBtn.classList.contains('is-disabled')) return;
      scrollLobby(1);
    });

    [lobbyPrevBtn, lobbyNextBtn].forEach((control, index) => {
      control.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (control.classList.contains('is-disabled')) return;
        scrollLobby(index === 0 ? -1 : 1);
      });
    });

    lobbyTrack.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollLobby(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollLobby(1);
      }
    });

    lobbyTrack.addEventListener('scroll', updateLobbyControls, { passive: true });
    window.addEventListener('resize', updateLobbyControls);
    updateLobbyControls();
  }

  const newsFeature = document.querySelector('.news-feature');
  const newsSlidesContainer = document.querySelector('.news-feature-slides');
  const newsSlides = [...document.querySelectorAll('[data-news-slide]')];
  const newsPrevButtons = [...document.querySelectorAll('[data-news-prev]')];
  const newsNextButtons = [...document.querySelectorAll('[data-news-next]')];

  if (newsSlides.length > 1 && (newsPrevButtons.length || newsNextButtons.length)) {
    let activeNewsIndex = Math.max(0, newsSlides.findIndex((slide) => slide.classList.contains('is-active')));
    if (activeNewsIndex < 0) activeNewsIndex = 0;
    let isNewsTransitioning = false;
    let newsTransitionTimer = null;
    let latchedNewsSelector = null;

    const setArrowDisabled = (control, isDisabled) => {
      control.classList.toggle('is-disabled', isDisabled);
      control.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      control.tabIndex = isDisabled ? -1 : 0;
    };

    const updateNewsControls = () => {
      const isFirst = activeNewsIndex <= 0;
      const isLast = activeNewsIndex >= newsSlides.length - 1;
      newsPrevButtons.forEach((button) => setArrowDisabled(button, isFirst));
      newsNextButtons.forEach((button) => setArrowDisabled(button, isLast));
    };

    const focusActiveNewsControl = (selector) => {
      const activeSlide = newsSlides[activeNewsIndex];
      const control = activeSlide?.querySelector(selector);
      if (!control || control.classList.contains('is-disabled')) return;
      control.focus({ preventScroll: true });
    };

    const applyLatchedState = (selector) => {
      latchedNewsSelector = selector;
      [...document.querySelectorAll('[data-news-prev], [data-news-next]')].forEach((button) => {
        button.classList.remove('is-latched');
      });

      if (!selector) return;

      [...document.querySelectorAll(selector)].forEach((button) => {
        button.classList.add('is-latched');
      });
    };

    const syncNewsFeatureHeight = () => {
      if (!newsSlidesContainer) return;

      let maxHeight = 0;

      newsSlides.forEach((slide) => {
        const wasActive = slide.classList.contains('is-active');

        slide.classList.add('is-active', 'is-measuring');
        maxHeight = Math.max(maxHeight, slide.offsetHeight);
        slide.classList.remove('is-measuring');

        if (!wasActive) {
          slide.classList.remove('is-active');
        }
      });

      if (maxHeight > 0) {
        newsSlidesContainer.style.setProperty('--news-feature-height', `${maxHeight}px`);

        if (window.innerWidth <= 900) {
          newsSlidesContainer.style.minHeight = `${maxHeight}px`;
          newsSlidesContainer.style.height = `${maxHeight}px`;
        } else {
          newsSlidesContainer.style.minHeight = `${maxHeight}px`;
          newsSlidesContainer.style.height = '';
        }
      }
    };

    const renderNewsSlide = (index, focusSelector = null, pressedSelector = null) => {
      const previousTop = newsFeature?.getBoundingClientRect().top ?? 0;

      activeNewsIndex = Math.max(0, Math.min(newsSlides.length - 1, index));
      newsSlides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === activeNewsIndex);
      });
      updateNewsControls();
      applyLatchedState(latchedNewsSelector);
      syncNewsFeatureHeight();

      const nextTop = newsFeature?.getBoundingClientRect().top ?? 0;
      const offsetDelta = nextTop - previousTop;
      if (Math.abs(offsetDelta) > 1) {
        window.scrollBy(0, offsetDelta);
      }

      if (focusSelector) {
        requestAnimationFrame(() => focusActiveNewsControl(focusSelector));
      }

      if (pressedSelector) {
        requestAnimationFrame(() => pulsePressedState(pressedSelector, 560));
      }

      if (newsTransitionTimer) {
        window.clearTimeout(newsTransitionTimer);
      }

      isNewsTransitioning = true;
      newsTransitionTimer = window.setTimeout(() => {
        isNewsTransitioning = false;
      }, 380);
    };

    const showNextNews = (focusSelector = null, pressedSelector = null) => {
      renderNewsSlide(activeNewsIndex + 1, focusSelector, pressedSelector);
    };

    const showPrevNews = (focusSelector = null, pressedSelector = null) => {
      renderNewsSlide(activeNewsIndex - 1, focusSelector, pressedSelector);
    };

    const pressTimers = new WeakMap();

    const setPressedState = (buttons, isPressed) => {
      buttons.forEach((control) => {
        control.classList.toggle('is-pressed', isPressed && !control.classList.contains('is-disabled'));
      });
    };

    const pulsePressedState = (selector, duration = 180) => {
      const buttons = [...document.querySelectorAll(selector)];
      setPressedState(buttons, true);

      buttons.forEach((button) => {
        const timer = pressTimers.get(button);
        if (timer) window.clearTimeout(timer);

        const nextTimer = window.setTimeout(() => {
          button.classList.remove('is-pressed');
          pressTimers.delete(button);
        }, duration);

        pressTimers.set(button, nextTimer);
      });
    };

    const bindPressedState = (button, selector) => {
      const clearPressedState = () => {
        const timer = pressTimers.get(button);
        if (timer) {
          window.clearTimeout(timer);
          pressTimers.delete(button);
        }
        button.classList.remove('is-pressed');
      };

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (button.classList.contains('is-disabled')) return;
        pulsePressedState(selector);
      });

      button.addEventListener('pointercancel', clearPressedState);
      button.addEventListener('pointerleave', clearPressedState);
      button.addEventListener('blur', clearPressedState);
      button.addEventListener('dragstart', (event) => event.preventDefault());
    };

    newsPrevButtons.forEach((button) => {
      bindPressedState(button, '[data-news-prev]');

      button.addEventListener('click', () => {
        if (button.classList.contains('is-disabled') || isNewsTransitioning) return;
        button.blur();
        applyLatchedState('[data-news-prev]');
        window.setTimeout(() => {
          showPrevNews(null, '[data-news-prev]');
        }, 110);
      });

      button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (button.classList.contains('is-disabled') || isNewsTransitioning) return;
        applyLatchedState('[data-news-prev]');
        showPrevNews('[data-news-prev]', '[data-news-prev]');
      });
    });

    newsNextButtons.forEach((button) => {
      bindPressedState(button, '[data-news-next]');

      button.addEventListener('click', () => {
        if (button.classList.contains('is-disabled') || isNewsTransitioning) return;
        button.blur();
        applyLatchedState('[data-news-next]');
        window.setTimeout(() => {
          showNextNews(null, '[data-news-next]');
        }, 110);
      });

      button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (button.classList.contains('is-disabled') || isNewsTransitioning) return;
        applyLatchedState('[data-news-next]');
        showNextNews('[data-news-next]', '[data-news-next]');
      });
    });

    syncNewsFeatureHeight();
    window.addEventListener('resize', syncNewsFeatureHeight);
    renderNewsSlide(activeNewsIndex);
  }

  // Mobile menu
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  const mobileLinks = mobileNav ? [...mobileNav.querySelectorAll('a[href^="#"]')] : [];

  const closeMobileMenu = () => {
    if (!burger || !mobileNav) return;
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    mobileNav.classList.remove('open');
  };

  const openMobileMenu = () => {
    if (!burger || !mobileNav) return;
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    mobileNav.classList.add('open');
  };

  burger?.addEventListener('click', () => {
    const isOpen = mobileNav?.classList.contains('open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => closeMobileMenu());
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1180) closeMobileMenu();
  });

  // Lots filtering
  const filterButtons = [...document.querySelectorAll('.filter-button[data-filter]')];
  const lotCards = [...document.querySelectorAll('.lot-card[data-categories]')];
  const lotsEmpty = document.getElementById('lotsEmpty');

  const applyFilter = (filter) => {
    let visibleCount = 0;
    lotCards.forEach((card) => {
      const categories = (card.dataset.categories || '').split(/\s+/).filter(Boolean);
      const show = filter === 'all' || categories.includes(filter);
      card.classList.toggle('hidden-card', !show);
      if (show) visibleCount += 1;
    });
    lotsEmpty?.classList.toggle('hidden', visibleCount > 0);
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      filterButtons.forEach((item) => item.classList.toggle('active', item === button));
      applyFilter(filter);
    });
  });

  const activeFilterButton = filterButtons.find((button) => button.classList.contains('active'));
  applyFilter(activeFilterButton?.dataset.filter || 'all');

  // Accent tab-link style buttons
  const tabLinks = [...document.querySelectorAll('[data-tab-link]')];
  tabLinks.forEach((link) => {
    const activate = () => link.classList.add('is-hovered');
    const deactivate = () => link.classList.remove('is-hovered');

    link.addEventListener('mouseenter', activate);
    link.addEventListener('mouseleave', deactivate);
    link.addEventListener('focus', activate);
    link.addEventListener('blur', deactivate);
  });

  // Rubytech session modal
  const rubytechSessionKey = 'rubytech-modal-dismissed-v2';
  const rubytechModal = document.getElementById('rubytechModal');
  const rubytechModalClose = document.getElementById('rubytechModalClose');
  const rubytechCta = rubytechModal?.querySelector('[data-rubytech-cta]');
  let rubytechAudioContext = null;
  let rubytechAudioBusy = false;
  let rubytechAudioUnlocked = false;

  const createRubytechAudioContext = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!rubytechAudioContext) {
      rubytechAudioContext = new AudioContextClass();
    }

    return rubytechAudioContext;
  };

  const unlockRubytechAudio = async () => {
    const audioContext = createRubytechAudioContext();
    if (!audioContext) return false;

    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        return false;
      }
    }

    rubytechAudioUnlocked = audioContext.state === 'running';
    return rubytechAudioUnlocked;
  };

  const playRubytechSound = async () => {
    if (rubytechAudioBusy) return false;

    try {
      const audioContext = createRubytechAudioContext();
      if (!audioContext) {
        return false;
      }

      const isUnlocked = await unlockRubytechAudio();
      if (!isUnlocked) {
        return false;
      }

      rubytechAudioBusy = true;

      const startAt = audioContext.currentTime + 0.02;
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.045, startAt + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.34);
      gainNode.connect(audioContext.destination);

      const frequencies = [523.25, 659.25];
      frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startAt);
        oscillator.connect(gainNode);
        oscillator.start(startAt + index * 0.028);
        oscillator.stop(startAt + 0.16 + index * 0.05);
      });

      window.setTimeout(() => {
        rubytechAudioBusy = false;
      }, 380);
      return true;
    } catch (error) {
      rubytechAudioBusy = false;
      return false;
    }
  };

  const setRubytechSessionDismissed = () => {
    try {
      window.sessionStorage.setItem(rubytechSessionKey, 'true');
    } catch (error) {
      // Ignore storage access issues in private mode or restricted contexts.
    }
  };

  const isRubytechDismissed = () => {
    try {
      return window.sessionStorage.getItem(rubytechSessionKey) === 'true';
    } catch (error) {
      return false;
    }
  };

  const closeRubytechModal = () => {
    if (!rubytechModal || rubytechModal.hidden) return;
    rubytechModal.classList.remove('is-active');
    window.setTimeout(() => {
      if (rubytechModal) rubytechModal.hidden = true;
    }, 220);
    setRubytechSessionDismissed();
  };

  const openRubytechModal = () => {
    if (!rubytechModal || isRubytechDismissed()) return;
    rubytechModal.hidden = false;
    requestAnimationFrame(() => {
      rubytechModal?.classList.add('is-active');
    });

    window.setTimeout(() => {
      playRubytechSound();
    }, 140);
  };

  rubytechModalClose?.addEventListener('click', () => closeRubytechModal());
  rubytechCta?.addEventListener('click', () => closeRubytechModal());

  const handleRubytechAudioGesture = async () => {
    if (rubytechModal && !rubytechModal.hidden) return;
    const unlocked = await unlockRubytechAudio();
    if (!unlocked) return;
    window.removeEventListener('keydown', handleRubytechAudioGesture);
    window.removeEventListener('pointerdown', handleRubytechAudioGesture);
    window.removeEventListener('touchstart', handleRubytechAudioGesture);
  };

  ['pointerdown', 'touchstart'].forEach((eventName) => {
    window.addEventListener(eventName, handleRubytechAudioGesture, { passive: true });
  });
  window.addEventListener('keydown', handleRubytechAudioGesture);

  document.addEventListener('keydown', (event) => {
    if (!rubytechModal || rubytechModal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeRubytechModal();
    }
  });

  window.setTimeout(openRubytechModal, 3000);

  // "Leave request" buttons for lots
  const lotRequestButtons = [...document.querySelectorAll('[data-request-lot]')];
  const lotLayoutButtons = [...document.querySelectorAll('[data-request-layout]')];
  const topicRequestLinks = [...document.querySelectorAll('[data-request-topic]')];
  const contactsSection = document.getElementById('contacts');
  const lotSelect = document.getElementById('lotSelect');
  const customLotSelect = document.querySelector('[data-custom-select]');
  const lotSelectTrigger = customLotSelect?.querySelector('.lot-select-trigger');
  const lotSelectTriggerText = customLotSelect?.querySelector('.lot-select-trigger-text');
  const lotSelectMenu = customLotSelect?.querySelector('.lot-select-menu');
  const selectedLotBox = document.getElementById('selectedLotBox');
  const changeLotButton = document.getElementById('changeLotButton');
  const messageField = document.getElementById('leadMessage');
  const requestTypeField = document.getElementById('requestTypeField');
  const phoneField = document.getElementById('leadPhone');
  const nameField = document.getElementById('leadName');
  const consentField = document.getElementById('leadConsent');

  const setLotSelectOpen = (isOpen) => {
    if (!customLotSelect || !lotSelectTrigger || !lotSelectMenu) return;
    customLotSelect.classList.toggle('open', isOpen);
    lotSelectTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    lotSelectMenu.hidden = !isOpen;
  };

  const renderLotSelectOptions = () => {
    if (!lotSelect || !lotSelectMenu || !lotSelectTriggerText) return;

    lotSelectMenu.innerHTML = '';
    [...lotSelect.options].forEach((option) => {
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'lot-select-option';
      optionButton.textContent = option.textContent || '';
      optionButton.dataset.value = option.value;
      optionButton.setAttribute('role', 'option');
      optionButton.setAttribute('aria-selected', option.selected ? 'true' : 'false');
      optionButton.classList.toggle('is-selected', option.selected);

      optionButton.addEventListener('click', () => {
        lotSelect.value = option.value;
        lotSelect.dispatchEvent(new Event('change', { bubbles: true }));
        setLotSelectOpen(false);
        lotSelectTrigger.focus();
      });

      lotSelectMenu.appendChild(optionButton);
    });

    const selectedOption = lotSelect.options[lotSelect.selectedIndex] || lotSelect.options[0];
    lotSelectTriggerText.textContent = selectedOption?.textContent || '';
  };

  const syncCustomLotSelect = () => {
    if (!lotSelect || !lotSelectMenu || !lotSelectTriggerText) return;

    const selectedValue = lotSelect.value;
    [...lotSelectMenu.querySelectorAll('.lot-select-option')].forEach((button) => {
      const isSelected = button.dataset.value === selectedValue;
      const shouldHighlightFallback = !selectedValue && button.dataset.value === '';
      button.classList.toggle('is-selected', isSelected || shouldHighlightFallback);
      button.setAttribute('aria-selected', isSelected || shouldHighlightFallback ? 'true' : 'false');
    });

    const selectedOption = lotSelect.options[lotSelect.selectedIndex] || lotSelect.options[0];
    lotSelectTriggerText.textContent = selectedOption?.textContent || '';
  };

  if (lotSelect && customLotSelect && lotSelectTrigger && lotSelectMenu) {
    renderLotSelectOptions();
    syncCustomLotSelect();

    lotSelectTrigger.addEventListener('click', () => {
      const isOpen = customLotSelect.classList.contains('open');
      setLotSelectOpen(!isOpen);
    });

    lotSelectTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setLotSelectOpen(true);
        lotSelectMenu.querySelector('.lot-select-option.is-selected, .lot-select-option')?.focus();
      }
      if (event.key === 'Escape') {
        setLotSelectOpen(false);
      }
    });

    lotSelectMenu.addEventListener('keydown', (event) => {
      const optionButtons = [...lotSelectMenu.querySelectorAll('.lot-select-option')];
      const currentIndex = optionButtons.findIndex((button) => button === document.activeElement);

      if (event.key === 'Escape') {
        event.preventDefault();
        setLotSelectOpen(false);
        lotSelectTrigger.focus();
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        optionButtons[(currentIndex + 1 + optionButtons.length) % optionButtons.length]?.focus();
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        optionButtons[(currentIndex - 1 + optionButtons.length) % optionButtons.length]?.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!customLotSelect.contains(event.target)) {
        setLotSelectOpen(false);
      }
    });
  }

  const updateSelectedLotUi = (lotLabel) => {
    if (!selectedLotBox || !lotSelect || !changeLotButton) return;

    if (lotLabel) {
      selectedLotBox.classList.remove('selected-lot--empty');
      selectedLotBox.innerHTML = `<span>Выбран: ${lotLabel}</span>`;
      changeLotButton.hidden = false;
      selectedLotBox.appendChild(changeLotButton);
      return;
    }

    selectedLotBox.classList.add('selected-lot--empty');
    selectedLotBox.innerHTML = '';
    changeLotButton.hidden = true;
    selectedLotBox.appendChild(changeLotButton);
  };

  const selectLot = (lotLabel) => {
    if (!lotSelect) return;
    const optionExists = [...lotSelect.options].some((option) => option.value === lotLabel);
    lotSelect.value = optionExists ? lotLabel : '';
    syncCustomLotSelect();
    updateSelectedLotUi(lotSelect.value);
  };

  const setRequestContext = ({ topic = '', lotLabel = '', appendMessage = '' } = {}) => {
    if (topic && requestTypeField) {
      requestTypeField.value = topic;
    }

    if (lotLabel) {
      selectLot(lotLabel);
    }

    if (appendMessage && messageField instanceof HTMLTextAreaElement) {
      const currentValue = messageField.value.trim();
      const nextValue = currentValue ? `${currentValue}\n${appendMessage}` : appendMessage;
      if (!currentValue.includes(appendMessage)) {
        messageField.value = nextValue;
      }
    }
  };

  lotRequestButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const lotLabel = button.dataset.requestLot || '';
      setRequestContext({
        topic: 'Запросить этот лот',
        lotLabel,
        appendMessage: `Интересует ${lotLabel}. Прошу связаться и обсудить условия аренды.`
      });
      contactsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      messageField?.focus();
    });
  });

  lotLayoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const lotLabel = button.dataset.requestLayout || '';
      setRequestContext({
        topic: 'Получить планировку',
        lotLabel,
        appendMessage: `Прошу направить планировку по лоту: ${lotLabel}.`
      });
      contactsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      messageField?.focus();
    });
  });

  topicRequestLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const topic = link.dataset.requestTopic || '';
      setRequestContext({
        topic,
        appendMessage: topic ? `Интересует запрос: ${topic}.` : ''
      });
    });
  });

  lotSelect?.addEventListener('change', () => {
    syncCustomLotSelect();
    updateSelectedLotUi(lotSelect.value);
  });

  changeLotButton?.addEventListener('click', () => {
    lotSelectTrigger?.focus();
    setLotSelectOpen(true);
  });

  updateSelectedLotUi(lotSelect?.value || '');

  // Lead form submit (works on static hosting, including GitHub Pages)
  const leadForm = document.getElementById('leadForm');
  const formStatus = document.getElementById('formStatus');

  const setFormStatus = (message, type = '') => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.remove('success', 'error');
    if (type) formStatus.classList.add(type);
  };

  const validateLeadForm = ({ report = false } = {}) => {
    const nameValue = String(nameField?.value || '').trim();
    const phoneValue = String(phoneField?.value || '').trim();

    if (nameField instanceof HTMLInputElement) {
      nameField.setCustomValidity(nameValue.length >= 2 ? '' : 'Укажите имя не короче 2 символов.');
    }

    if (phoneField instanceof HTMLInputElement) {
      const normalizedPhone = phoneValue.replace(/[^\d+]/g, '');
      phoneField.setCustomValidity(normalizedPhone.length >= 10 ? '' : 'Укажите корректный номер телефона.');
    }

    const isValid = leadForm instanceof HTMLFormElement
      ? (report ? leadForm.reportValidity() : leadForm.checkValidity())
      : false;
    return isValid;
  };

  [nameField, phoneField].forEach((field) => {
    field?.addEventListener('input', () => validateLeadForm());
    field?.addEventListener('change', () => validateLeadForm());
  });

  leadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!(leadForm instanceof HTMLFormElement)) return;

    if (!validateLeadForm({ report: true })) {
      setFormStatus('Проверьте обязательные поля формы.', 'error');
      return;
    }

    const submitButton = leadForm.querySelector('button[type="submit"]');
    const initialSubmitText = submitButton instanceof HTMLButtonElement ? submitButton.textContent : '';
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = 'Отправляем...';
      submitButton.setAttribute('aria-busy', 'true');
    }
    setFormStatus('Отправляем заявку...');

    const formData = new FormData(leadForm);
    const honeypot = String(formData.get('website') || '').trim();
    if (honeypot) {
      setFormStatus('Ошибка проверки формы. Обновите страницу и попробуйте снова.', 'error');
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = initialSubmitText;
        submitButton.removeAttribute('aria-busy');
      }
      return;
    }

    const endpoint = 'https://formsubmit.co/ajax/s.zharov@abcentrum.ru';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setFormStatus('Заявка отправлена. Мы свяжемся с вами в рабочее время.', 'success');
      leadForm.reset();
      if (requestTypeField instanceof HTMLInputElement) requestTypeField.value = '';
      syncCustomLotSelect();
      updateSelectedLotUi('');
    } catch (error) {
      setFormStatus('Не удалось отправить заявку. Проверьте интернет или свяжитесь по телефону.', 'error');
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = initialSubmitText;
        submitButton.removeAttribute('aria-busy');
      }
    }
  });
});
