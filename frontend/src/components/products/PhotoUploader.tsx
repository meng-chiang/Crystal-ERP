'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { photosApi } from '@/lib/api';
import { Upload, X, Star } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface Photo {
  id: number;
  filename: string;
  isPrimary: boolean;
}

interface PhotoUploaderProps {
  productId: number;
  photos: Photo[];
}

export default function PhotoUploader({ productId, photos: initialPhotos }: PhotoUploaderProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploading(true);
      const compressed = await Promise.all(
        files.map((file) =>
          imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true })
        )
      );
      return photosApi.upload(productId, compressed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      setUploading(false);
    },
    onError: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: number) => photosApi.delete(photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product', productId] }),
  });

  const primaryMutation = useMutation({
    mutationFn: (photoId: number) => photosApi.setPrimary(photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product', productId] }),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadMutation.mutate(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* 上傳區域 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-purple-600 text-sm">上傳中...</p>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">點擊或拖曳圖片上傳</p>
            <p className="text-xs text-gray-400 mt-1">支援 JPG、PNG、WebP，最大 10MB</p>
          </>
        )}
      </div>

      {/* 相片列表 */}
      {initialPhotos.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {initialPhotos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              <img
                src={photosApi.url(photo.filename)}
                alt="商品相片"
                className="w-full h-full object-cover rounded-lg"
              />
              {photo.isPrimary && (
                <div className="absolute top-1 left-1 bg-yellow-400 rounded-full p-0.5">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {!photo.isPrimary && (
                  <button
                    onClick={() => primaryMutation.mutate(photo.id)}
                    title="設為主相片"
                    className="p-1.5 bg-white rounded-full text-yellow-500 hover:bg-yellow-50"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(photo.id)}
                  title="刪除相片"
                  className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
