import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, Link, X, Menu, BookOpen, Atom, FlaskConical, Code, Dna, Sparkles, Trash2 } from 'lucide-react';

const subjects = [
  { id: 'math', name: 'Math', icon: '📐', color: 'from-pink-500 to-rose-500' },
  { id: 'science', name: 'Science', icon: '🔬', color: 'from-purple-500 to-indigo-500' },
  { id: 'english', name: 'English', icon: '📖', color: 'from-blue-500 to-cyan-500' },
  { id: 'cs', name: 'Computer Science', icon: '💻', color: 'from-violet-500 to-purple-500' },
  { id: 'nepali', name: 'Nepali', icon: '🇳🇵', color: 'from-red-500 to-orange-500' },
  { id: 'social', name: 'Social', icon: '🌍', color: 'from-green-500 to-emerald-500' },
  { id: 'health', name: 'Health', icon: '💊', color: 'from-teal-500 to-cyan-500' },
];

export default function StudyBuddy() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: "Hey bestie! 💖 I'm here to help you crush your homework. Pick a subject and let's get started!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Math homework help', date: new Date(), messages: 5 },
    { id: 2, title: 'Science questions', date: new Date(Date.now() - 86400000), messages: 12 },
  ]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const linkInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Create user message object
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      subject: selectedSubject || null,
      files: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
    };

    // Show user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFiles([]); // optional: clear after sending
    setIsLoading(true);

    try {
      // Send all info to    try {
      const res = await fetch("http://127.0.0.1:8000/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: input })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hey bestie! 💖 I'm here to help you crush your homework. Pick a subject and let's get started!",
        timestamp: new Date(),
      },
    ]);
    setUploadedFiles([]);
  };

  const addLink = () => {
    const link = linkInputRef.current?.value;
    if (link && link.trim()) {
      setUploadedFiles(prev => [...prev, { name: link, size: 0, type: 'link' }]);
      linkInputRef.current.value = '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-lg border-b border-white/30 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-purple-100 rounded-full transition-colors"
          >
            <Menu className="w-5 h-5 text-purple-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              Study Buddy <Sparkles className="w-5 h-5 text-purple-500" />
            </h1>
            <p className="text-xs text-gray-600">Your AI homework hero</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <div
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed lg:relative z-20 w-72 bg-white/60 backdrop-blur-lg border-r border-white/30 transition-transform duration-300 h-full overflow-y-auto`}
        >
          <div className="p-4 space-y-4">
            {/* Subject Selection */}
            <div className="bg-white/80 rounded-2xl p-4 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-lg">📚</span> Pick Subject
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubject(subject.name);
                      setSidebarOpen(false);
                    }}
                    className={`p-3 rounded-xl font-medium transition-all ${selectedSubject === subject.name
                      ? `bg-gradient-to-r ${subject.color} text-white shadow-lg scale-105`
                      : 'bg-white/50 text-gray-700 hover:bg-white/80'
                      }`}
                  >
                    <div className="text-xl mb-1">{subject.icon}</div>
                    <div className="text-[10px] leading-tight">{subject.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat History */}
            <div className="bg-white/80 rounded-2xl p-4 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-lg">🕐</span> History
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full text-left p-3 bg-white/50 hover:bg-white/80 rounded-xl transition-all group"
                  >
                    <div className="font-medium text-sm text-gray-800 truncate group-hover:text-purple-600">
                      {chat.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      <span>{chat.date.toLocaleDateString()}</span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {chat.messages} msgs
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-10"
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 shadow-lg ${message.role === 'user'
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-sm'
                    }`}
                >
                  <div className="text-sm md:text-base leading-relaxed">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${message.role === 'user' ? 'text-pink-100' : 'text-gray-500'
                      }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl rounded-bl-sm p-4 shadow-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/30 bg-white/60 backdrop-blur-lg p-4">
            {selectedSubject && (
              <div className="mb-2 flex items-center justify-center">
                <span className="text-xs px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium">
                  ✨ Studying: {selectedSubject}
                </span>
              </div>
            )}

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <span className="text-xs">
                        {file.type === 'link' ? '🔗' : '📎'}
                      </span>
                      <span className="font-medium text-gray-800 truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(idx)}
                        className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 items-end max-w-5xl mx-auto">
              <div className="flex-1 bg-white rounded-2xl shadow-lg border-2 border-purple-200 focus-within:border-purple-400 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything... Type your question here! 💭"
                  rows={3}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none resize-none text-gray-800 placeholder-gray-400"
                />
                <div className="px-4 pb-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Press Enter to send, Shift + Enter for new line
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-2 hover:bg-pink-100 rounded-full transition-colors"
                      title="Take photo"
                    >
                      <span className="text-lg">📸</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4 text-purple-600" />
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                      title="Upload image"
                    >
                      <Image className="w-4 h-4 text-purple-600" />
                    </button>
                    <button
                      onClick={() => {
                        const link = prompt('Enter YouTube or website URL:');
                        if (link && link.trim()) {
                          setUploadedFiles(prev => [...prev, { name: link, size: 0, type: 'link' }]);
                        }
                      }}
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                      title="Add link"
                    >
                      <Link className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-2xl hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}