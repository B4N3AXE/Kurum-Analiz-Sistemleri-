import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { 
  BookOpen, UploadCloud, Trash2, Play, Eye, Save, RotateCcw, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Check, Square, 
  Type, Edit3, Trash, Highlighter, Download, ArrowLeft, Loader2, Sparkles,
  Search, Info, CheckCircle, GraduationCap, RefreshCw, UserCheck
} from 'lucide-react';

interface KitapligimProps {
  user: User;
  token: string;
}

interface UserPDF {
  id: number;
  userId: number;
  title: string;
  fileUrl: string;
  createdAt: string;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  type: 'pen' | 'highlight';
  points: Point[];
  color: string;
  width: number;
}

interface TextAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

type Annotation = Stroke | TextAnnotation;

interface SavedAnnotationState {
  page: number;
  items: Annotation[];
}

export default function Kitapligim({ user, token }: KitapligimProps) {
  // State: List View vs Editor View
  const [activePdf, setActivePdf] = useState<UserPDF | null>(null);
  const [pdfs, setPdfs] = useState<UserPDF[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Student selection for Teachers/Admins
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | 'me'>('me');
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Upload State
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Custom modals/notifications to avoid blocked window.confirm / alert inside iframes
  const [deletingPdfId, setDeletingPdfId] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [activeSuccess, setActiveSuccess] = useState<string | null>(null);

  const showError = (msg: string) => {
    setActiveError(msg);
    setTimeout(() => {
      setActiveError(prev => prev === msg ? null : prev);
    }, 5000);
  };

  const showSuccess = (msg: string) => {
    setActiveSuccess(msg);
    setTimeout(() => {
      setActiveSuccess(prev => prev === msg ? null : prev);
    }, 4000);
  };

  // PDF.js rendering states
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(window.innerWidth < 768 ? 0.6 : 1.25);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Drawing canvas states
  const [tool, setTool] = useState<'pen' | 'highlight' | 'text' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState('#ef4444'); // Red
  const [highlightColor, setHighlightColor] = useState('rgba(234, 179, 8, 0.45)'); // Semi-transparent yellow
  const [penWidth, setPenWidth] = useState(3);
  const [highlightWidth, setHighlightWidth] = useState(15);
  
  // Undo/Redo/Saved Annotation lists
  const [annotations, setAnnotations] = useState<SavedAnnotationState[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Text overlay input state
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  // Refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tracking drawing mouse/touch state
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);

  const isTeacherOrAdmin = user.rol === 'admin' || user.rol === 'ogretmen' || user.rol === 'rehber';

  // 1. Fetch Students (if Teacher/Admin)
  useEffect(() => {
    if (isTeacherOrAdmin) {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const res = await fetch('/api/ogrenci', {
            headers: { 'Authorization': token }
          });
          if (res.ok) {
            const data = await res.json();
            setStudents(data);
            // Default to first student to provide an instant preview for teachers
            if (data.length > 0) {
              setSelectedStudentId(data[0].id);
            }
          }
        } catch (err) {
          console.error("Error loading students list:", err);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    } else {
      setSelectedStudentId('me');
    }
  }, [user.rol, token]);

  // 2. Fetch PDF List based on selected student or 'me'
  const fetchPdfs = async () => {
    setLoadingList(true);
    try {
      let url = '/api/pdf';
      if (selectedStudentId !== 'me') {
        url += `?studentId=${selectedStudentId}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        setPdfs(data);
      }
    } catch (err) {
      console.error("PDF list loading error:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    // Only fetch once selectedStudentId state resolves
    if (selectedStudentId !== undefined) {
      fetchPdfs();
    }
  }, [token, selectedStudentId]);

  // Handle drag over/leave/drop for files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadError('Lütfen geçerli bir PDF dosyası seçin.');
      return;
    }
    
    // Check local limit (100MB)
    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('Dosya boyutu çok büyük. Maksimum limit 100MB\'tır.');
      return;
    }

    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      let url = '/api/pdf/upload';
      if (selectedStudentId !== 'me') {
        url += `?studentId=${selectedStudentId}`;
      }
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData
      });

      if (res.ok) {
        await fetchPdfs();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const errData = await res.json();
        setUploadError(errData.error || 'Dosya yükleme başarısız.');
      }
    } catch (err) {
      setUploadError('Sunucu bağlantı hatası oluştu.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePdf = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPdfId(id);
  };

  const executeDeletePdf = async (id: number) => {
    try {
      let url = `/api/pdf/${id}`;
      if (selectedStudentId !== 'me') {
        url += `?studentId=${selectedStudentId}`;
      }

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setPdfs(prev => prev.filter(p => p.id !== id));
        if (activePdf && activePdf.id === id) {
          setActivePdf(null);
        }
        showSuccess('Döküman başarıyla silindi.');
      } else {
        const errData = await res.json();
        showError(errData.error || 'Silme işlemi başarısız.');
      }
    } catch (err) {
      console.error("PDF deletion error:", err);
      showError('Döküman silinirken sunucu bağlantı hatası oluştu.');
    }
  };

  // 3. Open PDF in Editor
  const handleStartStudy = async (pdf: UserPDF) => {
    setActivePdf(pdf);
    setPageNum(1);
    setLoadingPdf(true);
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);
    setTextInput(null);

    // Fetch existing annotations for this PDF
    try {
      const res = await fetch(`/api/pdf/${pdf.id}/annotations`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = data.map((a: any) => ({
          page: a.pageNumber,
          items: typeof a.annotationData === 'string' ? JSON.parse(a.annotationData) : a.annotationData
        }));
        setAnnotations(parsed);
      }
    } catch (err) {
      console.error("Error loading annotations:", err);
    }

    // Load PDF Document
    try {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        throw new Error('PDF.js kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.');
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const fileUrlWithToken = `${pdf.fileUrl}?token=${token}`;
      const loadingTask = pdfjsLib.getDocument(fileUrlWithToken);
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
    } catch (err: any) {
      showError(err.message || 'PDF dökümanı yüklenirken bir hata oluştu.');
      setActivePdf(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Render current PDF page & Overlay Drawings
  useEffect(() => {
    if (!pdfDoc || !activePdf) return;

    let isRenderCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        if (isRenderCancelled) return;

        // Perfect alignment check: Adjust drawing canvas to EXACT dimension of PDF page
        const dCanvas = drawingCanvasRef.current;
        if (dCanvas) {
          dCanvas.width = viewport.width;
          dCanvas.height = viewport.height;
          drawCurrentPageAnnotations();
        }
      } catch (err) {
        console.error("PDF rendering error:", err);
      }
    };

    renderPage();

    return () => {
      isRenderCancelled = true;
    };
  }, [pdfDoc, pageNum, scale]);

  // Redraw annotations whenever list changes
  useEffect(() => {
    if (pdfDoc && activePdf) {
      drawCurrentPageAnnotations();
    }
  }, [annotations, pageNum]);

  const getCurrentPageAnnotations = (): Annotation[] => {
    const pageState = annotations.find(a => a.page === pageNum);
    return pageState ? pageState.items : [];
  };

  const drawCurrentPageAnnotations = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const items = getCurrentPageAnnotations();
    for (const item of items) {
      if (item.type === 'pen' || item.type === 'highlight') {
        if (!item.points || item.points.length === 0) continue;
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.width;

        const firstX = item.points[0].x * canvas.width;
        const firstY = item.points[0].y * canvas.height;
        ctx.moveTo(firstX, firstY);

        for (let i = 1; i < item.points.length; i++) {
          const pX = item.points[i].x * canvas.width;
          const pY = item.points[i].y * canvas.height;
          ctx.lineTo(pX, pY);
        }
        ctx.stroke();
      } else if (item.type === 'text') {
        ctx.font = `bold ${item.fontSize}px sans-serif`;
        ctx.fillStyle = item.color;
        ctx.textBaseline = 'top';
        ctx.fillText(item.text, item.x * canvas.width, item.y * canvas.height);
      }
    }
  };

  // Drawing Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const rect = drawingCanvasRef.current!.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;
      setTextInput({ x: clickX, y: clickY });
      setTextValue('');
      return;
    }

    if (tool === 'eraser') {
      // Find and remove clicked annotation
      const rect = drawingCanvasRef.current!.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;
      
      const currentItems = getCurrentPageAnnotations();
      let foundIndex = -1;

      // Check distance for erasure
      for (let i = currentItems.length - 1; i >= 0; i--) {
        const item = currentItems[i];
        if (item.type === 'text') {
          const dist = Math.sqrt(Math.pow(item.x - clickX, 2) + Math.pow(item.y - clickY, 2));
          if (dist < 0.05) {
            foundIndex = i;
            break;
          }
        } else {
          // Check points
          const clickedOnStroke = item.points.some(p => {
            const dist = Math.sqrt(Math.pow(p.x - clickX, 2) + Math.pow(p.y - clickY, 2));
            return dist < 0.025; // Close to stroke path
          });
          if (clickedOnStroke) {
            foundIndex = i;
            break;
          }
        }
      }

      if (foundIndex !== -1) {
        // Save history for undo
        saveHistoryState();
        const updatedItems = [...currentItems];
        updatedItems.splice(foundIndex, 1);
        updatePageAnnotations(updatedItems);
      }
      return;
    }

    isDrawingRef.current = true;
    const rect = drawingCanvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    currentPointsRef.current = [{ x, y }];

    // Direct feedback on canvas
    const ctx = drawingCanvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'pen' ? penColor : highlightColor;
      ctx.lineWidth = tool === 'pen' ? penWidth : highlightWidth;
      ctx.moveTo(x * drawingCanvasRef.current!.width, y * drawingCanvasRef.current!.height);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || tool === 'text' || tool === 'eraser') return;

    const canvas = drawingCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    currentPointsRef.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x * canvas.width, y * canvas.height);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      saveHistoryState();
      
      const newStroke: Stroke = {
        type: tool === 'pen' ? 'pen' : 'highlight',
        points: [...currentPointsRef.current],
        color: tool === 'pen' ? penColor : highlightColor,
        width: tool === 'pen' ? penWidth : highlightWidth
      };

      const currentItems = getCurrentPageAnnotations();
      updatePageAnnotations([...currentItems, newStroke]);
    }
    currentPointsRef.current = [];
  };

  const handleAddText = () => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null);
      return;
    }

    saveHistoryState();

    const newText: TextAnnotation = {
      type: 'text',
      x: textInput.x,
      y: textInput.y,
      text: textValue.trim(),
      color: penColor,
      fontSize: penWidth * 3 + 12
    };

    const currentItems = getCurrentPageAnnotations();
    updatePageAnnotations([...currentItems, newText]);
    setTextInput(null);
    setTextValue('');
  };

  // Helper to update annotations state for current page
  const updatePageAnnotations = (items: Annotation[]) => {
    const updated = [...annotations];
    const index = updated.findIndex(a => a.page === pageNum);
    if (index !== -1) {
      updated[index] = { page: pageNum, items };
    } else {
      updated.push({ page: pageNum, items });
    }
    setAnnotations(updated);
  };

  // History Undo/Redo Engine
  const saveHistoryState = () => {
    const currentItems = getCurrentPageAnnotations();
    setUndoStack([...undoStack, currentItems]);
    setRedoStack([]); // Clear redo
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const current = getCurrentPageAnnotations();
    
    setRedoStack([...redoStack, current]);
    setUndoStack(undoStack.slice(0, -1));
    updatePageAnnotations(previous);
  };

  const handleClearPage = () => {
    setShowClearConfirm(true);
  };

  const executeClearPage = () => {
    saveHistoryState();
    updatePageAnnotations([]);
    setShowClearConfirm(false);
  };

  // Save annotations to database
  const handleSaveAnnotations = async () => {
    if (!activePdf) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const pageItems = getCurrentPageAnnotations();
      const res = await fetch(`/api/pdf/${activePdf.id}/annotations`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pageNumber: pageNum,
          annotationData: pageItems
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        showError('Kaydetme işlemi başarısız.');
      }
    } catch (err) {
      console.error("Annotation save error:", err);
      showError('Bağlantı hatası sebebiyle kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  // Filtering list by search query
  const filteredPdfs = pdfs.filter(pdf => 
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtering student selection dropdown
  const filteredStudents = students.filter(student => 
    student.ad_soyad.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (student.sinif_ad && student.sinif_ad.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const selectedStudentObj = students.find(s => s.id === selectedStudentId);

  return (
    <div id="kitapligim-container" className="h-full w-full max-w-7xl mx-auto px-2 sm:px-4 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BookOpen size={160} />
        </div>
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <BookOpen size={18} />
            </span>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">KAS.ai ÇALIŞMA VE ANALİZ KÜTÜPHANESİ</h1>
          </div>
          <p className="text-xs text-slate-400 font-semibold max-w-2xl leading-relaxed">
            Kendi PDF ders kitaplarınızı, deneme sınavı fasiküllerinizi veya çalışma yapraklarınızı sisteme yükleyin. 
            Vurgulama araçlarıyla dökümanların üzerine notlar alın ve kaydedin.
          </p>
        </div>

        {activePdf && (
          <button
            onClick={() => setActivePdf(null)}
            className="flex items-center gap-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition z-10"
          >
            <ArrowLeft size={14} /> Kitaplığa Geri Dön
          </button>
        )}
      </div>

      {/* RENDER VIEW: 1. LIST & UPLOAD VIEW (NOT STUDYING) */}
      {!activePdf ? (
        <div className="space-y-6">
          
          {/* STATS TILES SECTION (Adds Premium feel to reduce simplicity) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3.5 shadow">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">Kayıtlı Kitap / PDF</span>
                <span className="text-base font-black text-slate-100">{pdfs.length} Döküman</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3.5 shadow">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                <UploadCloud size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">Maksimum Yükleme</span>
                <span className="text-base font-black text-slate-100">100 Megabayt (MB)</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3.5 shadow">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">Çalışılan Profil</span>
                <span className="text-xs font-extrabold text-slate-200 truncate max-w-[160px] block">
                  {selectedStudentId === 'me' ? user.ad_soyad : (selectedStudentObj?.ad_soyad || 'Öğrenci Kütüphanesi')}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3.5 shadow">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">Akıllı Tavsiye</span>
                <span className="text-[11px] font-bold text-slate-300 block">Renkli analiz notları al!</span>
              </div>
            </div>

          </div>

          {/* DYNAMIC TWO-COLUMN WORKSPACE CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SOL TARAF: KİTAP LİSTESİ & SEÇİMLER (col-span-2) */}
            <div className="lg:col-span-2 space-y-4">
              
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                
                {/* Search Bar and Student Selection Header */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-2 border-b border-slate-850">
                  
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest block">KAYITLI DÖKÜMANLARIM</span>
                    {isTeacherOrAdmin && selectedStudentObj && (
                      <span className="text-[10px] text-blue-400 font-extrabold">
                        {selectedStudentObj.ad_soyad} ({selectedStudentObj.sinif_ad || 'Sınıf Yok'}) dökümanları listeleniyor.
                      </span>
                    )}
                  </div>

                  {/* Active Search Field */}
                  <div className="relative w-full sm:w-60">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Döküman adı ile ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                </div>

                {/* TEACHER/ADMIN STUDENT SELECTOR PANEL (If appropriate role) */}
                {isTeacherOrAdmin && (
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="text-blue-400" size={16} />
                      <span className="text-xs font-black text-slate-200">Kütüphanesine Erişilecek Öğrenci Seçimi</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                          <Search size={13} />
                        </span>
                        <input
                          type="text"
                          placeholder="Öğrenci veya sınıf ara..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>

                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value === 'me' ? 'me' : Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 shrink-0 cursor-pointer min-w-[200px]"
                      >
                        {user.rol === 'admin' && (
                          <option value="me">Benim Kişisel Kitaplığım</option>
                        )}
                        {filteredStudents.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.ad_soyad} - {s.sinif_ad || 'Sınıfı Yok'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium">
                      Öğretmenler, danışmanı oldukları veya kurumlarındaki öğrencilerin kitaplıklarını açabilir, yeni ders notu atayabilir veya çizimlerini inceleyebilir.
                    </p>
                  </div>
                )}

                {/* PDF Lists Grid */}
                {loadingList ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span className="text-xs font-bold text-slate-400">PDF listesi güncelleniyor...</span>
                  </div>
                ) : filteredPdfs.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500 border border-slate-800 border-dashed rounded-xl bg-slate-950/10 space-y-2">
                    <p className="font-semibold text-slate-400">Aranan döküman kütüphanede bulunamadı.</p>
                    <p className="text-[11px] text-slate-500">Sol kısımdaki seçimi kontrol edebilir veya sağ taraftan yeni bir PDF ders notu ekleyebilirsiniz!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPdfs.map(pdf => (
                      <div 
                        key={pdf.id} 
                        className="bg-slate-950/40 border border-slate-850 hover:border-slate-700 rounded-xl p-4 flex justify-between items-center gap-4 transition group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg shrink-0">
                            <BookOpen size={18} />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-xs font-extrabold text-slate-200 block truncate" title={pdf.title}>
                              {pdf.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              Yükleme: {new Date(pdf.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleStartStudy(pdf)}
                            className="p-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-[11px] font-black"
                            title="Çalışmaya Başla"
                          >
                            <Play size={13} />
                            <span>Çalış</span>
                          </button>
                          <button
                            onClick={(e) => handleDeletePdf(pdf.id, e)}
                            className="p-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-500/20 hover:border-transparent transition cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* SAĞ TARAF: KİTAP YÜKLEME & KILAVUZ (col-span-1) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* PDF Upload Panel */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <span className="text-xs text-slate-200 font-extrabold uppercase tracking-widest block">YENİ KİTAP / PDF YÜKLE</span>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    dragActive 
                      ? "border-blue-500 bg-blue-500/5" 
                      : "border-slate-800 bg-slate-950/20 hover:border-slate-700 hover:bg-slate-950/40"
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden" 
                  />
                  
                  {uploading ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <Loader2 className="animate-spin text-blue-400" size={32} />
                      <span className="text-xs text-slate-400 font-bold">PDF şifrelenip yükleniyor...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full">
                        <UploadCloud size={24} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-200 block">Döküman Seçin</span>
                        <span className="text-[10px] text-slate-500 font-semibold block">Sürükle bırak veya Tıkla</span>
                        <span className="text-[9px] text-blue-400 font-extrabold block">Maksimum dosya boyutu: 100MB</span>
                      </div>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold leading-relaxed">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Study Guideline Widget */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-slate-850">
                  <Sparkles size={16} />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">KAS.ai AKILLI METODLAR</span>
                </div>

                <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed font-semibold">
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-blue-600/10 text-blue-400 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                    <p>
                      <strong className="text-slate-200">Farklı Renklerle Sınıflandır:</strong> Vurgulama kaleminde sarıyı önemli yerler, pembeyi ise kesinlikle ezberlenmesi gereken formüller için kullan.
                    </p>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-blue-600/10 text-blue-400 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                    <p>
                      <strong className="text-slate-200">Metin Kutusu Notları Ekle:</strong> Metin aracı yardımıyla zorlandığın soruların yanına kendi analiz cümlelerini ekle.
                    </p>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-blue-600/10 text-blue-400 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                    <p>
                      <strong className="text-slate-200">Her Sayfada Kaydet:</strong> İşlediğin her sayfada <span className="text-blue-400 font-bold">Notu Kaydet</span> butonuna basarak notlarını kalıcı hale getir.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* RENDER VIEW: 2. PDF WORKSPACE EDITOR */
        <div className="space-y-4">
          
          {/* EDITOR WORKSPACE CONTROLS & TOOLBAR */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 shadow-xl">
            
            {/* Tool Selections */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850 overflow-x-auto">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  tool === 'pen' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Kalem Çizimi"
              >
                <Edit3 size={14} />
                <span className="hidden sm:inline">Kalem</span>
              </button>

              <button
                onClick={() => setTool('highlight')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  tool === 'highlight' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Fosforlu Kalem Vurgu"
              >
                <Highlighter size={14} />
                <span className="hidden sm:inline">Fosforlu</span>
              </button>

              <button
                onClick={() => setTool('text')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  tool === 'text' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Metin Ekle"
              >
                <Type size={14} />
                <span className="hidden sm:inline">Metin</span>
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  tool === 'eraser' ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Çizim/Not Silici"
              >
                <Trash size={14} />
                <span className="hidden sm:inline">Silgi</span>
              </button>
            </div>

            {/* Customizer Sub-tools (Colors, Widths) based on selected tools */}
            <div className="flex items-center gap-4">
              
              {/* Color Presets */}
              {(tool === 'pen' || tool === 'text') && (
                <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Renk:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { hex: '#ef4444', label: 'Kırmızı' },
                      { hex: '#3b82f6', label: 'Mavi' },
                      { hex: '#10b981', label: 'Yeşil' },
                      { hex: '#000000', label: 'Siyah' },
                      { hex: '#ffffff', label: 'Beyaz' }
                    ].map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setPenColor(c.hex)}
                        className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                          penColor === c.hex ? "border-white scale-125" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              {tool === 'highlight' && (
                <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Vurgu:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { value: 'rgba(234, 179, 8, 0.45)', colorHex: '#eab308', label: 'Sarı' },
                      { value: 'rgba(34, 197, 94, 0.45)', colorHex: '#22c55e', label: 'Yeşil' },
                      { value: 'rgba(59, 130, 246, 0.45)', colorHex: '#3b82f6', label: 'Mavi' },
                      { value: 'rgba(236, 72, 153, 0.45)', colorHex: '#ec4899', label: 'Pembe' }
                    ].map(c => (
                      <button
                        key={c.value}
                        onClick={() => setHighlightColor(c.value)}
                        className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                          highlightColor === c.value ? "border-white scale-125" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.colorHex }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stroke Width Adjuster */}
              {tool === 'pen' && (
                <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Boyut ({penWidth}px):</span>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {tool === 'highlight' && (
                <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Boyut ({highlightWidth}px):</span>
                  <input
                    type="range"
                    min="8"
                    max="35"
                    value={highlightWidth}
                    onChange={(e) => setHighlightWidth(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

            </div>

            {/* Pagination & Zoom */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setPageNum(Math.max(1, pageNum - 1))}
                  disabled={pageNum <= 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-200 px-1 shrink-0">
                  Sayfa {pageNum} / {numPages}
                </span>
                <button
                  onClick={() => setPageNum(Math.min(numPages, pageNum + 1))}
                  disabled={pageNum >= numPages}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setScale(Math.max(0.6, scale - 0.15))}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Yakınlaştır"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[10px] font-black text-slate-400 w-10 text-center shrink-0">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale(Math.min(3.0, scale + 0.15))}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Uzaklaştır"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* History Action & [KAYDET] Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:text-white disabled:opacity-20 text-slate-400 rounded-xl transition cursor-pointer"
                title="Geri Al"
              >
                <RotateCcw size={14} className="scale-x-[-1]" />
              </button>

              <button
                onClick={handleClearPage}
                className="p-2 bg-slate-950 hover:bg-red-950/40 border border-slate-850 text-slate-400 hover:text-red-400 rounded-xl transition cursor-pointer"
                title="Sayfayı Temizle"
              >
                <Trash2 size={14} />
              </button>

              <button
                onClick={handleSaveAnnotations}
                disabled={saving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer transition shadow ${
                  saveSuccess 
                    ? "bg-emerald-600 text-white" 
                    : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/15"
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={13} />
                    <span>Kaydediliyor...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={13} />
                    <span>Kaydedildi!</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Notu Kaydet</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* ACTIVE PDF TITLE DISPLAY */}
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-850 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest">ÇALIŞILAN DÖKÜMAN:</span>
              <span className="text-xs font-bold text-slate-200">{activePdf.title}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">Kaydedilen notlar her sayfaya özel olarak saklanır</span>
          </div>

          {/* LOADING PDF LOADER */}
          {loadingPdf && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 bg-slate-900/10 border border-slate-850 rounded-2xl">
              <Loader2 className="animate-spin text-blue-500" size={36} />
              <span className="text-xs text-slate-400 font-bold">PDF Dökümanı Render Ediliyor...</span>
            </div>
          )}

          {/* MAIN PDF VIEW CANVAS CONTAINER */}
          {!loadingPdf && (
            <div className="flex justify-center overflow-auto p-4 border border-slate-850 bg-slate-950/20 rounded-2xl max-h-[85vh]">
              <div 
                ref={containerRef}
                className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800"
                style={{ width: pdfCanvasRef.current?.width || 'auto', height: pdfCanvasRef.current?.height || 'auto' }}
              >
                {/* PDF Page Canvas */}
                <canvas 
                  ref={pdfCanvasRef} 
                  className="absolute top-0 left-0 bg-white" 
                />

                {/* Annotation drawing overlay canvas */}
                <canvas 
                  ref={drawingCanvasRef} 
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={`absolute top-0 left-0 z-10 ${
                    tool === 'eraser' ? 'cursor-pointer' : tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
                  }`}
                />

                {/* Text Tool absolute placement Input Overlay */}
                {textInput && (
                  <div 
                    className="absolute z-20 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex items-center gap-1.5"
                    style={{ 
                      left: `${textInput.x * (drawingCanvasRef.current?.width || 0)}px`, 
                      top: `${textInput.y * (drawingCanvasRef.current?.height || 0)}px` 
                    }}
                  >
                    <input
                      type="text"
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddText();
                        if (e.key === 'Escape') setTextInput(null);
                      }}
                      placeholder="Notunuzu yazın..."
                      className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
                      autoFocus
                    />
                    <button
                      onClick={handleAddText}
                      className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setTextInput(null)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition cursor-pointer"
                    >
                      <Square size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* CUSTOM CONFIRM & TOAST MODALS FOR IFRAME COMPATIBILITY */}
      
      {/* 1. PDF Deletion Confirmation Dialog */}
      {deletingPdfId !== null && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">Dökümanı Sil</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu dökümanı ve dökümana eklenmiş olan tüm çizim ve notları kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingPdfId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  const id = deletingPdfId;
                  setDeletingPdfId(null);
                  executeDeletePdf(id);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Clear Page Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Info size={20} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">Sayfayı Temizle</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu sayfadaki tüm çizim ve notları temizlemek istediğinize emin misiniz? (Geri alabilirsiniz).
            </p>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={executeClearPage}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Success Toast Notification */}
      {activeSuccess && (
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-emerald-500/30 text-emerald-200 px-4 py-3.5 rounded-2xl shadow-2xl z-[999] flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold">{activeSuccess}</span>
          <button 
            onClick={() => setActiveSuccess(null)}
            className="text-slate-400 hover:text-slate-200 ml-auto transition text-[10px] font-black px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Error Toast Notification */}
      {activeError && (
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-red-500/30 text-red-200 px-4 py-3.5 rounded-2xl shadow-2xl z-[999] flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Info size={16} className="text-red-400 shrink-0" />
          <span className="text-xs font-extrabold">{activeError}</span>
          <button 
            onClick={() => setActiveError(null)}
            className="text-slate-400 hover:text-slate-200 ml-auto transition text-[10px] font-black px-1.5"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
