"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import { supabase } from "@/lib/supabase";

interface ImageUploaderProps {
  bucket: "avatars" | "headers" | "media-kits";
  currentUrl?: string;
  onUpload: (url: string) => void;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for banner
  cropShape?: "round" | "rect";
  maxWidth?: number;
  maxHeight?: number;
  label?: string;
}

export default function ImageUploader({
  bucket,
  currentUrl,
  onUpload,
  aspectRatio,
  cropShape = "rect",
  maxWidth = 800,
  maxHeight = 800,
  label = "Upload Image",
}: ImageUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileType = file.type;
      
      // For non-image files (like PDFs), upload directly without cropping
      if (!fileType.startsWith("image/")) {
        handleDirectUpload(file);
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleDirectUpload = async (file: File) => {
    setUploading(true);

    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error);
        alert("Upload failed: " + error.message);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUpload(urlData.publicUrl);
      setIsOpen(false);
      setImageSrc(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    }

    setUploading(false);
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      
      // Set initial crop
      const cropWidth = Math.min(width, height);
      const cropHeight = aspectRatio ? cropWidth / aspectRatio : cropWidth;
      
      const initialCrop: Crop = {
        unit: "px",
        x: (width - cropWidth) / 2,
        y: (height - Math.min(cropHeight, height)) / 2,
        width: cropWidth,
        height: Math.min(cropHeight, height),
      };
      
      setCrop(initialCrop);
    },
    [aspectRatio]
  );

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    const pixelCrop = completedCrop;
    
    canvas.width = Math.min(pixelCrop.width * scaleX, maxWidth);
    canvas.height = Math.min(pixelCrop.height * scaleY, maxHeight);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      imgRef.current,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.9
      );
    });
  };

  const handleUpload = async () => {
    setUploading(true);

    try {
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        alert("Failed to crop image");
        setUploading(false);
        return;
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error);
        alert("Upload failed: " + error.message);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUpload(urlData.publicUrl);
      setIsOpen(false);
      setImageSrc(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    }

    setUploading(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUpload(urlInput.trim());
      setIsOpen(false);
      setUrlInput("");
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-[var(--color-accent)] hover:underline"
      >
        {label}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {label}
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setImageSrc(null);
                }}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("upload")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "upload"
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                }`}
              >
                📁 Upload File
              </button>
              <button
                onClick={() => setMode("url")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "url"
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                }`}
              >
                🔗 Use URL
              </button>
            </div>

            {mode === "upload" ? (
              <>
                {!imageSrc ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                  >
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-[var(--color-text-primary)] font-medium">
                      Click to select an image
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {bucket === "media-kits" ? "JPG, PNG, PDF up to 10MB" : "JPG, PNG, GIF up to 10MB"}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={bucket === "media-kits" ? "image/*,.pdf" : "image/*"}
                      onChange={onSelectFile}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`relative ${cropShape === "round" ? "rounded-full overflow-hidden" : ""}`}>
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspectRatio}
                        circularCrop={cropShape === "round"}
                      >
                        <img
                          ref={imgRef}
                          src={imageSrc}
                          alt="Crop preview"
                          onLoad={onImageLoad}
                          className="max-h-[400px] w-full object-contain"
                        />
                      </ReactCrop>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setImageSrc(null)}
                        className="flex-1 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium"
                      >
                        Choose Different
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={uploading || !completedCrop}
                        className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium disabled:opacity-50"
                      >
                        {uploading ? "Uploading..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  />
                </div>

                {urlInput && (
                  <div className="border border-[var(--color-border)] rounded-lg p-2">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Preview:</p>
                    <img
                      src={urlInput}
                      alt="Preview"
                      className="max-h-[200px] w-full object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium disabled:opacity-50"
                >
                  Use This Image
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
