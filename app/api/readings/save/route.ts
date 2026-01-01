export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface SaveReadingRequest {
  userId: string;
  title?: string;
  question: string;
  spreadId: string;
  cards: Array<{
    id: number;
    name: string;
    position?: string;
  }>;
  layoutType: number;
  isPublic?: boolean;
}

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: "Request body is empty" };
  }

  if (!body.userId || typeof body.userId !== "string") {
    return { valid: false, error: "User ID is required" };
  }

  if (!body.question || typeof body.question !== "string") {
    return { valid: false, error: "Question is required" };
  }

  if (!body.spreadId || typeof body.spreadId !== "string") {
    return { valid: false, error: "Spread ID is required" };
  }

  if (!Array.isArray(body.cards) || body.cards.length === 0) {
    return {
      valid: false,
      error: "Cards array is required and must not be empty",
    };
  }

  if (typeof body.layoutType !== "number") {
    return { valid: false, error: "Layout type is required" };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid request" },
        { status: 400 },
      );
    }

    const {
      userId,
      title,
      question,
      spreadId,
      cards,
      layoutType,
      isPublic = false,
    } = body as SaveReadingRequest;

    // Save the reading to the database
    const userReading = await prisma.userReading.create({
      data: {
        userId,
        title: title || `Reading: ${question.substring(0, 50)}...`,
        question,
        spreadId,
        cards,
        layoutType,
        isPublic,
      },
    });

    return NextResponse.json({
      id: userReading.id,
      message: "Reading saved successfully",
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error saving reading:", errorMsg);

    return NextResponse.json(
      { error: "Failed to save reading" },
      { status: 500 },
    );
  }
}
