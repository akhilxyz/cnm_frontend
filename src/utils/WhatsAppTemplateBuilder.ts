export class WhatsAppTemplateBuilder {
  private name = "";
  private category = "";
  private language = "";
  private components: any[] = [];

  setName(name: string) {
    const clean = name
      .toLowerCase()
      .replace(/[^a-z0-9\s_]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 512);
    this.name = clean;
    return this;
  }

  setCategory(category: string) {
    this.category = category;
    return this;
  }

  setLanguage(language: string) {
    this.language = language;
    return this;
  }

  addHeader(type: string, content?: string) {
    if (type === "TEXT" && content) {
      this.components.push({
        type: "HEADER",
        format: "TEXT",
        text: content.trim(),
      });
    } else if (type !== "NONE") {
      this.components.push({
        type: "HEADER",
        format: type,
      });
    }
    return this;
  }

  addBody(text: string, variables: string[], variableSamples: Record<string, string>) {
    const cleanText = text.trim().replace(/\s+/g, " ");
    const bodyComponent: any = { type: "BODY", text: cleanText };

    if (variables.length > 0) {
      const samples = variables.map(v => variableSamples[v] || "sample_data");
      bodyComponent.example = { body_text: [samples] };
    }

    this.components.push(bodyComponent);
    return this;
  }

  addFooter(text?: string) {
    if (text) {
      this.components.push({ type: "FOOTER", text: text.trim() });
    }
    return this;
  }

  addButtons(buttons: string[]) {
    if (buttons.length > 0) {
      const btns = buttons.map(text => ({
        type: "QUICK_REPLY",
        text: text.trim().substring(0, 25),
      }));
      this.components.push({ type: "BUTTONS", buttons: btns });
    }
    return this;
  }

  build() {
    return {
      name: this.name,
      category: this.category,
      language: this.language,
      components: this.components,
    };
  }
}