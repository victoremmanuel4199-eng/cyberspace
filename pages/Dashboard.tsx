
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  LogOut, Shield, HardDrive, 
  Upload, Trash2, Loader2, FolderPlus, FileText, 
  Users, StickyNote, Folder, Plus, X,
  ChevronRight, ChevronUp, ChevronDown, Save, LayoutGrid, DownloadCloud, Image as ImageIcon, File as FileIcon,
  AlertTriangle, Sparkles, ArrowLeft, Search, Home, Eye, History,
  Film, Music, Globe, Volume2, ExternalLink, CheckCircle, MessageSquare, Flame
} from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import UpgradeModal from '../components/UpgradeModal';
import FilePreviewModal from '../components/FilePreviewModal';
import FileVersionModal from '../components/FileVersionModal';

// --- Types ---
interface Timestamp {
  seconds: number;
}

interface FileItem {
  id: string;
  name: string;
  size: number; // Stored in bytes
  type: string;
  mimeType: string;
  folderId: string | null;
  storagePath: string;
  downloadURL: string;
  createdAt: Timestamp;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Timestamp;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: Timestamp;
}

interface MemberItem {
  id: string;
  name: string;
  role: string;
  email: string;
  createdAt: Timestamp;
}

type TabView = 'overview' | 'files' | 'notes' | 'team' | 'ai-studio';
type SortKey = 'name' | 'size' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null); // null = root
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'createdAt', 
    direction: 'desc' 
  });
  
  // UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  
  // Data State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Preview & Versioning State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [versioningFile, setVersioningFile] = useState<FileItem | null>(null);

  // Renaming State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Create Modal States
  const [modalOpen, setModalOpen] = useState<{
    type: 'folder' | 'file' | 'note' | 'member' | null;
  }>({ type: null });

  // Delete Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: string | null;
    collectionName: string;
    storagePath?: string;
    itemName?: string;
  }>({ 
    isOpen: false, 
    itemId: null, 
    collectionName: 'files',
    itemName: '' 
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form Inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemContent, setNewItemContent] = useState(''); // For notes
  const [newItemRole, setNewItemRole] = useState('Viewer'); // For members
  
  // File Upload Specific State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- AI Studio States ---
  // A. Video States (Veo)
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoImageBytes, setVideoImageBytes] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // B. Music States (Lyria)
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicImageBytes, setMusicImageBytes] = useState<string | null>(null);
  const [musicMimeType, setMusicMimeType] = useState<string | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState('');
  const [musicError, setMusicError] = useState<string | null>(null);

  // C. Search States (Grounded Search)
  const [aiSearchInput, setAiSearchInput] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState<string | null>(null);
  const [aiSearchChunks, setAiSearchChunks] = useState<any[]>([]);
  const [aiSearchMetadata, setAiSearchMetadata] = useState<any>(null);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);

  // Load initial lists from localStorage or seed them if not present
  useEffect(() => {
    if (!user) return;

    setLoadingData(true);

    const storedFolders = localStorage.getItem(`cyberspace_folders_${user.uid}`);
    const storedFiles = localStorage.getItem(`cyberspace_files_${user.uid}`);
    const storedNotes = localStorage.getItem(`cyberspace_notes_${user.uid}`);
    const storedMembers = localStorage.getItem(`cyberspace_members_${user.uid}`);

    // Seed Folders if empty
    let currentFolders: FolderItem[] = [];
    if (storedFolders) {
      currentFolders = JSON.parse(storedFolders);
    } else {
      currentFolders = [
        { id: 'f1', name: 'Design Assets', parentId: null, createdAt: { seconds: 1715000000 } as any },
        { id: 'f2', name: 'Financials Q4', parentId: null, createdAt: { seconds: 1714500000 } as any },
        { id: 'f3', name: 'Legal Contracts', parentId: null, createdAt: { seconds: 1714000000 } as any },
        { id: 'f4', name: 'Logos', parentId: 'f1', createdAt: { seconds: 1715005000 } as any },
      ];
      localStorage.setItem(`cyberspace_folders_${user.uid}`, JSON.stringify(currentFolders));
    }
    setFolders(currentFolders);

    // Seed Files if empty
    let currentFiles: FileItem[] = [];
    if (storedFiles) {
      currentFiles = JSON.parse(storedFiles);
    } else {
      currentFiles = [
        { id: '1', name: 'Project_Alpha_Specs.pdf', size: 2400000, type: 'pdf', mimeType: 'application/pdf', folderId: null, storagePath: '', downloadURL: '#', createdAt: { seconds: 1715200000 } as any },
        { id: '2', name: 'Budget_2024.xlsx', size: 1500000, type: 'doc', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', folderId: 'f2', storagePath: '', downloadURL: '#', createdAt: { seconds: 1714600000 } as any },
        { id: '3', name: 'Cyberspace_Logo_V2.png', size: 4500000, type: 'image', mimeType: 'image/png', folderId: 'f4', storagePath: '', downloadURL: 'https://images.unsplash.com/photo-1614064641938-3e8529437109?auto=format&fit=crop&q=80&w=2000', createdAt: { seconds: 1715100000 } as any },
        { id: '4', name: 'NDA_Template.docx', size: 850000, type: 'doc', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', folderId: 'f3', storagePath: '', downloadURL: '#', createdAt: { seconds: 1714100000 } as any },
        { id: '5', name: 'Meeting_Notes_May.txt', size: 12000, type: 'doc', mimeType: 'text/plain', folderId: null, storagePath: '', downloadURL: '#', createdAt: { seconds: 1715300000 } as any },
      ];
      localStorage.setItem(`cyberspace_files_${user.uid}`, JSON.stringify(currentFiles));
    }
    setFiles(currentFiles);

    // Seed Notes if empty
    let currentNotes: NoteItem[] = [];
    if (storedNotes) {
      currentNotes = JSON.parse(storedNotes);
    } else {
      currentNotes = [
        { id: 'n1', title: 'Security Roadmap', content: "1. Enable multi-factor authentication for all key roles.\n2. Complete cybersecurity awareness training.\n3. Conduct penetration testing on staging next week.", color: 'bg-emerald-50', createdAt: { seconds: 1715000000 } as any },
        { id: 'n2', title: 'Cyberspace Ideas', content: "Explore client-side homomorphic encryption options for our vault databases to maximize information boundaries.", color: 'bg-blue-50', createdAt: { seconds: 1714800000 } as any }
      ];
      localStorage.setItem(`cyberspace_notes_${user.uid}`, JSON.stringify(currentNotes));
    }
    setNotes(currentNotes);

    // Seed Members if empty
    let currentMembers: MemberItem[] = [];
    if (storedMembers) {
      currentMembers = JSON.parse(storedMembers);
    } else {
      currentMembers = [
        { id: 'm1', name: 'Sarah Jenkins', role: 'Admin', email: 'sarah@cyberspace.team', createdAt: { seconds: 1710000000 } as any },
        { id: 'm2', name: 'Mike Ross', role: 'Editor', email: 'mike@cyberspace.team', createdAt: { seconds: 1711000000 } as any },
        { id: 'm3', name: 'Jessica Pearson', role: 'Viewer', email: 'jessica@cyberspace.team', createdAt: { seconds: 1712000000 } as any },
      ];
      localStorage.setItem(`cyberspace_members_${user.uid}`, JSON.stringify(currentMembers));
    }
    setMembers(currentMembers);

    setLoadingData(false);
  }, [user]);

  // Sync to other windows or FileVersionModal changes
  useEffect(() => {
    const handleLocalChange = () => {
      if (!user) return;
      const storedFolders = localStorage.getItem(`cyberspace_folders_${user.uid}`);
      const storedFiles = localStorage.getItem(`cyberspace_files_${user.uid}`);
      const storedNotes = localStorage.getItem(`cyberspace_notes_${user.uid}`);
      const storedMembers = localStorage.getItem(`cyberspace_members_${user.uid}`);

      if (storedFolders) setFolders(JSON.parse(storedFolders));
      if (storedFiles) setFiles(JSON.parse(storedFiles));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      if (storedMembers) setMembers(JSON.parse(storedMembers));
    };

    window.addEventListener('cyberspace_vault_changed', handleLocalChange);
    return () => window.removeEventListener('cyberspace_vault_changed', handleLocalChange);
  }, [user]);

  // --- Actions ---

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setNewItemName(file.name);
      setUploadProgress(0);
      setErrorMsg(null);
      setModalOpen({ type: 'file' });
    }
  };

  // Open the delete confirmation modal
  const openDeleteModal = (collectionName: string, item: any) => {
    setDeleteModal({
      isOpen: true,
      itemId: item.id,
      collectionName,
      storagePath: item.storagePath,
      itemName: item.name || item.title || 'Untitled Item'
    });
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteModal.itemId) return;
    
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const colName = deleteModal.collectionName;
      let storageKey = '';
      let stateSetter: any = null;

      if (colName === 'folders') {
        storageKey = `cyberspace_folders_${user.uid}`;
        stateSetter = setFolders;
      } else if (colName === 'files') {
        storageKey = `cyberspace_files_${user.uid}`;
        stateSetter = setFiles;
      } else if (colName === 'notes') {
        storageKey = `cyberspace_notes_${user.uid}`;
        stateSetter = setNotes;
      } else if (colName === 'teamMembers') {
        storageKey = `cyberspace_members_${user.uid}`;
        stateSetter = setMembers;
      }

      if (storageKey && stateSetter) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const items = JSON.parse(stored);
          const updated = items.filter((item: any) => item.id !== deleteModal.itemId);
          localStorage.setItem(storageKey, JSON.stringify(updated));
          stateSetter(updated);
        }
      }

      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Local delete error:", err);
      setDeleteError("Failed to remove item. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = (url: string) => {
    if (!url || url === '#') {
      alert("This is a demo secure document with mock download stream.");
      return;
    }
    window.open(url, '_blank');
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'image' || file.type === 'pdf') {
      setPreviewFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!newItemName) {
        setNewItemName(file.name);
      }
    }
  };

  // --- Renaming Logic ---

  const startRenaming = (e: React.MouseEvent, item: FolderItem | FileItem) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const saveRename = async (collectionName: 'folders' | 'files') => {
    if (!user || !editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }

    const storageKey = collectionName === 'files' 
      ? `cyberspace_files_${user.uid}` 
      : `cyberspace_folders_${user.uid}`;
    
    const stateSetter = collectionName === 'files' ? setFiles : setFolders;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const items = JSON.parse(stored);
        const updated = items.map((item: any) => {
          if (item.id === editingId) {
            return { ...item, name: editingName.trim() };
          }
          return item;
        });
        localStorage.setItem(storageKey, JSON.stringify(updated));
        stateSetter(updated);
      }
    } catch (err) {
      console.error("Error renaming:", err);
      alert("Failed to rename item");
    } finally {
      setEditingId(null);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, collectionName: 'folders' | 'files') => {
    if (e.key === 'Enter') {
      saveRename(collectionName);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: { seconds: number }) => {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    return 'doc';
  };

  const getBreadcrumbs = () => {
    if (!currentFolder) return [];
    
    const path: FolderItem[] = [currentFolder];
    let curr = currentFolder;
    
    let depth = 0;
    while (curr.parentId && depth < 20) {
      const parent = folders.find(f => f.id === curr.parentId);
      if (parent) {
        path.unshift(parent);
        curr = parent;
      } else {
        break;
      }
      depth++;
    }
    return path;
  };

  const handleCreate = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (modalOpen.type === 'folder') {
        const storageKey = `cyberspace_folders_${user.uid}`;
        const stored = localStorage.getItem(storageKey);
        const foldersList = stored ? JSON.parse(stored) : [];
        
        const newFolder: FolderItem = {
          id: 'fol_' + Date.now(),
          name: newItemName || 'Untitled Folder',
          parentId: currentFolder?.id || null,
          createdAt: { seconds: Math.floor(Date.now() / 1000) } as any
        };

        const updated = [newFolder, ...foldersList];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setFolders(updated);
        closeModal();
      } 
      else if (modalOpen.type === 'file') {
        if (!selectedFile) {
          setErrorMsg("Please select a file to upload.");
          setIsSubmitting(false);
          return;
        }

        // Standard UX visual feedback progress ticks
        await new Promise((resolve) => {
          let pct = 0;
          const interval = setInterval(() => {
            pct += 25;
            if (pct >= 100) {
              clearInterval(interval);
              resolve(true);
            } else {
              setUploadProgress(pct);
            }
          }, 100);
        });

        const storageKey = `cyberspace_files_${user.uid}`;
        const stored = localStorage.getItem(storageKey);
        const filesList = stored ? JSON.parse(stored) : [];

        const uniqueId = Date.now();
        // createObjectURL allows real in-memory download & previewing!
        const downloadURL = URL.createObjectURL(selectedFile);

        const newFile: FileItem = {
          id: 'file_' + uniqueId,
          name: newItemName || selectedFile.name,
          type: getFileTypeLabel(selectedFile.type),
          mimeType: selectedFile.type,
          size: selectedFile.size,
          folderId: currentFolder?.id || null,
          storagePath: `local_uploads/${uniqueId}_${selectedFile.name}`,
          downloadURL: downloadURL,
          createdAt: { seconds: Math.floor(Date.now() / 1000) } as any
        };

        const updated = [newFile, ...filesList];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setFiles(updated);
        closeModal();
      } 
      else if (modalOpen.type === 'note') {
        const colors = ['bg-yellow-50', 'bg-purple-50', 'bg-blue-50', 'bg-red-50', 'bg-emerald-50'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const storageKey = `cyberspace_notes_${user.uid}`;
        const stored = localStorage.getItem(storageKey);
        const notesList = stored ? JSON.parse(stored) : [];

        const newNote: NoteItem = {
          id: 'note_' + Date.now(),
          title: newItemName || 'Untitled Note',
          content: newItemContent,
          color: randomColor,
          createdAt: { seconds: Math.floor(Date.now() / 1000) } as any
        };

        const updated = [newNote, ...notesList];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setNotes(updated);
        closeModal();
      } 
      else if (modalOpen.type === 'member') {
        const storageKey = `cyberspace_members_${user.uid}`;
        const stored = localStorage.getItem(storageKey);
        const membersList = stored ? JSON.parse(stored) : [];

        const newMember: MemberItem = {
          id: 'mem_' + Date.now(),
          name: newItemName,
          role: newItemRole,
          email: newItemName.toLowerCase().replace(/\s/g, '') + '@cyberspace.team',
          createdAt: { seconds: Math.floor(Date.now() / 1000) } as any
        };

        const updated = [newMember, ...membersList];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setMembers(updated);
        closeModal();
      }
    } catch (err) {
      console.error("Error creating item:", err);
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (type: 'folder' | 'file' | 'note' | 'member') => {
    setNewItemName('');
    setNewItemContent('');
    setNewItemRole('Viewer');
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMsg(null);
    setModalOpen({ type });
  };

  const closeModal = () => {
    setModalOpen({ type: null });
    setIsSubmitting(false);
  };

  // --- Helpers ---
  
  const getInitials = (name?: string | null) => {
    const n = name || user?.email || 'U';
    return n.substring(0, 2).toUpperCase();
  };

  // --- Render Sections ---

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const startVideoPolling = (operationName: string) => {
    const messages = [
      "Analyzing input video frame context...",
      "Provisioning safe Veo 3.1 video generation node...",
      "Generating dynamic spatial-temporal fields...",
      "Rendering high-fidelity video container streams...",
      "Finalizing raw MP4 video streams..."
    ];
    let msgIndex = 0;
    setVideoStatusMessage(messages[0]);

    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setVideoStatusMessage(messages[msgIndex]);
    }, 4500);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName })
        });
        const data = await response.json();
        
        if (data.done) {
          clearInterval(pollInterval);
          clearInterval(msgInterval);
          
          if (data.error) {
            setVideoError(data.error.message || "Video generation failed");
            setVideoLoading(false);
            return;
          }

          setVideoStatusMessage("Assembling finished. Fetching local video stream buffer...");
          
          const downloadRes = await fetch("/api/video-download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName })
          });
          
          if (!downloadRes.ok) {
            throw new Error(`Failed to stream compiled video: ${downloadRes.statusText}`);
          }

          const blob = await downloadRes.blob();
          const localUrl = URL.createObjectURL(blob);
          setGeneratedVideoUrl(localUrl);
          setVideoLoading(false);
        }
      } catch (err: any) {
        console.error("Polling error:", err);
        clearInterval(pollInterval);
        clearInterval(msgInterval);
        setVideoError(err.message || "Failed to poll video generation status.");
        setVideoLoading(false);
      }
    }, 5000);
  };

  const renderAIStudio = () => {
    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setVideoFile(file);
      try {
        const base64 = await convertToBase64(file);
        setVideoImageBytes(base64);
        setVideoMimeType(file.type);
      } catch (err: any) {
        setVideoError("Failed to extract seed image bytes: " + err.message);
      }
    };

    const handleMusicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setMusicFile(file);
      try {
        const base64 = await convertToBase64(file);
        setMusicImageBytes(base64);
        setMusicMimeType(file.type);
      } catch (err: any) {
        setMusicError("Failed to extract seed music bytes: " + err.message);
      }
    };

    const generateVideo = async () => {
      setVideoError(null);
      setGeneratedVideoUrl(null);
      setVideoLoading(true);
      setVideoStatusMessage("Connecting to Veo video computing instances...");

      try {
        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: videoPrompt,
            imageBytes: videoImageBytes,
            mimeType: videoMimeType,
            aspectRatio: videoAspectRatio
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to start Veo operation.");
        }

        if (data.operationName) {
          startVideoPolling(data.operationName);
        } else {
          throw new Error("Invalid response received from remote Veo node.");
        }
      } catch (err: any) {
        setVideoError(err.message || "An unexpected error occurred during video production onboarding.");
        setVideoLoading(false);
      }
    };

    const generateMusic = async () => {
      setMusicError(null);
      setGeneratedMusicUrl(null);
      setMusicLyrics("");
      setMusicLoading(true);

      try {
        const res = await fetch("/api/generate-music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: musicPrompt,
            model: musicModel,
            imageBytes: musicImageBytes,
            mimeType: musicMimeType
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to synthesize Lyria music score.");
        }

        if (data.audioBase64) {
          const byteCharacters = atob(data.audioBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const audioBlob = new Blob([byteArray], { type: data.mimeType || "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);
          setGeneratedMusicUrl(audioUrl);
          if (data.lyrics) {
            setMusicLyrics(data.lyrics);
          }
        } else {
          throw new Error("No synthesizer audio streams response from Lyria.");
        }
      } catch (err: any) {
        setMusicError(err.message || "Music synthesis failed.");
      } finally {
        setMusicLoading(false);
      }
    };

    const runGroundedSearch = async () => {
      setAiSearchError(null);
      setAiSearchResult(null);
      setAiSearchChunks([]);
      setAiSearchLoading(true);

      try {
        const res = await fetch("/api/grounded-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: aiSearchInput })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Search grounding request failed.");
        }

        setAiSearchResult(data.answer);
        setAiSearchChunks(data.searchChunks || []);
        if (data.searchMetadata) {
          setAiSearchMetadata(data.searchMetadata);
        }
      } catch (err: any) {
        setAiSearchError(err.message || "Grounded smart search index querying failed.");
      } finally {
        setAiSearchLoading(false);
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={120} className="animate-pulse" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold rounded-md uppercase tracking-wider">
                  Experimental Lab
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h2 className="text-2xl font-bold font-sans tracking-tight">Cyberspace AI Generation Suite</h2>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Synthesize high-fidelity media assets and access real-time grounded search streams powered by the latest Gemini model infrastructure.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid Layer 1: Veo & Lyria */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Bento Cell A: Veo Image-to-Video Maker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Film size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 font-sans text-sm">Veo Image-to-Video Animator</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Model: veo-3.1-fast-generate-preview</p>
                </div>
              </div>

              {/* Input photo uploader */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 tracking-wide uppercase mb-2">
                  1. Seed Frame / Image Upload
                </label>
                <div 
                  onClick={() => document.getElementById('video-image-uploader')?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    videoFile ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <input 
                    type="file" 
                    id="video-image-uploader" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleVideoFileChange} 
                  />
                  {videoFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{videoFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{(videoFile.size / 1024).toFixed(0)} KB • Click to swap</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-500 font-medium">Click or drag & drop starting image</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Supports PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Choice of Aspect Ratio */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 tracking-wide uppercase mb-2">
                  2. Render Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`py-2 px-3 text-xs font-semibold border rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      videoAspectRatio === '16:9' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-4 h-2.5 border border-current rounded-sm block opacity-80" />
                    16:9 Landscape
                  </button>
                  <button 
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`py-2 px-3 text-xs font-semibold border rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      videoAspectRatio === '9:16' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-4 border border-current rounded-sm block opacity-80" />
                    9:16 Portrait
                  </button>
                </div>
              </div>

              {/* Cinematic Prompt */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 tracking-wide uppercase mb-2">
                  3. Directional Motion Prompt
                </label>
                <textarea 
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 h-20 resize-none font-sans"
                  placeholder="Describe camera movement or motion details (e.g., Infinite camera zoom, waves dynamic ripples, smoke rise...)"
                />
              </div>
            </div>

            <div className="space-y-3">
              {/* Actions & Results */}
              {videoError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start gap-2 border border-red-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{videoError}</span>
                </div>
              )}

              {videoLoading ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center space-y-3">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-medium text-slate-700">{videoStatusMessage}</p>
                  <p className="text-[10px] text-slate-400 font-mono animate-pulse">Processing takes approximately 1-2 minutes depending on resource capacity</p>
                </div>
              ) : generatedVideoUrl ? (
                <div className="bg-slate-950 rounded-xl overflow-hidden shadow-inner p-2 relative group border border-slate-800">
                  <div className="relative aspect-video bg-black flex items-center justify-center rounded-lg overflow-hidden">
                    <video 
                      src={generatedVideoUrl} 
                      controls 
                      className="max-h-[220px] max-w-full"
                      playsInline
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-mono">Render: MP4 H.264</span>
                    <a 
                      href={generatedVideoUrl} 
                      download="cyberspace_veo_media.mp4"
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <DownloadCloud size={12} />
                      Save Video
                    </a>
                  </div>
                </div>
              ) : null}

              {!videoLoading && (
                <button 
                  onClick={generateVideo}
                  disabled={!videoPrompt && !videoImageBytes}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={14} className="text-emerald-400" />
                  Synthesize Veo Motion Frame
                </button>
              )}
            </div>
          </div>

          {/* Bento Cell B: Lyria Lyric & Music Generator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Music size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 font-sans text-sm">Lyria Music Stream Synth</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Models: clip-30s or pro-track-mix</p>
                </div>
              </div>

              {/* Music model choice */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 tracking-wide uppercase mb-2">
                  1. Track Duration / Level Mix
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setMusicModel('lyria-3-clip-preview')}
                    className={`py-2 px-3 text-xs font-semibold border rounded-lg transition-all flex flex-col items-center justify-center ${
                      musicModel === 'lyria-3-clip-preview' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold font-sans">Clip Preview</span>
                    <span className="text-[9px] opacity-75 mt-0.5">Short loops up to 30s</span>
                  </button>
                  <button 
                    onClick={() => setMusicModel('lyria-3-pro-preview')}
                    className={`py-2 px-3 text-xs font-semibold border rounded-lg transition-all flex flex-col items-center justify-center ${
                      musicModel === 'lyria-3-pro-preview' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold font-sans">Pro Master Track</span>
                    <span className="text-[9px] opacity-75 mt-0.5">Full stereophonic mix</span>
                  </button>
                </div>
              </div>

              {/* Optional image context for Lyria */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 tracking-wide uppercase mb-2">
                  2. Visual Image Vibe Context (Optional)
                </label>
                <div 
                  onClick={() => document.getElementById('music-image-uploader')?.click()}
                  className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                    musicFile ? 'border-purple-500 bg-purple-50/10' : 'border-slate-200 hover:border-purple-500'
                  }`}
                >
                  <input 
                    type="file" 
                    id="music-image-uploader" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleMusicFileChange} 
                  />
                  {musicFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-slate-800 truncate max-w-[150px]">{musicFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-1">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium font-sans">Extract track theme from a photo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Music prompt */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 tracking-wide uppercase mb-2">
                  3. Theme Prompt / Lyric Context
                </label>
                <textarea 
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-purple-500 h-20 resize-none font-sans"
                  placeholder="Atmospheric lofi focus beats, high energy tech cyberpunks, orchestral synth..."
                />
              </div>
            </div>

            <div className="space-y-3">
              {musicError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start gap-2 border border-red-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{musicError}</span>
                </div>
              )}

              {musicLoading ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
                  <p className="text-xs font-medium text-slate-700">Synthesizing stereophonic master audio stream...</p>
                  <p className="text-[9px] text-slate-400 font-mono">Modulating frequencies and assembling track waves</p>
                </div>
              ) : generatedMusicUrl ? (
                <div className="bg-slate-50 border border-purple-100 rounded-xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <Volume2 size={16} />
                    </div>
                    <div className="flex-1">
                      <audio src={generatedMusicUrl} controls className="w-full h-8 outline-none" />
                    </div>
                  </div>
                  {musicLyrics && (
                    <div className="bg-white border border-slate-150 p-3 rounded-lg text-xs text-slate-600 max-h-24 overflow-y-auto font-sans italic">
                      <span className="block font-bold font-mono text-[9px] text-purple-500 uppercase not-italic tracking-wide mb-1">Generated Lyrics/Transcription:</span>
                      "{musicLyrics}"
                    </div>
                  )}
                </div>
              ) : null}

              {!musicLoading && (
                <button 
                  onClick={generateMusic}
                  disabled={!musicPrompt}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Music size={14} className="text-purple-400" />
                  Synthesize Lyria audio score
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bento Grid Layer 2: Secure Google Search Grounding Q&A */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 font-sans text-sm">Grounded Google-Search Intelligence</h3>
                <p className="text-[10px] text-slate-400 font-mono">Model: gemini-3.5-flash with search tool Integration</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-full uppercase font-mono tracking-wider">
              <CompassIcon size={12} className="animate-spin text-blue-500" style={{ animationDuration: '4s' }} />
              Live Web Grounded
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text"
                value={aiSearchInput}
                onChange={(e) => setAiSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runGroundedSearch()}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
                placeholder="Ask smart queries leveraging live Google Search index (e.g. latest cyber safety parameters, recent system events...)"
              />
              <button 
                onClick={runGroundedSearch}
                disabled={aiSearchLoading || !aiSearchInput}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={14} />}
                Inspect Index
              </button>
            </div>

            {aiSearchError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start gap-2 border border-red-100">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{aiSearchError}</span>
              </div>
            )}

            {aiSearchLoading && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-medium text-slate-600">Querying real-time Google Search context index...</p>
                <p className="text-[10px] text-slate-400 font-mono">Synthesizing and filtering grounding metadata</p>
              </div>
            )}

            {aiSearchResult && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Answer Output */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                    <MessageSquare size={12} className="text-blue-500" />
                    Synthesized Grounded Answer
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {aiSearchResult}
                  </p>
                </div>

                {/* Grounding Proof of Work / Citations */}
                {aiSearchChunks && aiSearchChunks.length > 0 && (
                  <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 font-mono uppercase tracking-wider">
                      <CheckCircle size={12} />
                      Real-time Citations & Grounding Sources ("Proof of Work")
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                      {aiSearchChunks.map((chunk: any, idx: number) => {
                        const sourceTitle = chunk.web?.title || `Search Index Result [${idx + 1}]`;
                        const sourceUrl = chunk.web?.uri;
                        return (
                          <div key={idx} className="bg-white border border-slate-100 p-3 rounded-lg flex flex-col justify-between hover:border-blue-300 transition-colors shadow-sm">
                            <div>
                              <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 font-mono text-[9px] font-bold rounded mb-1">
                                Source [{idx + 1}]
                              </span>
                              <h4 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-snug">{sourceTitle}</h4>
                            </div>
                            {sourceUrl && (
                              <a 
                                href={sourceUrl} 
                                target="_blank" 
                                rel="referrer noopener"
                                className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-1 mt-2 w-fit pt-1.5 border-t border-slate-50"
                              >
                                <ExternalLink size={10} />
                                View Source Index
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <Shield size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Vault Status</h3>
          <p className="text-sm text-slate-500 mb-4">Your environment is secure and encrypted.</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active Protection
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <HardDrive size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Storage</h3>
          <p className="text-sm text-slate-500 mb-4">{files.length} files stored in your cloud vault.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(files.length * 2, 100)}%` }} />
          </div>
          <span className="text-xs text-slate-400">Standard Plan</span>
        </div>

        {/* Team Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
             <Users size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Team Access</h3>
          <p className="text-sm text-slate-500 mb-4">{members.length} active members in this workspace.</p>
          <button onClick={() => setActiveTab('team')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Manage Team
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10">
           <h3 className="text-xl font-bold mb-2">Welcome to Cyberspace 2.0</h3>
           <p className="text-slate-400 max-w-lg mb-6">
             You now have full access to the new file management system, secure notes, and team collaboration tools.
           </p>
           <button 
             onClick={() => setActiveTab('files')}
             className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
           >
             Start Uploading
             <Upload size={16} />
           </button>
        </div>
      </div>
    </div>
  );

  const renderFiles = () => {
    const isSearching = searchQuery.length > 0;
    
    // Determine which files to show: Search results (global) or Current Folder contents
    let displayFiles = files;
    let displayFolders = folders;

    if (isSearching) {
      const lowerQuery = searchQuery.toLowerCase();
      // Search all files and folders
      displayFiles = files.filter(f => f.name.toLowerCase().includes(lowerQuery));
      displayFolders = folders.filter(f => f.name.toLowerCase().includes(lowerQuery));
    } else {
      // Standard navigation
      displayFiles = files.filter(f => 
        currentFolder ? f.folderId === currentFolder.id : !f.folderId
      );
      // Show folders that are children of current folder (or root)
      displayFolders = folders.filter(f => 
        currentFolder ? f.parentId === currentFolder.id : !f.parentId
      );
    }

    // Sort Helper Function
    const sortData = (data: any[], type: 'file' | 'folder') => {
      return [...data].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle undefined (folders don't have size)
        if (aVal === undefined && type === 'folder') return 1; 
        if (bVal === undefined && type === 'folder') return -1;
        
        // If sorting folders by size, sort by name instead
        if (sortConfig.key === 'size' && type === 'folder') {
           aVal = a.name;
           bVal = b.name;
        }

        if (sortConfig.key === 'createdAt') {
            aVal = a.createdAt?.seconds || 0;
            bVal = b.createdAt?.seconds || 0;
        }
        
        // Handle string (case insensitive)
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    };

    const sortedFiles = sortData(displayFiles, 'file');
    const sortedFolders = sortData(displayFolders, 'folder');
    const breadcrumbs = getBreadcrumbs();

    const showFoldersSection = sortedFolders.length > 0;
    
    // Check if view is empty
    const isViewEmpty = !showFoldersSection && sortedFiles.length === 0;

    const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return null;
      return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />;
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
           {/* Left: Breadcrumbs */}
           <div className="flex items-center gap-1 text-sm text-slate-500 min-w-fit overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {currentFolder && (
                  <button 
                    onClick={() => {
                        if (currentFolder.parentId) {
                            const parent = folders.find(f => f.id === currentFolder.parentId);
                            setCurrentFolder(parent || null);
                        } else {
                            setCurrentFolder(null);
                        }
                    }}
                    className="mr-2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Go Up"
                  >
                    <ArrowLeft size={16} />
                  </button>
              )}
              
              <button 
                onClick={() => { setCurrentFolder(null); setSearchQuery(''); }}
                className={`flex items-center hover:text-emerald-600 transition-colors ${!currentFolder && !isSearching ? 'font-bold text-slate-800' : ''}`}
              >
                {!currentFolder && !isSearching && <Home size={16} className="mr-1.5" />}
                My Files
              </button>
              
              {!isSearching && breadcrumbs.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0 mx-0.5" />
                  <button
                    onClick={() => { setCurrentFolder(folder); setSearchQuery(''); }}
                     className={`hover:text-emerald-600 transition-colors whitespace-nowrap ${index === breadcrumbs.length - 1 ? 'font-bold text-slate-800' : ''}`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}

              {isSearching && (
                <>
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0 mx-0.5" />
                  <span className="font-bold text-slate-800 whitespace-nowrap">Search Results</span>
                </>
              )}
           </div>
           
           {/* Middle: Search Bar */}
           <div className="relative flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
           </div>
           
           {/* Right: Actions */}
           <div className="flex gap-3 min-w-fit">
              {!isSearching && (
                <button 
                    onClick={() => openModal('folder')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 flex items-center gap-2"
                >
                    <FolderPlus size={16} />
                    <span className="hidden sm:inline">New Folder</span>
                </button>
              )}
              
              {/* Limit Check */}
              {files.length >= 5 ? (
                 <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-xs md:text-sm font-semibold text-slate-500">Free limit reached.</span>
                    <button 
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-200"
                    >
                        Upgrade
                    </button>
                 </div>
              ) : (
                <button 
                    onClick={() => {
                        // Keep current folder context even if searching to allow upload
                        openModal('file');
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                    <Upload size={16} />
                    <span className="hidden sm:inline">Add File</span>
                    <span className="sm:hidden">Add</span>
                </button>
              )}
           </div>
        </div>

        {/* Content (Drag & Drop Zone) */}
        <div 
          className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden min-h-[400px] relative ${
            isDragging ? 'border-emerald-500 bg-emerald-50/20 shadow-xl' : 'border-slate-200 shadow-sm'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
           {/* Drag & Drop Overlay */}
           {isDragging && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm pointer-events-none">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <Upload className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Drop to Upload</h3>
                  <p className="text-slate-600 font-medium">Release your files here instantly.</p>
              </div>
           )}

           {/* Header Row */}
           <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
              <div 
                className="col-span-5 flex items-center cursor-pointer hover:text-emerald-600 transition-colors" 
                onClick={() => handleSort('name')}
              >
                Name <SortIcon column="name" />
              </div>
              <div 
                className="col-span-3 flex items-center cursor-pointer hover:text-emerald-600 transition-colors" 
                onClick={() => handleSort('createdAt')}
              >
                Date Modified <SortIcon column="createdAt" />
              </div>
              <div 
                className="col-span-2 flex items-center cursor-pointer hover:text-emerald-600 transition-colors" 
                onClick={() => handleSort('size')}
              >
                Size <SortIcon column="size" />
              </div>
              <div className="col-span-2 text-right">Action</div>
           </div>

           {/* Empty State */}
           {isViewEmpty && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    {isSearching 
                        ? <Search className="w-8 h-8 text-slate-300" />
                        : <FolderPlus className="w-8 h-8 text-slate-300" />
                    }
                 </div>
                 <h3 className="text-slate-900 font-medium">
                    {isSearching 
                        ? 'No results found' 
                        : (currentFolder ? 'This folder is empty' : 'No files yet')
                    }
                 </h3>
                 <p className="text-slate-500 text-sm mt-1">
                    {isSearching 
                        ? `No files matching "${searchQuery}"` 
                        : (currentFolder ? 'Upload a file or drag and drop here.' : 'Create a folder or drag and drop a file to get started.')
                    }
                 </p>
                 {!isSearching && (
                    <div className="flex gap-3 mt-4">
                        <button 
                            onClick={() => openModal('folder')}
                            className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
                        >
                            New Folder
                        </button>
                        <button 
                            onClick={() => openModal('file')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500"
                        >
                            Upload File
                        </button>
                    </div>
                 )}
              </div>
           )}

           {/* Folders List */}
           {showFoldersSection && sortedFolders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => {
                    setCurrentFolder(folder);
                    setSearchQuery(''); // Clear search when entering a folder
                }}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group items-center"
              >
                 <div className="col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                       <Folder size={16} fill="currentColor" className="opacity-20" />
                    </div>
                    {editingId === folder.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyDown(e, 'folders')}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => saveRename('folders')}
                        autoFocus
                        className="bg-white border border-emerald-500 rounded px-2 py-0.5 text-sm text-slate-900 focus:outline-none w-full shadow-sm"
                      />
                    ) : (
                      <span 
                        onClick={(e) => startRenaming(e, folder)}
                        className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors hover:underline cursor-text truncate pr-4"
                        title="Click to rename"
                      >
                        {folder.name}
                      </span>
                    )}
                 </div>
                 <div className="col-span-3 text-xs text-slate-400">{formatDate(folder.createdAt)}</div>
                 <div className="col-span-2 text-xs text-slate-400">-</div>
                 <div className="col-span-2 flex justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openDeleteModal('folders', folder); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                       <Trash2 size={14} />
                    </button>
                 </div>
              </div>
           ))}

           {/* Files List */}
           {sortedFiles.map(file => {
             const isPreviewable = file.type === 'image' || file.type === 'pdf';
             return (
              <div 
                key={file.id} 
                onClick={() => handleFileClick(file)}
                className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group items-center ${isPreviewable ? 'cursor-pointer' : ''}`}
              >
                 <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      file.type === 'image' ? 'bg-purple-50 text-purple-600' :
                      file.type === 'pdf' ? 'bg-red-50 text-red-600' : 
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                       {file.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                    </div>
                    {editingId === file.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyDown(e, 'files')}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => saveRename('files')}
                        autoFocus
                        className="bg-white border border-emerald-500 rounded px-2 py-0.5 text-sm text-slate-900 focus:outline-none w-full shadow-sm"
                      />
                    ) : (
                      <span 
                        onClick={(e) => startRenaming(e, file)}
                        className="text-sm font-medium text-slate-700 truncate pr-4 hover:underline cursor-text" 
                        title="Click to rename"
                      >
                        {file.name}
                      </span>
                    )}
                 </div>
                 <div className="col-span-3 text-xs text-slate-500">{formatDate(file.createdAt)}</div>
                 <div className="col-span-2 text-xs text-slate-500">{formatFileSize(file.size)}</div>
                 <div className="col-span-2 flex justify-end gap-1">
                    <button 
                       onClick={(e) => { e.stopPropagation(); setVersioningFile(file); }}
                       className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                       title="Version History"
                    >
                       <History size={14} />
                    </button>
                    {isPreviewable && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                           className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                           title="Preview"
                        >
                           <Eye size={14} />
                        </button>
                    )}
                    <button 
                       onClick={(e) => { e.stopPropagation(); handleDownload(file.downloadURL); }}
                       className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                       title="Download"
                    >
                       <DownloadCloud size={14} />
                    </button>
                    <button 
                       onClick={(e) => { e.stopPropagation(); openDeleteModal('files', file); }}
                       className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                       title="Delete"
                    >
                       <Trash2 size={14} />
                    </button>
                 </div>
              </div>
             );
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pt-28 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
         <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-500">Manage your files and team members.</p>
         </div>
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                    {getInitials(user?.displayName)}
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.displayName || 'User'}</span>
             </div>
             
             {/* Settings Dropdown Trigger */}
             <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <ChevronDown size={20} />
                </button>
                
                {isDropdownOpen && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                      <button 
                        onClick={() => { setIsDropdownOpen(false); setIsSettingsOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium transition-colors"
                      >
                         Settings
                      </button>
                      <button 
                        onClick={() => { setIsDropdownOpen(false); setIsUpgradeModalOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium transition-colors"
                      >
                         Upgrade Plan
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center gap-2"
                      >
                         <LogOut size={14} />
                         Sign Out
                      </button>
                   </div>
                )}
             </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
         <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
         >
            Overview
         </button>
         <button 
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'files' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
         >
            My Files
         </button>
         <button 
            onClick={() => setActiveTab('notes')} // Assuming this tab exists based on types
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'notes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
         >
            Notes
         </button>
         <button 
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
         >
            Team
         </button>
         <button 
            onClick={() => setActiveTab('ai-studio')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ai-studio' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'} flex items-center gap-1.5`}
         >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            AI Studio
         </button>
      </div>

      {/* Main Content Area */}
      {loadingData ? (
         <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
         </div>
      ) : (
         <>
           {activeTab === 'overview' && renderOverview()}
           {activeTab === 'files' && renderFiles()}
            {activeTab === 'ai-studio' && renderAIStudio()}
           {activeTab === 'notes' && (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
                 <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                 <h3 className="text-slate-900 font-medium">Notes</h3>
                 <p className="text-slate-500 text-sm">Notes feature is coming soon.</p>
                 <button onClick={() => openModal('note')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">New Note</button>
              </div>
           )}
           {activeTab === 'team' && (
               <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
                 <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                 <h3 className="text-slate-900 font-medium">Team Management</h3>
                 <p className="text-slate-500 text-sm">Team feature is coming soon.</p>
                  <button onClick={() => openModal('member')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Add Member</button>
              </div>
           )}
         </>
      )}

      {/* Modals */}
      {/* Create Modal */}
      {modalOpen.type && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
             <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-900 capitalize">
                      {modalOpen.type === 'member' ? 'Add Team Member' : `Create New ${modalOpen.type}`}
                   </h3>
                   <button onClick={closeModal} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                      <X size={18} />
                   </button>
                </div>
                <div className="p-6 space-y-4">
                   {errorMsg && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg">{errorMsg}</div>
                   )}
                   
                   {modalOpen.type === 'file' ? (
                      <div className="space-y-4">
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-colors"
                         >
                            <input 
                               type="file" 
                               className="hidden" 
                               ref={fileInputRef}
                               onChange={handleFileSelect}
                            />
                            {selectedFile ? (
                               <div>
                                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                     <FileIcon size={24} />
                                  </div>
                                  <p className="font-medium text-slate-900 text-sm truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                                  <p className="text-xs text-slate-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                               </div>
                            ) : (
                               <div>
                                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                     <Upload size={24} />
                                  </div>
                                  <p className="font-medium text-slate-900 text-sm">Click to upload</p>
                                  <p className="text-xs text-slate-500 mt-1">or drag and drop here</p>
                               </div>
                            )}
                         </div>

                         {selectedFile && (
                            <div className="space-y-1">
                               <label className="text-xs font-semibold text-slate-700 ml-1">File Name</label>
                               <input 
                                 type="text" 
                                 value={newItemName}
                                 onChange={(e) => setNewItemName(e.target.value)}
                                 className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                               />
                            </div>
                         )}

                         {uploadProgress > 0 && (
                            <div className="space-y-1">
                               <div className="flex justify-between text-xs text-slate-500">
                                  <span>Uploading...</span>
                                  <span>{Math.round(uploadProgress)}%</span>
                               </div>
                               <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                               </div>
                            </div>
                         )}
                      </div>
                   ) : (
                      <>
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700 ml-1">
                              {modalOpen.type === 'member' ? 'Name' : 'Name'}
                           </label>
                           <input 
                             type="text" 
                             value={newItemName}
                             onChange={(e) => setNewItemName(e.target.value)}
                             placeholder={modalOpen.type === 'folder' ? 'New Folder' : ''}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                             autoFocus
                           />
                        </div>
                        {modalOpen.type === 'note' && (
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 ml-1">Content</label>
                              <textarea 
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none h-32 resize-none"
                                placeholder="Write your note here..."
                              />
                           </div>
                        )}
                        {modalOpen.type === 'member' && (
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 ml-1">Role</label>
                              <select
                                value={newItemRole}
                                onChange={(e) => setNewItemRole(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none bg-white"
                              >
                                 <option value="Viewer">Viewer</option>
                                 <option value="Editor">Editor</option>
                                 <option value="Admin">Admin</option>
                              </select>
                           </div>
                        )}
                      </>
                   )}

                   <div className="pt-2 flex gap-3">
                      <button 
                        onClick={closeModal}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={handleCreate}
                        disabled={isSubmitting || (modalOpen.type === 'file' && !selectedFile)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                         {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : (modalOpen.type === 'file' ? 'Upload' : 'Create')}
                      </button>
                   </div>
                </div>
             </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDeleteModal} />
             <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-6 text-center">
                   <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                      <Trash2 size={24} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Delete {deleteModal.collectionName === 'folders' ? 'Folder' : 'Item'}?</h3>
                   <p className="text-sm text-slate-500 mb-6">
                      Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteModal.itemName}"</span>? 
                      {deleteModal.collectionName === 'folders' && <br/>}
                      {deleteModal.collectionName === 'folders' && "This will remove all items inside it."}
                      <br/>This action cannot be undone.
                   </p>
                   
                   {deleteError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg text-left flex items-center gap-2">
                         <AlertTriangle size={14} />
                         {deleteError}
                      </div>
                   )}

                   <div className="flex gap-3">
                      <button 
                        onClick={closeDeleteModal}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 flex items-center justify-center gap-2"
                      >
                         {isDeleting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Delete'}
                      </button>
                   </div>
                </div>
             </div>
         </div>
      )}

      {/* Other Modals */}
      <FileVersionModal 
        file={versioningFile} 
        userId={user?.uid || ''} 
        onClose={() => setVersioningFile(null)} 
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};

export default Dashboard;
