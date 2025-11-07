"use client";

import React, { useState, useRef } from "react";
import Webcam from "react-webcam";

interface CameraUploaderProps {
  onUploadComplete: (url: string) => void;
}

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "environment",
};

const CameraUploader: React.FC<CameraUploaderProps> = ({ onUploadComplete }) => {
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
      const blob = await fetch(image).then((res) => res.blob());
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "shop_unsigned_preset"
      );

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.secure_url) {
        onUploadComplete(data.secure_url);
        alert("✅ Image uploaded successfully!");
        setImage(null);
      } else {
        alert("❌ Upload failed. Try again.");
      }
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 border border-gray-200 rounded-lg p-4">
      {!showCamera && !image && (
        <button
          onClick={() => setShowCamera(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          📷 Open Camera
        </button>
      )}

      {showCamera && (
        <div className="flex flex-col items-center gap-3">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="rounded-lg border border-gray-300"
          />
          <button
            onClick={capture}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Capture
          </button>
        </div>
      )}

      {image && (
        <div className="flex flex-col items-center gap-3">
          <img
            src={image}
            alt="Captured"
            className="w-48 h-48 object-cover rounded-lg border border-gray-300"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setImage(null)}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Retake
            </button>
            <button
              onClick={uploadToCloudinary}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraUploader;
