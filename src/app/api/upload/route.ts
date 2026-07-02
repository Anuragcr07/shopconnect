import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
      console.error("S3 configuration is missing on the server.");
      return NextResponse.json(
        { message: "S3 upload configuration is missing on the server" },
        { status: 500 }
      );
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedUserId = session.user.id.replace(/[^a-zA-Z0-9]/g, "");
    const key = `uploads/${sanitizedUserId}-${timestamp}-${randomString}.jpg`;

    
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({ secure_url: s3Url });
  } catch (error) {
    console.error("Error in /api/upload:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
