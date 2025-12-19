import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createDefaultCategoriesForUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const firstName: string = body.firstName || "";
    const lastName: string = body.lastName || "";
    const email: string = body.email || "";
    const password: string = body.password || "";
    const storeName: string = body.storeName || "";
    const phone: string = body.phone || "";

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          store_name: storeName,
          phone,
        },
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("already registered")) {
        return NextResponse.json({ success: false, error: "This email is already registered. Please login instead." }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: error.message || "Signup failed" }, { status: 400 });
    }

    if (data?.user?.id) {
      try {
        await createDefaultCategoriesForUser(data.user.id);
      } catch (seedErr) {
        console.warn("Default category seed failed:", seedErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Unexpected error" }, { status: 500 });
  }
}