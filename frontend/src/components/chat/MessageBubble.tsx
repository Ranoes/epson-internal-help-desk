import { HistoryMessage } from "@/types/api";
import { FaUser, FaRobot, FaCheckCircle } from "react-icons/fa";

interface MessageBubbleProps {
  message: HistoryMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <FaRobot className="text-gray-600 mt-1 flex-shrink-0" size={20} />
      )}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
          isUser
            ? "bg-gray-200 text-gray-900 rounded-br-none"
            : "bg-gray-50 text-gray-900 border border-gray-200 rounded-bl-none shadow-sm"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        {!isUser && message.confidence && (
          <p className="text-xs mt-2 opacity-70 flex items-center gap-1">
            <FaCheckCircle size={12} className="text-green-600" />
            Confidence: {(message.confidence * 100).toFixed(0)}%
          </p>
        )}
        <p className="text-xs mt-1 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
      {isUser && (
        <FaUser className="text-gray-600 mt-1 flex-shrink-0" size={20} />
      )}
    </div>
  );
}
