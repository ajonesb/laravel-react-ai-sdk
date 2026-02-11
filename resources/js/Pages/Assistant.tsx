import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { PageProps } from '@/types';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: { name: string; url: string; type: string }[];
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
    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ name: string; url: string; type: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const persona = personas.find(p => p.id === selectedPersona) || personas[0];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        setFiles(prev => [...prev, ...selectedFiles]);

        const newPreviews = selectedFiles.map(file => ({
            name: file.name,
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
            type: file.type
        }));
        setFilePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setFilePreviews(prev => {
            const removed = prev[index];
            if (removed.url) URL.revokeObjectURL(removed.url);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleChat = async (e?: React.FormEvent, quickAction?: string) => {
        if (e) e.preventDefault();
        if ((!input.trim() && files.length === 0) || loading) return;

        const currentFiles = [...files];
        const currentPreviews = [...filePreviews];
        
        const userMessage: Message = { 
            role: 'user', 
            content: input || (quickAction ? `Action: ${quickAction}` : 'Analyze attachment'),
            attachments: currentPreviews
        };

        const newMessages: Message[] = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setFiles([]);
        setFilePreviews([]);
        setLoading(true);

        const formData = new FormData();
        // We only send the raw text items for the SDK to reconstruct the history
        // The SDK handles content as messages
        newMessages.forEach((msg, i) => {
           formData.append(`messages[${i}][role]`, msg.role);
           formData.append(`messages[${i}][content]`, msg.content);
        });
        
        currentFiles.forEach((file) => {
            formData.append('attachments[]', file);
        });
        
        formData.append('persona', selectedPersona);
        if (quickAction) formData.append('quick_action', quickAction);

        try {
            const response = await axios.post('/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
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
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Multimodal Studio</h2>
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
                                disabled={(!input.trim() && files.length === 0) || loading}
                            >
                                📝 Summarize
                            </button>
                            <button 
                                onClick={(e) => handleChat(undefined, 'explain')} 
                                className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition shadow-sm"
                                disabled={(!input.trim() && files.length === 0) || loading}
                            >
                                🐣 ELI5
                            </button>
                            <button 
                                onClick={(e) => handleChat(undefined, 'fix')} 
                                className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition shadow-sm"
                                disabled={(!input.trim() && files.length === 0) || loading}
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
                                        <p className="text-sm text-gray-500 max-w-xs mx-auto">Upload images or documents for analysis.</p>
                                    </div>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex gap-2 mb-2 flex-wrap justify-end">
                                            {msg.attachments.map((att, i) => (
                                                <div key={i} className="relative group">
                                                    {att.type.startsWith('image/') ? (
                                                        <img src={att.url} className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow-sm" alt="attachment" />
                                                    ) : (
                                                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2 text-[10px] text-center font-bold text-gray-500 overflow-hidden">
                                                            <span className="text-xl mb-1">📄</span>
                                                            <span className="truncate w-full">{att.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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

                        {/* File Previews Area */}
                        {filePreviews.length > 0 && (
                            <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-3 overflow-x-auto">
                                {filePreviews.map((preview, i) => (
                                    <div key={i} className="relative group flex-shrink-0">
                                        {preview.type.startsWith('image/') ? (
                                            <img src={preview.url} className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" alt="preview" />
                                        ) : (
                                            <div className="w-16 h-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center p-1 text-[8px] text-center font-bold text-gray-500 overflow-hidden">
                                                <span className="text-lg">📄</span>
                                                <span className="truncate w-full">{preview.name}</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => removeFile(i)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm transform transition hover:scale-110"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10">
                            <form onSubmit={(e) => handleChat(e)} className="relative flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-blue-500 transition shadow-sm"
                                    disabled={loading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    multiple 
                                    accept="image/*,.pdf,.txt,.doc,.docx"
                                />
                                <div className="relative flex-1">
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
                                        disabled={loading || (!input.trim() && files.length === 0)}
                                        className={`absolute right-2 top-1.5 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale ${persona.bg} shadow-md`}
                                    >
                                        {loading ? '...' : 'SEND'}
                                    </button>
                                </div>
                            </form>
                            <p className="text-[10px] text-center mt-3 text-gray-400 font-medium">✨ Upload images for visual analysis or documents for summaries.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
