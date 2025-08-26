import { useState, useCallback } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon, Eye } from "lucide-react";
import type { UploadResult } from "@uppy/core";
import { vendorApiRequest } from "@/lib/queryClient";

interface MultipleImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
}

export default function MultipleImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  label = "Product Images",
  description = "Upload high-quality images of your product. First image will be the main image."
}: MultipleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleGetUploadParameters = useCallback(async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  }, []);

  const handleUploadComplete = useCallback(async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      setUploading(false);
      
      if (result.successful && result.successful.length > 0) {
        const uploadedFiles = result.successful;
        const newImageUrls: string[] = [];
        
        // Process each uploaded file
        for (const file of uploadedFiles) {
          if (file.uploadURL) {
            // Convert the upload URL to object path
            const objectPath = convertUploadUrlToObjectPath(file.uploadURL);
            
            try {
              // Set ACL policy for the uploaded image using vendor authentication
              const aclData = await vendorApiRequest('/api/vendor/images', 'PUT', { 
                imageURL: file.uploadURL 
              });
              
              newImageUrls.push(aclData.objectPath);
            } catch (error) {
              console.error('Failed to set ACL for image:', file.uploadURL, error);
              // Fallback to direct URL if ACL setting fails
              newImageUrls.push(objectPath);
            }
          }
        }
        
        // Add new images to the existing list
        const updatedImages = [...images, ...newImageUrls].slice(0, maxImages);
        onImagesChange(updatedImages);
      }
    } catch (error) {
      console.error('Error processing upload:', error);
      setUploading(false);
    }
  }, [images, onImagesChange, maxImages]);

  const convertUploadUrlToObjectPath = (uploadUrl: string): string => {
    try {
      const url = new URL(uploadUrl);
      const pathParts = url.pathname.split('/');
      if (pathParts.length >= 3) {
        // Extract the object ID from the upload URL
        const objectId = pathParts[pathParts.length - 1];
        return `/objects/uploads/${objectId}`;
      }
      return uploadUrl;
    } catch {
      return uploadUrl;
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
                <div className="absolute top-2 left-2 bg-buylock-primary text-white text-xs px-2 py-1 rounded">
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

      {/* Upload Button */}
      {remainingSlots > 0 && (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-buylock-primary transition-colors">
          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-4 text-center">
            Upload up to {remainingSlots} more image{remainingSlots > 1 ? 's' : ''}
          </p>
          
          <ObjectUploader
            maxNumberOfFiles={remainingSlots}
            maxFileSize={5242880} // 5MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-buylock-primary hover:bg-buylock-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Images'}
          </ObjectUploader>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Image Guidelines</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images (at least 800x800 pixels)</li>
          <li>• Maximum file size: 5MB per image</li>
          <li>• Supported formats: JPG, PNG, WebP</li>
          <li>• First image will be used as the main product image</li>
          <li>• Show different angles and features of your product</li>
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