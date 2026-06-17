// DDUI System - Custom Form UI Wrapper
// Provides a cleaner API for creating forms with observables

import { world } from "../core.js";
import { ActionFormData, ModalFormData } from "../core.js";

// ============================================
// Observable System
// ============================================

class Observable {
    constructor(value) {
        this._value = value;
        this._listeners = [];
    }

    static create(value) {
        return new Observable(value);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = newValue;
        this._notifyListeners();
    }

    toString() {
        return String(this._value);
    }

    _notifyListeners() {
        for (const listener of this._listeners) {
            listener(this._value);
        }
    }
}

// ============================================
// Label Component
// ============================================

class Label {
    constructor(text) {
        this.text = text;
    }

    toString() {
        return this.text;
    }
}

// ============================================
// CustomForm System
// ============================================

class CustomForm {
    constructor(player, title) {
        this.player = player;
        this.title = title;
        this.buttons = [];
        this.labels = [];
        this.spacers = [];
        this.dividers = [];
        this._onClose = null;
    }

    static create(player, title) {
        return new CustomForm(player, title);
    }

    label(text) {
        this.labels.push(text);
        return this;
    }

    spacer() {
        this.spacers.push(true);
        return this;
    }

    divider() {
        this.dividers.push(true);
        return this;
    }

    button(text, callback, icon) {
        this.buttons.push({ text, callback, icon });
        return this;
    }

    closeButton() {
        this._hasCloseButton = true;
        return this;
    }

    async show() {
        return new Promise((resolve, reject) => {
            try {
                // Build the form body with labels and dividers
                let body = "";
                
                for (const label of this.labels) {
                    const labelText = label instanceof Observable ? label.toString() : String(label);
                    body += `${labelText}\n`;
                }

                const form = new ActionFormData()
                    .title(this.title)
                    .body(body);

                // Add buttons
                for (const btn of this.buttons) {
                    const iconPath = btn.icon || "textures/ui/button.png";
                    form.button(btn.text, iconPath);
                }

                // Show form and handle response
                form.show(this.player).then(response => {
                    if (response.canceled) {
                        if (this._onClose) this._onClose();
                        resolve();
                        return;
                    }

                    const selectedButton = this.buttons[response.selection];
                    if (selectedButton) {
                        try {
                            selectedButton.callback();
                        } catch (e) {
                            reject(e);
                        }
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    then(callback) {
        this._onClose = callback;
        return this;
    }

    catch(callback) {
        this._onError = callback;
        return this;
    }
}

// ============================================
// Export DDUI Components
// ============================================

export { CustomForm, Label, Observable };
