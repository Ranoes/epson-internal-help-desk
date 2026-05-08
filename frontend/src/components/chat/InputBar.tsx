"use client";

import { useState, useRef } from "react";
import { FaPaperclip, FaPaperPlane, FaImage } from "react-icons/fa";

interface InputBarProps {
  onSendMessage: (text: string, imageBase64?: string) => void;
  disabled?: boolean;
}

export default function InputBar({ onSendMessage, disabled }: InputBarProps) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1];
        onSendMessage(`[Image uploaded: ${file.name}]`, base64Data);
        setInput("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg disabled:bg-gray-100 disabled:text-gray-300 transition flex items-center justify-center"
        title="Attach image"
      >
        <FaImage size={18} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter" && !disabled) {
            handleSend();
          }
        }}
        placeholder="Ask about printer issues, errors, etc..."
        disabled={disabled}
        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 transition bg-white"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 transition font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        <FaPaperPlane size={16} />
        Send
      </button>
    </div>
  );
}
