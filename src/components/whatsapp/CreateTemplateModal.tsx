import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Bold, Italic, Strikethrough, Code, Upload, Loader2, FileText, Image as ImageIcon, Video, File, AlertCircle, CheckCircle, Plus, Trash2, Phone, Link as LinkIcon, Copy } from "lucide-react";
import { WAApi } from "../../api/whatsapp.api";
import { languagesList } from "../../lib/languageList";



export default function CreateTemplateModal({ show, setShow, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [step, setStep] = useState(1);
  const [mediaError, setMediaError] = useState('');
  const [errors, setErrors] = useState<any>({});

  const [form, setForm] = useState<any>({
    category: "UTILITY",
    name: "",
    language: "en",
    headerType: "NONE",
    headerText: "",
    headerMedia: null,
    bodyText: "",
    footerText: "",
    buttons: [],
    buttonType: "NONE", // NONE, QUICK_REPLY, CALL_TO_ACTION
    variableSamples: {},
  });

  const categoryInfo: any = {
    MARKETING: {
      label: "Marketing",
      description: "Promotional content, special offers, product announcements",
      color: "blue",
      restrictions: [
        "Requires explicit opt-in from customers",
        "Must not be spam or unsolicited",
        "Can't make promises you can't keep",
        "Must clearly identify your business"
      ]
    },
    UTILITY: {
      label: "Utility",
      description: "Transactional updates like order confirmations, shipping alerts, account updates",
      color: "green",
      restrictions: [
        "Must relate to a specific transaction or account",
        "Should not be promotional",
        "Must provide value to the customer"
      ]
    },
    AUTHENTICATION: {
      label: "Authentication",
      description: "Verification messages like OTP for account logins",
      color: "purple",
      restrictions: [
        "Only for security purposes (OTP, verification codes)",
        "URLs, media, and emojis are NOT allowed",
        "Variables limited to 15 characters",
        "Must include a one-tap or copy-code button"
      ]
    }
  };

  const headerTypes = [
    { value: "NONE", label: "None" },
    { value: "TEXT", label: "Text" },
    { value: "IMAGE", label: "Image" },
    { value: "VIDEO", label: "Video" },
    { value: "DOCUMENT", label: "Document" },
  ];

  const buttonTypes = [
    { value: "NONE", label: "None" },
    { value: "QUICK_REPLY", label: "Quick Reply" },
    { value: "CALL_TO_ACTION", label: "Call to Action" },
  ];

  // Comprehensive validation functions
  const validateTemplateName = (name: string): string | null => {
    if (!name.trim()) return 'Template name is required';
    if (name.length < 3) return 'Template name must be at least 3 characters';
    if (name.length > 512) return 'Template name must not exceed 512 characters';
    if (!/^[a-z0-9_]+$/.test(name.toLowerCase().replace(/\s+/g, '_'))) {
      return 'Template name can only contain lowercase letters, numbers, and underscores';
    }
    if (name.toLowerCase().startsWith('whatsapp') || name.toLowerCase().includes('meta') || name.toLowerCase().includes('facebook')) {
      return 'Template name cannot contain reserved words (whatsapp, meta, facebook)';
    }
    return null;
  };

  const validateBodyText = (text: string, category: string): string | null => {
    if (!text?.trim()) return 'Body text is required';
    if (text.length > 1024) return 'Body text must not exceed 1024 characters';
    
    // Authentication restrictions
    if (category === "AUTHENTICATION") {
      if (text.includes('http://') || text.includes('https://')) {
        return 'Authentication templates cannot contain URLs';
      }
      // Check for emoji (basic check)
      if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(text)) {
        return 'Authentication templates cannot contain emojis';
      }
    }

    // Variable validation
    if (text.startsWith('{{') || text.endsWith('}}')) {
      return "Variables cannot be at the start or end of the message";
    }

    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    const variables = matches.map(m => parseInt(m.replace(/[{}]/g, '')));
    
    // Check for sequential numbering
    const sortedVars = [...variables].sort((a, b) => a - b);
    for (let i = 0; i < sortedVars.length; i++) {
      if (sortedVars[i] !== i + 1) {
        return `Variables must be numbered sequentially starting from {{1}}. Missing or wrong: {{${i + 1}}}`;
      }
    }

    // Check variable density (not more than 1/3 of content)
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (matches.length > wordCount / 3) {
      return "Too many variables. Variables should not exceed 1/3 of the message length";
    }

    // Check for special characters in variables
    const invalidVars = text.match(/\{\{[^}]*[#$%&*]+[^}]*\}\}/g);
    if (invalidVars) {
      return "Variables cannot contain special characters like #, $, %, &, *";
    }

    // Check consecutive spaces
    if (/\s{5,}/.test(text)) {
      return "Body text cannot contain more than 4 consecutive spaces";
    }

    return null;
  };

  const validateHeaderText = (text: string): string | null => {
    if (!text?.trim()) return 'Header text is required when header type is TEXT';
    if (text.length > 60) return 'Header text must not exceed 60 characters';
    if (text.startsWith('{{') || text.endsWith('}}')) {
      return "Variables cannot be at the start or end of header";
    }
    return null;
  };

  const validateFooterText = (text: string): string | null => {
    if (!text) return null;
    if (text.length > 60) return 'Footer text must not exceed 60 characters';
    if (/\{\{/.test(text)) {
      return "Footer text cannot contain variables";
    }
    return null;
  };

  const validateButtons = (): string | null => {
    if (form.buttonType === "NONE") return null;

    if (form.buttonType === "QUICK_REPLY") {
      if (form.buttons.length === 0) return "Add at least one quick reply button";
      if (form.buttons.length > 3) return "Maximum 3 quick reply buttons allowed";
      
      for (const btn of form.buttons) {
        if (!btn.text?.trim()) return "All quick reply buttons must have text";
        if (btn.text.length > 25) return `Quick reply text "${btn.text}" exceeds 25 characters`;
      }
    }

    if (form.buttonType === "CALL_TO_ACTION") {
      if (form.buttons.length === 0) return "Add at least one call to action button";
      if (form.buttons.length > 2) return "Maximum 2 call to action buttons allowed";
      
      const phoneButtons = form.buttons.filter((b: any) => b.type === "PHONE_NUMBER");
      const urlButtons = form.buttons.filter((b: any) => b.type === "URL");
      
      if (phoneButtons.length > 1) return "Maximum 1 phone number button allowed";
      if (urlButtons.length > 2) return "Maximum 2 URL buttons allowed";

      for (const btn of form.buttons) {
        if (!btn.text?.trim()) return "All buttons must have text";
        if (btn.text.length > 25) return `Button text "${btn.text}" exceeds 25 characters`;
        
        if (btn.type === "PHONE_NUMBER") {
          if (!btn.phone_number?.trim()) return "Phone number is required";
          if (!/^\+?[1-9]\d{1,14}$/.test(btn.phone_number.replace(/[\s-]/g, ''))) {
            return "Invalid phone number format. Use international format with + prefix";
          }
        }
        
        if (btn.type === "URL") {
          if (!btn.url?.trim()) return "URL is required for URL buttons";
          if (!/^https:\/\/.+/.test(btn.url)) {
            return "URLs must start with https://";
          }
          
          // Dynamic URL validation
          if (btn.url.includes('{{1}}')) {
            if (!btn.example?.trim()) {
              return "Dynamic URL requires an example value";
            }
            if (btn.example.length > 2000) {
              return "URL example too long (max 2000 characters)";
            }
          }
        }

        if (btn.type === "COPY_CODE" && form.category === "AUTHENTICATION") {
          if (!btn.example?.trim()) return "Copy code button requires example text";
          if (btn.example.length > 15) return "Authentication button code limited to 15 characters";
        }
      }
    }

    return null;
  };

  const validateVariableSamples = (): any => {
    const errors: any = {};
    const bodyVars = extractVariables(form.bodyText);
    const headerVars = form.headerType === "TEXT" ? extractVariables(form.headerText) : [];
    const allVars = [...new Set([...bodyVars, ...headerVars])];

    allVars.forEach((varNum: string) => {
      const sample = form.variableSamples[varNum];
      
      if (!sample?.trim()) {
        errors[`variable_${varNum}`] = `Sample for {{${varNum}}} is required`;
        return;
      }

      if (form.category === "AUTHENTICATION" && sample.length > 15) {
        errors[`variable_${varNum}`] = `Authentication variables limited to 15 characters`;
      }

      if (sample.includes('{{') || sample.includes('}}')) {
        errors[`variable_${varNum}`] = `Variable sample cannot contain {{ or }}`;
      }

      // Check consecutive spaces in sample
      if (/\s{5,}/.test(sample)) {
        errors[`variable_${varNum}`] = `Sample cannot contain more than 4 consecutive spaces`;
      }
    });

    return errors;
  };

  const validateStep = () => {
    const newErrors: any = {};

    if (step === 2) {
      const nameError = validateTemplateName(form.name);
      if (nameError) newErrors.name = nameError;

      if (!form.language) newErrors.language = 'Language is required';

      const bodyError = validateBodyText(form.bodyText, form.category);
      if (bodyError) newErrors.bodyText = bodyError;

      if (form.headerType === "TEXT") {
        const headerError = validateHeaderText(form.headerText);
        if (headerError) newErrors.headerText = headerError;
      }

      if ((form.headerType === "IMAGE" || form.headerType === "VIDEO" || form.headerType === "DOCUMENT") && !form.headerMedia) {
        newErrors.headerMedia = 'Please upload a media file';
      }

      const footerError = validateFooterText(form.footerText);
      if (footerError) newErrors.footerText = footerError;

      const buttonError = validateButtons();
      if (buttonError) newErrors.buttons = buttonError;

      const varErrors = validateVariableSamples();
      Object.assign(newErrors, varErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key: any, value: any) => {
    setMediaError("");
    setErrors((prev: any) => ({ ...prev, [key]: '' }));
    setForm((prev: any) => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key]) : value
    }));
  };

  const extractVariables = (text: any) => {
    if (!text) return [];
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map((m: any) => m.replace(/[{}]/g, '')) : [];
  };

  const insertFormatting = (format: any) => {
    const textarea: any = document.getElementById('bodyText');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.bodyText.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold': formattedText = `*${selectedText}*`; break;
      case 'italic': formattedText = `_${selectedText}_`; break;
      case 'strike': formattedText = `~${selectedText}~`; break;
      case 'mono': formattedText = `\`\`\`${selectedText}\`\`\``; break;
    }

    const newText = form.bodyText.substring(0, start) + formattedText + form.bodyText.substring(end);
    handleChange('bodyText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const addVariable = () => {
    const variables = extractVariables(form.bodyText);
    const nextNum = variables.length > 0 ? Math.max(...variables.map(Number)) + 1 : 1;
    handleChange('bodyText', form.bodyText + ` {{${nextNum}}}`);
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    setMediaError("");
    if (!file) return;

    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      setMediaError("File size must be less than 16MB");
      return;
    }

    const validTypes: any = {
      IMAGE: ['image/jpeg', 'image/png'],
      VIDEO: ['video/mp4', 'video/3gpp'],
      DOCUMENT: ['application/pdf']
    };

    const typeKey = form.headerType;
    if (validTypes[typeKey] && !validTypes[typeKey].includes(file.type)) {
      setMediaError(`Invalid file type. Allowed: ${validTypes[typeKey].join(', ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingMedia(true);
    try {
      const { responseObject } = await WAApi.uploadMedia(formData);
      const previewUrl = URL.createObjectURL(file);
      handleChange("headerMedia", {
        name: file.name,
        mediaId: responseObject.id,
        type: file.type,
        previewUrl: previewUrl
      });
    } catch (err) {
      setMediaError("Upload failed. Please try again.");
      console.error('Upload failed:', err);
    } finally {
      setUploadingMedia(false);
    }
  };

  const addButton = () => {
    if (form.buttonType === "QUICK_REPLY") {
      if (form.buttons.length >= 3) return;
      handleChange('buttons', [...form.buttons, { type: "QUICK_REPLY", text: "" }]);
    } else if (form.buttonType === "CALL_TO_ACTION") {
      if (form.buttons.length >= 2) return;
      handleChange('buttons', [...form.buttons, { type: "PHONE_NUMBER", text: "", phone_number: "" }]);
    }
  };

  const updateButton = (index: number, field: string, value: any) => {
    const newButtons = [...form.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    handleChange('buttons', newButtons);
    setErrors((prev: any) => ({ ...prev, buttons: '' }));
  };

  const removeButton = (index: number) => {
    handleChange('buttons', form.buttons.filter((_: any, i: number) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      alert("Please fix all validation errors before submitting");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: form.name.toLowerCase().replace(/\s+/g, "_"),
        category: form.category,
        language: form.language,
        components: [],
      };

      // HEADER
      if (form.headerType === "TEXT" && form.headerText) {
        const headerComponent: any = {
          type: "HEADER",
          format: "TEXT",
          text: form.headerText,
        };
        const headerVars = extractVariables(form.headerText);
        if (headerVars.length > 0) {
          headerComponent.example = {
            header_text: [headerVars.map((v: any) => form.variableSamples[v])],
          };
        }
        payload.components.push(headerComponent);
      } else if (form.headerType && form.headerType !== "NONE") {
        const mediaComponent: any = {
          type: "HEADER",
          format: form.headerType.toUpperCase(),
        };
        if (["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerType) && form.headerMedia?.mediaId) {
          mediaComponent.example = {
            header_handle: [form.headerMedia.mediaId],
          };
        }
        payload.components.push(mediaComponent);
      }

      // BODY (Required)
      const bodyComponent: any = {
        type: "BODY",
        text: form.bodyText,
      };
      const bodyVars = extractVariables(form.bodyText);
      if (bodyVars.length > 0) {
        bodyComponent.example = {
          body_text: [bodyVars.map((v: any) => form.variableSamples[v])],
        };
      }
      payload.components.push(bodyComponent);

      // FOOTER
      if (form.footerText?.trim()) {
        payload.components.push({
          type: "FOOTER",
          text: form.footerText,
        });
      }

      // BUTTONS
      if (form.buttons.length > 0) {
        const buttons = form.buttons.map((btn: any) => {
          const baseBtn: any = { type: btn.type, text: btn.text };

          if (btn.type === "PHONE_NUMBER") {
            baseBtn.phone_number = btn.phone_number.replace(/[\s-]/g, '');
          }

          if (btn.type === "URL") {
            if (btn.url.includes('{{1}}')) {
              baseBtn.url = btn.url;
              baseBtn.example = [btn.example];
            } else {
              baseBtn.url = btn.url;
            }
          }

          if (btn.type === "COPY_CODE") {
            baseBtn.example = btn.example;
          }

          return baseBtn;
        });

        payload.components.push({
          type: "BUTTONS",
          buttons,
        });
      }

      console.log("Final Payload:", JSON.stringify(payload, null, 2));
      await WAApi.createTemplate(payload);
      alert("✓ Template submitted for review successfully!\n\nReview typically takes 24-48 hours.\n\nYou'll be notified via email once approved.");
      setShow(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating template:", error);
      alert(`Failed to create template:\n${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return form.category;
    if (step === 2) {
      // Don't run full validation during render, just check basic requirements
      return form.name.trim() && form.bodyText.trim();
    }
    return true;
  };

  const currentCategory = categoryInfo[form.category];
  const selectedLanguage = languagesList.find(l => l.code === form.language);
  const variables = extractVariables(form.bodyText);
  const headerVariables = form.headerType === "TEXT" ? extractVariables(form.headerText) : [];
  const allVariables = [...new Set([...variables, ...headerVariables])];

  const getMediaIcon = () => {
    switch (form.headerType) {
      case 'IMAGE': return <ImageIcon className="w-8 h-8" />;
      case 'VIDEO': return <Video className="w-8 h-8" />;
      case 'DOCUMENT': return <FileText className="w-8 h-8" />;
      default: return <File className="w-8 h-8" />;
    }
  };

  const renderFormattedText = (text: string, samples: any) => {
    let formatted = text.replace(/\{\{(\d+)\}\}/g, (_, key) => samples[key] || `{{${key}}}`);
    
    // Bold
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    // Italic
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    // Strikethrough
    formatted = formatted.replace(/~(.*?)~/g, '<s>$1</s>');
    // Monospace
    formatted = formatted.replace(/```(.*?)```/g, '<code class="bg-gray-200 px-1 rounded">$1</code>');
    
    return formatted;
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create WhatsApp Template</h2>
                  <p className="text-sm text-gray-600 mt-1">Pre-approved messages for customer communication</p>
                </div>
                <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`h-2 flex-1 rounded-full transition-all ${step >= s ? 'bg-green-600' : 'bg-gray-200'}`} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs font-medium text-gray-700">Category</span>
                <span className="text-xs font-medium text-gray-700">Content & Details</span>
                <span className="text-xs font-medium text-gray-700">Preview & Submit</span>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 mb-1">Choose your template category carefully</p>
                          <p className="text-blue-700">The category determines pricing, restrictions, and approval criteria. Marketing templates require explicit opt-in.</p>
                        </div>
                      </div>
                    </div>

                    {Object.entries(categoryInfo).map(([key, cat]: any) => (
                      <motion.div
                        key={key}
                        whileHover={{ scale: 1.01 }}
                        className="relative"
                      >
                        <button
                          type="button"
                          onClick={() => handleChange("category", key)}
                          className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                            form.category === key 
                              ? `border-${cat.color}-500 bg-${cat.color}-50 shadow-md` 
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`} />
                                <h3 className="font-bold text-lg text-gray-900">{cat.label}</h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{cat.description}</p>
                              
                              {form.category === key && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-2">Requirements:</p>
                                  <ul className="space-y-1">
                                    {cat.restrictions.map((restriction: string, idx: number) => (
                                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                        <span className="text-gray-400 mt-0.5">•</span>
                                        <span>{restriction}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            {form.category === key && (
                              <CheckCircle className={`w-6 h-6 text-${cat.color}-600 flex-shrink-0`} />
                            )}
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* Left Column - Form */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Template Name & Language */}
                      <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          Template name and language
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Template name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., order_confirmation, welcome_message"
                              value={form.name}
                              onChange={(e) => handleChange("name", e.target.value)}
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              maxLength={512}
                            />
                            {errors.name && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Use lowercase, numbers, and underscores only</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Language <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={form.language}
                              onChange={(e) => handleChange("language", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {languagesList.map((lang) => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Header */}
                      <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          Header <span className="text-gray-500 font-normal text-sm">• Optional</span>
                        </h3>
                        
                        <select
                          value={form.headerType}
                          onChange={(e) => {
                            handleChange("headerType", e.target.value);
                            handleChange("headerMedia", null);
                            handleChange("headerText", "");
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        >
                          {headerTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>

                        {form.headerType === "TEXT" && (
                          <div>
                            <input
                              type="text"
                              placeholder="Add a short header (supports {{1}}, {{2}}...)"
                              value={form.headerText}
                              onChange={(e) => handleChange("headerText", e.target.value)}
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                                errors.headerText ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              maxLength={60}
                            />
                            {errors.headerText && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.headerText}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 text-right">{form.headerText.length}/60</p>
                          </div>
                        )}

                        {(form.headerType === "IMAGE" || form.headerType === "VIDEO" || form.headerType === "DOCUMENT") && (
                          <div>
                            {!form.headerMedia ? (
                              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                                errors.headerMedia ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
                              }`}>
                                {uploadingMedia ? (
                                  <div className="flex flex-col items-center">
                                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                                    <p className="text-sm font-medium text-gray-700">Uploading...</p>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-700 mb-1">Upload {form.headerType.toLowerCase()}</p>
                                    <p className="text-xs text-gray-500 mb-4">
                                      {form.headerType === "IMAGE" && "JPEG or PNG, max 16MB"}
                                      {form.headerType === "VIDEO" && "MP4 or 3GPP, max 16MB"}
                                      {form.headerType === "DOCUMENT" && "PDF only, max 16MB"}
                                    </p>
                                    <input
                                      type="file"
                                      onChange={handleFileUpload}
                                      className="hidden"
                                      id="fileUpload"
                                      accept={
                                        form.headerType === "IMAGE" ? "image/jpeg,image/png" :
                                        form.headerType === "VIDEO" ? "video/mp4,video/3gpp" :
                                        "application/pdf"
                                      }
                                      disabled={uploadingMedia}
                                    />
                                    <label
                                      htmlFor="fileUpload"
                                      className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition"
                                    >
                                      Choose File
                                    </label>
                                  </>
                                )}
                                {(mediaError || errors.headerMedia) && (
                                  <p className="text-xs text-red-600 mt-3 flex items-center justify-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {mediaError || errors.headerMedia}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                                <div className="flex items-start gap-3">
                                  {form.headerMedia.type?.startsWith('image/') ? (
                                    <img src={form.headerMedia.previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded" />
                                  ) : form.headerMedia.type?.startsWith('video/') ? (
                                    <video src={form.headerMedia.previewUrl} className="w-24 h-24 object-cover rounded" controls />
                                  ) : (
                                    <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                                      {getMediaIcon()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{form.headerMedia.name}</p>
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Uploaded successfully
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (form.headerMedia?.previewUrl) {
                                          URL.revokeObjectURL(form.headerMedia.previewUrl);
                                        }
                                        handleChange("headerMedia", null);
                                      }}
                                      className="text-xs text-red-600 hover:text-red-700 mt-2 font-medium"
                                    >
                                      Remove file
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          Body text <span className="text-red-500">*</span>
                        </h3>
                        
                        <div className="flex gap-1 mb-2 flex-wrap">
                          <button type="button" onClick={() => insertFormatting('bold')} className="p-2 border border-gray-300 rounded hover:bg-gray-100" title="Bold">
                            <Bold className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => insertFormatting('italic')} className="p-2 border border-gray-300 rounded hover:bg-gray-100" title="Italic">
                            <Italic className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => insertFormatting('strike')} className="p-2 border border-gray-300 rounded hover:bg-gray-100" title="Strike">
                            <Strikethrough className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => insertFormatting('mono')} className="p-2 border border-gray-300 rounded hover:bg-gray-100" title="Code">
                            <Code className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={addVariable} className="ml-auto px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium">
                            + Add Variable
                          </button>
                        </div>

                        <textarea
                          id="bodyText"
                          placeholder={`Write your message in ${selectedLanguage?.name}. Use {{1}}, {{2}} for dynamic content.`}
                          value={form.bodyText}
                          onChange={(e) => handleChange("bodyText", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 h-40 resize-none ${
                            errors.bodyText ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          maxLength={1024}
                        />
                        <div className="flex justify-between items-start mt-1">
                          {errors.bodyText && (
                            <p className="text-xs text-red-600 flex items-start gap-1 flex-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{errors.bodyText}</span>
                            </p>
                          )}
                          <p className="text-xs text-gray-500 ml-auto">{form.bodyText.length}/1024</p>
                        </div>
                      </div>

                      {/* Variable Samples */}
                      {allVariables.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Variable samples <span className="text-red-500">*</span>
                          </h4>
                          <p className="text-xs text-gray-600 mb-3">
                            Provide example values for review. Don't use real customer data.
                          </p>
                          <div className="space-y-2">
                            {allVariables.map((varNum: any) => (
                              <div key={varNum}>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Sample for {`{{${varNum}}}`} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder={form.category === "AUTHENTICATION" ? "Max 15 characters" : "Sample value"}
                                  value={form.variableSamples[varNum] || ''}
                                  onChange={(e) => handleChange('variableSamples', { ...form.variableSamples, [varNum]: e.target.value })}
                                  className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                                    errors[`variable_${varNum}`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                  }`}
                                  maxLength={form.category === "AUTHENTICATION" ? 15 : 100}
                                />
                                {errors[`variable_${varNum}`] && (
                                  <p className="text-xs text-red-600 mt-1">{errors[`variable_${varNum}`]}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                          Footer <span className="text-gray-500 font-normal text-sm">• Optional</span>
                        </h3>
                        <input
                          type="text"
                          placeholder="Add a small footer text (no variables)"
                          value={form.footerText}
                          onChange={(e) => handleChange("footerText", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                            errors.footerText ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          maxLength={60}
                        />
                        {errors.footerText && (
                          <p className="text-xs text-red-600 mt-1">{errors.footerText}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 text-right">{form.footerText.length}/60</p>
                      </div>

                      {/* Buttons */}
                      {form.category !== "AUTHENTICATION" && (
                        <div className="bg-white border rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                            Buttons <span className="text-gray-500 font-normal text-sm">• Optional</span>
                          </h3>

                          
                        <select
                          value={form.buttonType}
                          onChange={(e) => {
                            handleChange("buttonType", e.target.value);
                            handleChange("buttons", []);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        >
                          {buttonTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>

                          {form.buttonType === "CALL_TO_ACTION" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs text-blue-800">
                              <strong>Call to Action buttons:</strong> Add clickable buttons with phone numbers or website links. Users can tap to call or visit your website.
                            </p>
                          </div>
                        )}

                        {form.buttonType === "QUICK_REPLY" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs text-blue-800">
                              <strong>Quick Reply buttons:</strong> Add up to 3 quick response options for users to tap and reply instantly.
                            </p>
                          </div>
                        )}

                          {form.buttonType !== "NONE" && (
                            <div className="space-y-3">
                              {form.buttons.map((btn: any, index: number) => (
                                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-xs font-medium text-gray-600 mt-2">#{index + 1}</span>
                                    <div className="flex-1 space-y-2">
                                      {form.buttonType === "CALL_TO_ACTION" && (
                                        <select
                                          value={btn.type}
                                          onChange={(e) => updateButton(index, 'type', e.target.value)}
                                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                        >
                                          <option value="PHONE_NUMBER">Phone Number</option>
                                          <option value="URL">Website URL</option>
                                        </select>
                                      )}

                                      <input
                                        type="text"
                                        placeholder="Button text (max 25 chars)"
                                        value={btn.text}
                                        onChange={(e) => updateButton(index, 'text', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                        maxLength={25}
                                      />

                                      {btn.type === "PHONE_NUMBER" && (
                                        <input
                                          type="tel"
                                          placeholder="+1234567890"
                                          value={btn.phone_number || ''}
                                          onChange={(e) => updateButton(index, 'phone_number', e.target.value)}
                                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                        />
                                      )}

                                      {btn.type === "URL" && (
                                        <>
                                          <input
                                            type="url"
                                            placeholder="https://example.com or https://example.com/{{1}}"
                                            value={btn.url || ''}
                                            onChange={(e) => updateButton(index, 'url', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                          />
                                          {btn.url?.includes('{{1}}') && (
                                            <input
                                              type="text"
                                              placeholder="Example for {{1}}: product-id-123"
                                              value={btn.example || ''}
                                              onChange={(e) => updateButton(index, 'example', e.target.value)}
                                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                            />
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeButton(index)}
                                      className="text-red-600 hover:text-red-700 p-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {((form.buttonType === "QUICK_REPLY" && form.buttons.length < 3) ||
                                (form.buttonType === "CALL_TO_ACTION" && form.buttons.length < 2)) && (
                                <button
                                  type="button"
                                  onClick={addButton}
                                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Button
                                </button>
                              )}

                              {errors.buttons && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.buttons}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-6">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-green-600">📱</span>
                          Live Preview
                        </h3>
                        <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-4">
                          <div className="bg-white rounded-2xl shadow-lg p-1 max-w-sm mx-auto">
                            <div className="bg-green-500 text-white p-3 rounded-t-2xl flex items-center gap-2">
                              <div className="w-8 h-8 bg-white rounded-full" />
                              <span className="font-medium text-sm">Your Business</span>
                            </div>
                            
                            <div className="p-3 space-y-2">
                              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                {/* Header Preview */}
                                {form.headerType === "TEXT" && form.headerText && (
                                  <div className="font-semibold text-gray-900 mb-2 text-sm">
                                    {form.headerText.replace(/\{\{(\d+)\}\}/g, (_, key) => form.variableSamples[key] || `{{${key}}}`)}
                                  </div>
                                )}
                                
                                {form.headerMedia && form.headerType !== "TEXT" && form.headerType !== "NONE" && (
                                  <div className="mb-2">
                                    {form.headerType === "IMAGE" && (
                                      <img src={form.headerMedia.previewUrl} alt="" className="w-full rounded" />
                                    )}
                                    {form.headerType === "VIDEO" && (
                                      <video src={form.headerMedia.previewUrl} className="w-full rounded" />
                                    )}
                                    {form.headerType === "DOCUMENT" && (
                                      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                                        <FileText className="w-5 h-5 text-red-600" />
                                        <span className="text-xs truncate">{form.headerMedia.name}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Body Preview */}
                                <div 
                                  className="text-sm text-gray-800 whitespace-pre-wrap mb-2"
                                  dangerouslySetInnerHTML={{ 
                                    __html: renderFormattedText(form.bodyText, form.variableSamples) 
                                  }}
                                />

                                {/* Footer Preview */}
                                {form.footerText && (
                                  <div className="text-xs text-gray-500 pt-2 border-t">
                                    {form.footerText}
                                  </div>
                                )}

                                {/* Buttons Preview */}
                                {form.buttons.length > 0 && (
                                  <div className="mt-3 pt-3 border-t space-y-1">
                                    {form.buttons.map((btn: any, idx: number) => (
                                      <button
                                        key={idx}
                                        className="w-full py-2 px-3 text-sm text-blue-600 font-medium border border-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
                                      >
                                        {btn.type === "PHONE_NUMBER" && <Phone className="w-4 h-4" />}
                                        {btn.type === "URL" && <LinkIcon className="w-4 h-4" />}
                                        {btn.type === "COPY_CODE" && <Copy className="w-4 h-4" />}
                                        {btn.text || "Button"}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Category:</span>
                            <span className={`font-semibold px-2 py-1 rounded ${
                              form.category === "MARKETING" ? "bg-blue-100 text-blue-700" :
                              form.category === "UTILITY" ? "bg-green-100 text-green-700" :
                              "bg-purple-100 text-purple-700"
                            }`}>
                              {currentCategory.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-2">
                            <span className="text-gray-600">Language:</span>
                            <span className="font-medium">{selectedLanguage?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <div className="flex gap-4">
                        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div>
                          <h3 className="font-bold text-green-900 text-lg mb-2">Ready to Submit!</h3>
                          <p className="text-sm text-green-800 mb-3">
                            Your template has passed all validation checks. Review the summary below and click submit.
                          </p>
                          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Template Name:</span>
                              <span className="font-mono font-medium">{form.name || "Not set"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium">{currentCategory.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Language:</span>
                              <span className="font-medium">{selectedLanguage?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Variables:</span>
                              <span className="font-medium">{allVariables.length} variable(s)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Buttons:</span>
                              <span className="font-medium">{form.buttons.length} button(s)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border rounded-xl p-6">
                      <h3 className="font-bold text-gray-900 text-xl mb-4">Final Preview</h3>
                      
                      <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl p-6">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden">
                          {/* WhatsApp Header */}
                          <div className="bg-green-600 text-white p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl">
                              🏢
                            </div>
                            <div>
                              <div className="font-semibold">Your Business Name</div>
                              <div className="text-xs text-green-100">Business Account</div>
                            </div>
                          </div>

                          {/* Message Bubble */}
                          <div className="p-4 bg-gray-50">
                            <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                              {/* Header */}
                              {form.headerType === "TEXT" && form.headerText && (
                                <div className="font-bold text-gray-900 text-base">
                                  {form.headerText.replace(/\{\{(\d+)\}\}/g, (_, key) => form.variableSamples[key] || `{{${key}}}`)}
                                </div>
                              )}
                              
                              {form.headerMedia && form.headerType !== "TEXT" && form.headerType !== "NONE" && (
                                <div>
                                  {form.headerType === "IMAGE" && (
                                    <img src={form.headerMedia.previewUrl} alt="" className="w-full rounded-lg" />
                                  )}
                                  {form.headerType === "VIDEO" && (
                                    <video src={form.headerMedia.previewUrl} className="w-full rounded-lg" controls />
                                  )}
                                  {form.headerType === "DOCUMENT" && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                          {form.headerMedia.name}
                                        </div>
                                        <div className="text-xs text-gray-500">PDF Document</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Body */}
                              <div 
                                className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                                dangerouslySetInnerHTML={{ 
                                  __html: renderFormattedText(form.bodyText, form.variableSamples) 
                                }}
                              />

                              {/* Footer */}
                              {form.footerText && (
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                                  {form.footerText}
                                </div>
                              )}

                              {/* Buttons */}
                              {form.buttons.length > 0 && (
                                <div className="pt-3 border-t border-gray-200 space-y-2">
                                  {form.buttons.map((btn: any, idx: number) => (
                                    <button
                                      key={idx}
                                      className="w-full py-2.5 px-4 text-sm text-blue-600 font-semibold border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                    >
                                      {btn.type === "PHONE_NUMBER" && <Phone className="w-4 h-4" />}
                                      {btn.type === "URL" && <LinkIcon className="w-4 h-4" />}
                                      {btn.type === "COPY_CODE" && <Copy className="w-4 h-4" />}
                                      {btn.type === "QUICK_REPLY" && <span>↩️</span>}
                                      {btn.text || "Button"}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="text-xs text-gray-500 text-right mt-2">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        What happens next?
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">1.</span>
                          <span>Your template will be submitted to Meta for review</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">2.</span>
                          <span>Review typically takes 1-2 business days (up to 48 hours)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">3.</span>
                          <span>You'll receive an email notification with the approval status</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">4.</span>
                          <span>Once approved, you can start sending messages using this template</span>
                        </li>
                      </ul>
                    </div>

                    {form.category === "MARKETING" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          Marketing Template Reminder
                        </h4>
                        <p className="text-sm text-amber-800">
                          Marketing templates can only be sent to users who have explicitly opted in to receive promotional messages from your business. Ensure you have proper consent before sending.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {step < 3 ? (
                  <button
                    onClick={() => {
                      if (canGoNext()) {
                        setStep(step + 1);
                      } else {
                        alert("Please fill in all required fields correctly before proceeding.");
                      }
                    }}
                    disabled={!canGoNext()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    disabled={loading}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-green-600 text-white px-8 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Submit for Review
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}