import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

interface FileUploadProps {
  onUpload: (base64: string) => void;
}

// Function to resize image
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // If image is larger than 1024px in either dimension, resize it
        if (width > 1024 || height > 1024) {
          if (width > height) {
            height = Math.round((height * 1024) / width);
            width = 1024;
          } else {
            width = Math.round((width * 1024) / height);
            height = 1024;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: "File size must be less than 5MB",
            variant: "destructive",
          });
          return;
        }

        try {
          // Resize the image if it's larger than 1024px in any dimension
          const resizedImage = await resizeImage(file);
          setPreview(resizedImage);
          onUpload(resizedImage);
        } catch (error) {
          console.error("Error processing image:", error);
          toast({
            title: "Error",
            description: "Failed to process image. Please try again.",
            variant: "destructive",
          });
        }
      }
    },
    [onUpload, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
  });

  const clearUpload = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary"
            }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag & drop an image here, or click to select
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports: JPG, PNG (max 5MB, will be resized if larger than 1024px)
          </p>
        </div>
      ) : (
        <Card className="relative">
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={clearUpload}
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={preview}
            alt="Room preview"
            className="w-full h-64 object-cover rounded-lg"
          />
        </Card>
      )}
    </div>
  );
}
