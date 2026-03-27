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
    if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  };
  updateScrollUi();
  window.addEventListener('scroll', updateScrollUi, { passive: true });

  const mapAnnotationMedia = document.querySelector('[data-map-annotation]');
  if (mapAnnotationMedia) {
    const mapImage = mapAnnotationMedia.querySelector('img');
    const syncMapAnnotationBounds = () => {
      if (!(mapImage instanceof HTMLImageElement)) return;

      const boxWidth = mapImage.clientWidth;
      const boxHeight = mapImage.clientHeight;
      const naturalWidth = mapImage.naturalWidth || 1628;
      const naturalHeight = mapImage.naturalHeight || 960;

      if (!boxWidth || !boxHeight || !naturalWidth || !naturalHeight) return;

      const imageRatio = naturalWidth / naturalHeight;
      const boxRatio = boxWidth / boxHeight;

      let renderedWidth = boxWidth;
      let renderedHeight = boxHeight;

      if (imageRatio > boxRatio) {
        renderedHeight = boxWidth / imageRatio;
      } else {
        renderedWidth = boxHeight * imageRatio;
      }

      const offsetLeft = (boxWidth - renderedWidth) / 2;
      const offsetTop = (boxHeight - renderedHeight) / 2;

      mapAnnotationMedia.style.setProperty('--map-image-left', `${offsetLeft}px`);
      mapAnnotationMedia.style.setProperty('--map-image-top', `${offsetTop}px`);
      mapAnnotationMedia.style.setProperty('--map-image-width', `${renderedWidth}px`);
      mapAnnotationMedia.style.setProperty('--map-image-height', `${renderedHeight}px`);
    };

    syncMapAnnotationBounds();
    if (mapImage instanceof HTMLImageElement && !mapImage.complete) {
      mapImage.addEventListener('load', syncMapAnnotationBounds, { once: true });
    }
    window.addEventListener('resize', syncMapAnnotationBounds);

    if ('IntersectionObserver' in window) {
      const mapAnnotationObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            mapAnnotationMedia.classList.add('map-annotation-visible');
            mapAnnotationObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.38 });

      mapAnnotationObserver.observe(mapAnnotationMedia);
    } else {
      mapAnnotationMedia.classList.add('map-annotation-visible');
    }
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
      lobbyPrevBtn.disabled = lobbyTrack.scrollLeft <= 4;
      lobbyNextBtn.disabled = lobbyTrack.scrollLeft >= maxScroll - 4;
    };

    const scrollLobby = (direction) => {
      lobbyTrack.scrollBy({
        left: getStep() * direction,
        behavior: 'smooth'
      });
    };

    lobbyPrevBtn.addEventListener('click', () => scrollLobby(-1));
    lobbyNextBtn.addEventListener('click', () => scrollLobby(1));

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
    selectedLotBox.innerHTML = '<span>Лот не выбран. Оставьте заявку, и мы подберем подходящий вариант.</span>';
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

    if (consentField instanceof HTMLInputElement) {
      consentField.setCustomValidity(consentField.checked ? '' : 'Нужно согласие на обработку персональных данных.');
    }

    const isValid = leadForm instanceof HTMLFormElement
      ? (report ? leadForm.reportValidity() : leadForm.checkValidity())
      : false;
    return isValid;
  };

  [nameField, phoneField, consentField].forEach((field) => {
    field?.addEventListener('input', () => validateLeadForm());
    field?.addEventListener('change', () => validateLeadForm());
  });

  leadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!(leadForm instanceof HTMLFormElement)) return;

    if (!validateLeadForm({ report: true })) {
      setFormStatus('Проверьте обязательные поля формы и согласие на обработку данных.', 'error');
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
