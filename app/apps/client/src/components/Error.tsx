import { AlertCircle } from "lucide-react";

const ErrorMessage = ({ error }: { error: string }) => {
  return (
    <div className="flex items-center justify-center h-40 text-red-500">
      <AlertCircle className="mr-2" size={24} />
      <p>{error}</p>
    </div>
  );
};

export default ErrorMessage;
