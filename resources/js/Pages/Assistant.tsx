import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { PageProps } from '@/types';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Persona {
    id: string;
    name: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    text: string;
}

const personas: Persona[] = [
    { id: 'assistant', name: 'General', icon: '🤖', color: 'blue', bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-600' },
    { id: 'architect', name: 'Architect', icon: '🏗️', color: 'indigo', bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-600' },
    { id: 'creative', name: 'Creative', icon: '🎨', color: 'purple', bg: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-600' },
    { id: 'bible', name: 'Bible Coach', icon: '📖', color: 'amber', bg: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-600' },
];

export default function Assistant({ auth }: PageProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedPersona, setSelectedPersona] = useState<string>('assistant');
    const scrollRef = useRef<HTMLDivElement>(null);

    const persona = personas.find(p => p.id === selectedPersona) || personas[0];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const handleChat = async (e?: React.FormEvent, quickAction?: string) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('/chat', { 
                messages: newMessages,
                persona: selectedPersona,
                quick_action: quickAction
            });
            setMessages([...newMessages, { role: 'assistant', content: response.data.content }]);
        } catch (error: any) {
            console.error(error);
            setMessages([...newMessages, { role: 'system', content: 'Error: ' + (error.response?.data?.error || error.message) }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Persona Studio</h2>
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl gap-1">
                        {personas.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPersona(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    selectedPersona === p.id 
                                    ? `${p.bg} text-white shadow-sm ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-opacity-50` 
                                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                            >
                                <span>{p.icon}</span>
                                <span className="hidden sm:inline">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            }
        >
            <Head title="Assistant Studio" />

            <div className="py-8">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 sm:rounded-2xl h-[700px] flex flex-col">
                        {/* Quick Actions Bar */}
                        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex gap-2 overflow-x-auto">
                            <span className="text-[10px] font-black uppercase text-gray-400 self-center mr-2">Quick:</span>
                            <button 
                                onClick={(e) => handleChat(undefined, 'summarize')} 
                                className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition shadow-sm"
                                disabled={!input.trim() || loading}
                            >
                                📝 Summarize
                            </button>
                            <button 
                                onClick={(e) => handleChat(undefined, 'explain')} 
                                className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition shadow-sm"
                                disabled={!input.trim() || loading}
                            >
                                🐣 ELI5
                            </button>
                            <button 
                                onClick={(e) => handleChat(undefined, 'fix')} 
                                className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition shadow-sm"
                                disabled={!input.trim() || loading}
                            >
                                ✨ Fix Grammar
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">
                            {messages.length === 0 && (
                                <div className="text-center mt-20 space-y-4">
                                    <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl shadow-lg border-4 border-white dark:border-gray-700 ${persona.bg}`}>
                                        {persona.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">I'm your {persona.name}</h3>
                                        <p className="text-sm text-gray-500 max-w-xs mx-auto">Selected persona is active and ready to help.</p>
                                    </div>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                            ? `${persona.bg} text-white`
                                            : msg.role === 'system'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700/50 dark:text-gray-200 prose dark:prose-invert max-w-none border border-gray-200 dark:border-gray-600'
                                        }`}>
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-700/50 dark:text-gray-200 rounded-2xl p-4 animate-pulse border border-gray-200 dark:border-gray-600">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10">
                            <form onSubmit={(e) => handleChat(e)} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={`Message your ${persona.name}...`}
                                    className="w-full pl-5 pr-20 py-4 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-inner"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className={`absolute right-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale ${persona.bg} shadow-md`}
                                >
                                    {loading ? '...' : 'SEND'}
                                </button>
                            </form>
                            <p className="text-[10px] text-center mt-3 text-gray-400 font-medium">✨ Tip: Try using Quick Actions to transform your text instantly.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
