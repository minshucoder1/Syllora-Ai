import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Library,
  Upload,
  FileText,
  MessageSquare,
  Search,
  Folder,
  FolderPlus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Filter,
  FileCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  Quote,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface LibraryDocItem {
  id: string;
  name: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  collectionName: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  errorMessage?: string;
  pageCount: number;
  chunksCount: number;
  uploadedAt: string;
}

interface CitationItem {
  docId: string;
  docName: string;
  pageNumber?: number;
  excerpt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationItem[];
  timestamp: string;
}

interface ConversationItem {
  id: string;
  title: string;
  selectedDocumentIds: string[];
  collectionName?: string;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
}

export const MyLibraryView: React.FC = () => {
  const { user, showToast, triggerConfetti } = useApp();

  const [activeTab, setActiveTab] = useState<'library' | 'chat'>('library');
  const [documents, setDocuments] = useState<LibraryDocItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('All Documents');
  const [collections, setCollections] = useState<string[]>(['All Documents', 'General', 'Core Notes', 'Assignments']);
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [showAddCollection, setShowAddCollection] = useState<boolean>(false);

  // Upload States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat States
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isSendingQuery, setIsSendingQuery] = useState<boolean>(false);
  const [selectedDocIdsForChat, setSelectedDocIdsForChat] = useState<string[]>([]);
  const [preferredLang, setPreferredLang] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [expandedCitation, setExpandedCitation] = useState<CitationItem | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch documents
  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/library/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);

        // Aggregate unique collections
        const uniqueCols = new Set<string>(['All Documents', 'General']);
        (data.documents || []).forEach((d: LibraryDocItem) => {
          if (d.collectionName) uniqueCols.add(d.collectionName);
        });
        setCollections(Array.from(uniqueCols));
      }
    } catch (err) {
      console.warn('Failed to fetch library documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Fetch conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/library/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0 && !currentConversationId) {
          loadConversationMessages(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  };

  const loadConversationMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/library/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConversationId(convId);
        setMessages(data.conversation?.messages || []);
        if (data.conversation?.selectedDocumentIds) {
          setSelectedDocIdsForChat(data.conversation.selectedDocumentIds);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i + 0.2) / files.length) * 100));

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
        ? 'image'
        : ext === 'docx'
        ? 'docx'
        : ext === 'txt'
        ? 'txt'
        : 'pdf';

      try {
        const res = await fetch('/api/library/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            fileType,
            mimeType: file.type || 'application/pdf',
            sizeBytes: file.size,
            base64Data,
            collectionName: selectedCollection !== 'All Documents' ? selectedCollection : 'General',
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          showToast(`Upload failed for ${file.name}: ${errData.error}`, 'error');
        } else {
          showToast(`Successfully indexed ${file.name} into your AI Library!`, 'success');
        }
      } catch (err) {
        showToast(`Failed uploading ${file.name}`, 'error');
      }
    }

    setUploadProgress(100);
    setIsUploading(false);
    loadDocuments();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reprocess Document
  const handleReprocess = async (docId: string) => {
    showToast('Reprocessing document chunks...', 'info');
    try {
      const res = await fetch(`/api/library/documents/${docId}/reprocess`, { method: 'POST' });
      if (res.ok) {
        showToast('Document reprocessed and ready!', 'success');
        loadDocuments();
      } else {
        showToast('Reprocessing failed. Please retry.', 'error');
      }
    } catch {
      showToast('Network error during reprocessing.', 'error');
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from your library?`)) return;
    try {
      const res = await fetch(`/api/library/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Removed "${name}" from your library.`, 'info');
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      showToast('Failed to delete document.', 'error');
    }
  };

  // Create New Conversation
  const handleCreateNewConversation = async () => {
    try {
      const res = await fetch('/api/library/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Discussion #${conversations.length + 1}`,
          selectedDocumentIds: selectedDocIdsForChat,
          collectionName: selectedCollection !== 'All Documents' ? selectedCollection : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversations((prev) => [data.conversation, ...prev]);
        setCurrentConversationId(data.conversation.id);
        setMessages([]);
      }
    } catch {
      showToast('Failed to start new chat session.', 'error');
    }
  };

  // Send Chat Query with RAG
  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || inputQuery;
    if (!textToSend.trim() || isSendingQuery) return;

    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsSendingQuery(true);

    try {
      const res = await fetch('/api/library/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversationId,
          query: textToSend.trim(),
          selectedDocumentIds: selectedDocIdsForChat,
          collectionName: selectedCollection !== 'All Documents' ? selectedCollection : undefined,
          preferredLanguage: preferredLang,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat RAG query failed');
      }

      const data = await res.json();
      if (data.conversationId && (!currentConversationId || currentConversationId !== data.conversationId)) {
        setCurrentConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMessage.id),
        data.userMessage,
        data.assistantMessage,
      ]);

      if (data.assistantMessage?.citations?.length > 0) {
        triggerConfetti();
      }
    } catch (err: any) {
      showToast('Failed to retrieve answer from your library.', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, unable to query your document library right now. Please verify your connection and retry.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSendingQuery(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesQuery =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.collectionName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection =
      selectedCollection === 'All Documents' || doc.collectionName === selectedCollection;
    return matchesQuery && matchesCollection;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel-heavy border border-red-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-mono font-semibold">
            <Library className="w-3.5 h-3.5" />
            <span>KNOWLEDGE REPOSITORY & RAG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My AI Library & Document Q&A
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Upload your lecture PDFs, textbooks, handwritten scanned notes, and DOCX files.
            Chat with your entire library with grounded source citations and page excerpts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#090912] border border-zinc-800 relative z-10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Document Library ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat With Library</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DOCUMENT LIBRARY
          ========================================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Upload Zone & Collections Filter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Box */}
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#0a0a14] border border-red-950/40 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Upload className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Upload Learning Materials
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  PDF, DOCX, TXT, Images (OCR) up to 20MB
                </span>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-red-950/70 hover:border-red-600/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-[#07070f] hover:bg-red-950/10 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-900/60 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      Click to select or drag & drop documents
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Text extraction, OCR, and semantic vector chunking happen automatically
                    </p>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2 pt-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-mono flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                      Uploading & Processing Chunks...
                    </span>
                    <span className="text-red-400 font-mono font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Folders / Collections Sidebar */}
            <div className="p-6 rounded-3xl bg-[#0a0a14] border border-red-950/40 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-red-400" />
                    Collections
                  </span>
                  <button
                    onClick={() => setShowAddCollection(!showAddCollection)}
                    className="text-[11px] text-red-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <FolderPlus className="w-3 h-3" />
                    + New
                  </button>
                </div>

                {showAddCollection && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <input
                      type="text"
                      placeholder="Folder name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none flex-1"
                    />
                    <button
                      onClick={() => {
                        if (newCollectionName.trim()) {
                          setCollections((prev) => [...prev, newCollectionName.trim()]);
                          setSelectedCollection(newCollectionName.trim());
                          setNewCollectionName('');
                          setShowAddCollection(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-bold"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {collections.map((col) => {
                    const count =
                      col === 'All Documents'
                        ? documents.length
                        : documents.filter((d) => d.collectionName === col).length;

                    return (
                      <button
                        key={col}
                        onClick={() => setSelectedCollection(col)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                          selectedCollection === col
                            ? 'bg-red-950/50 text-white border border-red-800/40 font-semibold'
                            : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate">{col}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-900/80">
                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat With This Collection</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar & Document Listing */}
          <div className="p-6 rounded-3xl bg-[#0a0a14] border border-red-950/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search uploaded documents by title or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span>Showing {filteredDocuments.length} documents</span>
                <button
                  onClick={loadDocuments}
                  className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white"
                  title="Refresh library"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Documents Table / Grid */}
            {isLoadingDocs ? (
              <div className="p-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
                <span>Loading your encrypted library...</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#07070e] border border-zinc-900 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No documents found</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No files matched your search keyword.'
                    : 'Upload lecture PDFs, syllabuses, or scanned notes above to build your searchable library.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredDocuments.map((doc) => {
                  const sizeFormatted =
                    doc.sizeBytes > 1024 * 1024
                      ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.round(doc.sizeBytes / 1024)} KB`;

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-[#07070f] border border-zinc-900 hover:border-red-950/60 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate" title={doc.name}>
                              {doc.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                              <span className="uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300">
                                {doc.fileType}
                              </span>
                              <span>{sizeFormatted}</span>
                              <span>•</span>
                              <span>{doc.pageCount} Pages</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {doc.status === 'ready' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              Ready ({doc.chunksCount} chunks)
                            </span>
                          ) : doc.status === 'processing' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/40 text-amber-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Indexing...
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-800/40 text-rose-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 text-[11px]">
                        <span className="text-[10px] font-mono text-zinc-500">
                          Collection: <strong className="text-zinc-300">{doc.collectionName}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          {doc.status === 'failed' && (
                            <button
                              onClick={() => handleReprocess(doc.id)}
                              className="text-amber-400 hover:text-amber-300 text-[10px] font-mono flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDocIdsForChat([doc.id]);
                              setActiveTab('chat');
                            }}
                            className="text-red-400 hover:text-white text-[11px] font-semibold flex items-center gap-1"
                          >
                            <span>Chat</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.name)}
                            className="p-1.5 rounded hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CHAT WITH YOUR ENTIRE LIBRARY
          ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Sidebar: Past Discussions & Document Scope Selector */}
          <div className="lg:col-span-1 space-y-4">
            {/* Scope Control Box */}
            <div className="p-5 rounded-3xl bg-[#0a0a14] border border-red-950/40 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-red-400" />
                Retrieval Scope
              </span>

              <div className="space-y-2">
                <button
                  onClick={() => setSelectedDocIdsForChat([])}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between ${
                    selectedDocIdsForChat.length === 0
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span>Entire Library</span>
                  <span className="text-[10px] font-mono">({documents.length} docs)</span>
                </button>

                <div className="pt-2 border-t border-zinc-900">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Or Select Target Documents:
                  </span>
                  <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
                    {documents.map((d) => {
                      const isSelected = selectedDocIdsForChat.includes(d.id);
                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedDocIdsForChat((prev) => prev.filter((id) => id !== d.id));
                            } else {
                              setSelectedDocIdsForChat((prev) => [...prev, d.id]);
                            }
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-red-950/40 border-red-800 text-white'
                              : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                          }`}
                        >
                          <span className="truncate pr-2">{d.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-red-400 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Response Language:</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['English', 'Hindi', 'Hinglish'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setPreferredLang(lang)}
                      className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                        preferredLang === lang
                          ? 'bg-red-950/80 border-red-700 text-white'
                          : 'border-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation History */}
            <div className="p-5 rounded-3xl bg-[#0a0a14] border border-red-950/40 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Saved Sessions
                </span>
                <button
                  onClick={handleCreateNewConversation}
                  className="text-[11px] text-red-400 hover:text-white font-mono"
                >
                  + New Chat
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadConversationMessages(c.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all truncate block ${
                      currentConversationId === c.id
                        ? 'bg-red-950/60 text-white border border-red-900/60 font-semibold'
                        : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Messages & Query Input */}
          <div className="lg:col-span-3 flex flex-col h-[700px] rounded-3xl bg-[#080810] border border-red-950/50 overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="p-4 px-6 border-b border-zinc-900 bg-[#0a0a14] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-white">
                  RAG Assistant • Grounded in {selectedDocIdsForChat.length === 0 ? 'All Documents' : `${selectedDocIdsForChat.length} Selected Docs`}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Language: <strong className="text-zinc-300">{preferredLang}</strong>
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Ask your uploaded library anything</h3>
                    <p className="text-xs text-zinc-400 max-w-md">
                      Get direct answers with page citations. Try one of these instant prompts:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
                    {[
                      'Find all formulas related to matrices in my notes',
                      'Explain Chapter 3 in simple Hinglish',
                      'Generate 10 exam MCQs from my uploaded material',
                      'Summarize all high-yield definitions in my PDFs',
                    ].map((promptText) => (
                      <button
                        key={promptText}
                        onClick={() => handleSendChat(promptText)}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-left text-xs text-zinc-300 hover:border-red-600/50 hover:text-white transition-all"
                      >
                        "{promptText}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-red-600 text-white rounded-br-none shadow-md shadow-red-950/40'
                          : 'bg-[#0f0f1b] border border-zinc-800/80 text-zinc-200 rounded-bl-none space-y-3'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Source Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-3 border-t border-zinc-800 space-y-2">
                          <span className="text-[10px] font-mono text-red-400 uppercase font-bold flex items-center gap-1">
                            <Quote className="w-3 h-3" />
                            Grounded Citations ({msg.citations.length})
                          </span>

                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => setExpandedCitation(c)}
                                className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/40 hover:border-red-600 text-red-300 text-[10px] font-mono flex items-center gap-1 transition-all"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[140px]">{c.docName}</span>
                                <span>(P.{c.pageNumber || 1})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                        >
                          {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isSendingQuery && (
                <div className="flex items-center gap-2 text-xs text-red-400 font-mono p-3 rounded-xl bg-red-950/30 border border-red-900/40 w-max">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching document chunks and formulating grounded answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Citation Modal / Drawer */}
            {expandedCitation && (
              <div className="p-4 bg-zinc-950 border-t border-red-950/80 animate-fade-in flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-red-400 font-bold">
                    <span>Source Excerpt from: {expandedCitation.docName}</span>
                    <span>(Page {expandedCitation.pageNumber || 1})</span>
                  </div>
                  <p className="text-zinc-300 italic max-h-24 overflow-y-auto">
                    "{expandedCitation.excerpt}"
                  </p>
                </div>
                <button
                  onClick={() => setExpandedCitation(null)}
                  className="px-2 py-1 rounded bg-zinc-900 text-zinc-400 hover:text-white text-[10px] font-mono"
                >
                  Close
                </button>
              </div>
            )}

            {/* Input Box */}
            <div className="p-4 bg-[#0a0a14] border-t border-zinc-900 flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  documents.length === 0
                    ? 'Upload documents in the Library tab first...'
                    : 'Ask any question about your uploaded documents...'
                }
                value={inputQuery}
                disabled={documents.length === 0 || isSendingQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChat();
                }}
                className="flex-1 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 disabled:opacity-50"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={!inputQuery.trim() || isSendingQuery || documents.length === 0}
                className="btn-red-glow px-5 py-3 rounded-2xl text-xs font-bold text-white uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Ask</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
