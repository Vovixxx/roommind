/**
 * House boiler groups: switches that share a minimum run and minimum off.
 */
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { BoilerGroup, HomeAssistant } from "../../types";
import { localize } from "../../utils/localize";

@customElement("rs-settings-boiler")
export class RsSettingsBoiler extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public boilerGroups: BoilerGroup[] = [];

  render() {
    const lang = this.hass.language;
    return html`
      ${this.boilerGroups.map(
        (group, index) => html`
          <div class="group">
            <ha-textfield
              .label=${localize("boiler.name", lang)}
              .value=${group.name}
              @change=${(e: Event) => this._patch(index, { name: (e.target as HTMLInputElement).value })}
            ></ha-textfield>
            <ha-textfield
              .label=${localize("boiler.members", lang)}
              .value=${group.members.join(", ")}
              .helper=${localize("boiler.members_hint", lang)}
              @change=${(e: Event) =>
                this._patch(index, {
                  members: (e.target as HTMLInputElement).value
                    .split(",")
                    .map((item) => item.trim())
                    .filter((item) => item.startsWith("switch.")),
                })}
            ></ha-textfield>
            <ha-textfield
              .label=${localize("boiler.min_run", lang)}
              type="number"
              .value=${String(group.min_run_minutes)}
              @change=${(e: Event) =>
                this._patch(index, {
                  min_run_minutes: Number((e.target as HTMLInputElement).value) || 10,
                })}
            ></ha-textfield>
            <ha-textfield
              .label=${localize("boiler.min_off", lang)}
              type="number"
              .value=${String(group.min_off_minutes)}
              @change=${(e: Event) =>
                this._patch(index, {
                  min_off_minutes: Number((e.target as HTMLInputElement).value) || 5,
                })}
            ></ha-textfield>
            <ha-button @click=${() => this._remove(index)}
              >${localize("boiler.remove", lang)}</ha-button
            >
          </div>
        `,
      )}
      <ha-button @click=${this._add}>${localize("boiler.add", lang)}</ha-button>
    `;
  }

  private _patch(index: number, patch: Partial<BoilerGroup>) {
    const next = this.boilerGroups.map((group, i) =>
      i === index ? { ...group, ...patch } : group,
    );
    this._emit(next);
  }

  private _remove(index: number) {
    this._emit(this.boilerGroups.filter((_, i) => i !== index));
  }

  private _add() {
    this._emit([
      ...this.boilerGroups,
      {
        id: `boiler-${Date.now()}`,
        name: "Boiler",
        members: [],
        min_run_minutes: 10,
        min_off_minutes: 5,
      },
    ]);
  }

  private _emit(groups: BoilerGroup[]) {
    this.dispatchEvent(
      new CustomEvent("setting-changed", {
        detail: { key: "boilerGroups", value: groups },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "rs-settings-boiler": RsSettingsBoiler;
  }
}
