"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [responseText, setResponseText] = useState("");
  const [responseJson, setResponseJson] = useState({})

  const generateSomething = async () => {
    try {
      const res = await fetch("/api"); // adjust path if needed
      const text = await res.text(); // since it's plain text, not JSON
      setResponseText(text);
    } catch (err) {
      console.error("API call failed:", err);
      setResponseText("Error fetching data");
    }
  };

const generateGreetings = async () => {
  
  const response = await fetch('/api/greetings');
  const json = await response.json();
  setResponseJson(json)
}









  return (
    <main className="h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4 text-center">
        <Input placeholder="Enter a topic..." />
        <Button onClick={generateSomething}>Hello from the server</Button>

        {responseText && <p className="text-sm text-muted-foreground">{responseText}</p>}
        <Button onClick={generateGreetings}>Greetings from the server</Button>
          {responseJson && Object.keys(responseJson).length > 0  && <p className="text-sm text-muted-foreground">{JSON.stringify(responseJson)}</p>}
      </div>
    </main>
  );
}
