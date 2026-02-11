# Multimodal Persona Studio 🎭🖼️

A high-performance AI Assistant built with **Laravel 12**, **React**, and the **Laravel AI SDK**. This application demonstrates advanced AI capabilities including persona-based instruction, vision models, and document processing.

## 🌟 Key Features

- **Persona Studio**: Switch between distinct AI personalities (**General**, **Code Architect**, **Creative Writer**, **Bible Coach**).
- **Multimodal Support**: 
    - **Vision**: Automatically switches to `llama-3.2-90b-vision` for image analysis.
    - **PDF/Text Analysis**: Extracts text from PDFs using `pdftotext` and processes text/JSON attachments.
- **Quick Actions**: Instant one-click processing for summarizing, grammar fixing, and explaining complex concepts.
- **Dynamic UI**: Theme colors and icons adapt in real-time to the selected persona.

---

## 🧠 Behind the Scenes: Laravel AI SDK

The application leverages the [Laravel AI SDK](https://github.com/laravel/ai) to provide a unified, developer-friendly interface for interacting with LLMs.

### How it Works:
1. **Model Abstraction**: The SDK allows us to switch between Groq, OpenAI, or Anthropic without changing the core business logic.
2. **The Anonymous Agent**: We use the `AnonymousAgent` class for stateless, high-speed chat interactions. It conveniently encapsulates system instructions and message history.
3. **Smart Attachments**: The SDK provides `Image` and `Document` classes that handle base64 encoding and MIME-type management automatically.
4. **Prism Gateway**: Under the hood, the SDK uses the Prism gateway to marshal Laravel messages into provider-specific formats (like Groq's vision schema).

---

## 🏗️ Architecture

### Frontend (React + Inertia)
- **State Managed UI**: A robust React component (`Assistant.tsx`) manages chat history, file uploads, and persona themes.
- **Multipart Data**: Uses `FormData` to handle simultaneous text and file uploads.
- **Responsive Navigation**: Integrated into the standard Laravel Authenticated Layout.

### Backend (Laravel)
- **Controller Logic**: `AssistantController.php` acts as the brain. It:
    - Maps persona selections to specific system prompts.
    - Triggers the **Vision Model Switch** when images are detected.
    - Uses system-level `pdftotext` to extract text from PDFs for processing.
- **Storage**: Uses Laravel's local disk for transient file processing before cleanup.

---

## 🚀 Getting Started

1. **Prerequisites**: Ensure `pdftotext` is installed (`sudo apt install poppler-utils`).
2. **Install**: Run `composer install` and `npm install`.
3. **Secrets**: Add your `GROQ_API_KEY` to the `.env` file.
4. **Run**: `php artisan serve` and `npm run dev`.

---
*Built with ❤️ using the Laravel AI SDK.*
