import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon, Eye, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface MultipleImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

export default function MultipleImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  label = "Product Images",
  description = "Upload high-quality images of your product. First image will be the main image."
}: MultipleImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadSingleFile = async (file: File): Promise<string> => {
    const fileId = Math.random().toString(36).substring(7);
    
    // Add to local uploading state
    setUploadingFiles(prev => [...prev, { id: fileId, name: file.name, progress: 0 }]);

    const formData = new FormData();
    formData.append("file", file);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadingFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress: pct } : f)
          );
        }
      });

      xhr.addEventListener("load", () => {
        // Remove from uploading list
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) {
              resolve(data.url);
            } else {
              reject(new Error("Invalid response from server"));
            }
          } catch {
            reject(new Error("Failed to parse server response"));
          }
        } else {
          let errorMsg = "Upload failed";
          try {
            errorMsg = JSON.parse(xhr.responseText).message || errorMsg;
          } catch {}
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener("error", () => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        reject(new Error("Network error during file upload"));
      });

      xhr.open("POST", "/api/upload/file");
      xhr.send(formData);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filter by slot capacity
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Limit Exceeded",
        description: `You can only upload up to ${remainingSlots} more image(s).`,
        variant: "destructive"
      });
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const uploadPromises = filesToUpload.map(async (file) => {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 5MB limit.`,
          variant: "destructive"
        });
        return null;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid Format",
          description: `${file.name} is not an image file.`,
          variant: "destructive"
        });
        return null;
      }

      try {
        const url = await uploadSingleFile(file);
        return url;
      } catch (err: any) {
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}: ${err.message}`,
          variant: "destructive"
        });
        return null;
      }
    });

    const newUrls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);
    
    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls].slice(0, maxImages));
      toast({
        title: "Success",
        description: `Successfully uploaded ${newUrls.length} image(s).`
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  const remainingSlots = maxImages - images.length;
  const isUploading = uploadingFiles.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {/* Current Images Display */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300";
                  }}
                />
              </div>
              
              {/* Image Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(imageUrl, '_blank')}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Main Image Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-[#FF5A1F] text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
              
              {/* Image Order Controls */}
              <div className="absolute bottom-2 right-2 flex space-x-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="bg-white text-gray-700 hover:bg-gray-100 p-1 rounded text-xs"
                    title="Move left"
                  >
                    ←
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    className="bg-white text-gray-700 hover:bg-gray-100 p-1 rounded text-xs"
                    title="Move right"
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploading Files Status */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 border border-orange-100 bg-orange-50/50 p-4 rounded-xl">
          <p className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image(s) to secure storage...
          </p>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span>{file.progress}%</span>
              </div>
              <Progress value={file.progress} className="h-1.5" />
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {remainingSlots > 0 && (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#FF5A1F] hover:bg-orange-50/20 transition-all cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-4 text-center font-medium">
            Upload up to {remainingSlots} more image{remainingSlots > 1 ? 's' : ''}
          </p>
          
          <Button 
            type="button" 
            className="bg-[#FF5A1F] hover:bg-[#e64e17] text-white rounded-xl shadow-sm"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select & Upload Images
          </Button>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Image Guidelines</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images (at least 800x800 pixels)</li>
          <li>• Maximum file size: 5MB per image</li>
          <li>• Supported formats: JPG, PNG, WebP</li>
          <li>• First image will be used as the main product/service image</li>
          <li>• Show different angles and features of your item</li>
        </ul>
      </div>

      {images.length >= maxImages && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm">
            You've reached the maximum of {maxImages} images. Remove some images to add new ones.
          </p>
        </div>
      )}
    </div>
  );
}