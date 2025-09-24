import { ModernSpinner } from "@/components/ui/modern-spinners";

export default function Spinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="flex flex-col items-center gap-4">
        <ModernSpinner variant="neural" size="lg" className="text-blue-500" />
        <p className="text-white text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
