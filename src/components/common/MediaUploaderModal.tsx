/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Crop,
  Check,
  AlertCircle,
  Loader2,
  Maximize2,
  Sliders,
  RefreshCw,
  Link as LinkIcon,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { MediaItem } from '../../types';

interface MediaUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (media: MediaItem) => void;
  defaultCategory?: 'institucional' | 'eventos' | 'consejeros' | 'territorio' | 'documentos' | 'general';
}

type TabMode = 'file' | 'video-url';

interface SelectedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  previewUrl: string;
  title: string;
  description: string;
  altText: string;
  category: MediaItem['category'];
  aspectRatio: 'free' | '1:1' | '16:9' | '4:3';
  quality: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export const MediaUploaderModal: React.FC<MediaUploaderModalProps> = ({
  isOpen,
  onClose,
  onUploaded,
  defaultCategory = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('file');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);

  // Global settings for batch
  const [batchCategory, setBatchCategory] = useState<MediaItem['category']>(defaultCategory);

  // Video embed url state
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [videoCategory, setVideoCategory] = useState<MediaItem['category']>(defaultCategory);

  // Upload status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasFailedItems, setHasFailedItems] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentFile = selectedFiles[activeFileIndex] || null;

  // Sanitization for SVG
  const sanitizeSvg = (svgText: string): string => {
    return svgText
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  };

  const processAndAddFiles = (files: FileList | File[]) => {
    setErrorMsg('');
    const newItems: SelectedFileItem[] = [];

    Array.from(files).forEach((file) => {
      const lowerName = file.name.toLowerCase();
      const isSvg = file.type === 'image/svg+xml' || lowerName.endsWith('.svg');
      const isVideo = file.type.startsWith('video/') || lowerName.endsWith('.mp4') || lowerName.endsWith('.webm') || lowerName.endsWith('.mov');
      const isDoc = file.type.includes('pdf') || lowerName.endsWith('.pdf') || lowerName.endsWith('.docx');

      const id = `fl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      if (isVideo) {
        const objectUrl = URL.createObjectURL(file);
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'video/mp4',
          previewUrl: objectUrl,
          title: cleanTitle,
          description: '',
          altText: cleanTitle,
          category: batchCategory,
          aspectRatio: 'free',
          quality: 0.85,
          status: 'pending',
        });
      } else if (isDoc) {
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/pdf',
          previewUrl: '',
          title: cleanTitle,
          description: '',
          altText: cleanTitle,
          category: 'documentos',
          aspectRatio: 'free',
          quality: 0.85,
          status: 'pending',
        });
      } else {
        // Image formats (JPG, PNG, WEBP, GIF, BMP, TIFF, AVIF, HEIC)
        const reader = new FileReader();
        if (isSvg) {
          reader.onload = (e) => {
            const text = e.target?.result as string;
            const clean = sanitizeSvg(text);
            const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
            setSelectedFiles((prev) =>
              prev.map((item) => (item.id === id ? { ...item, previewUrl: encoded } : item))
            );
          };
          reader.readAsText(file);
        } else {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setSelectedFiles((prev) =>
              prev.map((item) => (item.id === id ? { ...item, previewUrl: result } : item))
            );
          };
          reader.readAsDataURL(file);
        }

        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
          previewUrl: '',
          title: cleanTitle,
          description: '',
          altText: cleanTitle,
          category: batchCategory,
          aspectRatio: 'free',
          quality: 0.85,
          status: 'pending',
        });
      }
    });

    if (newItems.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newItems]);
      if (selectedFiles.length === 0) {
        setActiveFileIndex(0);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex((prev) => prev - 1);
    }
  };

  // Process & compress canvas for images
  const processImageCanvas = async (sourceDataUrl: string, ratio: 'free' | '1:1' | '16:9' | '4:3', qual: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!sourceDataUrl.startsWith('data:image')) {
        return resolve(sourceDataUrl);
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let targetWidth = img.width;
        let targetHeight = img.height;

        let startX = 0;
        let startY = 0;
        let cropWidth = img.width;
        let cropHeight = img.height;

        if (ratio === '1:1') {
          const minDim = Math.min(img.width, img.height);
          startX = (img.width - minDim) / 2;
          startY = (img.height - minDim) / 2;
          cropWidth = minDim;
          cropHeight = minDim;
          targetWidth = Math.min(minDim, 1200);
          targetHeight = targetWidth;
        } else if (ratio === '16:9') {
          const targetH = img.width * (9 / 16);
          if (targetH <= img.height) {
            startY = (img.height - targetH) / 2;
            cropHeight = targetH;
          } else {
            const targetW = img.height * (16 / 9);
            startX = (img.width - targetW) / 2;
            cropWidth = targetW;
          }
          targetWidth = Math.min(cropWidth, 1600);
          targetHeight = Math.round(targetWidth * (9 / 16));
        } else if (ratio === '4:3') {
          const targetH = img.width * (3 / 4);
          if (targetH <= img.height) {
            startY = (img.height - targetH) / 2;
            cropHeight = targetH;
          } else {
            const targetW = img.height * (4 / 3);
            startX = (img.width - targetW) / 2;
            cropWidth = targetW;
          }
          targetWidth = Math.min(cropWidth, 1400);
          targetHeight = Math.round(targetWidth * (3 / 4));
        } else {
          if (targetWidth > 1920) {
            targetHeight = Math.round((1920 / targetWidth) * targetHeight);
            targetWidth = 1920;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
          const outputFormat = sourceDataUrl.includes('image/png') ? 'image/png' : 'image/jpeg';
          const optimized = canvas.toDataURL(outputFormat, qual);
          resolve(optimized);
        } else {
          resolve(sourceDataUrl);
        }
      };
      img.onerror = () => resolve(sourceDataUrl);
      img.src = sourceDataUrl;
    });
  };

  const parseVideoEmbed = (url: string) => {
    let embedUrl = url;
    let thumb = '';
    let platform: 'youtube' | 'vimeo' | 'otro' = 'otro';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
        thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } else if (url.includes('vimeo.com')) {
      platform = 'vimeo';
      const parts = url.split('/');
      const id = parts[parts.length - 1];
      embedUrl = `https://player.vimeo.com/video/${id}`;
    }

    return { embedUrl, thumb, platform };
  };

  const handleBatchUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setHasFailedItems(false);

    if (activeTab === 'video-url') {
      if (!videoUrl.trim()) {
        setErrorMsg('Por favor ingrese el enlace oficial del video.');
        return;
      }
      setIsProcessing(true);
      setUploadProgress(40);
      try {
        const parsed = parseVideoEmbed(videoUrl);
        const created = await api.uploadMedia({
          name: videoTitle.trim() || 'Video Institucional CMJ',
          type: 'video',
          mimeType: 'video/external',
          size: 0,
          url: parsed.embedUrl,
          thumbnailUrl: parsed.thumb || parsed.embedUrl,
          category: videoCategory,
          title: videoTitle.trim() || 'Video Institucional CMJ',
          description: videoDescription.trim(),
          altText: videoTitle.trim() || 'Video Oficial del CMJ Flandes',
          isExternal: true,
          externalPlatform: parsed.platform,
        });
        setUploadProgress(100);
        onUploaded(created);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al guardar el video.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMsg('Seleccione al menos una fotografía o archivo multimedia para subir.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(10);

    const itemsToUpload: any[] = [];
    let lastUploadedMedia: MediaItem | null = null;
    let failedCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      try {
        setSelectedFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
        );

        let finalUrl = item.previewUrl;
        if (item.previewUrl.startsWith('data:image')) {
          finalUrl = await processImageCanvas(item.previewUrl, item.aspectRatio, item.quality);
        }

        const payload: Partial<MediaItem> = {
          name: item.name,
          type: item.mimeType.startsWith('video/') ? 'video' : 'image',
          mimeType: item.mimeType,
          size: item.size,
          url: finalUrl,
          thumbnailUrl: finalUrl,
          category: item.category,
          title: item.title.trim() || item.name,
          description: item.description.trim(),
          altText: item.altText.trim() || item.title.trim(),
        };

        const created = await api.uploadMedia(payload);
        lastUploadedMedia = created;

        setSelectedFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'success' } : f))
        );
      } catch (itemErr: any) {
        failedCount++;
        setSelectedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', errorMessage: itemErr.message || 'Error de carga' } : f
          )
        );
      }

      setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    }

    setIsProcessing(false);

    if (failedCount > 0) {
      setHasFailedItems(true);
      setErrorMsg(`Se completaron ${selectedFiles.length - failedCount} archivos, pero ${failedCount} fallaron. Puede reintentar la carga.`);
      if (lastUploadedMedia) {
        onUploaded(lastUploadedMedia);
      }
    } else {
      if (lastUploadedMedia) {
        onUploaded(lastUploadedMedia);
      }
      onClose();
    }
  };

  const handleRetryFailed = () => {
    // Reset failed items status
    setSelectedFiles((prev) =>
      prev.map((f) => (f.status === 'error' ? { ...f, status: 'pending', errorMessage: undefined } : f))
    );
    setErrorMsg('');
    setHasFailedItems(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="uploader-modal-title">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-900 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="uploader-modal-title" className="text-base font-bold font-serif text-stone-900 dark:text-white">
                Carga y Gestión de Fotografías Institucionales
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Soporte múltiple: JPG, JPEG, PNG, WEBP, GIF, AVIF, BMP, TIFF, HEIC, SVG y videos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 flex gap-2 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'file'}
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 text-xs font-semibold px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-red-900 text-red-900 dark:text-red-400 dark:border-red-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Subir Fotografías / Archivos ({selectedFiles.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'video-url'}
            onClick={() => setActiveTab('video-url')}
            className={`pb-2.5 text-xs font-semibold px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'video-url'
                ? 'border-red-900 text-red-900 dark:text-red-400 dark:border-red-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Enlace de Video (YouTube / Vimeo)</span>
          </button>
        </div>

        {/* Content Area */}
        <form onSubmit={handleBatchUploadSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start justify-between gap-2.5 text-xs text-red-900 dark:text-red-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              {hasFailedItems && (
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  className="px-2.5 py-1 bg-red-900 text-white rounded text-[11px] font-semibold hover:bg-red-950 shrink-0 cursor-pointer"
                >
                  Reintentar Fallidas
                </button>
              )}
            </div>
          )}

          {activeTab === 'file' ? (
            <div className="space-y-4">
              {/* Dropzone with Multi-Selection */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-red-800 dark:hover:border-red-600 rounded-2xl p-6 text-center cursor-pointer transition-all bg-stone-50 dark:bg-stone-800/40 group"
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && processAndAddFiles(e.target.files)}
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/bmp,image/tiff,image/heic,image/heif,image/svg+xml,video/mp4,video/webm,video/quicktime,.pdf"
                />
                <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Arrastra aquí tus fotografías o selecciona múltiples archivos
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Formatos compatibles: JPG, JPEG, PNG, WEBP, GIF, AVIF, BMP, TIFF, HEIC, SVG y videos MP4
                </p>
              </div>

              {/* Multi-photo selected thumbnails carousel */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-red-900 dark:text-red-400" />
                      <span>Fotografías seleccionadas ({selectedFiles.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-stone-400 hover:text-red-700 text-[11px]"
                    >
                      Limpiar todo
                    </button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {selectedFiles.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveFileIndex(idx)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                          activeFileIndex === idx
                            ? 'border-red-900 ring-2 ring-red-900/30'
                            : 'border-stone-200 dark:border-stone-700 opacity-75 hover:opacity-100'
                        }`}
                      >
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-stone-400" />
                          </div>
                        )}

                        {item.status === 'success' && (
                          <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center text-white">
                            <Check className="w-5 h-5 text-emerald-400" />
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center text-white">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-black text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active File Inspector & Crop Controls */}
              {currentFile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700">
                  {/* Preview container */}
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-stone-950 border border-stone-800 flex items-center justify-center min-h-[200px] max-h-[280px]">
                      {currentFile.previewUrl ? (
                        <img
                          src={currentFile.previewUrl}
                          alt={currentFile.title}
                          className="max-h-[280px] w-auto object-contain"
                        />
                      ) : (
                        <div className="p-6 text-center text-white">
                          <FileText className="w-12 h-12 mx-auto mb-1 text-red-400" />
                          <span className="text-xs font-mono">{currentFile.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Aspect Ratio Preset Selector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                        <span className="flex items-center gap-1">
                          <Crop className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                          <span>Proporción de Recorte</span>
                        </span>
                        <div className="flex gap-1">
                          {(['free', '1:1', '16:9', '4:3'] as const).map((ratio) => (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => {
                                setSelectedFiles((prev) =>
                                  prev.map((f, i) => (i === activeFileIndex ? { ...f, aspectRatio: ratio } : f))
                                );
                              }}
                              className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors cursor-pointer ${
                                currentFile.aspectRatio === ratio
                                  ? 'bg-red-900 text-white font-bold'
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                              }`}
                            >
                              {ratio === 'free' ? 'Libre' : ratio}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Compression slider */}
                      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-stone-500" />
                          <span>Calidad ({Math.round(currentFile.quality * 100)}%)</span>
                        </span>
                        <input
                          type="range"
                          min="0.5"
                          max="1"
                          step="0.05"
                          value={currentFile.quality}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSelectedFiles((prev) =>
                              prev.map((f, i) => (i === activeFileIndex ? { ...f, quality: val } : f))
                            );
                          }}
                          className="w-28 accent-red-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Título de la Fotografía *
                      </label>
                      <input
                        type="text"
                        required
                        value={currentFile.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedFiles((prev) =>
                            prev.map((f, i) => (i === activeFileIndex ? { ...f, title: val } : f))
                          );
                        }}
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-1 focus:ring-red-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Categoría Institucional
                      </label>
                      <select
                        value={currentFile.category}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setSelectedFiles((prev) =>
                            prev.map((f, i) => (i === activeFileIndex ? { ...f, category: val } : f))
                          );
                        }}
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-1 focus:ring-red-900"
                      >
                        <option value="institucional">Institucional / Logotipos</option>
                        <option value="eventos">Eventos y Asambleas</option>
                        <option value="consejeros">Perfiles de Consejeros</option>
                        <option value="territorio">Territorio y Paisajes Flandes</option>
                        <option value="documentos">Documentos y Gacetas</option>
                        <option value="general">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Texto Alternativo (Accesibilidad)
                      </label>
                      <input
                        type="text"
                        value={currentFile.altText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedFiles((prev) =>
                            prev.map((f, i) => (i === activeFileIndex ? { ...f, altText: val } : f))
                          );
                        }}
                        placeholder="Descripción para personas con discapacidad visual"
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-1 focus:ring-red-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Descripción o Pie de Foto (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={currentFile.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedFiles((prev) =>
                            prev.map((f, i) => (i === activeFileIndex ? { ...f, description: val } : f))
                          );
                        }}
                        placeholder="Contexto o detalles de la fotografía"
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-1 focus:ring-red-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Video URL mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Enlace de YouTube o Vimeo
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-red-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Título del Video *</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Ej. Sesión Plenaria del CMJ Flandes"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Categoría</label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  >
                    <option value="eventos">Eventos y Asambleas</option>
                    <option value="institucional">Institucional</option>
                    <option value="territorio">Territorio Flandes</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              {videoUrl.trim() && (
                <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                  <span className="text-[11px] font-bold text-red-900 dark:text-red-400 block mb-2">
                    Vista previa de incrustación:
                  </span>
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={parseVideoEmbed(videoUrl).embedUrl}
                      title="Video preview"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-stone-500 font-mono">
                <span>Guardando fotografías de forma permanente en el servidor...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-900 dark:bg-red-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing || (activeTab === 'file' && selectedFiles.length === 0)}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-900 hover:bg-red-950 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {activeTab === 'file'
                      ? selectedFiles.length > 1
                        ? `Subir ${selectedFiles.length} Fotografías`
                        : 'Guardar Fotografía'
                      : 'Guardar Video'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
