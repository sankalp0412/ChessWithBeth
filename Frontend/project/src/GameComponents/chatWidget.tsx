import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTalkToBeth = async () => {
    setLoading(true);
    try {
      // Simulate sending request to your Dify LLM API
      const response = await fetch("YOUR_DIFY_API_ENDPOINT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "talk_to_beth" }),
      });

      const data = await response.json();
      setMessages([...messages, "You: Talk to Beth", `Beth: ${data.reply}`]);
    } catch (error) {
      setMessages([
        ...messages,
        "Beth is unavailable right now. Try again later.",
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="relative h-full w-full">
      {/* Floating Button */}
      {!isOpen && (
        <Button
          className="flex items-center gap-2 p-3 rounded-full shadow-lg bg-blue-600 text-white"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle size={20} />
          <span className="hidden sm:block">Stuck? Ask Beth!</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
        >
          <Card className="w-full h-full p-3 shadow-xl bg-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Ask Beth</h3>
              <X className="cursor-pointer" onClick={() => setIsOpen(false)} />
            </div>
            <CardContent className="h-48 overflow-y-auto border-t mt-2 p-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Click the button below to talk to Beth.
                </p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className="text-sm bg-gray-200 p-2 rounded-lg mb-1"
                  >
                    {msg}
                  </div>
                ))
              )}
            </CardContent>
            <div className="flex justify-center mt-2">
              <Button onClick={handleTalkToBeth} disabled={loading}>
                {loading ? "Talking..." : "Talk to Beth"}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
