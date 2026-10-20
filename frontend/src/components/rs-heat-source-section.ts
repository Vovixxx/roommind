import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { HomeAssistant } from "../types";
import { localize } from "../utils/localize";
import { inputStyles } from "../styles/input-styles";

import "./shared/rs-info-icon";

@customElement("rs-heat-source-section")
export class RsHeatSourceSection extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public enabled = false;
  @property({ type: Number }) public primaryDelta = 1.5;
  @property({ type: Number }) public outdoorThreshold = 5.0;
  @property({ type: Number }) public acMinOutdoor = -15.0;
  @property({ type: Number }) public hysteresis = 0.3;
  @property({ type: Number }) public largeGapMultiplier = 2.0;
  @property({ type: Number }) public secondaryPowerScale = 0.7;
  @property() public preference: "outdoor" | "primary" = "outdoor";
  @property({ type: Boolean }) public editing = false;

  static styles = [
    inputStyles,
    css`
      :host {
        display: block;
      }

      /* Read-only summary (tile) */
      .summary {
        padding: 0 16px 16px;
        font-size: 13px;
        color: var(--secondary-text-color);
        line-height: 1.6;
      }

      .summary.disabled {
        font-style: italic;
        opacity: 0.75;
      }

      /* Editing layout */
      .feature-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: var(--card-background-color);
        transition:
          border-color 0.2s ease,
          background 0.2s ease;
      }

      .feature-card.enabled {
        border-color: rgba(3, 169, 244, 0.4);
        background: rgba(3, 169, 244, 0.06);
      }

      .feature-text {
        flex: 1;
        min-width: 0;
      }

      .feature-title {
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 4px;
      }

      .feature-description {
        font-size: 12px;
        color: var(--secondary-text-color);
        line-height: 1.5;
        margin: 0;
      }

      ha-switch {
        flex-shrink: 0;
      }

      .thresholds {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      @media (max-width: 600px) {
        .thresholds {
          grid-template-columns: 1fr;
        }
      }

      .threshold-cell {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 14px;
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        background: var(--card-background-color);
      }

      .threshold-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        gap: 4px;
        line-height: 1.3;
      }

      .threshold-label > span {
        flex: 1;
        min-width: 0;
      }

      .threshold-cell ha-textfield {
        width: 100%;
      }
    `,
  ];

  render() {
    const lang = this.hass.language;

    if (!this.editing) {
      if (!this.enabled) {
        return html`<div class="summary disabled">
          ${localize("heat_source.summary_disabled", lang)}
        </div>`;
      }
      return html`<div class="summary">
        ${localize("heat_source.primary_delta", lang)}:
        <strong>${this.primaryDelta}${localize("heat_source.primary_delta_suffix", lang)}</strong>
        · ${localize("heat_source.outdoor_threshold", lang)}:
        <strong
          >${this.outdoorThreshold}${localize("heat_source.outdoor_threshold_suffix", lang)}</strong
        >
        · ${localize("heat_source.ac_min_outdoor", lang)}:
        <strong>${this.acMinOutdoor}${localize("heat_source.ac_min_outdoor_suffix", lang)}</strong>
        · ${localize("heat_source.preference", lang)}:
        <strong
          >${localize(
            this.preference === "primary"
              ? "heat_source.preference_primary"
              : "heat_source.preference_outdoor",
            lang,
          )}</strong
        >
        · ${localize("heat_source.large_gap_multiplier", lang)}:
        <strong>${this.largeGapMultiplier}×</strong>
      </div>`;
    }

    return html`
      <div class="feature-card ${this.enabled ? "enabled" : ""}">
        <div class="feature-text">
          <div class="feature-title">${localize("heat_source.toggle", lang)}</div>
          <div class="feature-description">${localize("heat_source.toggle_hint", lang)}</div>
        </div>
        <ha-switch .checked=${this.enabled} @change=${this._onSwitchChange}></ha-switch>
      </div>

      ${
        this.enabled
          ? html`
              <div class="thresholds">
                <div class="threshold-cell">
                  <div class="threshold-label">
                    <span>${localize("heat_source.preference", lang)}</span>
                    <rs-info-icon
                      .text=${localize("heat_source.preference_hint", lang)}
                    ></rs-info-icon>
                  </div>
                  <ha-select
                    .value=${this.preference}
                    @selected=${(e: Event) => {
                      const target = e.target as HTMLElement & { value?: string };
                      if (target.value === "outdoor" || target.value === "primary") {
                        this._emit("heat_source_preference", target.value);
                      }
                    }}
                    @closed=${(e: Event) => e.stopPropagation()}
                    fixedMenuPosition
                  >
                    <ha-list-item value="outdoor"
                      >${localize("heat_source.preference_outdoor", lang)}</ha-list-item
                    >
                    <ha-list-item value="primary"
                      >${localize("heat_source.preference_primary", lang)}</ha-list-item
                    >
                  </ha-select>
                </div>
                ${this._renderThresholdCell({
                  label: localize("heat_source.primary_delta", lang),
                  hint: localize("heat_source.primary_delta_hint", lang),
                  suffix: localize("heat_source.primary_delta_suffix", lang),
                  value: this.primaryDelta,
                  min: 0.5,
                  max: 5.0,
                  step: 0.1,
                  key: "heat_source_primary_delta",
                })}
                ${this._renderThresholdCell({
                  label: localize("heat_source.outdoor_threshold", lang),
                  hint: localize("heat_source.outdoor_threshold_hint", lang),
                  suffix: localize("heat_source.outdoor_threshold_suffix", lang),
                  value: this.outdoorThreshold,
                  min: -20,
                  max: 25,
                  step: 1,
                  key: "heat_source_outdoor_threshold",
                })}
                ${this._renderThresholdCell({
                  label: localize("heat_source.ac_min_outdoor", lang),
                  hint: localize("heat_source.ac_min_outdoor_hint", lang),
                  suffix: localize("heat_source.ac_min_outdoor_suffix", lang),
                  value: this.acMinOutdoor,
                  min: -30,
                  max: 5,
                  step: 1,
                  key: "heat_source_ac_min_outdoor",
                })}
                ${this._renderThresholdCell({
                  label: localize("heat_source.hysteresis", lang),
                  hint: localize("heat_source.hysteresis_hint", lang),
                  suffix: localize("heat_source.primary_delta_suffix", lang),
                  value: this.hysteresis,
                  min: 0,
                  max: 2,
                  step: 0.1,
                  key: "heat_source_hysteresis",
                })}
                ${this._renderThresholdCell({
                  label: localize("heat_source.large_gap_multiplier", lang),
                  hint: localize("heat_source.large_gap_multiplier_hint", lang),
                  suffix: "×",
                  value: this.largeGapMultiplier,
                  min: 1,
                  max: 8,
                  step: 0.1,
                  key: "heat_source_large_gap_multiplier",
                })}
                ${this._renderThresholdCell({
                  label: localize("heat_source.secondary_power_scale", lang),
                  hint: localize("heat_source.secondary_power_scale_hint", lang),
                  suffix: "",
                  value: this.secondaryPowerScale,
                  min: 0.1,
                  max: 1,
                  step: 0.05,
                  key: "heat_source_secondary_power_scale",
                })}
              </div>
            `
          : nothing
      }
    `;
  }

  private _renderThresholdCell(opts: {
    label: string;
    hint: string;
    suffix: string;
    value: number;
    min: number;
    max: number;
    step: number;
    key: string;
  }) {
    return html`
      <div class="threshold-cell">
        <div class="threshold-label">
          <span>${opts.label}</span>
          <rs-info-icon .text=${opts.hint}></rs-info-icon>
        </div>
        <ha-textfield
          .value=${String(opts.value)}
          .min=${String(opts.min)}
          .max=${String(opts.max)}
          .step=${String(opts.step)}
          .suffix=${opts.suffix}
          type="number"
          @input=${(e: Event) => this._onNumberInput(opts.key, e)}
        ></ha-textfield>
      </div>
    `;
  }

  private _onSwitchChange(e: Event) {
    this._emit("heat_source_orchestration", (e.target as HTMLInputElement).checked);
  }

  private _onNumberInput(key: string, e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this._emit(key, val);
    }
  }

  private _emit(key: string, value: unknown) {
    this.dispatchEvent(
      new CustomEvent("setting-changed", {
        detail: { key, value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "rs-heat-source-section": RsHeatSourceSection;
  }
}
