import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { HomeAssistant } from "../types";
import { localize, type TranslationKey } from "../utils/localize";
import { getSelectValue } from "../utils/events";
import { inputStyles } from "../styles/input-styles";

import "./shared/rs-info-icon";

type HeatSourcePolicy = "efficiency" | "hydronic_first" | "air_first";

const POLICY_LABEL_KEYS: Record<HeatSourcePolicy, TranslationKey> = {
  efficiency: "heat_source.policy_efficiency",
  hydronic_first: "heat_source.policy_hydronic_first",
  air_first: "heat_source.policy_air_first",
};

@customElement("rs-heat-source-section")
export class RsHeatSourceSection extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public enabled = false;
  @property({ type: Number }) public primaryDelta = 1.5;
  @property({ type: Number }) public outdoorThreshold = 5.0;
  @property({ type: Number }) public acMinOutdoor = -15.0;
  @property({ type: String }) public policy: HeatSourcePolicy = "efficiency";
  @property({ type: Number }) public joinDelta = 1.1;
  @property({ type: Number }) public joinHoldMinutes = 30;
  @property({ type: Number }) public dropHysteresis = 0.3;
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

      .policy-row {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .policy-row ha-select {
        width: 100%;
      }

      .thresholds {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
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
    const policy = this._normalizedPolicy();

    if (!this.editing) {
      if (!this.enabled) {
        return html`<div class="summary disabled">
          ${localize("heat_source.summary_disabled", lang)}
        </div>`;
      }
      if (policy === "efficiency") {
        return html`<div class="summary">
          ${localize("heat_source.primary_delta", lang)}:
          <strong>${this.primaryDelta}${localize("heat_source.primary_delta_suffix", lang)}</strong>
          · ${localize("heat_source.outdoor_threshold", lang)}:
          <strong
            >${this.outdoorThreshold}${localize(
              "heat_source.outdoor_threshold_suffix",
              lang,
            )}</strong
          >
          · ${localize("heat_source.ac_min_outdoor", lang)}:
          <strong
            >${this.acMinOutdoor}${localize("heat_source.ac_min_outdoor_suffix", lang)}</strong
          >
        </div>`;
      }
      return html`<div class="summary">
        ${localize(POLICY_LABEL_KEYS[policy], lang)} · ${localize("heat_source.join_delta", lang)}:
        <strong>${this.joinDelta}${localize("heat_source.join_delta_suffix", lang)}</strong> ·
        ${localize("heat_source.join_hold", lang)}:
        <strong>${this.joinHoldMinutes}${localize("heat_source.join_hold_suffix", lang)}</strong> ·
        ${localize("heat_source.drop_hysteresis", lang)}:
        <strong
          >${this.dropHysteresis}${localize("heat_source.drop_hysteresis_suffix", lang)}</strong
        >
        · ${localize("heat_source.ac_min_outdoor", lang)}:
        <strong>${this.acMinOutdoor}${localize("heat_source.ac_min_outdoor_suffix", lang)}</strong>
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

      ${this.enabled
        ? html`
            <div class="policy-row">
              <div class="threshold-label">
                <span>${localize("heat_source.policy", lang)}</span>
                <rs-info-icon .text=${localize("heat_source.policy_hint", lang)}></rs-info-icon>
              </div>
              <ha-select
                .value=${policy}
                .options=${[
                  {
                    value: "efficiency",
                    label: localize("heat_source.policy_efficiency", lang),
                  },
                  {
                    value: "hydronic_first",
                    label: localize("heat_source.policy_hydronic_first", lang),
                  },
                  {
                    value: "air_first",
                    label: localize("heat_source.policy_air_first", lang),
                  },
                ]}
                fixedMenuPosition
                @selected=${this._onPolicySelected}
                @closed=${(e: Event) => e.stopPropagation()}
              >
                <ha-list-item value="efficiency"
                  >${localize("heat_source.policy_efficiency", lang)}</ha-list-item
                >
                <ha-list-item value="hydronic_first"
                  >${localize("heat_source.policy_hydronic_first", lang)}</ha-list-item
                >
                <ha-list-item value="air_first"
                  >${localize("heat_source.policy_air_first", lang)}</ha-list-item
                >
              </ha-select>
            </div>
            <div class="thresholds">
              ${policy === "efficiency"
                ? html`
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
                    ${this._renderAcMinOutdoorCell(lang)}
                  `
                : html`
                    ${this._renderThresholdCell({
                      label: localize("heat_source.join_delta", lang),
                      hint: localize("heat_source.join_delta_hint", lang),
                      suffix: localize("heat_source.join_delta_suffix", lang),
                      value: this.joinDelta,
                      min: 0.5,
                      max: 3.0,
                      step: 0.1,
                      key: "heat_source_join_delta",
                    })}
                    ${this._renderThresholdCell({
                      label: localize("heat_source.join_hold", lang),
                      hint: localize("heat_source.join_hold_hint", lang),
                      suffix: localize("heat_source.join_hold_suffix", lang),
                      value: this.joinHoldMinutes,
                      min: 15,
                      max: 90,
                      step: 1,
                      key: "heat_source_join_hold_minutes",
                    })}
                    ${this._renderThresholdCell({
                      label: localize("heat_source.drop_hysteresis", lang),
                      hint: localize("heat_source.drop_hysteresis_hint", lang),
                      suffix: localize("heat_source.drop_hysteresis_suffix", lang),
                      value: this.dropHysteresis,
                      min: 0.1,
                      max: 1.5,
                      step: 0.1,
                      key: "heat_source_drop_hysteresis",
                    })}
                    ${this._renderAcMinOutdoorCell(lang)}
                  `}
            </div>
          `
        : nothing}
    `;
  }

  private _normalizedPolicy(): HeatSourcePolicy {
    if (this.policy === "hydronic_first" || this.policy === "air_first") return this.policy;
    return "efficiency";
  }

  private _renderAcMinOutdoorCell(lang: string) {
    return this._renderThresholdCell({
      label: localize("heat_source.ac_min_outdoor", lang),
      hint: localize("heat_source.ac_min_outdoor_hint", lang),
      suffix: localize("heat_source.ac_min_outdoor_suffix", lang),
      value: this.acMinOutdoor,
      min: -30,
      max: 5,
      step: 1,
      key: "heat_source_ac_min_outdoor",
    });
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

  private _onPolicySelected(e: Event) {
    const val = getSelectValue(e);
    if (val === "efficiency" || val === "hydronic_first" || val === "air_first") {
      if (val !== this._normalizedPolicy()) this._emit("heat_source_policy", val);
    }
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
