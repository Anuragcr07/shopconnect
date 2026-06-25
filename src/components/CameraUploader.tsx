"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import { Camera, Check, ImagePlus, RotateCcw } from "lucide-react";

interface CameraUploaderProps { onUploadComplete: (url: string) => void; }

const videoConstraints = { width: 640, height: 480, facingMode: "environment" };

export default function CameraUploader({ onUploadComplete }: CameraUploaderProps) {
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setImage(imageSrc);
    setShowCamera(false);
  };

  const uploadToCloudinary = async () => {
    if (!image) return;
    setUploading(true);
    try {
      const blob = await fetch(image).then((response) => response.blob());
      const formData = new FormData();
      formData.append("file", new File([blob], "capture.jpg", { type: "image/jpeg" }));
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.secure_url) throw new Error(data.message || "Upload failed");
      onUploadComplete(data.secure_url);
      setImage(null);
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
      {!showCamera && !image && <button type="button" onClick={() => setShowCamera(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"><ImagePlus className="size-4" /> Add a product photo</button>}
      {showCamera && <div className="flex w-full flex-col items-center gap-3"><Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="w-full rounded-2xl border border-slate-200" /><button type="button" onClick={capture} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"><Camera className="size-4" /> Capture</button></div>}
      {image && <div className="flex flex-col items-center gap-3"><Image src={image} alt="Captured product" width={192} height={192} unoptimized className="size-48 rounded-2xl border border-slate-200 object-cover" /><div className="flex gap-3"><button type="button" onClick={() => setImage(null)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><RotateCcw className="size-4" /> Retake</button><button type="button" onClick={uploadToCloudinary} disabled={uploading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{uploading ? "Uploading…" : <><Check className="size-4" /> Use photo</>}</button></div></div>}
    </div>
  );
}
