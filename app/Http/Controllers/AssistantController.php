<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Ai\AnonymousAgent;
use Laravel\Ai\Messages\UserMessage;
use Laravel\Ai\Messages\AssistantMessage;

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

        // Handle Quick Actions
        if ($request->filled('quick_action')) {
            $action = $request->input('quick_action');
            $prompt = match ($action) {
                'summarize' => "Please summarize the following text concisely: \n\n" . $prompt,
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
                provider: 'groq',
                model: 'llama-3.3-70b-versatile'
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
