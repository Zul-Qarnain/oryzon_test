"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Link } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpload: (file: File | string) => Promise<{ url: string; imageId: string } | null>;
  onImageUrlChange: (url: string | null, imageId: string | null) => void;
  onDirectUrlUpdate?: (url: string) => void; // New prop for direct URL updates
  isUploading: boolean;
  className?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUpload,
  onImageUrlChange,
  onDirectUrlUpdate,
  isUploading,
  className = '',
  disabled = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState(currentImageUrl || '');
  const [urlDebounceTimer, setUrlDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    const result = await onImageUpload(file);
    if (result) {
      onImageUrlChange(result.url, result.imageId);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = () => {
    // Clear any pending URL updates
    if (urlDebounceTimer) {
      clearTimeout(urlDebounceTimer);
      setUrlDebounceTimer(null);
    }
    
    onImageUrlChange(null, null);
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    
    // Clear existing timer
    if (urlDebounceTimer) {
      clearTimeout(urlDebounceTimer);
    }
    
    // Set new timer for debounced URL processing
    const timer = setTimeout(async () => {
      if (newUrl.trim()) {
        // Validate if it's a proper URL
        try {
          new URL(newUrl);
          // Use the upload callback to handle URL input
          const result = await onImageUpload(newUrl);
          if (result) {
            onImageUrlChange(result.url, result.imageId);
          }
          if (onDirectUrlUpdate) {
            onDirectUrlUpdate(newUrl);
          }
        } catch {
          // Invalid URL, but still update the input field
          // Don't update the image preview for invalid URLs
        }
      } else {
        onImageUrlChange(null, null);
      }
    }, 500); // 500ms debounce
    
    setUrlDebounceTimer(timer);
  };

  // Sync URL input with currentImageUrl prop changes
  React.useEffect(() => {
    setUrlInput(currentImageUrl || '');
  }, [currentImageUrl]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (urlDebounceTimer) {
        clearTimeout(urlDebounceTimer);
      }
    };
  }, [urlDebounceTimer]);

  const triggerFileInput = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
        Product Image
      </label>
      
      {/* Image Preview */}
      {currentImageUrl && (
        <div className="relative inline-block">
          <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-[var(--border-medium)]">
            <img
              src={currentImageUrl}
              alt="Product preview"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          {!disabled && !isUploading && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* URL Input Field */}
      <div className="space-y-2">
        <label htmlFor="imageUrl" className="block text-sm font-medium text-[var(--text-on-dark-muted)]">
          Or enter image URL directly
        </label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-on-dark-muted)]" />
          <input
            id="imageUrl"
            type="url"
            value={urlInput}
            onChange={handleUrlInputChange}
            placeholder="https://example.com/image.jpg"
            disabled={disabled || isUploading}
            className="w-full pl-10 pr-3 py-2 bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-muted)] disabled:opacity-50"
          />
        </div>
        <p className="text-xs text-[var(--text-on-dark-muted)]">
          Paste a direct link to an image from the web
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-[var(--border-medium)]'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-accent-primary)] hover:bg-[var(--bg-badge)]'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-primary)] mb-2" />
            <p className="text-sm text-[var(--text-on-dark-muted)]">Uploading image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {currentImageUrl ? (
              <Upload className="h-8 w-8 text-[var(--icon-accent-primary)] mb-2" />
            ) : (
              <ImageIcon className="h-8 w-8 text-[var(--icon-accent-primary)] mb-2" />
            )}
            <p className="text-sm text-[var(--text-on-dark-primary)] mb-1">
              {currentImageUrl ? 'Re-upload Image' : 'Upload Product Image'}
            </p>
            <p className="text-xs text-[var(--text-on-dark-muted)]">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-xs text-[var(--text-on-dark-muted)] mt-1">
              Supports: JPG, PNG, GIF (Max 5MB)
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
};

export default ImageUpload;
