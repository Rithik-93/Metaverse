import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-40">
      <Loader2 className="animate-spin text-gray-500" size={32} />
      <p className="mt-2 text-gray-600">Loading spaces...</p>
    </div>
  );
};

export default Loading;
