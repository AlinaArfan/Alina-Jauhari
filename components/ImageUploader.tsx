
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Image as ImageIcon, UploadCloud, Scissors, Clipboard } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  maxFiles?: number;
  label?: string;
  description?: string;
  compact?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  images, 
  setImages, 
  maxFiles = 5, 
  label = "Unggah Gambar", 
  description,
  compact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Logic Processing ---

  const processFiles = (newFiles: File[]) => {
    // Filter only images
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;

    if (images.length + imageFiles.length > maxFiles) {
      alert(`Maksimal ${maxFiles} gambar diperbolehkan.`);
      return;
    }

    const newUploadedImages: UploadedImage[] = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newUploadedImages]);
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering click on parent
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  };

  // --- Event Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Handle Paste (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      processFiles(Array.from(e.clipboardData.files));
    }
  };

  // Enable div focus to capture paste events
  const handleContainerClick = () => {
    containerRef.current?.focus();
  };

  // --- Render ---

  // 1. Empty State / Large Dropzone
  if (images.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
            {label}
        </label>
        <div
            ref={containerRef}
            tabIndex={0}
            onClick={handleContainerClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            className={`
                relative w-full border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer outline-none group
                ${compact ? 'h-32' : 'h-48'}
                ${isDragging 
                    ? 'border-teal-500 bg-teal-50 ring-4 ring-teal-500/10 scale-[1.01]' 
                    : 'border-gray-300 bg-gray-50 hover:bg-white hover:border-teal-400'}
                focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20
            `}
        >
            <input 
                type="file" 
                accept="image/*" 
                multiple={maxFiles > 1} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange}
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
                <div className={`
                    p-3 rounded-full mb-3 transition-colors duration-200
                    ${isDragging ? 'bg-teal-100 text-teal-600' : 'bg-white shadow-sm text-gray-400 group-hover:text-teal-500 group-hover:scale-110'}
                `}>
                    {isDragging ? <UploadCloud className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                </div>
                <p className="text-sm font-medium text-gray-600">
                    <span className="text-teal-600">Klik Upload</span> atau Drag & Drop
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clipboard className="w-3 h-3" /> Support Copy Paste (Ctrl+V)
                </p>
                {description && <p className="text-[10px] text-gray-400 mt-2 px-4 text-center">{description}</p>}
            </div>
        </div>
      </div>
    );
  }

  // 2. Has Images State (Grid View + Small Add Button)
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700">
            {label} {maxFiles > 1 ? `(${images.length}/${maxFiles})` : ''}
        </label>
        {images.length < maxFiles && (
            <span className="text-xs text-teal-600 flex items-center font-medium animate-pulse">
                 <Clipboard className="w-3 h-3 mr-1" /> Bisa Paste (Ctrl+V) disini
            </span>
        )}
      </div>
      
      <div 
        ref={containerRef}
        tabIndex={0} // Make focusable for paste
        onPaste={handlePaste} // Global paste listener for this container
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
            grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 outline-none p-2 rounded-xl border border-transparent transition-all
            ${isDragging ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20' : ''}
            focus:ring-2 focus:ring-teal-500/10
        `}
      >
        {images.map((img) => (
          <div key={img.id} className="aspect-square relative rounded-xl overflow-hidden border border-gray-200 group bg-white shadow-sm hover:shadow-md transition-all">
            <img 
              src={img.previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button
              onClick={(e) => removeImage(img.id, e)}
              className="absolute top-1.5 right-1.5 bg-white/90 text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 shadow-sm"
              title="Hapus Gambar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="text-[10px] text-white font-medium flex items-center justify-center">
                    Valid Image
                </div>
            </div>
          </div>
        ))}

        {/* Add Button (Mini Dropzone) */}
        {images.length < maxFiles && (
          <label className={`
            aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer 
            hover:border-teal-500 hover:bg-teal-50 transition-all bg-gray-50 group relative overflow-hidden
            ${isDragging ? 'opacity-50' : ''}
          `}>
             <input 
              type="file" 
              accept="image/*" 
              multiple={maxFiles > 1} 
              className="hidden" 
              onChange={handleFileChange}
            />
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:text-teal-600 text-gray-400">
                <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-500 font-medium group-hover:text-teal-700">Tambah</span>
          </label>
        )}
      </div>
      
      {/* Helper Text */}
      <div className="flex justify-between text-xs text-gray-400 px-1">
          <span>Drag gambar kesini untuk menambah</span>
          <span>Max {maxFiles} file</span>
      </div>
    </div>
  );
};

export default ImageUploader;
