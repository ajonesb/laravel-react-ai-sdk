<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Prism\Prism\Prism;
use Prism\Prism\Enums\Provider;
use Prism\Prism\ValueObjects\Messages\UserMessage;
use Prism\Prism\ValueObjects\Messages\AssistantMessage;
use Prism\Prism\ValueObjects\Messages\SystemMessage;

class AssistantController extends Controller
{
    public function index()
    {
        return inertia('Assistant');
    }

    public function chat(Request $request)
    {
        $messages = [];

        foreach ($request->input('messages', []) as $msg) {
            if ($msg['role'] === 'user') {
                $messages[] = new UserMessage($msg['content']);
            } elseif ($msg['role'] === 'assistant') {
                $messages[] = new AssistantMessage($msg['content']);
            } elseif ($msg['role'] === 'system') {
                $messages[] = new SystemMessage($msg['content']);
            }
        }

        try {
            $response = prism()->text()
                ->using(Provider::Groq, 'llama-3.3-70b-versatile')
                ->withMessages($messages)
                ->asText();

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
