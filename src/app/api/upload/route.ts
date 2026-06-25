import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;
    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || "shop_unsigned_preset";

    if (!cloudName) {
      console.error("Cloudinary cloud name is not configured on the server.");
      return NextResponse.json({ message: "Cloudinary cloud name is not configured on the server" }, { status: 500 });
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: "POST",
      body: cloudinaryFormData,
    });

    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      console.error("Cloudinary upload failed:", data);
      return NextResponse.json({ message: "Cloudinary upload failed", error: data }, { status: response.status });
    }

    return NextResponse.json({ secure_url: data.secure_url });
  } catch (error) {
    console.error("Error in /api/upload:", error);
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 });
  }
}
