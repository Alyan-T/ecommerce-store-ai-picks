import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne({ singletonId: "default" });
    if (!settings) {
      settings = await Settings.create({ singletonId: "default" });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const requester = getUserFromRequest(req);
    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    
    const settings = await Settings.findOneAndUpdate(
      { singletonId: "default" },
      { $set: body },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
