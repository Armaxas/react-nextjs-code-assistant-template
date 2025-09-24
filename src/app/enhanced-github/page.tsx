import { EnhancedGitHubDemo } from "@/components/enhanced-github-demo";

export default function EnhancedGitHubPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Enhanced GitHub Chat Features
          </h1>
          <p className="text-lg text-muted-foreground">
            Intelligent chat about commits and pull requests without persistent
            vector databases
          </p>
        </div>

        <EnhancedGitHubDemo />
      </div>
    </div>
  );
}
