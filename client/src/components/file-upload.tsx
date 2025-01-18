import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload: (base64: string) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
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

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPreview(base64);
          onUpload(base64);
        };
        reader.readAsDataURL(file);
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
            Supports: JPG, PNG (max 5MB)
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
