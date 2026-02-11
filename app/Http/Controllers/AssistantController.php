<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Ai\AnonymousAgent;
use Laravel\Ai\Messages\UserMessage;
use Laravel\Ai\Messages\AssistantMessage;
use Laravel\Ai\Files\Image;
use Laravel\Ai\Files\Document;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class AssistantController extends Controller
{
    public function index()
    {
        return inertia('Assistant');
    }

    public function chat(Request $request)
    {
        $personas = [
            'assistant' => [
                'name' => 'Helpful Assistant',
                'instructions' => 'You are a helpful, versatile assistant.',
                'color' => 'blue'
            ],
            'architect' => [
                'name' => 'Code Architect',
                'instructions' => 'You are a senior software architect. Provide highly technical, clean, and scalable code solutions with brief explanations.',
                'color' => 'indigo'
            ],
            'creative' => [
                'name' => 'Creative Writer',
                'instructions' => 'You are a poetic and creative writer. Use evocative language, metaphors, and a playful tone.',
                'color' => 'purple'
            ],
            'bible' => [
                'name' => 'Bible Coach',
                'instructions' => 'You are a wise protestant, Christian, Evangelical Bible Coach. Provide encouragement and wisdom based on biblical principles and scripture.',
                'color' => 'amber'
            ],
        ];

        $selectedPersona = $request->input('persona', 'assistant');
        $personaConfig = $personas[$selectedPersona] ?? $personas['assistant'];

        $messages = [];
        $systemInstructions = $personaConfig['instructions'];

        foreach ($request->input('messages', []) as $msg) {
            if ($msg['role'] === 'user') {
                $messages[] = new UserMessage($msg['content']);
            } elseif ($msg['role'] === 'assistant') {
                $messages[] = new AssistantMessage($msg['content']);
            }
        }

        // Extract the last user message to use as the prompt
        $lastMessage = array_pop($messages);

        if (!$lastMessage instanceof UserMessage) {
            return response()->json(['error' => 'Last message must be from user.'], 400);
        }

        $prompt = $lastMessage->content;
        $attachments = [];
        $model = 'llama-3.3-70b-versatile';

        Log::info('Chat request received', [
            'persona' => $selectedPersona,
            'is_multipart' => $request->isJson() ? 'no' : 'yes',
            'has_files' => $request->hasFile('attachments') ? 'yes' : 'no',
            'files_count' => $request->hasFile('attachments') ? count($request->file('attachments')) : 0,
        ]);

        // Handle uploaded files
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $mime = $file->getMimeType();
                Log::info('Processing attachment', [
                    'name' => $file->getClientOriginalName(),
                    'mime' => $mime,
                ]);

                if (str_starts_with($mime, 'image/')) {
                    $attachments[] = Image::fromUpload($file);
                    // Switch to vision model if image is present
                    $model = 'llama-3.2-90b-vision-preview'; // Upgrade to 90b for better vision
                } elseif (str_starts_with($mime, 'text/') || $mime === 'application/json') {
                    // Creative addition: Extract text and append to prompt
                    $content = $file->get();
                    $prompt .= "\n\n[Content of attached file {$file->getClientOriginalName()}]:\n{$content}";
                } elseif ($mime === 'application/pdf') {
                    // Extract text from PDF using pdftotext
                    $tempPath = $file->store('temp', 'local');
                    $absolutePath = Storage::disk('local')->path($tempPath);

                    Log::info('Attempting PDF extraction', ['path' => $absolutePath, 'exists' => file_exists($absolutePath)]);

                    $result = Process::run(['pdftotext', $absolutePath, '-']);

                    if ($result->successful()) {
                        $content = $result->output();
                        $prompt .= "\n\n[Extracted text from PDF {$file->getClientOriginalName()}]:\n{$content}";
                        Log::info('Successfully extracted text from PDF', ['name' => $file->getClientOriginalName()]);
                    } else {
                        Log::error('Failed to extract text from PDF', [
                            'name' => $file->getClientOriginalName(),
                            'error' => $result->errorOutput()
                        ]);
                        $prompt .= "\n\n[Warning: Could not extract text from PDF {$file->getClientOriginalName()}]";
                    }

                    Storage::delete($tempPath);
                } else {
                    // For other files, we still add as attachment in case provider supports it
                    $attachments[] = Document::fromUpload($file);
                }
            }
        }

        // Handle Quick Actions
        if ($request->filled('quick_action')) {
            $action = $request->input('quick_action');
            $prompt = match ($action) {
                'summarize' => "Please summarize the following text or attached document concisely: \n\n" . $prompt,
                'explain' => "Explain this like I am 5 years old: \n\n" . $prompt,
                'fix' => "Please fix any grammar or spelling mistakes in this text and provide the corrected version: \n\n" . $prompt,
                default => $prompt
            };
        }

        try {
            $agent = new AnonymousAgent(
                instructions: $systemInstructions,
                messages: $messages,
                tools: []
            );

            $response = $agent->prompt(
                prompt: $prompt,
                attachments: $attachments,
                provider: 'groq',
                model: $model
            );

            return response()->json([
                'content' => $response->text,
                'color' => $personaConfig['color']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
