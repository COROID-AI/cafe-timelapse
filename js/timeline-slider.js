// Timeline Slider with Era Selection Controls
// Provides a horizontal timeline with clickable year markers and an era info display.
// Calls PeriodManager.setEra(year) via the provided periodManager instance.

const DEFAULT_YEARS = Object.freeze([1945, 1965, 1985, 2005, 2025]);

const FALLBACK_DESCRIPTIONS = Object.freeze({
  1945: {
    name: '1945 — The Post-War Era',
    description: 'Post-war optimism, early suburban life, and radio news.'
  },
  1965: {
    name: '1965 — The Swinging Sixties',
    description: 'Mod fashion, the British Invasion, and the cultural revolution.'
  },
  1985: {
    name: '1985 — Neon Decade',
    description: 'Neon energy, arcade fun, and the rise of personal computing.'
  },
  2005: {
    name: '2005 — Digital Dawn',
    description: 'iPod culture, early social networks, and broadband adoption.'
  },
  2025: {
    name: '2025 — Neo-Futurism',
    description: 'Sustainable design, AI integration, and retro-futurist revival.'
  }
});

/**
 * @typedef {{ setEra: (year:number)=>Promise<void>, onEraChange:(cb:(era:any)=>void)=>void }} PeriodManagerLike
 */

class TimelineSlider {
  /**
   * @param {HTMLElement} container
   * @param {PeriodManagerLike} periodManager
   * @param {Record<number, {name:string, description:string}>} eraDescriptions
   */
  constructor(container, periodManager, eraDescriptions = FALLBACK_DESCRIPTIONS) {
    this.container = container;
    this.periodManager = periodManager;
    this.eraDescriptions = eraDescriptions;
    this.years = DEFAULT_YEARS;

    this.currentYear = this.years[0];

    this.sliderContainer = null;
    this.yearButtons = [];
    this.eraYearDisplay = null;
    this.eraNameDisplay = null;
    this.eraDescriptionDisplay = null;

    this._rafToken = 0;

    this.handleYearClick = this.handleYearClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this._onEraChange = this._onEraChange.bind(this);

    this._createSliderUI();
    this.updateUI();

    this.periodManager.onEraChange(this._onEraChange);
  }

  _createSliderUI() {
    this.sliderContainer = document.createElement('div');
    this.sliderContainer.className = 'timeline-slider-container';
    this.sliderContainer.tabIndex = 0;
    this.sliderContainer.setAttribute('role', 'group');
    this.sliderContainer.setAttribute('aria-label', 'Timeline era selection');

    const buttonsHtml = this.years
      .map(
        (year) => `
          <button
            type="button"
            class="year-button"
            data-year="${year}"
            aria-label="Select era ${year}"
            aria-pressed="false"
          >
            ${year}
          </button>
        `
      )
      .join('');

    this.sliderContainer.innerHTML = `
      <div class="timeline-bar" role="presentation">
        ${buttonsHtml}
      </div>
      <div class="era-info" aria-live="polite">
        <div class="era-display">
          <span class="era-year"></span> — <span class="era-name"></span>
        </div>
        <div class="era-description"></div>
      </div>
    `;

    this.container.appendChild(this.sliderContainer);

    this.yearButtons = Array.from(this.sliderContainer.querySelectorAll('.year-button'));
    this.eraYearDisplay = this.sliderContainer.querySelector('.era-year');
    this.eraNameDisplay = this.sliderContainer.querySelector('.era-name');
    this.eraDescriptionDisplay = this.sliderContainer.querySelector('.era-description');

    this.yearButtons.forEach((button) => button.addEventListener('click', this.handleYearClick));
    this.sliderContainer.addEventListener('keydown', this.handleKeyDown);
  }

  _onEraChange(era) {
    if (!era || typeof era.year !== 'number') return;
    this.currentYear = era.year;
    this.updateUI();
  }

  handleYearClick(event) {
    const year = Number(event.currentTarget?.dataset?.year);
    if (!Number.isFinite(year)) return;
    this.selectYear(year);
  }

  handleKeyDown(event) {
    const currentIndex = this.years.indexOf(this.currentYear);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowLeft') {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      nextIndex = Math.min(this.years.length - 1, currentIndex + 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectYear(this.currentYear);
      return;
    } else {
      return;
    }

    if (nextIndex === currentIndex) return;

    event.preventDefault();
    this.currentYear = this.years[nextIndex];
    this.updateUI();
    this.yearButtons[nextIndex]?.focus?.();
  }

  async selectYear(year) {
    if (!this.years.includes(year)) return;

    // Optimistic UI update.
    this.currentYear = year;
    this.updateUI();

    try {
      await this.periodManager.setEra(year);
    } catch (error) {
      console.error(`Failed to set era to ${year}:`, error);
    }
  }

  updateUI() {
    if (!this.sliderContainer) return;

    this._rafToken += 1;
    const token = this._rafToken;

    this.yearButtons.forEach((button) => {
      const year = Number(button.dataset.year);
      const isActive = year === this.currentYear;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const info = this.eraDescriptions[this.currentYear];
    const name = info?.name ?? String(this.currentYear);
    const description = info?.description ?? '';

    if (this.eraYearDisplay) this.eraYearDisplay.textContent = String(this.currentYear);

    // eraNameDisplay shows the era name without the year prefix if present.
    const cleanedName = name.replace(/^\d{4}\s*—\s*/, '');
    if (this.eraNameDisplay) this.eraNameDisplay.textContent = cleanedName;
    if (this.eraDescriptionDisplay) this.eraDescriptionDisplay.textContent = description;

    this.sliderContainer.dataset.theme = `era-${this.currentYear}`;

    requestAnimationFrame(() => {
      if (token !== this._rafToken) return;
      // reserved for future animation hooks
    });
  }

  destroy() {
    if (this.yearButtons) {
      this.yearButtons.forEach((button) => button.removeEventListener('click', this.handleYearClick));
    }
    if (this.sliderContainer) {
      this.sliderContainer.removeEventListener('keydown', this.handleKeyDown);
      this.sliderContainer.remove();
    }
  }
}

export { TimelineSlider };

export const eraDescriptions = FALLBACK_DESCRIPTIONS;
