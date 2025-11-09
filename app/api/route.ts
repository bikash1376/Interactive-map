import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return new Response("Hello from the API!");
}



export async function POST(req: NextRequest, res: NextResponse) {
    
    let topic = await req.text();
    console.log(topic) 

    return Response.json({message: `Topic: ${topic}`});
}
