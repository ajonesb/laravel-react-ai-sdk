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
        $messages = [];
        $systemInstructions = 'You are a helpful assistant.';

        foreach ($request->input('messages', []) as $msg) {
            if ($msg['role'] === 'user') {
                $messages[] = new UserMessage($msg['content']);
            } elseif ($msg['role'] === 'assistant') {
                $messages[] = new AssistantMessage($msg['content']);
            } elseif ($msg['role'] === 'system') {
                // System messages become instructions for the agent
                $systemInstructions = $msg['content'];
            }
        }

        // Extract the last user message to use as the prompt
        $lastMessage = array_pop($messages);

        if (!$lastMessage instanceof UserMessage) {
            return response()->json(['error' => 'Last message must be from user.'], 400);
        }

        try {
            $agent = new AnonymousAgent(
                instructions: $systemInstructions,
                messages: $messages,
                tools: []
            );

            $response = $agent->prompt(
                prompt: $lastMessage->content,
                provider: 'groq',
                model: 'llama-3.3-70b-versatile'
            );

            return response()->json([
                'content' => $response->text,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
