/**
 * TimelineUI — manages the year slider DOM, tick marks, and year display.
 * Emits a callback when the user selects a new year.
 */

const { YEARS } = window.Cafe;

class TimelineUI {
  /**
   * @param {function} onYearChange — (year: number) => void
   */
  constructor(onYearChange) {
    this.onYearChange = onYearChange;

    this.slider = document.getElementById("year-slider");
    this.display = document.getElementById("year-display");
    this.ticksContainer = document.getElementById("year-ticks");

    this._buildTicks();
    this._updateActiveTick(0);
    this._bindEvents();
  }

  /** Build the clickable / visual tick marks under the slider. */
  _buildTicks() {
    this.ticksContainer.innerHTML = "";
    this.tickElements = [];

    YEARS.forEach((year, index) => {
      const tick = document.createElement("div");
      tick.className = "timeline__tick";
      tick.dataset.index = String(index);

      const dot = document.createElement("div");
      dot.className = "timeline__tick-dot";

      const label = document.createElement("div");
      label.className = "timeline__tick-label";
      label.textContent = String(year);

      tick.appendChild(dot);
      tick.appendChild(label);
      this.ticksContainer.appendChild(tick);
      this.tickElements.push(tick);

      // Click a tick to jump to that year.
      tick.addEventListener("click", () => {
        this.slider.value = String(index);
        this._handleSliderChange();
      });
    });
  }

  /** Highlight the tick matching the current slider index. */
  _updateActiveTick(index) {
    this.tickElements.forEach((tick, i) => {
      tick.classList.toggle("timeline__tick--active", i === index);
    });
  }

  _bindEvents() {
    this.slider.addEventListener("input", () => this._handleSliderChange());
  }

  _handleSliderChange() {
    const index = parseInt(this.slider.value, 10);
    const year = YEARS[index];
    this.display.textContent = String(year);
    this._updateActiveTick(index);
    if (this.onYearChange) {
      this.onYearChange(year);
    }
  }

  /** Programmatically set the slider to a given year. */
  setYear(year) {
    const index = YEARS.indexOf(year);
    if (index === -1) return;
    this.slider.value = String(index);
    this.display.textContent = String(year);
    this._updateActiveTick(index);
  }
}

window.Cafe = window.Cafe || {};
window.Cafe.TimelineUI = TimelineUI;
