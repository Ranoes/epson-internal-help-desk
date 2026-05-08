import { FaRobot } from "react-icons/fa";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <FaRobot className="text-gray-600 mt-1 flex-shrink-0" size={20} />
      <div className="bg-gray-50 text-gray-900 border border-gray-200 rounded-lg rounded-bl-none shadow-sm px-4 py-3">
        <div className="flex gap-1">
          <div
            className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
