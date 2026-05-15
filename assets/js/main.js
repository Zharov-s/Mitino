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

  const cookieConsentKey = 'cookieConsent:v2';
  let cookieConsentAcceptedInSession = false;

  const hasAcceptedCookieConsent = () => {
    if (cookieConsentAcceptedInSession) return true;

    try {
      return window.localStorage.getItem(cookieConsentKey) === 'accepted';
    } catch (error) {
      return false;
    }
  };

  const saveCookieConsent = () => {
    cookieConsentAcceptedInSession = true;

    try {
      window.localStorage.setItem(cookieConsentKey, 'accepted');
    } catch (error) {
      // The current page can still work if localStorage is unavailable.
    }
  };

  const syncCookieConsentClass = () => {
    const accepted = hasAcceptedCookieConsent();
    document.documentElement.classList.toggle('has-cookie-consent', accepted);
    document.documentElement.classList.toggle('needs-cookie-consent', !accepted);
  };

  const isCookieBannerVisible = () => {
    const banner = document.querySelector('[data-cookie-banner]');
    return Boolean(banner && banner.classList.contains('is-visible') && !banner.classList.contains('is-hidden'));
  };

  const setupCookieBanner = () => {
    let banner = document.querySelector('[data-cookie-banner]');

    if (hasAcceptedCookieConsent()) {
      banner?.remove();
      return;
    }

    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'cookie-banner';
      banner.dataset.cookieBanner = 'true';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-live', 'polite');
      banner.setAttribute('aria-label', 'Уведомление о cookie');
      banner.innerHTML = `
        <div class="cookie-banner__text">
          Мы используем cookie, Яндекс.Карты и другие технические данные для корректной работы сайта. Продолжая пользоваться сайтом, вы соглашаетесь с обработкой данных в соответствии с <a href="/privacy">Политикой обработки персональных данных</a>.
        </div>
        <button class="button button-accent cookie-banner__button" type="button">Принять</button>
      `;
      document.body.appendChild(banner);
    }

    banner.hidden = false;
    syncCookieConsentClass();
    banner.classList.add('is-visible');

    const acceptButton = banner.querySelector('[data-cookie-accept]');
    const fallbackAcceptButton = banner.querySelector('.cookie-banner__button');
    (acceptButton || fallbackAcceptButton)?.addEventListener('click', () => {
      saveCookieConsent();
      syncCookieConsentClass();
      banner.classList.add('is-hidden');
      banner.classList.remove('is-visible');
      window.dispatchEvent(new CustomEvent('cookieConsentAccepted'));
      window.setTimeout(() => banner.remove(), 260);
    });
  };

  setupCookieBanner();

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
      locationMap.innerHTML = '';

      const map = new window.ymaps.Map('locationMap', {
        center: [centerLat, centerLon],
        zoom,
        controls: ['zoomControl', 'fullscreenControl']
      }, {
        suppressMapOpenBlock: true
      });

      const placemark = new window.ymaps.Placemark([pointLat, pointLon], {
        balloonContentHeader: 'Промтехнопарк',
        balloonContentBody: 'Москва, Барышиха 37а',
        hintContent: 'Промтехнопарк',
        iconCaption: 'Промтехнопарк'
      }, {
        preset: 'islands#redDotIconWithCaption'
      });

      map.geoObjects.add(placemark);
      map.behaviors.disable('scrollZoom');
      locationMap.dataset.mapReady = 'true';
    };

    let yandexMapsPromise = null;

    const loadYandexMapsApi = () => {
      if (window.ymaps && typeof window.ymaps.ready === 'function') {
        return Promise.resolve(window.ymaps);
      }

      if (yandexMapsPromise) return yandexMapsPromise;

      yandexMapsPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[data-yandex-maps-api]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(window.ymaps), { once: true });
          existingScript.addEventListener('error', reject, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
        script.async = true;
        script.defer = true;
        script.dataset.yandexMapsApi = 'true';
        script.addEventListener('load', () => resolve(window.ymaps), { once: true });
        script.addEventListener('error', reject, { once: true });
        document.head.appendChild(script);
      });

      return yandexMapsPromise;
    };

    const tryInitMap = () => {
      if (!hasAcceptedCookieConsent()) return;

      loadYandexMapsApi().then(() => {
        if (window.ymaps && typeof window.ymaps.ready === 'function') {
          window.ymaps.ready(initLocationMap);
        }
      }).catch(() => {
        locationMap.dataset.mapReady = 'error';
      });
    };

    const syncMapPlaceholder = () => {
      const placeholder = locationMap.querySelector('.map-placeholder');
      if (placeholder) {
        placeholder.textContent = hasAcceptedCookieConsent()
          ? 'Загружаем карту...'
          : 'Карта загрузится после принятия cookie.';
      }
    };

    syncMapPlaceholder();
    tryInitMap();
    window.addEventListener('cookieConsentAccepted', () => {
      syncMapPlaceholder();
      tryInitMap();
    });
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

  const lotsGrid = document.getElementById('lotsGrid');
  const lotCardTemplate = document.getElementById('lotCardTemplate');
  const lotsGroupTemplate = document.getElementById('lotsGroupTemplate');
  const lotSelectNode = document.getElementById('lotSelect');

  const lotsData = [
    {
      number: 'Лот 01',
      title: 'Производственный блок с зоной погрузки',
      area: '3 067,05 м²',
      rate: '18 000 руб/м² в год',
      floor: '3 этаж + 1 этаж',
      purpose: 'Light industrial / производство',
      composition: '2 900,77 м² производство + 166,28 м² зона погрузки на 1 этаже',
      ceiling: '8 м (производственная часть), для зоны погрузки - уточняется',
      summary: 'Под light industrial, сборку, R&D, инженерно-техническое подразделение и сервисную функцию.',
      tags: ['3 этаж', 'зона погрузки', '1,5 МВт', '6 ворот'],
      categories: ['production'],
      group: 'single',
      label: 'Лот 01 · Производственный блок с зоной погрузки 3 067,05 м²',
      images: [
        { src: 'assets/images/Lots/06/06лот1.jpg', alt: 'Производственный блок с зоной погрузки, 3 067,05 м²' },
        { src: 'assets/images/Lots/06/06лот2.jpg', alt: 'Производственный блок с зоной погрузки, 3 067,05 м²' },
        { src: 'assets/images/Lots/06/06лот3.jpg', alt: 'Производственный блок с зоной погрузки, 3 067,05 м²' }
      ]
    },
    {
      number: 'Лот 02',
      title: 'Мезонинный блок',
      area: '394,16 м²',
      rate: '18 000 руб/м² в год',
      floor: '4 этаж (мезонин)',
      purpose: 'Производство-склад / комплектация',
      composition: 'отдельный мезонинный блок',
      ceiling: '4 м',
      summary: 'Под хранение, комплектацию, упаковку, лёгкую сборку или вспомогательную функцию для производственного резидента.',
      tags: ['мезонин', '4 этаж', 'склад', 'комплектация'],
      categories: ['mezzanine'],
      group: 'single',
      label: 'Лот 02 · Мезонинный блок 394,16 м²',
      images: [
        { src: 'assets/images/Lots/05/05лот1.jpg', alt: 'Мезонинный блок, 394,16 м²' },
        { src: 'assets/images/Lots/05/05лот2.jpg', alt: 'Мезонинный блок, 394,16 м²' },
        { src: 'assets/images/Lots/05/05лот3.jpg', alt: 'Мезонинный блок, 394,16 м²' }
      ]
    },
    {
      number: 'Лот 03',
      title: 'Мезонинный блок',
      area: '319,29 м²',
      rate: '18 000 руб/м² в год',
      floor: '4 этаж (мезонин)',
      purpose: 'Производство-склад / сервисная функция',
      composition: 'отдельный мезонинный блок',
      ceiling: '4 м',
      summary: 'Под хранение, сервисную функцию, упаковку или вспомогательный блок в составе производственного контура.',
      tags: ['мезонин', '4 этаж', 'склад', 'гибкий формат'],
      categories: ['mezzanine'],
      group: 'single',
      label: 'Лот 03 · Мезонинный блок 319,29 м²',
      images: [
        { src: 'assets/images/Lots/05/05лот1.jpg', alt: 'Мезонинный блок, 319,29 м²' },
        { src: 'assets/images/Lots/05/05лот2.jpg', alt: 'Мезонинный блок, 319,29 м²' },
        { src: 'assets/images/Lots/05/05лот3.jpg', alt: 'Мезонинный блок, 319,29 м²' }
      ]
    },
    {
      number: 'Лот 04',
      title: 'Офисный блок',
      area: '896,94 м²',
      rate: '28 000 руб/м² в год',
      floor: '3 этаж',
      purpose: 'Офис',
      composition: 'единый офисный блок',
      ceiling: '4 м',
      summary: 'Под головной офис, административный блок, инженерную команду или клиентский офис.',
      tags: ['отдельный блок', '3 этаж', 'долгосрочная аренда'],
      categories: ['office'],
      group: 'single',
      label: 'Лот 04 · Офисный блок 896,94 м²',
      images: [
        { src: 'assets/images/Lots/01/01лот1.jpg', alt: 'Офисный блок, 896,94 м²' },
        { src: 'assets/images/Lots/01/01лот2.jpg', alt: 'Офисный блок, 896,94 м²' },
        { src: 'assets/images/Lots/01/01лот3.jpg', alt: 'Офисный блок, 896,94 м²' }
      ]
    },
    {
      number: 'Лот 05',
      title: 'Офисный блок',
      area: '428,79 м²',
      rate: '28 000 руб/м² в год',
      floor: '4 этаж',
      purpose: 'Офис',
      composition: 'компактный офисный блок',
      ceiling: '4 м',
      summary: 'Под административную функцию, инженерное подразделение, back office или сервисный офис.',
      tags: ['4 этаж', 'парковка', '2 лифта'],
      categories: ['office'],
      group: 'single',
      label: 'Лот 05 · Офисный блок 428,79 м²',
      images: [
        { src: 'assets/images/Lots/02/02лот1.jpg', alt: 'Офисный блок, 428,79 м²' },
        { src: 'assets/images/Lots/02/02лот2.jpg', alt: 'Офисный блок, 428,79 м²' },
        { src: 'assets/images/Lots/02/02лот3.jpg', alt: 'Офисный блок, 428,79 м²' }
      ]
    },
    {
      number: 'Лот 06',
      title: 'Showroom / клиентский блок',
      area: '385,12 м²',
      rate: '29 000 руб/м² в год',
      floor: '1 этаж',
      purpose: 'Коммерция / showroom',
      composition: 'первый этаж, клиентский доступ',
      ceiling: '4 м',
      summary: 'Под showroom, демонстрационное пространство, клиентский блок или фирменное представительство.',
      tags: ['1 этаж', 'клиентский доступ', 'коммерческий блок'],
      categories: ['commercial'],
      group: 'single',
      label: 'Лот 06 · Showroom / клиентский блок 385,12 м²',
      images: [
        { src: 'assets/images/Lots/04/04лот1.jpg', alt: 'Showroom / клиентский блок, 385,12 м²' },
        { src: 'assets/images/Lots/04/04лот2.jpg', alt: 'Showroom / клиентский блок, 385,12 м²' },
        { src: 'assets/images/Lots/04/04лот3.jpg', alt: 'Showroom / клиентский блок, 385,12 м²' }
      ]
    },
    {
      number: 'Лот 07',
      title: 'Кафе / ресторан',
      area: '425,30 м²',
      rate: '29 000 руб/м² в год',
      floor: '1 этаж',
      purpose: 'Общественное питание',
      composition: 'первый этаж, отдельный коммерческий блок',
      ceiling: '4 м',
      summary: 'Под кафе, ресторан, кофейню, столовую или корпоративное питание для резидентов и посетителей.',
      tags: ['1 этаж', 'общепит', 'потенциал трафика'],
      categories: ['commercial'],
      group: 'single',
      label: 'Лот 07 · Кафе / ресторан 425,30 м²',
      images: [
        { src: 'assets/images/Lots/03/03лот1.jpg', alt: 'Кафе / ресторан, 425,30 м²' },
        { src: 'assets/images/Lots/03/03лот2.jpg', alt: 'Кафе / ресторан, 425,30 м²' },
        { src: 'assets/images/Lots/03/03лот3.jpg', alt: 'Кафе / ресторан, 425,30 м²' }
      ]
    },
    {
      number: 'Лот 08',
      title: 'Производственно-офисный контур',
      area: '5 106,23 м²',
      rate: '18 000 руб/м² производство · 28 000 руб/м² офис',
      floor: '1, 3 и 4 этажи',
      purpose: 'Вариант объединения / смешанный блок',
      composition: '3 614,22 м² производственно-складские площади + 1 325,73 м² офисы + 166,28 м² зона погрузки',
      ceiling: '8 м (основная производственная часть), 4 м (мезонины и офисы), для зоны погрузки - уточняется',
      summary: 'Единый контур для компании, которой нужно объединить производство, инженерный офис и вспомогательные площади в одном объекте.',
      tags: ['комплексный блок', 'зона погрузки', '2 грузовых подъёмника'],
      categories: ['combination'],
      group: 'combination',
      label: 'Лот 08 · Производственно-офисный контур 5 106,23 м²',
      images: [
        { src: 'assets/images/Lots/05/05лот1.jpg', alt: 'Производственно-офисный контур, 5 106,23 м²' },
        { src: 'assets/images/Lots/05/05лот2.jpg', alt: 'Производственно-офисный контур, 5 106,23 м²' },
        { src: 'assets/images/Lots/05/05лот3.jpg', alt: 'Производственно-офисный контур, 5 106,23 м²' }
      ]
    }
  ];

  const lotGroups = [
    {
      id: 'single',
      kicker: 'Группа A',
      title: 'Отдельные лоты',
      note: 'Самостоятельные помещения, доступные к аренде по отдельности.',
      renderHeading: false
    },
    {
      id: 'combination',
      kicker: 'Группа B',
      title: 'Варианты объединения',
      note: 'Комбинации из тех же площадей. Это не дополнительный объём сверх отдельных лотов.',
      renderHeading: false
    }
  ];

  const renderLotsSection = () => {
    if (!lotsGrid || !lotCardTemplate || !lotsGroupTemplate) return;

    lotsGrid.innerHTML = '';

    lotGroups.forEach((group) => {
      if (group.renderHeading) {
        const heading = lotsGroupTemplate.content.firstElementChild?.cloneNode(true);
        if (!heading) return;

        heading.dataset.group = group.id;
        heading.classList.add('visible');
        heading.querySelector('.lots-group-kicker').textContent = group.kicker;
        heading.querySelector('.lots-group-title').textContent = group.title;
        heading.querySelector('.lots-group-note').textContent = group.note;
        lotsGrid.appendChild(heading);
      }

      lotsData.filter((lot) => lot.group === group.id).forEach((lot) => {
        const card = lotCardTemplate.content.firstElementChild?.cloneNode(true);
        if (!card) return;

        card.dataset.categories = lot.categories.join(' ');
        card.dataset.group = lot.group;
        card.classList.add('visible');

        const slidesContainer = card.querySelector('.lot-slides');
        const dotsContainer = card.querySelector('.slider-dots');
        slidesContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        lot.images.forEach((image, index) => {
          const slide = document.createElement('div');
          slide.className = `lot-slide${index === 0 ? ' active' : ''}`;
          slide.dataset.slide = String(index);

          const img = document.createElement('img');
          img.src = image.src;
          img.alt = image.alt;
          img.loading = index === 0 ? 'eager' : 'lazy';
          slide.appendChild(img);
          slidesContainer.appendChild(slide);

          const dot = document.createElement('span');
          dot.className = `slider-dot${index === 0 ? ' active' : ''}`;
          dot.dataset.dot = String(index);
          dotsContainer.appendChild(dot);
        });

        card.querySelector('.slider-badge').textContent = lot.number;
        card.querySelector('.lot-type').textContent = lot.title;
        card.querySelector('.lot-area').textContent = lot.area;
        card.querySelector('.lot-rate').textContent = lot.rate;
        card.querySelector('[data-field="floor"]').textContent = lot.floor;
        card.querySelector('[data-field="purpose"]').textContent = lot.purpose;
        card.querySelector('[data-field="ceiling"]').textContent = lot.ceiling;
        card.querySelector('[data-field="composition"]').textContent = lot.composition;
        card.querySelector('.lot-summary').textContent = lot.summary;

        const tagsContainer = card.querySelector('.lot-tags');
        lot.tags.forEach((tagText) => {
          const tag = document.createElement('span');
          tag.className = 'lot-tag';
          tag.textContent = tagText;
          tagsContainer.appendChild(tag);
        });

        const requestButton = card.querySelector('[data-request-lot]');
        requestButton.dataset.requestLot = lot.label;
        requestButton.setAttribute('aria-label', `Запросить ${lot.label}`);

        lotsGrid.appendChild(card);
      });
    });
  };

  const populateLotSelect = () => {
    if (!lotSelectNode) return;

    lotSelectNode.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Нужен подбор подходящего варианта';
    lotSelectNode.appendChild(defaultOption);

    lotsData.forEach((lot) => {
      const option = document.createElement('option');
      option.value = lot.label;
      option.textContent = lot.label;
      lotSelectNode.appendChild(option);
    });
  };

  renderLotsSection();
  populateLotSelect();

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
  const lotGroupHeadings = [...document.querySelectorAll('[data-group-heading]')];
  const lotsEmpty = document.getElementById('lotsEmpty');
  const lotsViewport = document.getElementById('lotsViewport');
  const lotsPrevButton = document.getElementById('lotsPrev');
  const lotsNextButton = document.getElementById('lotsNext');

  const getLotScrollStep = () => {
    if (!lotsViewport) return 0;
    const firstVisibleCard = lotCards.find((card) => !card.classList.contains('hidden-card'));
    if (!firstVisibleCard) return Math.max(320, lotsViewport.clientWidth * 0.85);

    const cardStyles = window.getComputedStyle(firstVisibleCard);
    const gap = Number.parseFloat(cardStyles.marginRight || '0');
    return firstVisibleCard.getBoundingClientRect().width + gap + 20;
  };

  const syncLotsCarouselState = () => {
    if (!lotsViewport || !lotsPrevButton || !lotsNextButton) return;

    const maxScroll = Math.max(0, lotsViewport.scrollWidth - lotsViewport.clientWidth);
    const currentScroll = Math.max(0, lotsViewport.scrollLeft);
    const prevDisabled = currentScroll <= 8;
    const nextDisabled = currentScroll >= maxScroll - 8 || maxScroll <= 8;

    lotsPrevButton.classList.toggle('is-disabled', prevDisabled);
    lotsNextButton.classList.toggle('is-disabled', nextDisabled);
    lotsPrevButton.setAttribute('aria-disabled', prevDisabled ? 'true' : 'false');
    lotsNextButton.setAttribute('aria-disabled', nextDisabled ? 'true' : 'false');
  };

  const scrollLotsBy = (direction) => {
    if (!lotsViewport) return;
    lotsViewport.scrollBy({
      left: getLotScrollStep() * direction,
      behavior: 'smooth'
    });
  };

  const applyFilter = (filter) => {
    let visibleCount = 0;
    const visibleByGroup = new Map();

    lotCards.forEach((card) => {
      const categories = (card.dataset.categories || '').split(/\s+/).filter(Boolean);
      const show = filter === 'all' || categories.includes(filter);
      card.classList.toggle('hidden-card', !show);
      if (show) {
        visibleCount += 1;
        const groupId = card.dataset.group || '';
        visibleByGroup.set(groupId, (visibleByGroup.get(groupId) || 0) + 1);
      }
    });

    lotGroupHeadings.forEach((heading) => {
      const groupId = heading.dataset.group || '';
      const hasVisibleCards = (visibleByGroup.get(groupId) || 0) > 0;
      heading.classList.toggle('hidden-card', !hasVisibleCards);
    });

    lotsEmpty?.classList.toggle('hidden', visibleCount > 0);
    if (lotsViewport) {
      lotsViewport.scrollTo({ left: 0, behavior: 'auto' });
    }
    window.requestAnimationFrame(syncLotsCarouselState);
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

  lotsPrevButton?.addEventListener('click', () => {
    if (lotsPrevButton.classList.contains('is-disabled')) return;
    scrollLotsBy(-1);
  });
  lotsNextButton?.addEventListener('click', () => {
    if (lotsNextButton.classList.contains('is-disabled')) return;
    scrollLotsBy(1);
  });
  [lotsPrevButton, lotsNextButton].forEach((control, index) => {
    control?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (control.classList.contains('is-disabled')) return;
      scrollLotsBy(index === 0 ? -1 : 1);
    });
  });
  lotsViewport?.addEventListener('scroll', syncLotsCarouselState, { passive: true });
  window.addEventListener('resize', syncLotsCarouselState);
  syncLotsCarouselState();

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

  const scheduleRubytechModal = (delayMs = 3000) => {
    window.setTimeout(() => {
      if (isCookieBannerVisible()) {
        window.addEventListener('cookieConsentAccepted', () => scheduleRubytechModal(700), { once: true });
        return;
      }

      openRubytechModal();
    }, delayMs);
  };

  scheduleRubytechModal();

  // "Leave request" buttons for lots
  const lotRequestButtons = [...document.querySelectorAll('[data-request-lot]')];
  const lotLayoutButtons = [...document.querySelectorAll('[data-request-layout]')];
  const topicRequestLinks = [...document.querySelectorAll('[data-request-topic]')];
  const contactsSection = document.getElementById('contacts');
  const lotSelect = lotSelectNode;
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
        topic: 'Запросить помещение',
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

    try {
      const res = await fetch('https://formsubmit.co/ajax/s.zharov@abcentrum.ru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Новая заявка с сайта Митино',
          _template: 'table',
          _captcha: 'false',
          Имя: String(formData.get('name') || ''),
          Телефон: String(formData.get('phone') || ''),
          Помещение: String(formData.get('lot') || 'подбор варианта'),
          'Тип запроса': String(formData.get('request_type') || ''),
          Комментарий: String(formData.get('message') || ''),
          Страница: window.location.href,
        }),
      });
      if (!res.ok) throw new Error('network');

      setFormStatus('Заявка отправлена. Мы свяжемся с вами в рабочее время.', 'success');
      leadForm.reset();
      if (requestTypeField instanceof HTMLInputElement) requestTypeField.value = '';
      syncCustomLotSelect();
      updateSelectedLotUi('');
    } catch (_) {
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
