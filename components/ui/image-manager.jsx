"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Upload,
  Wand2,
  Image as ImageIcon,
  Loader2,
  Copy,
  Download,
  Trash2,
  Eye,
  Settings,
} from "lucide-react";

const ImageManager = ({ onImageInsert, buttonText = "Add Image", className = "" }) => {
  const { getAuthHeaders } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Image generation state
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("educational");
  const [imageSize, setImageSize] = useState("1024x1024");

  // Upload state
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");

  const generateImage = async () => {
    if (!generatePrompt.trim()) {
      toast.error("Please enter a prompt for image generation");
      return;
    }

    setLoading(true);
    try {
      console.log("🎨 Starting image generation with:", {
        prompt: generatePrompt,
        style: imageStyle,
        size: imageSize,
      });

      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          prompt: generatePrompt,
          style: imageStyle,
          size: imageSize,
        }),
      });

      console.log("📡 API Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`;
        console.error("❌ API Error:", errorMessage);
        
        // Provide specific error messages based on status
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to generate images.");
        } else if (response.status === 400) {
          throw new Error(`Invalid request: ${errorMessage}`);
        } else if (response.status === 500) {
          throw new Error(`Server error: ${errorMessage}. This might be due to missing API keys.`);
        } else {
          throw new Error(`Failed to generate image: ${errorMessage}`);
        }
      }

      const data = await response.json();
      console.log("✅ Image generated successfully:", data);
      
      setGeneratedImage(data);
      
      if (data.isPlaceholder) {
        toast.success("Placeholder image generated! Set up OpenAI API key for AI-generated images.", { duration: 5000 });
      } else {
        toast.success("Image generated successfully!");
      }
    } catch (error) {
      console.error("💥 Error generating image:", error);
      toast.error(error.message || "Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("altText", altText || file.name);
      formData.append("caption", caption);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setUploadedImage(data.image);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  const insertImage = (image) => {
    const imageData = {
      url: image.url || image.imageUrl,
      alt: image.altText || altText || "Course image",
      caption: image.caption || caption,
      width: image.width,
      height: image.height,
    };

    // Create HTML for the image
    const imageHtml = `
      <figure class="image-container" style="margin: 20px 0; text-align: center;">
        <img src="${imageData.url}" 
             alt="${imageData.alt}" 
             style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
             loading="lazy" />
        ${imageData.caption ? `<figcaption style="margin-top: 8px; font-style: italic; color: #666; font-size: 0.9em;">${imageData.caption}</figcaption>` : ''}
      </figure>
    `;

    if (onImageInsert) {
      onImageInsert(imageHtml, imageData);
    }

    // Reset state and close dialog
    setGeneratedImage(null);
    setUploadedImage(null);
    setGeneratePrompt("");
    setAltText("");
    setCaption("");
    setOpen(false);
    
    toast.success("Image inserted into content!");
  };

  const copyImageUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <ImageIcon className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Image to Content</DialogTitle>
          <DialogDescription>
            Generate an image from a prompt or upload your own image file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">
              <Wand2 className="h-4 w-4 mr-2" />
              Generate with AI
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Image Description</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate (e.g., 'A diagram showing the water cycle with arrows and labels')"
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="style">Style</Label>
                  <select
                    id="style"
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="educational">Educational</option>
                    <option value="diagram">Technical Diagram</option>
                    <option value="illustration">Illustration</option>
                    <option value="realistic">Realistic</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="size">Size</Label>
                  <select
                    id="size"
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="1024x1024">Square (1024x1024)</option>
                    <option value="1792x1024">Landscape (1792x1024)</option>
                    <option value="1024x1792">Portrait (1024x1792)</option>
                  </select>
                </div>
              </div>

              <Button onClick={generateImage} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {generatedImage && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="text-center">
                    <img
                      src={generatedImage.imageUrl}
                      alt="Generated image"
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="gen-alt">Alt Text</Label>
                      <Input
                        id="gen-alt"
                        placeholder="Descriptive text for accessibility"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gen-caption">Caption (optional)</Label>
                      <Input
                        id="gen-caption"
                        placeholder="Caption to display below image"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => insertImage(generatedImage)} className="flex-1">
                      Insert Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyImageUrl(generatedImage.imageUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="alt-text">Alt Text</Label>
                <Input
                  id="alt-text"
                  placeholder="Descriptive text for accessibility"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="caption-text">Caption (optional)</Label>
                <Input
                  id="caption-text"
                  placeholder="Caption to display below image"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {loading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                    <p className="text-gray-500">Uploading image...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-gray-500">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports JPEG, PNG, WebP, GIF, SVG (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />

              {uploadedImage && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="text-center">
                    <img
                      src={uploadedImage.url}
                      alt={uploadedImage.altText}
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{uploadedImage.originalName}</span>
                    <Badge variant="secondary">
                      {uploadedImage.width}x{uploadedImage.height}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => insertImage(uploadedImage)} className="flex-1">
                      Insert Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyImageUrl(uploadedImage.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {!generatedImage && !uploadedImage && (
          <Alert>
            <ImageIcon className="h-4 w-4" />
            <AlertDescription>
              Generated and uploaded images will be optimized for web display and stored securely.
              Make sure to add descriptive alt text for accessibility.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageManager;